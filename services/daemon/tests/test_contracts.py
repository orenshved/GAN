import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator, FormatChecker
from pydantic import TypeAdapter, ValidationError

from gameagent.models import contracts

ROOT = Path(__file__).resolve().parents[3]
VALID = json.loads((ROOT / "packages/protocol/fixtures/valid.json").read_text())
INVALID = json.loads((ROOT / "packages/protocol/fixtures/invalid.json").read_text())


@pytest.mark.parametrize("definition,value", VALID.items())
def test_valid_wire_contract(definition, value):
    model = getattr(contracts, definition)
    parsed = model.model_validate_json(json.dumps(value))
    schema = model.model_json_schema()
    Draft202012Validator(schema, format_checker=FormatChecker()).validate(value)
    assert model.model_validate_json(parsed.model_dump_json()) == parsed


@pytest.mark.parametrize("case", INVALID, ids=lambda case: case["name"])
def test_invalid_wire_contract(case):
    with pytest.raises(ValidationError):
        getattr(contracts, case["definition"]).model_validate_json(json.dumps(case["value"]))


def test_event_discriminator_rejects_unknown_and_wrong_payload():
    adapter = TypeAdapter(contracts.Event)
    for patch in ({"event_type": "invented.event"}, {"payload": {"amount_cents": 10}}):
        with pytest.raises(ValidationError):
            adapter.validate_json(json.dumps(VALID["TaskEvent"] | patch))


def test_ontology_covers_exact_prd_capabilities_and_allows_extensions():
    import re

    prd = next(ROOT.glob("*Architecture.md")).read_text(encoding="utf-8")
    section = prd.split("# 15. Capability Ontology")[1].split("# 16. Agent Definition")[0]
    expected = set(re.findall(r"^- ([a-z_]+)$", section, flags=re.M))
    entries = json.loads((ROOT / "capabilities/ontology/initial.json").read_text())
    assert {item["capability_id"] for item in entries} == expected
    for entry in entries:
        contracts.Capability.model_validate(entry)
    contracts.Capability.model_validate(
        VALID["Capability"] | {"capability_id": "future_capability"}
    )


def test_engine_is_optional_and_global_agent_has_no_context_fields():
    assert contracts.Project.model_validate(VALID["Project"]).engine is None
    fields = contracts.AgentDefinition.model_fields
    assert not {"project_id", "thread_id", "creative_direction", "memory"} & fields.keys()
