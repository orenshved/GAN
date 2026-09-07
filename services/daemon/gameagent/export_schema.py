"""Deterministic schema export. Run through scripts/protocol.mjs."""

import json
import sys

from gameagent.models.api import ApiCatalog
from gameagent.models.contracts import ProtocolDocument


def main() -> None:
    schema = ProtocolDocument.model_json_schema()
    api_schema = ApiCatalog.model_json_schema()
    schema["$defs"].update(api_schema["$defs"])
    schema["$schema"] = "https://json-schema.org/draft/2020-12/schema"
    schema["$id"] = "https://gameagent.local/protocol/v1"

    # Discriminators are Pydantic hints, not JSON Schema validation keywords.
    def clean(value: object) -> None:
        if isinstance(value, dict):
            value.pop("discriminator", None)
            for child in value.values():
                clean(child)
        elif isinstance(value, list):
            for child in value:
                clean(child)

    clean(schema)
    sys.stdout.write(json.dumps(schema, indent=2, sort_keys=True) + "\n")


if __name__ == "__main__":
    main()
