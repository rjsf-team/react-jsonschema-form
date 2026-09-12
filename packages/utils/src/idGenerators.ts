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

/** Return a consistent `id` for the optional data controls `element`
 *
 * @param id - The id of the parent component for the option
 * @param element - The element type for which to generate the id
 * @returns - The consistent id for the optional data controls element from the given `id` and `element` type
 */
export function optionalControlsId(id: string, element: 'Add' | 'Msg' | 'Remove') {
  return idGenerator(id, `optional${element}`);
}
