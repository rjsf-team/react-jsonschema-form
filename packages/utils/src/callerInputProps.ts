import type { BaseInputTemplateProps } from './types.ts';

type CallerInputProps = Pick<BaseInputTemplateProps, 'accept' | 'inputMode' | 'pattern'>;

/** The `pattern`, `inputMode` and `accept` a widget passes `BaseInputTemplate`, which replace the ones the schema
 * derives. A `pattern` or `inputMode` the caller names counts even when it is undefined, which is how a caller turns the
 * derived one off
 *
 * @param props - The props of the `BaseInputTemplate`
 * @returns - The `pattern`, `inputMode` and `accept` to spread after the derived input props
 */
export default function callerInputProps(props: CallerInputProps): CallerInputProps {
  return {
    ...('pattern' in props ? { pattern: props.pattern } : undefined),
    ...('inputMode' in props ? { inputMode: props.inputMode } : undefined),
    ...(props.accept === undefined ? undefined : { accept: props.accept }),
  };
}
