import { UnsupportedFieldProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

export default function UnsupportedField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: UnsupportedFieldProps<T, S, F>) {
  console.log('DaisyUI UnsupportedField');

  props;
  return <div>UnsupportedField</div>;
}
