import {
  descriptionId,
  getTemplate,
  labelValue,
  WidgetProps,
  schemaRequiresTrueValue,
  StrictRJSFSchema,
  RJSFSchema,
  FormContextType,
} from '@rjsf/utils';
import { CheckboxInput } from '@appfolio/react-gears';

export default function CheckboxWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    value,
    disabled,
    readonly,
    label,
    hideLabel,
    schema,
    autofocus,
    options,
    onChange,
    onBlur,
    onFocus,
    registry,
    uiSchema,
  } = props;
  // Because an unchecked checkbox will cause html5 validation to fail, only add
  // the "required" attribute if the field value must be "true", due to the
  // "const" or "enum" keywords
  const required = schemaRequiresTrueValue<S>(schema);
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    options
  );

  const description = options.description || schema.description;
  return (
    <>
      <CheckboxInput
        id={id}
        name={id}
        checkboxLabel={labelValue(label, hideLabel || !label)}
        checked={typeof value === 'undefined' ? false : value}
        required={required}
        disabled={disabled || readonly}
        autoFocus={autofocus}
        onChange={onChange}
        type='checkbox'
        onBlur={onBlur}
        onFocus={onFocus}
      />
      {!hideLabel && description && (
        <DescriptionFieldTemplate
          id={descriptionId<T>(id)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
    </>
  );
}
