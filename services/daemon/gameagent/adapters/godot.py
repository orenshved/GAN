"""Godot 4 project inspection, build, runtime capture and log collection."""

import hashlib
import os
import re
import shutil
import struct
import subprocess
from datetime import UTC, datetime
from pathlib import Path

from gameagent.constitution import require
from gameagent.models.api import EngineNodeInspection, EngineProjectInspection
from gameagent.models.contracts import EngineAdapter, Evaluation, Evidence, SourceRef

IGNORED_DIRECTORIES = {
    ".git",
    ".gameagent",
    ".godot",
    ".tools",
    "artifacts",
    "bin",
    "node_modules",
    "obj",
    "results",
}

CAPTURE_SCRIPT = """extends SceneTree

func _initialize() -> void:
\tcall_deferred("_capture")

func _capture() -> void:
\tvar args := OS.get_cmdline_user_args()
\tif args.size() < 3:
\t\tpush_error("Expected output path, node path and main scene")
\t\tquit(2)
\t\treturn
\tvar packed := load(args[2]) as PackedScene
\tvar scene := packed.instantiate()
\troot.add_child(scene)
\tawait process_frame
\tawait process_frame
\tvar option := scene.get_node_or_null(NodePath(args[1])) as OptionButton
\tif option == null:
\t\tpush_error("OptionButton not found: %s" % args[1])
\t\tquit(3)
\t\treturn
\tfor attempt in range(6):
\t\tif option.is_visible_in_tree():
\t\t\tbreak
\t\tpress_accept()
\t\tawait process_frame
\t\tawait process_frame
\tif not option.is_visible_in_tree():
\t\tpush_error("OptionButton did not become visible: %s" % args[1])
\t\tquit(4)
\t\treturn
\toption.grab_focus()
\toption.show_popup()
\tawait process_frame
\tawait process_frame
\tawait process_frame
\tvar image := root.get_texture().get_image()
\tvar error := image.save_png(args[0])
\tif error != OK:
\t\tpush_error("Screenshot save failed: %s" % error)
\t\tquit(5)
\t\treturn
\tprint("GAMEAGENT_CAPTURE=%s" % args[0])
\tquit()

func press_accept() -> void:
\tvar mapped := InputMap.action_get_events("ui_accept")
\tif mapped.is_empty():
\t\tpush_error("ui_accept has no mapped input")
\t\treturn
\tvar event := mapped[0].duplicate() as InputEvent
\tevent.set("pressed", true)
\tInput.parse_input_event(event)
"""


def _digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _timestamp() -> str:
    return datetime.now(UTC).isoformat(timespec="microseconds").replace("+00:00", "Z")


def _files(root: Path, suffix: str, *, max_depth: int | None = None) -> list[Path]:
    found: list[Path] = []
    for directory, names, files in os.walk(root, followlinks=False):
        relative = Path(directory).relative_to(root)
        if max_depth is not None and len(relative.parts) >= max_depth:
            names.clear()
        else:
            names[:] = [name for name in names if name not in IGNORED_DIRECTORIES]
        found.extend(Path(directory) / name for name in files if name.endswith(suffix))
    return sorted(found)


def _source(root: Path, path: Path, media_type: str, locator: str | None = None) -> SourceRef:
    return SourceRef(
        uri=path.relative_to(root).as_posix(),
        media_type=media_type,
        locator=locator,
        sha256=_digest(path),
    )


