import { errorId } from './idGenerators.ts';
import type {
  ControlAttributes,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WrapIfAdditionalTemplateProps,
} from './types.ts';

/** Gets the attributes the key input of an `additionalProperties` entry carries while its row shows errors: the key is
 * the one control a forbidden key's row has, so it is `aria-invalid` and described by the row's errors. The template
 * can't tell a key's error from its value's, so it does this for any error the row shows
 *
 * @param props - The `id`, `hasErrors` and `presentation` of the `WrapIfAdditionalTemplate`
 * @returns - The `aria-describedby` and `aria-invalid`, or neither when the row shows no errors
 */
export default function getAdditionalKeyAttributes<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  props: Pick<WrapIfAdditionalTemplateProps<T, S, F>, 'id' | 'hasErrors' | 'presentation'>,
): Pick<ControlAttributes, 'aria-describedby' | 'aria-invalid'> {
  if (!props.hasErrors) {
    return {};
  }
  return { 'aria-describedby': props.presentation?.errors.id ?? errorId(props.id), 'aria-invalid': true };
}
