import type { StrictRJSFSchema } from '../../types.ts';
import type { SchemaNode } from './parseSchemaGraph.ts';

/** Returns the keywords of `source` on a schema of the plan's type. A literal or a merge result is not known to be an
 * `S`, so the copy starts as `template`, which is one, with every keyword removed. A `source` that is not an object,
 * which only an `allOf` merge with a `false` member returns, has no keywords to copy.
 */
export function schemaFrom<S extends StrictRJSFSchema, U>(template: S, source: U): S {
  const schema = { ...template };
  for (const key of Reflect.ownKeys(schema)) {
    Reflect.deleteProperty(schema, key);
  }
  return Object.assign(schema, source);
}

/** Returns the schema the boolean subschema `value` reads as: `true` as `{}`, `false` as `{ not: {} }`
 *
 * @param value - The boolean subschema
 * @param template - A schema of the type to return, whose keywords are not copied
 * @returns - The object schema
 */
export function schemaOfBoolean<S extends StrictRJSFSchema>(value: boolean, template: S): S {
  return schemaFrom(template, value ? {} : { not: {} });
}

/** The schema a boolean node reads as, as `schemaOfBoolean()` reads its value; any other node reads as `{}` */
export function booleanSchema<S extends StrictRJSFSchema>(node: SchemaNode<S>, template: S): S {
  return schemaOfBoolean(node.kind !== 'boolean' || node.value, template);
}
