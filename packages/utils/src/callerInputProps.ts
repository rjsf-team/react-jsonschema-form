import type { BaseInputTemplateProps } from './types.ts';

type CallerInputProps = Pick<BaseInputTemplateProps, 'accept' | 'inputMode' | 'multiple' | 'pattern'>;

/** The `pattern`, `inputMode`, `accept` and `multiple` a widget passes `BaseInputTemplate`, which replace the ones the
 * schema derives or go on the input beside them. A `pattern` or `inputMode` the caller names counts even when it is
 * undefined, which is how a caller turns the derived one off
 *
 * @param props - The props of the `BaseInputTemplate`
 * @returns - The `pattern`, `inputMode`, `accept` and `multiple` to spread after the derived input props
 */
export default function callerInputProps(props: CallerInputProps): CallerInputProps {
  return {
    ...('pattern' in props ? { pattern: props.pattern } : undefined),
    ...('inputMode' in props ? { inputMode: props.inputMode } : undefined),
    ...(props.accept === undefined ? undefined : { accept: props.accept }),
    ...(props.multiple === undefined ? undefined : { multiple: props.multiple }),
  };
}
