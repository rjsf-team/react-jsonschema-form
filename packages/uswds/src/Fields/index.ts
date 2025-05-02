import { Field, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import AnyOfField from '../Templates/AnyOfField'; // Adjust path if needed

export function generateFields<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(): { [name: string]: Field<T, S, F> } {
  return {
    AnyOfField,
    // OneOfField will also use the AnyOfField template
    OneOfField: AnyOfField,
  };
}

export default generateFields();
