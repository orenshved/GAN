import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import schema from "../schema/protocol.schema.json" with { type: "json" };

export type * from "./generated.js";

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
ajv.addSchema(schema);

/** Shape validation only. Authority and state admission remain daemon-owned. */
export function validateDocument(
  definition: string,
  value: unknown,
): {
  valid: boolean;
  errors: string[];
} {
  if (!Object.hasOwn(schema.$defs, definition)) {
    return { valid: false, errors: [`unknown_contract: ${definition}`] };
  }
  const validate = ajv.getSchema(`${schema.$id}#/$defs/${definition}`);
  if (!validate) return { valid: false, errors: ["missing_schema"] };
  const valid = validate(value) === true;
  return {
    valid,
    errors: (validate.errors ?? []).map(
      (error) => `${error.instancePath}: ${error.message}`,
    ),
  };
}
