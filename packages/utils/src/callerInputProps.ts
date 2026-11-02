import type { BaseInputTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** The `pattern` and `accept` a widget passes `BaseInputTemplate`, which replace the ones the schema derives. A
 * `pattern` the caller names counts even when it is undefined, which is how a caller turns the derived one off
 *
 * @param props - The props of the `BaseInputTemplate`
 * @returns - The `pattern` and `accept` to spread after the derived input props
 */
export default function callerInputProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: BaseInputTemplateProps<T, S, F>): Pick<BaseInputTemplateProps<T, S, F>, 'accept' | 'pattern'> {
  return {
    ...('pattern' in props ? { pattern: props.pattern } : undefined),
    ...(props.accept === undefined ? undefined : { accept: props.accept }),
  };
}
