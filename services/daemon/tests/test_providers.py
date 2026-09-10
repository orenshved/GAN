import asyncio
import json
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from gameagent.api import create_app
from gameagent.constitution import ConstitutionError
from gameagent.models.api import (
    ProviderConfigureCommand,
    ProviderInvokeCommand,
    SpendApprovalCommand,
)
from gameagent.models.contracts import Project, Provider
from gameagent.projects import ProjectStore, initialize
from gameagent.providers import (
    InMemoryCredentialStore,
    PaidProviderGateway,
    ProviderRequest,
    ProviderResponse,
    credential_key,
)

ROOT = Path(__file__).resolve().parents[3]
PROFILE = json.loads((ROOT / "packages/protocol/fixtures/valid.json").read_text())["Project"]
TOKEN = "test-token-" + "a" * 32
ORIGIN = "http://studio.test"


@pytest.fixture
def store(tmp_path: Path) -> ProjectStore:
    initialize(tmp_path, Project.model_validate(PROFILE))
    return ProjectStore(tmp_path, max_segment_bytes=1)


def provider(*, verified: bool = True) -> Provider:
    cap: dict[str, object]
    if verified:
        cap = {
            "verified": True,
            "amount_cents": 2500,
            "verification_method": "manual_provider_console",
            "verified_at": "2020-01-01T00:00:00Z",
            "expires_at": "2099-01-01T00:00:00Z",
            "proof": {
                "uri": "artifact://provider/cap-proof",
                "media_type": "image/png",
                "sha256": "a" * 64,
            },
            "provider_side": True,
        }
    else:
        cap = {"verified": False}
    return Provider.model_validate(
        {
            "provider_id": "provider-a",
            "display_name": "Provider A",
            "purpose": "High-quality model fallback",
            "billing": "paid",
            "state": "ACTIVE",
            "cap": cap,
            "adapter_id": "adapter-a",
            "credential_id": "api-key",
        }
    )


class FakeAdapter:
    adapter_id = "adapter-a"

    def __init__(self, estimate: int, *, fail: bool = False) -> None:
        self.estimate = estimate
        self.fail = fail
        self.calls = 0

    def estimate_cents(self, request: ProviderRequest) -> int:
        assert request.prompt
        return self.estimate

    async def invoke(self, request: ProviderRequest, secret: str) -> ProviderResponse:
        self.calls += 1
        assert secret == "credential-value"
        if self.fail:
            raise TimeoutError("ambiguous transport timeout")
        return ProviderResponse(output="provider result", actual_cents=self.estimate)


def configure(store: ProjectStore, configured: Provider | None = None) -> Provider:
    return store.configure_provider(
        ProviderConfigureCommand(request_id="configure-provider", provider=configured or provider())
    )


def gateway(store: ProjectStore, adapter: FakeAdapter) -> PaidProviderGateway:
    credentials = InMemoryCredentialStore()
    configured = next(
        item for item in store.snapshot().providers if item.provider_id == "provider-a"
    )
    credentials.set(credential_key(configured), "credential-value")
    return PaidProviderGateway(store, credentials, {adapter.adapter_id: adapter})


def test_uncapped_provider_is_structurally_blocked_before_adapter_call(
    store: ProjectStore,
) -> None:
    configured = configure(store, provider(verified=False))
    assert configured.state == "DISABLED_UNCAPPED"
    adapter = FakeAdapter(1)
    with pytest.raises(ConstitutionError) as caught:
        asyncio.run(
            gateway(store, adapter).invoke(
                ProviderInvokeCommand(
                    request_id="uncapped-call", provider_id="provider-a", prompt="do work"
                )
            )
        )
    assert caught.value.error == "provider_disabled"
    assert adapter.calls == 0
    assert store.snapshot().budget_reservations == []


def test_99_cents_executes_and_is_idempotent(store: ProjectStore) -> None:
    configure(store)
    adapter = FakeAdapter(99)
    paid_gateway = gateway(store, adapter)
    command = ProviderInvokeCommand(
        request_id="ninety-nine", provider_id="provider-a", prompt="do work"
    )
    result = asyncio.run(paid_gateway.invoke(command))
    repeated = asyncio.run(paid_gateway.invoke(command))
    assert result.record.state == "succeeded"
    assert result.output == "provider result"
    assert repeated.record == result.record
    assert repeated.output is None
    assert adapter.calls == 1
    assert store.snapshot().budget_reservations[0].actual_cents == 99


