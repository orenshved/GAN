# Ollama adapter boundary

Phase 8 implements the runtime adapter in
`services/daemon/gameagent/local_models.py`. It uses only the configured local
endpoint, performs no model installation, and records project-scoped benchmark
artifacts outside this documentation boundary. Core contracts do not import the
adapter.
