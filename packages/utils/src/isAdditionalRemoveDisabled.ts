import type { WrapIfAdditionalTemplateProps } from './types.ts';

/** Whether the remove button of an `additionalProperties` entry is disabled, which it is for a disabled or read-only
 * field and for one it is handed no `onRemoveProperty`, such as the root, which `ObjectField` doesn't render
 *
 * @param props - The `disabled`, `readonly` and `onRemoveProperty` of the `WrapIfAdditionalTemplate`
 * @returns - True when the remove button is disabled
 */
export default function isAdditionalRemoveDisabled(
  props: Pick<WrapIfAdditionalTemplateProps, 'disabled' | 'readonly' | 'onRemoveProperty'>,
) {
  return props.disabled || props.readonly || !props.onRemoveProperty;
}
