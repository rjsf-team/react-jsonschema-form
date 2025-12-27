import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';

function AltDateTimeWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  time = true,
  ...props
}: WidgetProps<T, S, F>) {
  const { AltDateWidget } = props.registry.widgets;
  return <AltDateWidget {...props} time={time} />;
}

export default AltDateTimeWidget;
