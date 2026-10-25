/** Generates the `id` of an element that is part of a field, such as its description or one of its controls, from the
 * field's `id` and the name of the part. Every id derived from a field's id is built here, joined by `__`, which
 * `fieldPathToId()` never writes into a field's own id, so a part's id can't be the id of another field
 *
 * @param id - The id of the field
 * @param part - The name of the part
 * @returns - The id of that part of the field
 */
export function partId(id: string, part: string) {
  return `${id}__${part}`;
}
/** Return a consistent `id` for the field description element
 *
 * @param id - The id of the field
 * @returns - The consistent id for the field description element from the given `id`
 */
export function descriptionId(id: string) {
  return partId(id, 'description');
}

/** Return a consistent `id` for the field error element
 *
 * @param id - The id of the field
 * @returns - The consistent id for the field error element from the given `id`
 */
export function errorId(id: string) {
  return partId(id, 'error');
}

/** Return a consistent `id` for the field examples element
 *
 * @param id - The id of the field
 * @returns - The consistent id for the field examples element from the given `id`
 */
export function examplesId(id: string) {
  return partId(id, 'examples');
}

/** Return a consistent `id` for the field help element
 *
 * @param id - The id of the field
 * @returns - The consistent id for the field help element from the given `id`
 */
export function helpId(id: string) {
  return partId(id, 'help');
}

/** Generates the `id` of an option's own description, help or label, numbered from the second on, so an option showing
 * its own text beneath another that shows its own renders under an id of its own
 *
 * @param id - The id of the field
 * @param suffix - The suffix of the first option's id
 * @param depth - How many fields above rendering the same `id` show text, or draw a label, of their own
 */
function optionIdGenerator(id: string, suffix: string, depth: number) {
  return partId(id, depth > 1 ? `${suffix}${depth}` : suffix);
}

/** Return a consistent `id` for the description a selected `anyOf`/`oneOf` option or the fallback UI's value field
 * renders of its own, beneath a field that renders a different description under `descriptionId()` for the same `id`
 *
 * @param id - The id of the field
 * @param [depth=1] - How many fields above rendering the same `id` show a description of their own: 2 beneath a
 *        field and an option that each show one, which takes `optionDescription2`
 * @returns - The consistent id for the option's own description element from the given `id` and `depth`
 */
export function optionDescriptionId(id: string, depth = 1) {
  return optionIdGenerator(id, 'optionDescription', depth);
}

/** Return a consistent `id` for the label a selected `anyOf`/`oneOf` option or the fallback UI's value field draws of
 * its own, beneath a field whose own component already draws a label under the id it would take, such as the option
 * selector drawing an `anyOf` field's label beside an option whose widget draws its own
 *
 * @param id - The id of the field
 * @param [depth=1] - How many fields above rendering the same `id` draw a label: 2 beneath a field and an option that
 *        each draw one, which takes `optionLabel2`
 * @returns - The consistent id for the option's own label element from the given `id` and `depth`
 */
export function optionLabelId(id: string, depth = 1) {
  return optionIdGenerator(id, 'optionLabel', depth);
}

/** Return a consistent `id` for the help a selected `anyOf`/`oneOf` option or the fallback UI's value field renders of
 * its own, beneath a field that renders a different help under `helpId()` for the same `id`
 *
 * @param id - The id of the field
 * @param [depth=1] - How many fields above rendering the same `id` show a help of their own: 2 beneath a
 *        field and an option that each show one, which takes `optionHelp2`
 * @returns - The consistent id for the option's own help element from the given `id` and `depth`
 */
export function optionHelpId(id: string, depth = 1) {
  return optionIdGenerator(id, 'optionHelp', depth);
}

/** Return a consistent `id` for the description of the option a select widget has selected, which describes that
 * option rather than the field, so it can't share the field's `descriptionId()`
 *
 * @param id - The id of the field
 * @returns - The consistent id for the selected option's description element from the given `id`
 */
export function selectedOptionDescriptionId(id: string) {
  return partId(id, 'selectedOptionDescription');
}

/** Return a consistent `id` for the field title element
 *
 * @param id - The id of the field
 * @returns - The consistent id for the field title element from the given `id`
 */
export function titleId(id: string) {
  return partId(id, 'title');
}

/** Return a list of element ids that contain additional information about the field that can be used to as the aria
 * description of the field. This is correctly omitting `titleId` which would be "labeling" rather than "describing" the
 * element.
 *
 * @param id - The id of the field
 * @param [includeExamples=false] - Optional flag, if true, will add the `examplesId` into the list
 * @returns - The string containing the list of ids for use in an `aria-describedBy` attribute
 */
export function ariaDescribedByIds(id: string, includeExamples = false) {
  const examples = includeExamples ? ` ${examplesId(id)}` : '';
  return `${errorId(id)} ${descriptionId(id)} ${helpId(id)}${examples}`;
}

