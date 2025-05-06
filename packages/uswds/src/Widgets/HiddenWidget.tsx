import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';

export default function HiddenWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ id, value }: WidgetProps<T, S, F>) {
  return (
    <input type="hidden" id={id} name={id} value={typeof value === 'undefined' ? '' : value} />
  );
}
