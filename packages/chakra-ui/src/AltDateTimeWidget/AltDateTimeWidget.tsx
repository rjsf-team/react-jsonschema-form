import _AltDateWidget from '../AltDateWidget';
import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';

function AltDateTimeWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
  const { AltDateWidget } = props.registry.widgets;
  return <AltDateWidget {...props} showTime />;
}

AltDateTimeWidget.defaultProps = {
  ..._AltDateWidget.defaultProps,
  showTime: true,
};

export default AltDateTimeWidget;
