import getSchemaType from './getSchemaType.ts';
import getXxxOfOptions from './getXxxOfOptions.ts';
import isConstantOptionList from './isConstantOptionList.ts';
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

/** Whether an option of an object parent renders a field of its own beside options it offers in turn: rendered with the
 * parent's object type where it names none, it is an object whose `anyOf`/`oneOf` is no select of constants. That field
 * takes the extra keys of the parent's field and its own, which the parent's field leaves to it (see
 * `getRenderedOptionSchema()`), so that one field at the data path renders them.
 *
 * @param option - An option of an object parent
 * @returns - True when the option renders a field of its own beside options of its own
 */
export function rendersOwnFieldBesideOwnOptions<S extends StrictRJSFSchema = RJSFSchema>(option: S): boolean {
  const offered = getXxxOfOptions<S>(option);
  return (
    offered !== undefined &&
    !Array.isArray(option.enum) &&
    !isConstantOptionList<S>(offered.options) &&
    (option.type === undefined || rendersOwnFieldBesideOption<S>(option))
  );
}
