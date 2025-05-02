import { ChangeEvent } from 'react';
import {
  FieldProps,
  RJSFSchema,
  StrictRJSFSchema,
  FormContextType,
  getTemplate,
  getUiOptions,
  TranslatableString,
  labelValue,
  isObject,
} from '@rjsf/utils';
import { Label, Select } from '@trussworks/react-uswds';

export default function AnyOfField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FieldProps<T, S, F>) {
  const {
    disabled,
    idSchema,
    name,
    onChange,
    options,
    readonly,
    registry,
    schema,
    uiSchema,
  } = props;

  const { fields, translateString } = registry;
  const { SchemaField } = fields;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const TitleFieldTemplate = getTemplate<'TitleFieldTemplate', T, S, F>('TitleFieldTemplate', registry, uiOptions);
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    uiOptions
  );

  const { anyOf, oneOf } = schema;
  const currentOptions = Array.isArray(anyOf) ? anyOf : Array.isArray(oneOf) ? oneOf : [];

  const currentIndex = currentOptions.findIndex((option) =>
    options && options.schema && JSON.stringify(options.schema) === JSON.stringify(option)
  );

  const handleOptionChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const index = parseInt(event.target.value, 10);
    onChange(undefined, undefined, `${idSchema.$id}_${index}`);
  };

  const fieldTitle = schema.title || name;
  const fieldDescription = schema.description;
  const selectId = `${idSchema.$id}_selector`;

  return (
    <div className="form-group">
      {fieldTitle && (
        <TitleFieldTemplate
          id={`${idSchema.$id}-title`}
          title={fieldTitle}
          required={Array.isArray(schema.required) && schema.required.includes(name)}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {fieldDescription && (
        <DescriptionFieldTemplate
          id={`${idSchema.$id}-description`}
          description={fieldDescription}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}

      <Label htmlFor={selectId}>{translateString(TranslatableString.SelectOptionLabel)}</Label>
      <Select
        id={selectId}
        name={selectId}
        value={currentIndex >= 0 ? String(currentIndex) : ''}
        disabled={disabled || readonly}
        onChange={handleOptionChange}
      >
        <option value="">{translateString(TranslatableString.SelectLabel)}</option>
        {currentOptions.map((option, index) => {
          const title = isObject(option) ? option.title : `Option ${index + 1}`;
          const label = labelValue(title || `Option ${index + 1}`, false, undefined);
          return (
            <option key={index} value={String(index)}>
              {label}
            </option>
          );
        })}
      </Select>

      {options && (
        <SchemaField
          {...props}
          required={Array.isArray(schema.required) && schema.required.includes(name)}
          schema={options.schema as S}
          idSchema={options.idSchema}
        />
      )}
    </div>
  );
}
