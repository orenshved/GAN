"""Paid-provider execution gateway and OS-backed credential abstraction."""

import asyncio
import ctypes
import json
import os
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Literal, Protocol
from urllib.request import Request, urlopen

from gameagent.constitution import require
from gameagent.models.api import (
    BudgetLedger,
    ProviderInvocationResult,
    ProviderInvokeCommand,
    ProviderRegistry,
    ProviderStatus,
)
from gameagent.models.contracts import PaidInvocationRecord, Provider
from gameagent.projects import ProjectStore


def _timestamp(value: datetime) -> str:
    return value.astimezone(UTC).isoformat(timespec="microseconds").replace("+00:00", "Z")


class CredentialStore(Protocol):
    def set(self, key: str, secret: str) -> None: ...

    def get(self, key: str) -> str | None: ...

    def delete(self, key: str) -> None: ...


class UnavailableCredentialStore:
    def set(self, key: str, secret: str) -> None:
        del key, secret
        require(False, "secure_credential_store_unavailable", "OS credential storage is required")

    def get(self, key: str) -> str | None:
        del key
        return None

    def delete(self, key: str) -> None:
        del key


class InMemoryCredentialStore:
    """Test-only secure-store stand-in; never selected by the application."""

    def __init__(self) -> None:
        self._values: dict[str, str] = {}

    def set(self, key: str, secret: str) -> None:
        require(bool(secret), "invalid_credential", "Credential cannot be empty")
        self._values[key] = secret

    def get(self, key: str) -> str | None:
        return self._values.get(key)

    def delete(self, key: str) -> None:
        self._values.pop(key, None)


class _CredentialW(ctypes.Structure):
    _fields_ = [
        ("Flags", ctypes.c_uint32),
        ("Type", ctypes.c_uint32),
        ("TargetName", ctypes.c_wchar_p),
        ("Comment", ctypes.c_wchar_p),
        ("LastWrittenLow", ctypes.c_uint32),
        ("LastWrittenHigh", ctypes.c_uint32),
        ("CredentialBlobSize", ctypes.c_uint32),
        ("CredentialBlob", ctypes.POINTER(ctypes.c_ubyte)),
        ("Persist", ctypes.c_uint32),
        ("AttributeCount", ctypes.c_uint32),
        ("Attributes", ctypes.c_void_p),
        ("TargetAlias", ctypes.c_wchar_p),
        ("UserName", ctypes.c_wchar_p),
    ]


class WindowsCredentialStore:
    """Windows Credential Manager generic credentials scoped to the current user."""

    _GENERIC = 1
    _LOCAL_MACHINE = 2
    _NOT_FOUND = 1168

    def __init__(self, namespace: str = "gameagent") -> None:
        require(os.name == "nt", "secure_credential_store_unavailable", "Windows is required")
        self.namespace = namespace
        self._api = ctypes.WinDLL("Advapi32.dll", use_last_error=True)
        self._api.CredWriteW.argtypes = [ctypes.POINTER(_CredentialW), ctypes.c_uint32]
        self._api.CredWriteW.restype = ctypes.c_int
        self._api.CredReadW.argtypes = [
            ctypes.c_wchar_p,
            ctypes.c_uint32,
            ctypes.c_uint32,
            ctypes.POINTER(ctypes.POINTER(_CredentialW)),
        ]
        self._api.CredReadW.restype = ctypes.c_int
        self._api.CredDeleteW.argtypes = [ctypes.c_wchar_p, ctypes.c_uint32, ctypes.c_uint32]
        self._api.CredDeleteW.restype = ctypes.c_int
        self._api.CredFree.argtypes = [ctypes.c_void_p]

    def _target(self, key: str) -> str:
        return f"{self.namespace}/{key}"

    def set(self, key: str, secret: str) -> None:
        require(bool(secret), "invalid_credential", "Credential cannot be empty")
        blob = secret.encode("utf-16-le")
        require(len(blob) <= 2560, "credential_too_large", "Credential exceeds OS limit")
        buffer = (ctypes.c_ubyte * len(blob)).from_buffer_copy(blob)
        credential = _CredentialW(
            Type=self._GENERIC,
            TargetName=self._target(key),
            CredentialBlobSize=len(blob),
            CredentialBlob=ctypes.cast(buffer, ctypes.POINTER(ctypes.c_ubyte)),
            Persist=self._LOCAL_MACHINE,
            UserName="Game Agent Network",
        )
        require(
            bool(self._api.CredWriteW(ctypes.byref(credential), 0)),
            "credential_write_failed",
            f"Windows error {ctypes.get_last_error()}",
        )

    def get(self, key: str) -> str | None:
        pointer = ctypes.POINTER(_CredentialW)()
        if not self._api.CredReadW(self._target(key), self._GENERIC, 0, ctypes.byref(pointer)):
            error = ctypes.get_last_error()
            if error == self._NOT_FOUND:
                return None
            require(False, "credential_read_failed", f"Windows error {error}")
        try:
            credential = pointer.contents
            blob = ctypes.string_at(credential.CredentialBlob, credential.CredentialBlobSize)
            return blob.decode("utf-16-le")
        finally:
            self._api.CredFree(pointer)

    def delete(self, key: str) -> None:
        if self._api.CredDeleteW(self._target(key), self._GENERIC, 0):
            return
        error = ctypes.get_last_error()
        require(error == self._NOT_FOUND, "credential_delete_failed", f"Windows error {error}")


