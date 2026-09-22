import { useMemo, useState } from 'react';
import type {
  ErrorSchema,
  FallbackFieldProps,
  FormContextType,
  RegistryWidgetsType,
  RJSFMarkedSchema,
  RJSFSchema,
  StrictRJSFSchema,
  UIOptionsType,
  UiSchema,
} from '@rjsf/utils';
import {
  ADDITIONAL_PROPERTIES_KEY,
  ADDITIONAL_PROPERTY_FLAG,
  getTemplate,
  getUiOptions,
  GUESSED_TYPE_FLAG,
  guessType,
  hasWidget,
  JSON_SCHEMA_TYPES,
  PATTERN_PROPERTIES_KEY,
  PROPERTIES_KEY,
  RJSF_REF_KEY,
  toFieldPath,
  fieldPathToId,
  TranslatableString,
  UI_OPTIONS_KEY,
  UI_WIDGET_KEY,
} from '@rjsf/utils';
import type { JSONSchema7TypeName } from 'json-schema';

/**
 * Get the types the type selection component offers for a schema. A schema listing its types offers exactly the ones
 * it lists that are JSON Schema types, even when only one of them is, since the unrecognized names alongside it are
 * what sent the schema here. One with no usable type at all — an unrecognized type, or an `additionalProperties` entry
 * the schema puts no constraint on — is free to hold anything, so it offers every JSON Schema type.
 * @param schema - The schema being rendered by the fallback UI.
 */
function getFallbackTypes<S extends StrictRJSFSchema = RJSFSchema>(schema: S): JSONSchema7TypeName[] {
  const { type } = schema;
  const listedTypes = Array.isArray(type)
    ? [...new Set(type)].filter((aType) => JSON_SCHEMA_TYPES.includes(aType))
    : [];
  return listedTypes.some((aType) => aType !== 'null') ? listedTypes : [...JSON_SCHEMA_TYPES];
}

/**
 * Get the type the selection starts on when the form data gives nothing to match: the first type the schema lists,
 * except that a leading `null` gives way to the first type that can hold a value. Starting on `null` would have
 * `NullField` write a `null` into the form data for a field the user has not touched.
 * @param types - The types the selection offers.
 */
function getDefaultType(types: JSONSchema7TypeName[]): JSONSchema7TypeName {
  // `getFallbackTypes()` never returns a list of nothing but `null`, so there is always a non-`null` type to find
  return types.find((aType) => aType !== 'null')!;
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
    default: getDefaultType(types),
    title,
  };
}

/**
 * Determines whether the field for `type` can show data of `dataType` as the value it is. The textual types stand in
 * for one another while a value is being edited — a `number` field holds the string `'3.'` until the user types the
 * next digit — but every other type only shows data of its own: a `string` field handed an object shows
 * `[object Object]`, and one handed a `null` shows an empty input that the next keystroke silently replaces.
 * @param type - The type currently chosen in the type selector.
 * @param dataType - The type of the form data being rendered.
 */
function canShowDataAsType(type: JSONSchema7TypeName, dataType: JSONSchema7TypeName): boolean {
  const isTextual = (aType: JSONSchema7TypeName) => aType === 'string' || aType === 'number' || aType === 'integer';
  return (isTextual(type) && isTextual(dataType)) || type === dataType;
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
    return getDefaultType(types);
  }
  const dataType = guessType(formData);
  if (types.includes(dataType)) {
    return dataType;
  }
  if (dataType === 'number' && types.includes('integer')) {
    return 'integer';
  }
  return getDefaultType(types);
}

/** The keywords that present or identify the field as a whole rather than describe its value. The field around the
 * value already renders them once, so the value field within it drops them rather than render them a second time — a
 * second description would also repeat the DOM id its `aria-describedby` points at. `examples` is not one of them: only
 * the value's own input renders it, as the suggestions it offers.
 */
const FIELD_ONLY_KEYS = ['description', 'deprecated', '$comment', '$id'] as const;

