import { RJSFSchema } from './types';
import { resolveDateExpression } from './resolveDateExpression';

const DATE_FORMATS = new Set(['date', 'date-time', 'time']);

function resolveSchemaNode(schema: RJSFSchema): RJSFSchema {
  const resolved: RJSFSchema = { ...schema };

  if (resolved.format && DATE_FORMATS.has(resolved.format as string)) {
    if (typeof resolved.formatMinimum === 'string') {
      resolved.formatMinimum = resolveDateExpression(resolved.formatMinimum, resolved.format as string);
    }
    if (typeof resolved.formatMaximum === 'string') {
      resolved.formatMaximum = resolveDateExpression(resolved.formatMaximum, resolved.format as string);
    }
  }

  if (resolved.properties) {
    resolved.properties = Object.fromEntries(
      Object.entries(resolved.properties).map(([key, value]) => [
        key,
        typeof value === 'object' && value !== null ? resolveSchemaNode(value as RJSFSchema) : value,
      ])
    );
  }

  if (resolved.definitions) {
    resolved.definitions = Object.fromEntries(
      Object.entries(resolved.definitions).map(([key, value]) => [
        key,
        typeof value === 'object' && value !== null ? resolveSchemaNode(value as RJSFSchema) : value,
      ])
    );
  }

  for (const key of ['allOf', 'anyOf', 'oneOf'] as const) {
    if (resolved[key]) {
      resolved[key] = (resolved[key] as RJSFSchema[]).map(resolveSchemaNode);
    }
  }

  for (const key of ['if', 'then', 'else'] as const) {
    if (resolved[key] && typeof resolved[key] === 'object') {
      (resolved as RJSFSchema)[key] = resolveSchemaNode(resolved[key] as RJSFSchema);
    }
  }

  if (resolved.items) {
    if (Array.isArray(resolved.items)) {
      resolved.items = (resolved.items as RJSFSchema[]).map(resolveSchemaNode);
    } else if (typeof resolved.items === 'object') {
      resolved.items = resolveSchemaNode(resolved.items as RJSFSchema);
    }
  }

  return resolved;
}

/** Walks a JSON Schema tree and resolves all `now()` expressions in `formatMinimum`/`formatMaximum`
 * values to concrete date strings at call time. Recurses into `properties`, `definitions`,
 * `allOf`/`anyOf`/`oneOf`, `if`/`then`/`else`, and `items`.
 *
 * Intended to be called inline on the `<Form schema>` prop so constraints stay current on every render:
 *
 * ```tsx
 * <Form schema={resolveDynamicDates(mySchema)} validator={validator} />
 * ```
 *
 * Static date strings are passed through unchanged, so existing schemas are unaffected.
 *
 * @param schema - The schema to resolve
 * @returns - A new schema with all `now()` expressions replaced by resolved date strings
 */
export function resolveDynamicDates(schema: RJSFSchema): RJSFSchema {
  return resolveSchemaNode(schema);
}
