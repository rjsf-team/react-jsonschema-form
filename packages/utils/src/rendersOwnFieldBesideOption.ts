import getSchemaType from './getSchemaType.ts';
import getXxxOfOptions from './getXxxOfOptions.ts';
import isConstantSelect from './isConstantSelect.ts';
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
  // The same test of a select `SchemaField` renders the options with, so the two agree on which field this is
  return (
    getXxxOfOptions<S>(option) !== undefined &&
    !isConstantSelect<S>(option, true) &&
    (option.type === undefined || rendersOwnFieldBesideOption<S>(option))
  );
}

/** Whether `option` takes the extra keys of `parent` in the place of the parent's own field: an object parent renders
 * a field beside the option, which leaves the extra keys to an option rendering a field of its own beside options of
 * its own (see `getRenderedOptionSchema()`)
 *
 * @param parent - The schema holding the options
 * @param option - One of its options
 * @returns - True when the option's field takes the parent's extra keys
 */
export function takesParentExtraKeys<S extends StrictRJSFSchema = RJSFSchema>(parent: S, option: S): boolean {
  return rendersOwnFieldBesideOption<S>(parent) && rendersOwnFieldBesideOwnOptions<S>(option);
}
