import base64
import json
import wave
from pathlib import Path

from fastapi.testclient import TestClient

from gameagent.api import create_app
from gameagent.models.api import TaskProposal
from gameagent.models.contracts import Project
from gameagent.production_domains import domain_catalog, inspect_domain, tool_catalog
from gameagent.projects import ProjectStore, initialize

ROOT = Path(__file__).resolve().parents[3]
PROFILE = json.loads((ROOT / "packages/protocol/fixtures/valid.json").read_text())["Project"]
TOKEN = "phase-eleven-test-token-0000000000000000"
ORIGIN = "http://127.0.0.1:4242"
PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
)


def _store(root: Path) -> ProjectStore:
    initialize(root, Project.model_validate(PROFILE))
    store = ProjectStore(root, max_segment_bytes=1)
    store.propose(
        TaskProposal(
            request_id="domain-task",
            title="Audit production disciplines",
            objective="Record inspectable discipline evidence",
            required_capabilities=["project_analysis"],
            deliverables=["Production domain audit"],
        )
    )
    return store


def _fixtures(root: Path) -> None:
    (root / "scripts").mkdir()
    (root / "scripts" / "player.gd").write_text("extends Node\nfunc jump():\n\tpass\n")
    (root / "levels").mkdir()
    (root / "levels" / "arena.tscn").write_text(
        '[gd_scene format=3]\n\n[node name="Arena" type="Node2D"]\n'
    )
    (root / "art").mkdir()
    (root / "art" / "player.png").write_bytes(PNG)
    (root / "audio").mkdir()
    with wave.open(str(root / "audio" / "ambience.wav"), "wb") as stream:
        stream.setnchannels(1)
        stream.setsampwidth(2)
        stream.setframerate(8_000)
        stream.writeframes(b"\x00\x00" * 800)
    (root / "narrative").mkdir()
    (root / "narrative" / "dialogue.json").write_text(
        json.dumps({"opening": ["Welcome", "Stay awhile"]})
    )


def test_catalog_exposes_five_installed_read_only_tools() -> None:
    domains = domain_catalog()
    tools = tool_catalog()
    assert [item.domain_id for item in domains] == [
        "gameplay",
        "level_design",
        "art",
        "audio",
        "narrative",
    ]
    assert len(tools) == len(domains)
    assert all(item.install_state == "installed" for item in tools)
    assert all(item.permissions.execute_discovered_code == "never" for item in tools)
    assert all(item.cost_policy.max_external_cost_cents == 0 for item in tools)


def test_every_domain_records_evidence_evaluation_and_canonical_history(tmp_path: Path) -> None:
    store = _store(tmp_path)
    _fixtures(tmp_path)
    task = store.snapshot().tasks[-1]
    for index, domain in enumerate(domain_catalog(), 1):
        request_id = f"run-{domain.domain_id}"
        inspection, evidence, evaluation = inspect_domain(
            tmp_path,
            task,
            domain.domain_id,
            request_id,
            f"2026-09-08T12:00:0{index}Z",
        )
        recorded = store.record_domain_inspection(
            request_id,
            inspection,
            evidence,
            evaluation,
        )
        assert recorded.status == "passed"
        assert recorded.inspected_file_count >= 1

    snapshot = ProjectStore(tmp_path, max_segment_bytes=1).snapshot()
    assert {item.domain_id for item in snapshot.production_domain_inspections} == {
        "gameplay",
        "level_design",
        "art",
        "audio",
        "narrative",
    }
    assert len(snapshot.production_domain_inspections) == 5
    assert len(snapshot.evidence) == 5
    assert len(snapshot.evaluations) == 5
    page = store.events(0, 100)
    assert sum(item.event_type == "production_domain.inspected" for item in page.events) == 5


def test_invalid_audio_needs_attention_without_subjective_claim(tmp_path: Path) -> None:
    store = _store(tmp_path)
    (tmp_path / "audio").mkdir()
    (tmp_path / "audio" / "broken.wav").write_bytes(b"not-a-wave")
    task = store.snapshot().tasks[-1]
    inspection, evidence, evaluation = inspect_domain(
        tmp_path,
        task,
        "audio",
        "invalid-audio",
        "2026-09-08T12:00:00Z",
    )
    assert inspection.status == "needs_attention"
    assert inspection.findings[0].severity == "error"
    assert evaluation.result == "failed"
    assert evaluation.claim == "technical"
    assert "no subjective" in evaluation.rationale
    assert evidence.evidence_class == "measured"


def test_api_lists_and_runs_production_domain_slice(tmp_path: Path) -> None:
    store = _store(tmp_path)
    _fixtures(tmp_path)
    headers = {"Authorization": f"Bearer {TOKEN}", "Origin": ORIGIN}
    with TestClient(create_app(store, TOKEN, ORIGIN)) as client:
        catalog = client.get("/production-domains", headers=headers)
        assert catalog.status_code == 200
        assert len(catalog.json()["domains"]) == 5
        response = client.post(
            "/production-domain-run",
            headers=headers,
            json={
                "request_id": "api-audio",
                "task_id": "task-domain-task",
                "domain_id": "audio",
            },
        )
        assert response.status_code == 200
        assert response.json()["status"] == "passed"
        replay = client.get("/production-domains", headers=headers).json()
        assert replay["inspections"][0]["inspection_id"] == "domain-inspection-api-audio"