def system_credential_store() -> CredentialStore:
    return WindowsCredentialStore() if os.name == "nt" else UnavailableCredentialStore()


@dataclass(frozen=True)
class ProviderRequest:
    prompt: str
    max_output_tokens: int


@dataclass(frozen=True)
class ProviderResponse:
    output: str
    actual_cents: int | None


class ProviderAdapter(Protocol):
    adapter_id: str

    def estimate_cents(self, request: ProviderRequest) -> int: ...

    async def invoke(self, request: ProviderRequest, secret: str) -> ProviderResponse: ...


class OpenAICompatibleAdapter:
    """Environment-configured chat-completions adapter with conservative pricing."""

    def __init__(
        self,
        adapter_id: str,
        endpoint: str,
        model: str,
        input_cents_per_million: int,
        output_cents_per_million: int,
    ) -> None:
        require(endpoint.startswith("https://"), "invalid_provider_endpoint", endpoint)
        require(input_cents_per_million >= 0, "invalid_cost", "Input price must be cents")
        require(output_cents_per_million >= 0, "invalid_cost", "Output price must be cents")
        self.adapter_id = adapter_id
        self.endpoint = endpoint
        self.model = model
        self.input_rate = input_cents_per_million
        self.output_rate = output_cents_per_million

    @staticmethod
    def _ceil_cost(token_cost: int) -> int:
        return (token_cost + 999_999) // 1_000_000

    def estimate_cents(self, request: ProviderRequest) -> int:
        # UTF-8 bytes / 3 is a conservative tokenizer-independent input estimate.
        input_tokens = (len(request.prompt.encode("utf-8")) + 2) // 3
        return self._ceil_cost(
            input_tokens * self.input_rate + request.max_output_tokens * self.output_rate
        )

    def _invoke_sync(self, request: ProviderRequest, secret: str) -> ProviderResponse:
        payload = json.dumps(
            {
                "model": self.model,
                "messages": [{"role": "user", "content": request.prompt}],
                "max_tokens": request.max_output_tokens,
            }
        ).encode("utf-8")
        http_request = Request(
            self.endpoint,
            data=payload,
            method="POST",
            headers={
                "Authorization": f"Bearer {secret}",
                "Content-Type": "application/json",
            },
        )
        with urlopen(http_request, timeout=120) as response:  # noqa: S310
            document = json.loads(response.read())
        output = document["choices"][0]["message"]["content"]
        usage = document.get("usage")
        actual = None
        if isinstance(usage, dict):
            prompt_tokens = usage.get("prompt_tokens")
            completion_tokens = usage.get("completion_tokens")
            if type(prompt_tokens) is int and type(completion_tokens) is int:
                actual = self._ceil_cost(
                    prompt_tokens * self.input_rate + completion_tokens * self.output_rate
                )
        return ProviderResponse(output=output, actual_cents=actual)

    async def invoke(self, request: ProviderRequest, secret: str) -> ProviderResponse:
        return await asyncio.to_thread(self._invoke_sync, request, secret)


def adapters_from_environment() -> dict[str, ProviderAdapter]:
    values = {
        "adapter_id": os.getenv("GAMEAGENT_PROVIDER_ADAPTER_ID"),
        "endpoint": os.getenv("GAMEAGENT_PROVIDER_ENDPOINT"),
        "model": os.getenv("GAMEAGENT_PROVIDER_MODEL"),
        "input_rate": os.getenv("GAMEAGENT_PROVIDER_INPUT_CENTS_PER_MILLION"),
        "output_rate": os.getenv("GAMEAGENT_PROVIDER_OUTPUT_CENTS_PER_MILLION"),
    }
    if not all(values.values()):
        return {}
    try:
        adapter = OpenAICompatibleAdapter(
            adapter_id=values["adapter_id"] or "",
            endpoint=values["endpoint"] or "",
            model=values["model"] or "",
            input_cents_per_million=int(values["input_rate"] or ""),
            output_cents_per_million=int(values["output_rate"] or ""),
        )
    except ValueError:
        require(False, "invalid_provider_configuration", "Provider prices must be integers")
    return {adapter.adapter_id: adapter}


def credential_key(provider: Provider) -> str:
    return f"{provider.provider_id}/{provider.credential_id or provider.provider_id}"


