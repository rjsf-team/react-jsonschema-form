import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';

import _AltDateWidget from '../AltDateWidget';

export default function AltDateTimeWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const { AltDateWidget } = props.registry.widgets;
  return <AltDateWidget showTime {...props} />;
}

AltDateTimeWidget.defaultProps = {
  ..._AltDateWidget.defaultProps,
  showTime: true,
};
