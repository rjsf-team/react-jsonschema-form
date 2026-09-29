/** Generates a consistent `id` pattern for a given `id` and a `suffix`
 *
 * @param id - The id of the field
 * @param suffix - The suffix to append to the id
 */
function idGenerator(id: string, suffix: string) {
  return `${id}__${suffix}`;
}
/** Return a consistent `id` for the field description element
 *
 * @param id - The id of the field
 * @returns - The consistent id for the field description element from the given `id`
 */
export function descriptionId(id: string) {
  return idGenerator(id, 'description');
}

/** Return a consistent `id` for the field error element
 *
 * @param id - The id of the field
 * @returns - The consistent id for the field error element from the given `id`
 */
export function errorId(id: string) {
  return idGenerator(id, 'error');
}

/** Return a consistent `id` for the field examples element
 *
 * @param id - The id of the field
 * @returns - The consistent id for the field examples element from the given `id`
 */
export function examplesId(id: string) {
  return idGenerator(id, 'examples');
}

/** Return a consistent `id` for the field help element
 *
 * @param id - The id of the field
 * @returns - The consistent id for the field help element from the given `id`
 */
export function helpId(id: string) {
  return idGenerator(id, 'help');
}

/** Return a consistent `id` for the field title element
 *
 * @param id - The id of the field
 * @returns - The consistent id for the field title element from the given `id`
 */
export function titleId(id: string) {
  return idGenerator(id, 'title');
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
  return `${id}__label`;
}

/** Return a consistent `id` for the element inside a picker's trigger that displays the selected value. A trigger that
 * is a `button` is named by the label pointing at it, which replaces its own contents, so the value it displays is
 * only announced where something references it — `aria-describedby`, the way a native control announces its value
 * after its name.
 *
 * @param id - The id of the trigger
 * @returns - The consistent id for the element displaying its value
 */
export function triggerValueId(id: string) {
  return `${id}__value`;
}

/** Return a consistent `id` for one of the date element selectors an `AltDateWidget` renders, so a theme can point a
 * label at the year, month or day control rather than rebuilding this shape itself. Note that the separator here is
 * always `_`, independent of the form's `idSeparator`
 *
 * @param rootId - The id of the `AltDateWidget` field the date element belongs to
 * @param type - The type of the date element, as given by its `DateElementProp`
 * @returns - The consistent id for that date element's control
 */
export function dateElementId(rootId: string, type: string) {
  return `${rootId}_${type}`;
}

/** Return a consistent `id` for the `optionIndex`s of a `Radio` or `Checkboxes` widget
 *
 * @param id - The id of the parent component for the option
 * @param optionIndex - The index of the option for which the id is desired
 * @returns - An id for the option index based on the parent `id`
 */
export function optionId(id: string, optionIndex: number) {
  return `${id}-${optionIndex}`;
}

/** Return a consistent `id` for the `btn` button element
 *
 * @param id - The id of the parent component for the option
 * @param btn - The button type for which to generate the id
 * @returns - The consistent id for the button from the given `id` and `btn` type
 */
export function buttonId(id: string, btn: 'add' | 'copy' | 'moveDown' | 'moveUp' | 'remove') {
  return idGenerator(id, btn);
}

/** Return a consistent `id` for the expand button of a cyclic schema's expand controls
 *
 * @param id - The id of the field whose cyclic schema can be expanded
 * @returns - The consistent id for the expand button from the given `id`
 */
export function expandButtonId(id: string) {
  return `${id}-button`;
}

/** Return a consistent `id` for the optional data controls `element`
 *
 * @param id - The id of the parent component for the option
 * @param element - The element type for which to generate the id
 * @returns - The consistent id for the optional data controls element from the given `id` and `element` type
 */
export function optionalControlsId(id: string, element: 'Add' | 'Msg' | 'Remove') {
  return idGenerator(id, `optional${element}`);
}
