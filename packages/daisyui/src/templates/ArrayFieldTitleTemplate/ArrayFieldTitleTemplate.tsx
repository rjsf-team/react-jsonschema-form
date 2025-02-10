import { ArrayFieldTitleProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

export default function ArrayFieldTitleTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: ArrayFieldTitleProps<T, S, F>) {
  console.log('DaisyUI ArrayFieldTitleTemplate');

  props;
  return <div>ArrayFieldTitleTemplate</div>;
}
