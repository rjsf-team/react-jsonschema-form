import getSchemaType from './getSchemaType.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Whether the field of `schema` renders a field of its own beside its selected `anyOf`/`oneOf` option, as an object's
 * `ObjectField` does (see `getFieldComponent()` in `SchemaField`). Such a field shows its own properties and other
 * keywords, so its option is read merged with the whole field; every other field leaves the whole field to the option
 * as `getRenderedOptionSchema()` renders it. Everything that picks between the two reads this, so that none of them
 * renders one option and seeds or walks another.
 *
 * @param schema - The schema holding the options
 * @returns - True when the field renders a field of its own beside the option
 */
export default function rendersOwnFieldBesideOption<S extends StrictRJSFSchema = RJSFSchema>(schema: S): boolean {
  return getSchemaType<S>(schema) === 'object';
}