/** Return a consistent `id` for the label a theme's `FieldTemplate` renders above a field's control, so a widget that
 * a `label htmlFor` cannot name — a group of controls, since the association reaches a single control rather than the
 * element wrapping them — can point `aria-labelledby` at the text the user actually sees. It cannot be `titleId()`,
 * which `TitleFieldTemplate` already claims for the same field, so an `additionalProperties` object would carry that
 * id twice.
 *
 * A single control, including a `button` a picker opens from, is named by the label's `htmlFor` alone and needs no
 * reference of its own: an `aria-labelledby` pointing here outranks that association, so under a `FieldTemplate` that
 * renders no label with this id it would leave the control named by its own contents, or by nothing at all.
 *
 * Two labels end up with this id wherever two `FieldTemplate`s render for one field id, which already gives that
 * control two `label htmlFor` of its own: a `oneOf` of constants, whose selected option renders again inside the
 * field, and a layout that places the same field twice. A reference resolves to the first, which is the field's own
 * label rather than the option's.
 *
 * @param id - The id of the field
 * @returns - The consistent id for that field's label element
 */
export function fieldLabelId(id: string) {
  return partId(id, 'label');
}

/** Return a consistent `id` for one of the date element selectors an `AltDateWidget` renders, so a theme can point a
 * label at the year, month or day control rather than rebuilding this shape itself
 *
 * @param rootId - The id of the `AltDateWidget` field the date element belongs to
 * @param type - The type of the date element, as given by its `DateElementProp`
 * @returns - The consistent id for that date element's control
 */
export function dateElementId(rootId: string, type: string) {
  return partId(rootId, type);
}

/** Return a consistent `id` for the `optionIndex`s of a `Radio` or `Checkboxes` widget
 *
 * @param id - The id of the parent component for the option
 * @param optionIndex - The index of the option for which the id is desired
 * @returns - An id for the option index based on the parent `id`
 */
export function optionId(id: string, optionIndex: number) {
  return partId(id, String(optionIndex));
}

/** Return a consistent `id` for the `btn` button element
 *
 * @param id - The id of the parent component for the option
 * @param btn - The button type for which to generate the id
 * @returns - The consistent id for the button from the given `id` and `btn` type
 */
export function buttonId(id: string, btn: 'add' | 'copy' | 'moveDown' | 'moveUp' | 'remove') {
  return partId(id, btn);
}

/** Return a consistent `id` for the expand button of a cyclic schema's expand controls
 *
 * @param id - The id of the field whose cyclic schema can be expanded
 * @returns - The consistent id for the expand button from the given `id`
 */
export function expandButtonId(id: string) {
  return partId(id, 'expand');
}

/** Return a consistent `id` for the optional data controls `element`
 *
 * @param id - The id of the parent component for the option
 * @param element - The element type for which to generate the id
 * @returns - The consistent id for the optional data controls element from the given `id` and `element` type
 */
export function optionalControlsId(id: string, element: 'Add' | 'Msg' | 'Remove') {
  return partId(id, `optional${element}`);
}

/** Return a consistent `id` for the input a `WrapIfAdditionalTemplate` renders to edit an additional property's key
 *
 * @param id - The id of the additional property's field
 * @returns - The consistent id for the key input from the given `id`
 */
export function additionalKeyId(id: string) {
  return partId(id, 'key');
}

/** Return a consistent `id` for the selector a field renders to pick its `anyOf`/`oneOf` option, numbered from the
 * second on, so a selector rendered for an option that is itself an `anyOf`/`oneOf` has an id of its own
 *
 * @param id - The id of the field
 * @param xxxOfKey - The keyword holding the options, `anyOf` or `oneOf`
 * @param [depth=1] - How many selectors for the same keyword render `id`, this one included: 2 for the selector of an
 *        `anyOf` option beneath its field's own `anyOf` selector, which takes `anyof_select2`
 * @returns - The consistent id for the option selector from the given `id`, keyword and `depth`
 */
export function optionSelectorId(id: string, xxxOfKey: 'anyOf' | 'oneOf', depth = 1) {
  return optionIdGenerator(id, `${xxxOfKey.toLowerCase()}_select`, depth);
}

/** Return a consistent `id` for the component a field renders beside its `anyOf`/`oneOf` options, such as an object's
 * own properties, whose selected option renders the field's own `id`, numbered from the second on, so the component an
 * option that is itself an `anyOf`/`oneOf` renders beside its own options has an id of its own
 *
 * @param id - The id of the field
 * @param [depth=1] - How many option selectors of either keyword render `id`, this field's included: 2 beside the
 *        options of an `anyOf` option beneath its field's own `anyOf`, which takes `XxxOf2`
 * @returns - The consistent id for the component rendered beside the options from the given `id` and `depth`
 */
export function besideOptionsId(id: string, depth = 1) {
  return optionIdGenerator(id, 'XxxOf', depth);
}

/** Return a consistent `id` for the type selector the fallback UI renders for a field of an unsupported type, as a part
 * of the field
 *
 * @param id - The id of the field
 * @returns - The consistent id for the type selector from the given `id`
 */
export function fallbackTypeSelectorId(id: string) {
  return partId(id, 'internalTypeSelector');
}
