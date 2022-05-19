import { JSONSchema7 } from 'json-schema';
import jsonpointer from 'jsonpointer';

import { REF_NAME } from './constants';

export default function findSchemaDefinition($ref: string, rootSchema: JSONSchema7 = {}): JSONSchema7 {
  let ref = $ref;
  if (ref.startsWith('#')) {
    // Decode URI fragment representation.
    ref = decodeURIComponent(ref.substring(1));
  } else {
    throw new Error(`Could not find a definition for ${$ref}.`);
  }
  const current: JSONSchema7 = jsonpointer.get(rootSchema, ref);
  if (current === undefined) {
    throw new Error(`Could not find a definition for ${$ref}.`);
  }
  if (current.hasOwnProperty(REF_NAME)) {
    return findSchemaDefinition(current[REF_NAME]!, rootSchema);
  }
  return current;
}
