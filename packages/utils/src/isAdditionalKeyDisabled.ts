import type { FormContextType, RJSFSchema, StrictRJSFSchema, WrapIfAdditionalTemplateProps } from './types.ts';

/** Whether the free-text key input of an `additionalProperties` entry is disabled, which it is for a disabled or
 * read-only field, whose key must not be renamed on blur, and for one it is handed no `onKeyRenameBlur`, such as the
 * root, which `ObjectField` doesn't render
 *
 * @param props - The `disabled`, `readonly` and `onKeyRenameBlur` of the `WrapIfAdditionalTemplate`
 * @returns - True when the key input is disabled
 */
export default function isAdditionalKeyDisabled<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: Pick<WrapIfAdditionalTemplateProps<T, S, F>, 'disabled' | 'readonly' | 'onKeyRenameBlur'>) {
  return props.disabled || props.readonly || !props.onKeyRenameBlur;
}
