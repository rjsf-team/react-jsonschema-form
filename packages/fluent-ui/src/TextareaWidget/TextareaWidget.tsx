import { FormContextType, getTemplate, getUiOptions, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';

export default function TextareaWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const { uiSchema, registry } = props;
  const options = getUiOptions<T, S, F>(uiSchema);
  const BaseInputTemplate = getTemplate<'BaseInputTemplate', T, S, F>('BaseInputTemplate', registry, options);
  // TODO: rows and columns.
  return <BaseInputTemplate {...props} multiline />;
}
