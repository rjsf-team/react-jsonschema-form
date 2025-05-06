import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
  getTemplate,
  getInputProps,
} from '@rjsf/utils';

export default function TextInputWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const { options, schema, type: propType, registry } = props;
  const BaseInputTemplate = getTemplate<'BaseInputTemplate', T, S, F>(
    'BaseInputTemplate',
    registry,
    options,
  );

  const inputType = propType || (schema.type === 'string' ? 'text' : schema.type);

  const inputProps = getInputProps<T, S, F>(schema, inputType, options);

  return <BaseInputTemplate {...props} {...inputProps} type={inputType} />;
}
