import jsonpointer from 'jsonpointer';

import { REF_NAME } from './constants';
import { RJSFSchema } from './types';

export default function findSchemaDefinition($ref: string, rootSchema: RJSFSchema = {}): RJSFSchema {
  let ref = $ref;
  if (ref.startsWith('#')) {
    // Decode URI fragment representation.
    ref = decodeURIComponent(ref.substring(1));
  } else {
    throw new Error(`Could not find a definition for ${$ref}.`);
  }
  const current: RJSFSchema = jsonpointer.get(rootSchema, ref);
  if (current === undefined) {
    throw new Error(`Could not find a definition for ${$ref}.`);
  }
  if (current.hasOwnProperty(REF_NAME)) {
    return findSchemaDefinition(current[REF_NAME]!, rootSchema);
  }
  return current;
}