def test_100_cents_requires_exact_scoped_human_approval(store: ProjectStore) -> None:
    configure(store)
    adapter = FakeAdapter(100)
    paid_gateway = gateway(store, adapter)
    command = ProviderInvokeCommand(
        request_id="one-dollar", provider_id="provider-a", prompt="do work"
    )
    with pytest.raises(ConstitutionError) as caught:
        asyncio.run(paid_gateway.invoke(command))
    assert caught.value.error == "human_approval_required"
    assert adapter.calls == 0
    approval_command = SpendApprovalCommand(
        request_id="approve-one-dollar",
        provider_id="provider-a",
        invocation_request_id="one-dollar",
        amount_cents=100,
        expires_at="2099-01-01T00:00:00Z",
    )
    approval = store.approve_spend(approval_command)
    assert store.approve_spend(approval_command) == approval
    assert asyncio.run(paid_gateway.invoke(command)).record.state == "succeeded"
    assert adapter.calls == 1


def test_missing_credential_releases_reservation(store: ProjectStore) -> None:
    configure(store)
    adapter = FakeAdapter(20)
    with pytest.raises(ConstitutionError) as caught:
        asyncio.run(
            PaidProviderGateway(
                store, InMemoryCredentialStore(), {adapter.adapter_id: adapter}
            ).invoke(
                ProviderInvokeCommand(
                    request_id="missing-credential",
                    provider_id="provider-a",
                    prompt="do work",
                )
            )
        )
    assert caught.value.error == "provider_credential_missing"
    assert store.snapshot().budget_reservations[0].state == "released"
    assert adapter.calls == 0


def test_concurrent_reservations_cannot_exceed_monthly_budget(store: ProjectStore) -> None:
    configure(store)

    def reserve(index: int) -> bool:
        try:
            store.reserve_provider_budget(
                "provider-a",
                f"parallel-{index}",
                99,
                now=datetime(2026, 9, 8, tzinfo=UTC),
            )
            return True
        except ConstitutionError as error:
            assert error.error == "monthly_budget_exceeded"
            return False

    with ThreadPoolExecutor(max_workers=12) as pool:
        accepted = list(pool.map(reserve, range(40)))
    snapshot = store.snapshot()
    assert sum(accepted) == 25
    assert sum(item.predicted_cents for item in snapshot.budget_reservations) == 2475


def test_month_rollover_uses_an_independent_ledger(store: ProjectStore) -> None:
    configure(store)
    for index in range(25):
        store.reserve_provider_budget(
            "provider-a",
            f"january-{index}",
            99,
            now=datetime(2026, 1, 10, tzinfo=UTC),
        )
    february = store.reserve_provider_budget(
        "provider-a", "february-0", 99, now=datetime(2026, 2, 1, tzinfo=UTC)
    )
    assert february.month == "2026-02"


def test_ambiguous_failure_retains_full_reservation_across_restart(
    store: ProjectStore,
) -> None:
    configure(store)
    adapter = FakeAdapter(20, fail=True)
    result = asyncio.run(
        gateway(store, adapter).invoke(
            ProviderInvokeCommand(
                request_id="ambiguous", provider_id="provider-a", prompt="do work"
            )
        )
    )
    assert result.record.state == "uncertain"
    restarted = ProjectStore(store.root, max_segment_bytes=1)
    reservation = restarted.snapshot().budget_reservations[0]
    assert reservation.state == "uncertain"
    assert restarted.budget_totals(restarted.snapshot(), reservation.month) == (0, 20)


def test_api_never_persists_or_returns_credential(store: ProjectStore) -> None:
    configured = configure(store)
    credentials = InMemoryCredentialStore()
    adapter = FakeAdapter(1)
    headers = {"Authorization": f"Bearer {TOKEN}"}
    secret = "credential-value"
    with TestClient(
        create_app(
            store,
            TOKEN,
            ORIGIN,
            credential_store=credentials,
            provider_adapters={adapter.adapter_id: adapter},
        )
    ) as client:
        response = client.post(
            "/provider-credential",
            headers=headers,
            json={"provider_id": configured.provider_id, "secret": secret},
        )
        assert response.status_code == 200
        assert response.json() == {"provider_id": "provider-a", "configured": True}
        registry = client.get("/providers", headers=headers)
        assert registry.status_code == 200
        assert secret not in registry.text
    for path in (store.root / ".gameagent").rglob("*"):
        if path.is_file() and path.name != "writer.lock":
            assert secret.encode() not in path.read_bytes()
