import isString from 'lodash/isString';

import { IdSchema } from './types';
import { ID_KEY } from './constants';

/** Generates a consistent `id` pattern for a given `id` and a `suffix`
 *
 * @param id - Either simple string id or an IdSchema from which to extract it
 * @param suffix - The suffix to append to the id
 */
function idGenerator<T = any>(id: IdSchema<T> | string, suffix: string) {
  const theId = isString(id) ? id : id[ID_KEY];
  return `${theId}__${suffix}`;
}
/** Return a consistent `id` for the field description element
 *
 * @param id - Either simple string id or an IdSchema from which to extract it
 * @returns - The consistent id for the field description element from the given `id`
 */
export function descriptionId<T = any>(id: IdSchema<T> | string) {
  return idGenerator<T>(id, 'description');
}

/** Return a consistent `id` for the field error element
 *
 * @param id - Either simple string id or an IdSchema from which to extract it
 * @returns - The consistent id for the field error element from the given `id`
 */
export function errorId<T = any>(id: IdSchema<T> | string) {
  return idGenerator<T>(id, 'error');
}

/** Return a consistent `id` for the field examples element
 *
 * @param id - Either simple string id or an IdSchema from which to extract it
 * @returns - The consistent id for the field examples element from the given `id`
 */
export function examplesId<T = any>(id: IdSchema<T> | string) {
  return idGenerator<T>(id, 'examples');
}

/** Return a consistent `id` for the field help element
 *
 * @param id - Either simple string id or an IdSchema from which to extract it
 * @returns - The consistent id for the field help element from the given `id`
 */
export function helpId<T = any>(id: IdSchema<T> | string) {
  return idGenerator<T>(id, 'help');
}

/** Return a consistent `id` for the field title element
 *
 * @param id - Either simple string id or an IdSchema from which to extract it
 * @returns - The consistent id for the field title element from the given `id`
 */
export function titleId<T = any>(id: IdSchema<T> | string) {
  return idGenerator<T>(id, 'title');
}

/** Return a list of element ids that contain additional information about the field that can be used to as the aria
 * description of the field. This is correctly omitting `titleId` which would be "labeling" rather than "describing" the
 * element.
 *
 * @param id - Either simple string id or an IdSchema from which to extract it
 * @param [includeExamples=false] - Optional flag, if true, will add the `examplesId` into the list
 * @returns - The string containing the list of ids for use in an `aria-describedBy` attribute
 */
export function ariaDescribedByIds<T = any>(id: IdSchema<T> | string, includeExamples = false) {
  const examples = includeExamples ? ` ${examplesId<T>(id)}` : '';
  return `${errorId<T>(id)} ${descriptionId<T>(id)} ${helpId<T>(id)}${examples}`;
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
