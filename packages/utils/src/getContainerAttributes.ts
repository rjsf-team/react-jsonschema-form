import getDescribedControlAttributes from './getDescribedControlAttributes.ts';
import { titleId } from './idGenerators.ts';
import type { ControlAttributes, FieldPresentation } from './types.ts';

/** Gets the attributes a container's template spreads onto the group around its title, description and contents, such
 * as an array's or an object's `<fieldset>`, which has no control for its field's errors, description and help to
 * describe: an `aria-labelledby` naming the group by the title the template draws, and an `aria-describedby` listing
 * the ids of those parts that render. It never carries `aria-invalid`, which ARIA doesn't allow on a `group`
 *
 * @param presentation - The plan of the container's field, if it has one
 * @param id - The id of the container's field, which its title is drawn under
 * @param [title] - The title the template draws, if any
 * @returns - The `aria-labelledby` and `aria-describedby`, each left out when there is nothing to say
 */
export default function getContainerAttributes(
  presentation: FieldPresentation | undefined,
  id: string,
  title?: string,
): Pick<ControlAttributes, 'aria-labelledby' | 'aria-describedby'> {
  return {
    ...(title && { 'aria-labelledby': titleId(id) }),
    ...getDescribedControlAttributes(presentation?.describedBy ?? [], []),
  };
}
