"""Constitution boundaries that can be checked without a running system."""

import ast
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]


def test_domain_has_no_infrastructure_or_engine_imports():
    allowed = {"__future__", "datetime", "typing", "pydantic", "gameagent"}
    files = list((ROOT / "services/daemon/gameagent/models").glob("*.py"))
    files.append(ROOT / "services/daemon/gameagent/constitution.py")
    for file in files:
        tree = ast.parse(file.read_text())
        for node in ast.walk(tree):
            modules = []
            if isinstance(node, ast.Import):
                modules = [alias.name for alias in node.names]
            elif isinstance(node, ast.ImportFrom) and node.module:
                modules = [node.module]
            for module in modules:
                assert module.split(".")[0] in allowed, (file, module)
                if module.startswith("gameagent."):
                    assert module.startswith("gameagent.models"), (file, module)


def test_workspace_dependencies_do_not_inherit_greenlight_infrastructure():
    forbidden = {"@supabase/supabase-js", "n8n", "express", "d3", "godot"}
    for manifest in (ROOT / "packages").glob("*/package.json"):
        data = json.loads(manifest.read_text())
        deps = set(data.get("dependencies", {}))
        assert not deps & forbidden
        assert not any("adapter-" in dep for dep in deps)
        if manifest.parent.name not in {"protocol", "ui"}:
            assert deps == {"@gameagent/protocol"}


def test_studio_does_not_import_fixtures_or_own_production_state():
    for file in (ROOT / "apps/studio/app").glob("*.tsx"):
        text = file.read_text()
        assert "fixtures" not in text
        assert "localStorage" not in text
        assert "adapters/" not in text


def test_sqlite_and_secrets_are_git_ignored():
    patterns = (ROOT / ".gitignore").read_text().splitlines()
    assert {"*.db", "*.sqlite", "*.sqlite3", ".env", ".env.*"} <= set(patterns)
