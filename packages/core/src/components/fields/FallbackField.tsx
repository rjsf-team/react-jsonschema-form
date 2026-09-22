import { useMemo, useState } from 'react';
import type { FallbackFieldProps, FormContextType, RJSFMarkedSchema, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import {
  ADDITIONAL_PROPERTIES_KEY,
  ADDITIONAL_PROPERTY_FLAG,
  getTemplate,
  getUiOptions,
  getUnionTypes,
  GUESSED_TYPE_FLAG,
  hashObject,
  JSON_SCHEMA_TYPES,
  PATTERN_PROPERTIES_KEY,
  PROPERTIES_KEY,
  toFieldPath,
  fieldPathToId,
  TranslatableString,
} from '@rjsf/utils';
import type { JSONSchema7TypeName } from 'json-schema';

/**
 * Get the types the type selection component offers for a schema. A schema that allows several types offers exactly
 * those, while one with no usable type at all — an unrecognized type, or an `additionalProperties` entry the schema
 * puts no constraint on — is free to hold anything, so it offers every JSON Schema type.
 * @param schema - The schema being rendered by the fallback UI.
 */
function getFallbackTypes<S extends StrictRJSFSchema = RJSFSchema>(schema: S): JSONSchema7TypeName[] {
  return getUnionTypes<S>(schema) ?? [...JSON_SCHEMA_TYPES];
}

/**
 * Get the schema for the type selection component.
 * @param types - The types the selection offers.
 * @param title - The translated title for the type selection schema.
 */
function getFallbackTypeSelectionSchema(types: JSONSchema7TypeName[], title: string): RJSFSchema {
  return {
    type: 'string',
    enum: types,
    default: types[0],
    title,
  };
}

/**
 * Determines the JSON Schema type of the given formData.
 * @param formData - The form data whose type is to be determined.
 */
function getTypeOfFormData(formData: any): JSONSchema7TypeName {
  const dataType = typeof formData;
  if (dataType === 'string' || dataType === 'number' || dataType === 'boolean') {
    return dataType;
  }
  if (dataType === 'object') {
    if (formData === null) {
      return 'null';
    }
    return Array.isArray(formData) ? 'array' : 'object';
  }
  // Treat everything else as a string
  return 'string';
}

/**
 * Determines which of the `types` the selection starts on, preferring the type the `formData` already has so that
 * existing data is shown by the field that matches it. An integer-only schema takes a number, and data of a type the
 * schema does not allow falls back to the first type offered, as does having no data to go on at all.
 * @param formData - The form data being rendered.
 * @param types - The types the selection offers.
 */
function getInitialType(formData: any, types: JSONSchema7TypeName[]): JSONSchema7TypeName {
  if (formData === undefined) {
    // Nothing to match, so the schema's own first type wins, which is what the selection defaults to
    return types[0];
  }
  const dataType = getTypeOfFormData(formData);
  if (types.includes(dataType)) {
    return dataType;
  }
  if (dataType === 'number' && types.includes('integer')) {
    return 'integer';
  }
  return types[0];
}

/**
 * Get the schema the value field renders: the `schema` with its `type` pinned to the one the selector is on, so that
 * every other keyword — a union's `properties`, `enum`, `items`, `format`, ... — still describes the value being
 * entered. The markers `retrieveSchema()` adds are dropped, since keeping `GUESSED_TYPE_FLAG` would route the value
 * field straight back here and keeping `ADDITIONAL_PROPERTY_FLAG` would render a second key input within this one.
 * @param schema - The schema being rendered by the fallback UI.
 * @param type - The type currently chosen in the type selector.
 * @param title - The translated title for the value schema.
 */
function getValueSchema<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  type: JSONSchema7TypeName,
  title: string,
): S {
  const valueSchema = { ...schema, type, title } as RJSFMarkedSchema;
  delete valueSchema[GUESSED_TYPE_FLAG];
  delete valueSchema[ADDITIONAL_PROPERTY_FLAG];
  const describesMembers =
    PROPERTIES_KEY in valueSchema || ADDITIONAL_PROPERTIES_KEY in valueSchema || PATTERN_PROPERTIES_KEY in valueSchema;
  // An object the schema says nothing more about takes any key/value pair, which is what this UI is here to offer
  if (type === 'object' && !describesMembers) {
    valueSchema[ADDITIONAL_PROPERTIES_KEY] = true;
  }
  return valueSchema as S;
}

