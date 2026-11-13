import type { ControlAttributes } from './types.ts';

/** Gets the attributes that describe a control from the parts of its field's plan: `aria-describedby` listing the ids
 * of the parts that render, and `aria-invalid` while the field shows errors. `resolveFieldPresentation()` builds a
 * control's attributes with it, and so can a caller planning a control the resolver didn't, such as an option selector
 * named by an object's heading
 *
 * @param describedBy - The ids of the parts describing the control, in order, each once
 * @param errors - The error messages the field shows
 * @returns - The `aria-describedby` and `aria-invalid`, each left out when there is nothing to say
 */
export default function getDescribedControlAttributes(
  describedBy: readonly string[],
  errors: readonly string[],
): Pick<ControlAttributes, 'aria-describedby' | 'aria-invalid'> {
  return {
    ...(describedBy.length > 0 && { 'aria-describedby': describedBy.join(' ') }),
    ...(errors.length > 0 && { 'aria-invalid': true }),
  };
}
