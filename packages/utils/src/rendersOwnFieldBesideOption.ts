import getSchemaType from './getSchemaType.ts';
import getXxxOfOptions from './getXxxOfOptions.ts';
import isConstantSelect from './isConstantSelect.ts';
import type { FormContextType, RJSFSchema, SchemaUtilsType, StrictRJSFSchema, UiSchema } from './types.ts';

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

/** Whether an object holding `anyOf`/`oneOf` options has anything of its own to render beside them: properties of its
 * own or room for more keys. Such an object renders its own heading beside the options, which draws its Optional Data
 * Controls, so its selected option's field draws none and renders nothing until Add. One with neither is a pure union,
 * rendered as the field holding its options, which leaves the controls to the option. The `properties` are counted,
 * since a view taking extra keys stubs each one the data holds among them.
 *
 * @param schemaUtils - The `canExpand()` of the form's `SchemaUtilsType`
 * @param schema - The object's schema, with the extra-key keywords of the option shown joined in, so an object whose
 *        every option closes it has no room for more
 * @param [uiSchema] - The object's uiSchema, whose `expandable` can rule out more keys
 * @param [formData] - The object's form data, which can fill its `maxProperties`
 * @returns - True when the object renders properties of its own or room for more keys beside its options
 */
export function hasOwnContentBesideOptions<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schemaUtils: Pick<SchemaUtilsType<T, S, F>, 'canExpand'>,
  schema: S,
  uiSchema?: UiSchema<T, S, F>,
  formData?: T,
): boolean {
  return Object.keys(schema.properties ?? {}).length > 0 || schemaUtils.canExpand(schema, uiSchema, formData);
}
