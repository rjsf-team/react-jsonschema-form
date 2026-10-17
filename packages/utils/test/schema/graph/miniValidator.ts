import { deepEquals, isObject } from '../../../src/index.ts';
import type { RJSFSchema, ValidatorType } from '../../../src/index.ts';

function typeMatches(type: unknown, data: unknown): boolean {
  if (Array.isArray(type)) {
    return type.some((entry) => typeMatches(entry, data));
  }
  switch (type) {
    case 'object':
      return isObject(data);
    case 'array':
      return Array.isArray(data);
    case 'string':
      return typeof data === 'string';
    case 'number':
      return typeof data === 'number';
    case 'integer':
      return Number.isInteger(data);
    case 'boolean':
      return typeof data === 'boolean';
    case 'null':
      return data === null;
    default:
      return true;
  }
}

function resolvePointer(root: unknown, ref: string): unknown {
  return ref
    .slice(2)
    .split('/')
    .filter((token) => token !== '')
    .map((token) => decodeURIComponent(token).replaceAll('~1', '/').replaceAll('~0', '~'))
    .reduce<unknown>((current, token) => (isObject(current) ? current[token] : undefined), root);
}

/** Checks `data` against `schema` for the keywords the graph tests use: `$ref` into the root, `type`, `const`, `enum`,
 * `required`, `properties`, `items`, `minItems`, `not`, `allOf`, `anyOf`, `oneOf` and `if`/`then`/`else`. It stands in
 * for a real validator, which `@rjsf/utils` cannot depend on.
 */
function check(schema: unknown, data: unknown, root: unknown, active: readonly unknown[] = []): boolean {
  if (typeof schema === 'boolean') {
    return schema;
  }
  // A schema that refers back to itself on the same data, such as `anyOf: [{ $ref: self }]`, fails that branch
  // rather than recursing without end
  if (!isObject(schema) || active.includes(schema)) {
    return !isObject(schema);
  }
  const inner = [...active, schema];
  const sub = (entry: unknown, value: unknown) => check(entry, value, root, value === data ? inner : []);
  const all = (schemas: unknown) => (Array.isArray(schemas) ? schemas : []).map((entry) => sub(entry, data));
  const checks: boolean[] = [
    typeof schema.$ref !== 'string' || sub(resolvePointer(root, schema.$ref), data),
    !('type' in schema) || typeMatches(schema.type, data),
    !('const' in schema) || deepEquals(schema.const, data),
    !Array.isArray(schema.enum) || schema.enum.some((value: unknown) => deepEquals(value, data)),
    !isObject(data) ||
      !Array.isArray(schema.required) ||
      schema.required.every((key: unknown) => typeof key === 'string' && data[key] !== undefined),
    !isObject(data) ||
      !isObject(schema.properties) ||
      Object.entries(schema.properties).every(([key, value]) => !(key in data) || sub(value, data[key])),
    !Array.isArray(data) || !isObject(schema.items) || data.every((row) => sub(schema.items, row)),
    !Array.isArray(data) || typeof schema.minItems !== 'number' || data.length >= schema.minItems,
    !('not' in schema) || !sub(schema.not, data),
    all(schema.allOf).every(Boolean),
    !Array.isArray(schema.anyOf) || all(schema.anyOf).some(Boolean),
    !Array.isArray(schema.oneOf) || all(schema.oneOf).filter(Boolean).length === 1,
    !('if' in schema) || (sub(schema.if, data) ? sub(schema.then ?? true, data) : sub(schema.else ?? true, data)),
  ];
  return checks.every(Boolean);
}

/** A validator whose `isValid()` is `check()`, counting its calls */
export function miniValidator(): ValidatorType & { calls: number } {
  const validator = {
    calls: 0,
    validateFormData: () => ({ errors: [], errorSchema: {} }),
    isValid: (schema: RJSFSchema, data: unknown, root: RJSFSchema) => {
      validator.calls += 1;
      return check(schema, data, root);
    },
    rawValidation: () => ({}),
  };
  return validator;
}
