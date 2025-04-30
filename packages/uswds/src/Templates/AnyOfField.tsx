import React, { ChangeEvent } from 'react';
import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  FieldProps,
  getTemplate,
  getUiOptions,
  optionId,
  GenericObjectType,
  TranslatableString, // Ensure TranslatableString is imported
} from '@rjsf/utils';
// Use Select component
import { FormGroup, Label, Select } from '@trussworks/react-uswds';

/** The `AnyOfField` component is used to render a field in the schema that is an `anyOf` or `oneOf`. It renders a
 * dropdown select input that allows the user to select between the options defined in the `anyOf`/`oneOf` array.
 *
 * @param props - The `FieldProps` for this component
 */
export default function AnyOfField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FieldProps<T, S, F>) {
  const {
    baseType,
    disabled = false,
    errorSchema = {},
    formContext,
    formData,
    hideError,
    idPrefix,
    idSchema,
    idSeparator,
    name,
    onBlur,
    onChange,
    onFocus,
    options,
    registry,
    required = false,
    schema,
    uiSchema,
  } = props;

  const { widgets, fields, translateString } = registry;
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

  // Find index based on resolved schema passed in options
  const currentIndex = currentOptions.findIndex((option) =>
    options && options.schema && JSON.stringify(options.schema) === JSON.stringify(option)
  );

  const handleOptionChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const index = parseInt(event.target.value, 10);
    // Trigger re-resolution by RJSF core
    onChange(undefined, undefined, `${idSchema.$id}_${index}`);
  };

  const fieldTitle = schema.title || name;
  const fieldDescription = schema.description;
  const selectId = `${idSchema.$id}_selector`;

  return (
    <FormGroup>
      {fieldTitle && (
        <TitleFieldTemplate
          id={`${idSchema.$id}-title`}
          title={fieldTitle}
          required={required}
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

      <Label htmlFor={selectId}>{translateString(TranslatableString.SelectOption)}</Label>
      {/* Always use standard Select */}
      <Select
        id={selectId}
        name={selectId}
        // Use index as string for value
        value={currentIndex >= 0 ? String(currentIndex) : ''}
        disabled={disabled}
        onChange={handleOptionChange}
        // onBlur={onBlur} // Attach if needed
        // onFocus={onFocus} // Attach if needed
      >
        <option value="">{translateString(TranslatableString.SelectLabel)}</option>
        {currentOptions.map((option, index) => {
          const label = (option as RJSFSchema).title || `Option ${index + 1}`;
          // Use index as string for option value
          return (
            <option key={index} value={String(index)}>
              {label}
            </option>
          );
        })}
      </Select>

      {/* Render the sub-form for the currently selected option */}
      {options && (
        <SchemaField
          {...props}
          schema={options.schema as S}
          idSchema={options.idSchema}
        />
      )}
    </FormGroup>
  );
}