/**
 * Casts the given formData to the specified type.
 * @param formData - The form data to be casted.
 * @param newType - The target type to which the form data should be casted.
 */
function castToNewType<T = any>(formData: T, newType: JSONSchema7TypeName): T {
  switch (newType) {
    case 'string':
      // A value of any other shape has no text form a user would have typed: `String()` would put the literal
      // `null` or `[object Object]` into the input as though it were real data
      return (formData == null || typeof formData === 'object' ? '' : String(formData)) as T;
    case 'number': {
      const castedNumber = Number(formData);
      return (Number.isNaN(castedNumber) ? 0 : castedNumber) as T;
    }
    case 'integer': {
      const castedNumber = Math.round(Number(formData));
      return (Number.isNaN(castedNumber) ? 0 : castedNumber) as T;
    }
    case 'boolean':
      return Boolean(formData) as T;
    case 'null':
      return null as T;
    // An array or object cannot hold the data of any other type, so they start out empty
    case 'array':
      return [] as T;
    case 'object':
      return {} as T;
    default:
      return formData;
  }
}

/**
 * The `FallbackField` component is used to render a field for unsupported or unknown schema types. If
 * `useFallbackUiForUnsupportedType` is enabled in the `globalUiOptions`, it provides a type selector
 */
export default function FallbackField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FallbackFieldProps<T, S, F>) {
  const {
    id,
    formData,
    displayLabel = true,
    schema,
    name,
    uiSchema,
    required,
    disabled = false,
    readonly = false,
    onBlur,
    onFocus,
    registry,
    fieldPath,
    onChange,
    errorSchema,
  } = props;
  const { translateString, fields, globalFormOptions } = registry;
  const types = useMemo(() => getFallbackTypes<S>(schema), [schema]);
  const [selectedType, setSelectedType] = useState<JSONSchema7TypeName>(() => getInitialType(formData, types));
  // The types on offer change with the schema — a `dependencies` or `oneOf` branch switch can replace them
  // wholesale — so a selection the schema no longer allows gives way to the type the current data fits. Without
  // this the selector would show one type while the field below it rendered another
  const type = types.includes(selectedType) ? selectedType : getInitialType(formData, types);

  const uiOptions = getUiOptions<T, S, F>(uiSchema);

  const typeSelectorFieldPath = toFieldPath('__internal_type_selector', fieldPath);

  const schemaTitle = translateString(TranslatableString.Type);
  const typesOptionSchema = useMemo(() => getFallbackTypeSelectionSchema(types, schemaTitle), [types, schemaTitle]);

  const valueSchema = useMemo(
    () => getValueSchema<S>(schema, type, translateString(TranslatableString.Value)),
    [schema, type, translateString],
  );

  const onTypeChange = (newType: T | undefined) => {
    if (newType != null) {
      setSelectedType(newType as JSONSchema7TypeName);
      onChange(castToNewType<T>(formData as T, newType as JSONSchema7TypeName), fieldPath, errorSchema, id);
    }
  };

  if (!globalFormOptions.useFallbackUiForUnsupportedType) {
    const { reason = translateString(TranslatableString.UnknownFieldType, [String(schema.type)]) } = props;
    const UnsupportedFieldTemplate = getTemplate<'UnsupportedFieldTemplate', T, S, F>(
      'UnsupportedFieldTemplate',
      registry,
      uiOptions,
    );

    return <UnsupportedFieldTemplate schema={schema} uiSchema={uiSchema} id={id} reason={reason} registry={registry} />;
  }

  const FallbackFieldTemplate = getTemplate<'FallbackFieldTemplate', T, S, F>(
    'FallbackFieldTemplate',
    registry,
    uiOptions,
  );

  const { SchemaField } = fields;

  return (
    <FallbackFieldTemplate
      schema={schema}
      registry={registry}
      typeSelector={
        <SchemaField
          key={formData ? hashObject(formData) : '__empty__'}
          fieldPath={typeSelectorFieldPath}
          id={fieldPathToId(typeSelectorFieldPath, globalFormOptions)}
          name={`${name}__fallback_type`}
          schema={typesOptionSchema as S}
          formData={type as T}
          onChange={onTypeChange}
          onBlur={onBlur}
          onFocus={onFocus}
          registry={registry}
          hideLabel={!displayLabel}
          disabled={disabled}
          readonly={readonly}
          required={required}
        />
      }
      schemaField={<SchemaField {...props} schema={valueSchema} />}
    />
  );
}