/**
 * Get the schema the value field renders: the `schema` with its `type` pinned to the one the selector is on, so that
 * every other keyword — a union's `properties`, `enum`, `items`, `format`, ... — still describes the value being
 * entered. The markers `retrieveSchema()` adds are dropped, since keeping `GUESSED_TYPE_FLAG` would route the value
 * field straight back here, keeping `ADDITIONAL_PROPERTY_FLAG` would render a second key input within this one, and
 * keeping `RJSF_REF_KEY` would merge the `ui:definitions` entry of the `$ref` it was resolved from back into the
 * `uiSchema` below, undoing the widget `getValueUiSchema()` drops. The outer field has already resolved that entry
 * into the `uiSchema` handed to this one, so nothing else is lost with it. The `FIELD_ONLY_KEYS` the outer field has
 * already rendered are dropped too.
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
  delete valueSchema[RJSF_REF_KEY];
  FIELD_ONLY_KEYS.forEach((key) => delete valueSchema[key]);
  const describesMembers =
    PROPERTIES_KEY in valueSchema || ADDITIONAL_PROPERTIES_KEY in valueSchema || PATTERN_PROPERTIES_KEY in valueSchema;
  // An object the schema says nothing more about takes any key/value pair, which is what this UI is here to offer
  if (type === 'object' && !describesMembers) {
    valueSchema[ADDITIONAL_PROPERTIES_KEY] = true;
  }
  return valueSchema as S;
}

/** The `uiSchema` entries that present the field as a whole, in both the spellings a caller can write them in. They
 * are the `FIELD_ONLY_KEYS` of a `uiSchema`: the field around the value renders each of them once, so the value field
 * within it would render a second copy under the same DOM id that its `aria-describedby` points at, and a second
 * label for the very same control.
 */
const FIELD_ONLY_UI_KEYS = ['ui:title', 'ui:description', 'ui:help'] as const;
const FIELD_ONLY_UI_OPTIONS = ['title', 'description', 'help'] as const;

/**
 * Get the `uiSchema` the value field renders with: the caller's, without what the field around the value has already
 * rendered, and with a `ui:widget` dropped when no widget implements it for the type the selector is on. A widget
 * named for one member of a union — `textarea` for its `string` — has no implementation for the others, and
 * `getWidget()` throws rather than falling back, which would take the whole form down as soon as another type was
 * selected. A widget that is a component, or registered under its own name, is left alone since it is expected to
 * handle whatever it is given.
 * @param uiSchema - The uiSchema for the field being rendered.
 * @param valueSchema - The schema the value field renders, with its type pinned.
 * @param widgets - The widgets registered with the form.
 */
function getValueUiSchema<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  uiSchema: UiSchema<T, S, F> | undefined,
  valueSchema: S,
  widgets: RegistryWidgetsType<T, S, F>,
): UiSchema<T, S, F> | undefined {
  if (!uiSchema) {
    return uiSchema;
  }
  const { widget } = getUiOptions<T, S, F>(uiSchema);
  const keepsWidget = !widget || hasWidget<T, S, F>(valueSchema, widget, widgets);
  const valueUiSchema = { ...uiSchema };
  FIELD_ONLY_UI_KEYS.forEach((key) => delete valueUiSchema[key]);
  if (!keepsWidget) {
    delete valueUiSchema[UI_WIDGET_KEY];
  }
  if (valueUiSchema[UI_OPTIONS_KEY]) {
    const uiOptions = { ...valueUiSchema[UI_OPTIONS_KEY] } as UIOptionsType<T, S, F>;
    FIELD_ONLY_UI_OPTIONS.forEach((key) => delete uiOptions[key]);
    if (!keepsWidget) {
      delete uiOptions.widget;
    }
    valueUiSchema[UI_OPTIONS_KEY] = uiOptions;
  }
  return valueUiSchema;
}

/** The text that reads as a `false` boolean, once trimmed and lower-cased
 */
