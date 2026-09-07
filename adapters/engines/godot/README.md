# Godot adapter boundary

The Phase 6 runtime implementation lives in
`services/daemon/gameagent/adapters/godot.py` so it ships with the local daemon.
It implements the versioned engine contract without leaking Godot imports or
assumptions into canonical models, constitution rules, project replay, or Studio.

Supported now: nested-project detection, settings and scene inspection,
`OptionButton` discovery, imported PNG reference validation, C# build, live scene
launch, selected-popup capture, log collection, and measured runtime evidence.