class GodotAdapter:
    definition = EngineAdapter(
        adapter_id="godot-4",
        version="1.0.0",
        engine_type="godot",
        supported_versions="4.x",
        capabilities=[
            "project_inspection",
            "scene_inspection",
            "ui_inspection",
            "project_build",
            "runtime_capture",
            "log_collection",
        ],
        tool_ids=["godot.cli"],
    )

    def __init__(self, root: Path) -> None:
        self.root = root.resolve(strict=True)
        candidates = _files(self.root, "project.godot", max_depth=4)
        require(bool(candidates), "godot_project_not_found", str(self.root))
        require(len(candidates) == 1, "ambiguous_godot_project", str(self.root))
        self.project_file = candidates[0]
        self.project_root = self.project_file.parent

    def inspect(self, project_id: str, task_id: str) -> EngineProjectInspection:
        settings = self.project_file.read_text(encoding="utf-8")
        version_match = re.search(r'config/features=PackedStringArray\("([^"]+)', settings)
        scene_match = re.search(r'run/main_scene="([^"]+)"', settings)
        require(scene_match is not None, "godot_main_scene_missing", str(self.project_file))
        assert scene_match is not None
        main_scene = scene_match.group(1)
        nodes: list[EngineNodeInspection] = []
        node_pattern = re.compile(
            r'^\[node name="([^"]+)" type="([^"]+)"(?: parent="([^"]*)")?', re.MULTILINE
        )
        for scene in _files(self.project_root, ".tscn"):
            relative_scene = scene.relative_to(self.project_root).as_posix()
            for name, node_type, parent in node_pattern.findall(
                scene.read_text(encoding="utf-8", errors="replace")
            ):
                if node_type != "OptionButton":
                    continue
                path = name if not parent or parent == "." else f"{parent}/{name}"
                nodes.append(
                    EngineNodeInspection(scene=relative_scene, path=path, node_type="option_button")
                )
        assets = [
            _source(self.root, path, "image/png")
            for path in _files(self.project_root / "assets", ".png")
            if "assets" in path.parts and (path.with_suffix(path.suffix + ".import")).exists()
        ][:40]
        return EngineProjectInspection(
            project_id=project_id,
            task_id=task_id,
            adapter=self.definition,
            project_path=self.project_root.relative_to(self.root).as_posix() or ".",
            engine_version=version_match.group(1) if version_match else "4.x",
            main_scene=main_scene,
            ui_nodes=nodes,
            approved_assets=assets,
            inspected_at=_timestamp(),
        )

    def capture(
        self, project_id: str, task_id: str, request_id: str, node_path: str
    ) -> tuple[EngineProjectInspection, Evidence, Evaluation, SourceRef]:
        inspection = self.inspect(project_id, task_id)
        require(
            any(node.path == node_path for node in inspection.ui_nodes),
            "ui_node_not_found",
            node_path,
        )
        evidence_id = f"evidence-{request_id}"
        evidence_dir = self.root / ".gameagent" / "evidence"
        runtime_dir = self.root / ".gameagent" / "runtime"
        evidence_dir.mkdir(parents=True, exist_ok=True)
        runtime_dir.mkdir(parents=True, exist_ok=True)
        screenshot = evidence_dir / f"{evidence_id}.png"
        log = evidence_dir / f"{evidence_id}.log"
        script = runtime_dir / "capture-ui.gd"
        script.write_text(CAPTURE_SCRIPT, encoding="utf-8")
        build_output = self._build()
        godot = self._godot_binary()
        completed = subprocess.run(
            [
                str(godot),
                "--path",
                str(self.project_root),
                "--single-window",
                "--rendering-method",
                "gl_compatibility",
                "--script",
                str(script),
                "--",
                str(screenshot),
                node_path,
                inspection.main_scene,
            ],
            cwd=self.root,
            check=False,
            capture_output=True,
            text=True,
            timeout=120,
        )
        log.write_text(
            f"BUILD\n{build_output}\nRUNTIME\n{completed.stdout}\n{completed.stderr}",
            encoding="utf-8",
        )
        require(completed.returncode == 0, "godot_run_failed", str(log))
        require(screenshot.is_file(), "runtime_capture_missing", str(screenshot))
        width, height = self._png_size(screenshot)
        require(width >= 640 and height >= 360, "runtime_capture_too_small", f"{width}x{height}")
        captured_at = _timestamp()
        evidence = Evidence(
            evidence_id=evidence_id,
            project_id=project_id,
            task_id=task_id,
            evidence_class="measured",
            producer_type="tool",
            producer_id="godot-adapter",
            captured_at=captured_at,
            source=_source(self.root, screenshot, "image/png", f"{width}x{height}"),
            capture_origin="runtime",
            summary=f"Godot runtime capture of {node_path} with its popup open",
        )
        evaluation = Evaluation(
            evaluation_id=f"evaluation-{request_id}",
            project_id=project_id,
            task_id=task_id,
            gate_id="runtime_ui_capture",
            claim="visual",
            result="passed",
            evidence_ids=[evidence_id],
            evaluator_id="godot-adapter",
            rationale=(
                f"Build and runtime exited successfully; captured {width}x{height} PNG from the "
                "live scene with the selected popup visible. Human style approval remains separate."
            ),
            evaluated_at=captured_at,
        )
        return inspection, evidence, evaluation, _source(self.root, log, "text/plain")

    def log_reference(self, evidence_id: str) -> SourceRef:
        path = self.root / ".gameagent" / "evidence" / f"{evidence_id}.log"
        require(path.is_file(), "capture_log_missing", evidence_id)
        return _source(self.root, path, "text/plain")

    def _build(self) -> str:
        projects = sorted(self.project_root.glob("*.csproj"))
        if not projects:
            return "No C# project detected; build step not required."
        dotnet = self.root / ".tools" / "dotnet" / "dotnet.exe"
        executable = dotnet if dotnet.is_file() else Path(shutil.which("dotnet") or "")
        require(executable.is_file(), "dotnet_not_found", str(self.root))
        completed = subprocess.run(
            [str(executable), "build", str(projects[0]), "--no-restore"],
            cwd=self.root,
            check=False,
            capture_output=True,
            text=True,
            timeout=120,
        )
        output = f"{completed.stdout}\n{completed.stderr}".strip()
        require(completed.returncode == 0, "godot_build_failed", output[-2000:])
        return output

    def _godot_binary(self) -> Path:
        local = sorted((self.root / ".tools" / "godot").glob("**/Godot*_console.exe"))
        if local:
            return local[0]
        found = shutil.which("godot4") or shutil.which("godot")
        require(found is not None, "godot_not_found", str(self.root))
        assert found is not None
        return Path(found)

    @staticmethod
    def _png_size(path: Path) -> tuple[int, int]:
        data = path.read_bytes()[:24]
        require(data[:8] == b"\x89PNG\r\n\x1a\n", "invalid_runtime_capture", str(path))
        return struct.unpack(">II", data[16:24])
