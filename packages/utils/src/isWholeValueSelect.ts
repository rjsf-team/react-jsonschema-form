import getSchemaType from './getSchemaType.ts';
import getXxxOfKey from './getXxxOfKey.ts';
import isConstantSelect from './isConstantSelect.ts';
import toConstant from './toConstant.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

function isContainerValue(value: unknown): boolean {
  return typeof value === 'object' && value !== null;
}

/** Checks whether `schema` is a select over object or array constants, which holds one of them as a whole rather than
 * being a container whose contents are edited, filled in with defaults, pruned or sanitized. That is a non-empty
 * select (see `isConstantSelect()`) whose `type` is `object` or `array`, or which declares no `type` and offers an
 * object or array constant, since `SchemaField` renders a typeless select over such values as a select too.
 *
 * @param schema - The already-resolved schema to check
 * @returns - True if `schema` is a select whose value is an object or array picked as a whole
 */
export default function isWholeValueSelect<S extends StrictRJSFSchema = RJSFSchema>(schema: S): boolean {
  const schemaType = getSchemaType<S>(schema);
  const isContainerType = schemaType === 'object' || schemaType === 'array';
  // A declared primitive type rules the schema out before its options are scanned
  if ((!isContainerType && schema.type !== undefined) || !isConstantSelect<S>(schema)) {
    return false;
  }
  if (isContainerType) {
    return true;
  }
  // `isConstantSelect()` reads a non-empty `enum` before the `anyOf`/`oneOf`, which it has checked are all constants
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return schema.enum.some(isContainerValue);
  }
  return (schema[getXxxOfKey<S>(schema)!] as S[]).some((option) => isContainerValue(toConstant<S>(option)));
}
