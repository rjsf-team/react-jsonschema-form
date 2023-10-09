import { FormContextType, RegistryFieldsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import MultiSchemaField from '../MultiSchemaField';

/** Generates a set of Fields `carbon` theme uses.
 */
export function generateFields<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(): RegistryFieldsType<T, S, F> {
  return {
    OneOfField: MultiSchemaField,
    AnyOfField: MultiSchemaField,
  };
}

export default generateFields();