const FALSE_SPELLINGS = ['false', '0', 'no', 'off'];

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
    case 'number':
    case 'integer': {
      const castedNumber = Number(formData);
      // A value with no numeric form a user would have typed — a boolean, or text that is blank — leaves the field empty
      // rather than holding a `0`: unlike the empty string the `string` case falls back to, a `0` satisfies `required`
      // and `minimum` as real input
      if (
        formData == null ||
        typeof formData === 'object' ||
        typeof formData === 'boolean' ||
        String(formData).trim() === '' ||
        Number.isNaN(castedNumber)
      ) {
        return undefined as T;
      }
      return (newType === 'integer' ? Math.round(castedNumber) : castedNumber) as T;
    }
    case 'boolean': {
      const text = typeof formData === 'string' ? formData.trim() : undefined;
      // A value that is not there, a container that has no boolean reading of its own, and text the user has cleared
      // would all become a definite `true` or `false` that satisfies `required` for a field the user never filled
      // in: `Boolean({})` is `true` and blank text reads as a `false` below
      if (formData == null || typeof formData === 'object' || text === '') {
        return undefined as T;
      }
      // Text that spells a false boolean reads back as `false`, since `Boolean()` reads it the other way round —
      // `Boolean('false')` is `true` — which would turn a `false` into a `true` on the way back from `string`. The
      // spellings a user types into the `string` field count too, whatever their case or surrounding whitespace
      return (text !== undefined ? !FALSE_SPELLINGS.includes(text.toLowerCase()) : Boolean(formData)) as T;
    }
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
    disabled = false,
    readonly = false,
    onBlur,
    onFocus,
    registry,
    fieldPath,
    onChange,
    errorSchema,
    rawErrors,
  } = props;
  const { translateString, fields, widgets, globalFormOptions } = registry;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const types = useMemo(() => getFallbackTypes<S>(schema), [schema]);
  const [selectedType, setSelectedType] = useState<JSONSchema7TypeName>(() => getInitialType(formData, types));
  // The types on offer change with the schema — a `dependencies` or `oneOf` branch switch can replace them
  // wholesale — so a selection the schema no longer allows gives way to the type the current data fits. A selection
  // the data no longer fits gives way too, since data replaced from outside the form arrives without going through
  // the selector. Without this the selector would show one type while the field below it rendered another
  // An input whose `ui:emptyValue` is `null` reports being cleared as a `null`, which is the empty value of the type
  // being edited rather than a switch to the `null` type, so it must not swap the input out from under the user
  const isClearedInput = formData === null && uiOptions.emptyValue === null;
  const isSelectionUsable =
    types.includes(selectedType) &&
    (formData === undefined || isClearedInput || canShowDataAsType(selectedType, guessType(formData)));
  const type = isSelectionUsable ? selectedType : getInitialType(formData, types);
  if (type !== selectedType) {
    // Storing the type the selector is showing keeps a selection the user can no longer see from coming back: with the
    // old one still in state, clearing the value would swap the field out for the type the data used to have. React
    // takes a state update made while rendering as an adjustment of this component's own state and re-runs it at once
    setSelectedType(type);
  }

  const typeSelectorFieldPath = toFieldPath('__internal_type_selector', fieldPath);

  const schemaTitle = translateString(TranslatableString.Type);
  const typesOptionSchema = useMemo(() => getFallbackTypeSelectionSchema(types, schemaTitle), [types, schemaTitle]);

  const valueSchema = useMemo(
    () => getValueSchema<S>(schema, type, translateString(TranslatableString.Value)),
    [schema, type, translateString],
  );
  const valueUiSchema = useMemo(
    () => getValueUiSchema<T, S, F>(uiSchema, valueSchema, widgets),
    [uiSchema, valueSchema, widgets],
  );

  // The errors raised against the old value describe a type it no longer has, so an empty error schema replaces them:
  // passing them on would re-assert them against the cast value, and passing none would leave them standing. With
  // nothing to clear it stays `undefined`, since `Form` keeps an empty-but-truthy error schema as a custom error of
  // its own that every later validation then has to merge, dropping message-less errors as it goes
  const hasErrorsToClear = !!rawErrors?.length || Object.keys(errorSchema ?? {}).length > 0;

  const onTypeChange = (newType: T | undefined) => {
    if (newType != null) {
      setSelectedType(newType as JSONSchema7TypeName);
      onChange(
        castToNewType<T>(formData as T, newType as JSONSchema7TypeName),
        fieldPath,
        hasErrorsToClear ? ({} as ErrorSchema<T>) : undefined,
        id,
      );
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
        />
      }
      schemaField={<SchemaField {...props} schema={valueSchema} uiSchema={valueUiSchema} />}
    />
  );
}
