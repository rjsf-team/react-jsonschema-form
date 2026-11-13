import { errorId } from './idGenerators.ts';
import type {
  ControlAttributes,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WrapIfAdditionalTemplateProps,
} from './types.ts';

/** Gets the attributes the key input of an `additionalProperties` entry carries while the parent schema forbids its key
 * and its row shows errors, which then say so: the key is the one control the user has to change, so it is
 * `aria-invalid` and described by the row's errors. An allowed key's row showing errors about its value leaves the key
 * unmarked
 *
 * @param props - The `id`, `keyNotAllowed`, `hasErrors` and `presentation` of the `WrapIfAdditionalTemplate`
 * @returns - The `aria-describedby` and `aria-invalid`, or neither when the key is allowed or the row shows no errors
 */
export default function getAdditionalKeyAttributes<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  props: Pick<WrapIfAdditionalTemplateProps<T, S, F>, 'id' | 'keyNotAllowed' | 'hasErrors' | 'presentation'>,
): Pick<ControlAttributes, 'aria-describedby' | 'aria-invalid'> {
  if (!props.keyNotAllowed || !props.hasErrors) {
    return {};
  }
  return { 'aria-describedby': props.presentation?.errors.id ?? errorId(props.id), 'aria-invalid': true };
}
