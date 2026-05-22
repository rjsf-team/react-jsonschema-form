import { useCallback, useEffect, useRef, useState } from 'react';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';
import {
  ANY_OF_KEY,
  deepEquals,
  ERRORS_KEY,
  FieldProps,
  FormContextType,
  getDiscriminatorFieldFromSchema,
  getTemplate,
  getUiOptions,
  getWidget,
  isFormDataAvailable,
  mergeSchemas,
  ONE_OF_KEY,
  RJSFSchema,
  shouldRenderOptionalField,
  StrictRJSFSchema,
  TranslatableString,
  UiSchema,
} from '@rjsf/utils';

/** The `AnyOfField` component is used to render a field in the schema that is an `anyOf`, `allOf` or `oneOf`. It tracks
 * the currently selected option and cleans up any irrelevant data in `formData`.
 *
 * @param props - The `FieldProps` for this template
 */
function AnyOfField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: FieldProps<T, S, F>,
) {
  const {
    name,
    disabled = false,
    errorSchema = {},
    formData,
    fieldPathId,
    onBlur,
    onChange,
    onFocus,
    options,
    readonly,
    required = false,
    registry,
    schema,
    uiSchema,
  } = props;

  const { widgets, fields, translateString, globalUiOptions, schemaUtils } = registry;
  const fieldPathIdId = fieldPathId.$id;
  const fieldPathIdPath = fieldPathId.path;

  const [{ selectedOption, retrievedOptions }, setState] = useState<{
    selectedOption: number;
    retrievedOptions: S[];
  }>(() => {
    // cache the retrieved options in state in case they have $refs to save doing it later
    const retrieved = options.map((opt: S) => schemaUtils.retrieveSchema(opt, formData));
    const discriminator = getDiscriminatorFieldFromSchema<S>(schema);
    return {
      retrievedOptions: retrieved,
      selectedOption: schemaUtils.getClosestMatchingOption(formData, retrieved, 0, discriminator),
    };
  });

  const prevOptionsRef = useRef(options);
  const prevFormDataRef = useRef(formData);
  const prevFieldPathIdIdRef = useRef(fieldPathIdId);

  useEffect(() => {
    const prevOptions = prevOptionsRef.current;
    const prevFormData = prevFormDataRef.current;
    const prevFieldPathIdId = prevFieldPathIdIdRef.current;

    prevOptionsRef.current = options;
    prevFormDataRef.current = formData;
    prevFieldPathIdIdRef.current = fieldPathIdId;

    setState((currentState) => {
      let { selectedOption: currentSelected, retrievedOptions: currentRetrieved } = currentState;
      let changed = false;

      if (!deepEquals(prevOptions, options)) {
        // re-cache the retrieved options in state in case they have $refs to save doing it later
        currentRetrieved = options.map((opt: S) => schemaUtils.retrieveSchema(opt, formData));
        changed = true;
      }

      if (!deepEquals(formData, prevFormData) && fieldPathIdId === prevFieldPathIdId) {
        const discriminator = getDiscriminatorFieldFromSchema<S>(schema);
        const matchingOption = schemaUtils.getClosestMatchingOption(
          formData,
          currentRetrieved,
          currentSelected,
          discriminator,
        );
        if (matchingOption !== currentSelected) {
          currentSelected = matchingOption;
          changed = true;
        }
      }

      return changed ? { selectedOption: currentSelected, retrievedOptions: currentRetrieved } : currentState;
    });
  }, [options, formData, fieldPathIdId, schema, schemaUtils]);

  const fieldId = `${fieldPathIdId}${schema.oneOf ? '__oneof_select' : '__anyof_select'}`;

  /** Callback handler to remember what the currently selected option is. In addition to that the `formData` is updated
   * to remove properties that are not part of the newly selected option schema, and then the updated data is passed to
   * the `onChange` handler.
   *
   * @param option - The new option value being selected
   */
  const onOptionChange = useCallback(
    (option?: string) => {
      const intOption = option !== undefined ? parseInt(option, 10) : -1;
      if (intOption === selectedOption) {
        return;
      }
      const newOption = intOption >= 0 ? retrievedOptions[intOption] : undefined;
      const oldOption = selectedOption >= 0 ? retrievedOptions[selectedOption] : undefined;

      let newFormData = schemaUtils.sanitizeDataForNewSchema(newOption, oldOption, formData);
      if (newOption) {
        // Call getDefaultFormState to make sure defaults are populated on change. Pass "excludeObjectChildren"
        // so that only the root objects themselves are created without adding undefined children properties
        newFormData = schemaUtils.getDefaultFormState(newOption, newFormData, 'excludeObjectChildren') as T;
      }

      setState({ selectedOption: intOption, retrievedOptions });
      onChange(newFormData, fieldPathIdPath, undefined, fieldId);
    },
    [selectedOption, retrievedOptions, schemaUtils, formData, onChange, fieldPathIdPath, fieldId],
  );

  const { SchemaField: _SchemaField } = fields;
  const MultiSchemaFieldTemplate = getTemplate<'MultiSchemaFieldTemplate', T, S, F>(
    'MultiSchemaFieldTemplate',
    registry,
    globalUiOptions,
  );
  const isOptionalRender = shouldRenderOptionalField<T, S, F>(registry, schema, required, uiSchema);
  const hasFormData = isFormDataAvailable<T>(formData);

  const {
    widget = 'select',
    placeholder,
    autofocus,
    autocomplete,
    title = schema.title,
    ...uiOptions
  } = getUiOptions<T, S, F>(uiSchema, globalUiOptions);
  const Widget = getWidget<T, S, F>({ type: 'number' }, widget, widgets);
  const rawErrors = get(errorSchema, ERRORS_KEY, []);
  const fieldErrorSchema = omit(errorSchema, [ERRORS_KEY]);
  const displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema, globalUiOptions);

  const option = selectedOption >= 0 ? retrievedOptions[selectedOption] || null : null;
  let optionSchema: S | undefined | null;

  if (option) {
    // merge top level required field
    const { required } = schema;
    // Merge in all the non-oneOf/anyOf properties and also skip the special ADDITIONAL_PROPERTY_FLAG property
    optionSchema = required ? (mergeSchemas({ required }, option) as S) : option;
  }

  // First we will check to see if there is an anyOf/oneOf override for the UI schema
  let optionsUiSchema: UiSchema<T, S, F>[] = [];
  if (ONE_OF_KEY in schema && uiSchema && ONE_OF_KEY in uiSchema) {
    if (Array.isArray(uiSchema[ONE_OF_KEY])) {
      optionsUiSchema = uiSchema[ONE_OF_KEY];
    } else {
      console.warn(`uiSchema.oneOf is not an array for "${title || name}"`);
    }
  } else if (ANY_OF_KEY in schema && uiSchema && ANY_OF_KEY in uiSchema) {
    if (Array.isArray(uiSchema[ANY_OF_KEY])) {
      optionsUiSchema = uiSchema[ANY_OF_KEY];
    } else {
      console.warn(`uiSchema.anyOf is not an array for "${title || name}"`);
    }
  }
  // Then we pick the one that matches the selected option index, if one exists otherwise default to the main uiSchema
  let optionUiSchema = uiSchema;
  if (selectedOption >= 0 && optionsUiSchema.length > selectedOption) {
    optionUiSchema = optionsUiSchema[selectedOption];
  }

  const translateEnum: TranslatableString = title
    ? TranslatableString.TitleOptionPrefix
    : TranslatableString.OptionPrefix;
  const translateParams = title ? [title] : [];
  const enumOptions = retrievedOptions.map((opt: { title?: string }, index: number) => {
    // Also see if there is an override title in the uiSchema for each option, otherwise use the title from the option
    const { title: uiTitle = opt.title } = getUiOptions<T, S, F>(optionsUiSchema[index]);
    return {
      label: uiTitle || translateString(translateEnum, translateParams.concat(String(index + 1))),
      value: index,
    };
  });

  const selector =
    !isOptionalRender || hasFormData ? (
      <Widget
        id={fieldId}
        name={`${name}${schema.oneOf ? '__oneof_select' : '__anyof_select'}`}
        schema={{ type: 'number', default: 0 } as S}
        onChange={onOptionChange}
        onBlur={onBlur}
        onFocus={onFocus}
        disabled={disabled || isEmpty(enumOptions)}
        multiple={false}
        rawErrors={rawErrors}
        errorSchema={fieldErrorSchema}
        value={selectedOption >= 0 ? selectedOption : undefined}
        options={{ enumOptions, ...uiOptions }}
        registry={registry}
        placeholder={placeholder}
        autocomplete={autocomplete}
        autofocus={autofocus}
        label={title ?? name}
        hideLabel={!displayLabel}
        readonly={readonly}
      />
    ) : undefined;

  const optionsSchemaField =
    (optionSchema && optionSchema.type !== 'null' && (
      <_SchemaField {...props} schema={optionSchema} uiSchema={optionUiSchema} />
    )) ||
    null;

  return (
    <MultiSchemaFieldTemplate
      schema={schema}
      registry={registry}
      uiSchema={uiSchema}
      selector={selector}
      optionSchemaField={optionsSchemaField}
    />
  );
}

export default AnyOfField;