class PaidProviderGateway:
    def __init__(
        self,
        store: ProjectStore,
        credentials: CredentialStore,
        adapters: dict[str, ProviderAdapter],
    ) -> None:
        self.store = store
        self.credentials = credentials
        self.adapters = adapters

    async def invoke(self, command: ProviderInvokeCommand) -> ProviderInvocationResult:
        snapshot = self.store.snapshot()
        existing = next(
            (item for item in snapshot.paid_invocations if item.request_id == command.request_id),
            None,
        )
        if existing is not None:
            return ProviderInvocationResult(record=existing)
        provider = next(
            (item for item in snapshot.providers if item.provider_id == command.provider_id), None
        )
        require(provider is not None, "provider_not_found", command.provider_id)
        assert provider is not None
        adapter = self.adapters.get(provider.adapter_id or "")
        require(adapter is not None, "provider_adapter_unavailable", provider.provider_id)
        assert adapter is not None
        request = ProviderRequest(
            prompt=command.prompt, max_output_tokens=command.max_output_tokens
        )
        predicted_cents = adapter.estimate_cents(request)
        require(
            type(predicted_cents) is int and predicted_cents >= 0,
            "unknown_cost",
            provider.provider_id,
        )
        reservation = self.store.reserve_provider_budget(
            provider.provider_id,
            command.request_id,
            predicted_cents,
            task_id=command.task_id,
        )
        if reservation.state in {"in_flight", "uncertain"}:
            require(False, "invocation_outcome_uncertain", command.request_id)
        if reservation.state == "settled":
            previous = next(
                (
                    item
                    for item in self.store.snapshot().paid_invocations
                    if item.request_id == command.request_id
                ),
                None,
            )
            require(previous is not None, "invocation_record_missing", command.request_id)
            assert previous is not None
            return ProviderInvocationResult(record=previous)
        require(reservation.state == "reserved", "invalid_reservation_state", reservation.state)
        secret = self.credentials.get(credential_key(provider))
        if secret is None:
            self.store.update_provider_reservation(reservation.reservation_id, "released")
            require(False, "provider_credential_missing", provider.provider_id)
        assert secret is not None
        self.store.update_provider_reservation(reservation.reservation_id, "in_flight")
        recorded_at = datetime.now(UTC)
        try:
            response = await adapter.invoke(request, secret)
        except Exception as error:
            self.store.update_provider_reservation(reservation.reservation_id, "uncertain")
            record = PaidInvocationRecord(
                invocation_id=f"invocation-{command.request_id}",
                project_id=reservation.project_id,
                provider_id=provider.provider_id,
                reservation_id=reservation.reservation_id,
                request_id=command.request_id,
                task_id=command.task_id,
                state="uncertain",
                predicted_cents=predicted_cents,
                detail=f"Outcome unknown after {type(error).__name__}; full reservation retained",
                recorded_at=_timestamp(recorded_at),
            )
            self.store.record_paid_invocation(record)
            return ProviderInvocationResult(record=record)
        if response.actual_cents is None:
            self.store.update_provider_reservation(reservation.reservation_id, "uncertain")
            state: Literal["succeeded", "failed", "uncertain"] = "uncertain"
            detail = "Provider omitted usage; full reservation retained"
        else:
            require(
                type(response.actual_cents) is int and response.actual_cents >= 0,
                "invalid_cost",
                "Provider returned invalid usage",
            )
            self.store.update_provider_reservation(
                reservation.reservation_id, "settled", actual_cents=response.actual_cents
            )
            state = "succeeded" if response.actual_cents <= predicted_cents else "failed"
            detail = (
                "Invocation completed and usage reconciled"
                if state == "succeeded"
                else "Provider exceeded the reserved upper bound"
            )
        record = PaidInvocationRecord(
            invocation_id=f"invocation-{command.request_id}",
            project_id=reservation.project_id,
            provider_id=provider.provider_id,
            reservation_id=reservation.reservation_id,
            request_id=command.request_id,
            task_id=command.task_id,
            state=state,
            predicted_cents=predicted_cents,
            actual_cents=response.actual_cents,
            detail=detail,
            recorded_at=_timestamp(recorded_at),
        )
        self.store.record_paid_invocation(record)
        return ProviderInvocationResult(record=record, output=response.output or None)


def provider_registry(
    store: ProjectStore,
    credentials: CredentialStore,
    adapters: dict[str, ProviderAdapter],
    *,
    now: datetime | None = None,
) -> ProviderRegistry:
    instant = (now or datetime.now(UTC)).astimezone(UTC)
    month = instant.strftime("%Y-%m")
    snapshot = store.snapshot()
    settled, reserved = store.budget_totals(snapshot, month)
    budget = snapshot.policy.monthly_external_budget_cents
    statuses = [
        ProviderStatus(
            provider=provider,
            credential_configured=credentials.get(credential_key(provider)) is not None,
            adapter_available=(provider.adapter_id or "") in adapters,
        )
        for provider in snapshot.providers
    ]
    return ProviderRegistry(
        providers=statuses,
        ledger=BudgetLedger(
            month=month,
            budget_cents=budget,
            settled_cents=settled,
            reserved_cents=reserved,
            available_cents=max(0, budget - settled - reserved),
        ),
        approvals=snapshot.spend_approvals,
        reservations=snapshot.budget_reservations,
        invocations=snapshot.paid_invocations,
    )
