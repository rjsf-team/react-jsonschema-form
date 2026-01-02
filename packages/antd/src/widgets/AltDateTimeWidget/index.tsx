import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';

export default function AltDateTimeWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ time = true, ...props }: WidgetProps<T, S, F>) {
  const { AltDateWidget } = props.registry.widgets;
  return <AltDateWidget time={time} {...props} />;
}
