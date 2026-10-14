import type { RJSFSchema } from '../../../src/index.ts';
import { isSchemaObject } from '../../../src/isObject.ts';

/** Reads `value` as a schema without the checks a schema literal gets, for a test that feeds the graph a keyword
 * holding the wrong kind of value, or one that JSON Schema draft 7 does not name
 */
export default function looseSchema(value: object): RJSFSchema {
  return isSchemaObject(value) ? value : {};
}
