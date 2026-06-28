import { useCallback, useReducer, useRef } from 'react';
import type { FieldProps, FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from '@rjsf/utils';
import {
  ANY_OF_KEY,
  deepEquals,
  ERRORS_KEY,
  getDiscriminatorFieldFromSchema,
  getTemplate,
  getUiOptions,
  getWidget,
  isFormDataAvailable,
  mergeSchemas,
  ONE_OF_KEY,
  shouldRenderOptionalField,
  TranslatableString,
} from '@rjsf/utils';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';

/** Type used for the state of the `AnyOfField` component */
interface AnyOfFieldState<T = any, S extends StrictRJSFSchema = RJSFSchema> {
  /** The currently selected option */
  selectedOption: number;
  /** The option schemas after retrieving all $refs */
  retrievedOptions: S[];
  /** Snapshot of the `options` prop — used to detect changes and re-cache retrievedOptions */
  prevOptions: S[];
  /** Snapshot of `formData` — used to detect changes and re-match the selected option */
  prevFormData: T | undefined;
  /** Snapshot of `fieldPathId.$id` — used to suppress option re-matching when the field itself changes */
  prevFieldId: string;
}

type AnyOfFieldAction<T = any, S extends StrictRJSFSchema = RJSFSchema> =
  | { type: 'SET_SELECTED_OPTION'; payload: number }
  | { type: 'UPDATE_STATE'; payload: AnyOfFieldState<T, S> };

function anyOfFieldReducer<T = any, S extends StrictRJSFSchema = RJSFSchema>(
  state: AnyOfFieldState<T, S>,
  action: AnyOfFieldAction<T, S>,
): AnyOfFieldState<T, S> {
  switch (action.type) {
    case 'SET_SELECTED_OPTION':
      return { ...state, selectedOption: action.payload };
    case 'UPDATE_STATE':
      return action.payload;
    default:
      return state;
  }
}

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
    registry,
    required = false,
    schema,
    uiSchema,
  } = props;
  const { schemaUtils } = registry;

  /** Flag to skip the formData-change-driven option recalculation when the user just selected an option.
   * Set to true in onOptionChange (before onChange is called), consumed and reset during the next render.
   * This prevents the matching-option recalculation from overriding a user's explicit choice when
   * getDefaultFormState populates undefined properties that make deepEquals see a false formData change.
   */
  const skipNextOptionRecalculation = useRef(false);

  const [state, dispatch] = useReducer(
    anyOfFieldReducer as (state: AnyOfFieldState<T, S>, action: AnyOfFieldAction<T, S>) => AnyOfFieldState<T, S>,
    null,
    (_: null): AnyOfFieldState<T, S> => {
      const retrievedOptions = options.map((opt: S) => schemaUtils.retrieveSchema(opt, formData));
      const discriminator = getDiscriminatorFieldFromSchema<S>(schema);
      return {
        retrievedOptions,
        selectedOption: schemaUtils.getClosestMatchingOption(formData, retrievedOptions, 0, discriminator),
        prevOptions: options,
        prevFormData: formData,
        prevFieldId: fieldPathId.$id,
      };
    },
  );

  // getDerivedStateFromProps pattern: compute any state updates during the render phase rather than in a
  // useEffect. When dispatch is called here, React immediately re-renders with the new state and discards
  // the current render's output before any DOM commit, so there is no visible flicker or extra paint.
  let nextState = state;

  if (!deepEquals(state.prevOptions, options)) {
    const retrievedOptions = options.map((opt: S) => schemaUtils.retrieveSchema(opt, formData));
    nextState = { ...nextState, retrievedOptions, prevOptions: options };
  }

  if (!deepEquals(formData, state.prevFormData)) {
    if (fieldPathId.$id === state.prevFieldId) {
      if (skipNextOptionRecalculation.current) {
        skipNextOptionRecalculation.current = false;
      } else {
        const discriminator = getDiscriminatorFieldFromSchema<S>(schema);
        const matchingOption = schemaUtils.getClosestMatchingOption(
          formData,
          nextState.retrievedOptions,
          nextState.selectedOption,
          discriminator,
        );
        if (matchingOption !== nextState.selectedOption) {
          nextState = { ...nextState, selectedOption: matchingOption };
        }
      }
    }
    nextState = { ...nextState, prevFormData: formData };
  }

  if (fieldPathId.$id !== state.prevFieldId) {
    nextState = { ...nextState, prevFieldId: fieldPathId.$id };
  }

  if (nextState !== state) {
    dispatch({ type: 'UPDATE_STATE', payload: nextState });
  }

  const fieldId = `${fieldPathId.$id}${schema.oneOf ? '__oneof_select' : '__anyof_select'}`;

  /** Callback handler to remember what the currently selected option is. In addition to that the `formData` is updated
   * to remove properties that are not part of the newly selected option schema, and then the updated data is passed to
   * the `onChange` handler.
   *
   * @param option - The new option value being selected
   */
  const onOptionChange = useCallback(
    (option?: string) => {
      const { selectedOption, retrievedOptions } = nextState;
      if (disabled || readonly) {
        return;
      }
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

      dispatch({ type: 'SET_SELECTED_OPTION', payload: intOption });
      skipNextOptionRecalculation.current = true;
      onChange(newFormData, fieldPathId.path, undefined, fieldId);
    },
    // dispatch is stable (guaranteed by useReducer); skipNextOptionRecalculation is a ref (no re-render on write)
    [nextState, disabled, readonly, schemaUtils, formData, fieldPathId, onChange, fieldId, dispatch],
  );

  const { widgets, fields, translateString, globalUiOptions } = registry;
  const { SchemaField: SchemaFieldComponent } = fields;
  const MultiSchemaFieldTemplate = getTemplate<'MultiSchemaFieldTemplate', T, S, F>(
    'MultiSchemaFieldTemplate',
    registry,
    globalUiOptions,
  );
  const isOptionalRender = shouldRenderOptionalField<T, S, F>(registry, schema, required, uiSchema);
  const hasFormData = isFormDataAvailable<T>(formData);

  const { selectedOption, retrievedOptions } = nextState;
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
    const { required: schemaRequired, type: schemaType } = schema;
    const parentProps: Partial<S> = {};
    if (schemaRequired) {
      parentProps.required = schemaRequired as S['required'];
    }
    // Propagate the parent schema type to options that don't define their own.
    // This is necessary when the parent constrains the type (e.g. { type: 'string',
    // oneOf: [{ pattern: '...' }, { pattern: '...' }] }) but the option sub-schemas
    // omit the type — without it, getSchemaType returns undefined and the option
    // renders as FallbackField instead of the correct widget (e.g. StringField).
    if (schemaType !== undefined && !('type' in option)) {
      parentProps.type = schemaType;
    }
    // Merge in all the non-oneOf/anyOf properties and also skip the special ADDITIONAL_PROPERTY_FLAG property
    optionSchema = Object.keys(parentProps).length > 0 ? (mergeSchemas(parentProps, option) as S) : option;
  }

  // First we will check to see if there is an anyOf/oneOf override for the UI schema
  let optionsUiSchema: UiSchema<T, S, F>[] = [];
  if (ONE_OF_KEY in schema && uiSchema && ONE_OF_KEY in uiSchema) {
    if (Array.isArray(uiSchema[ONE_OF_KEY])) {
      optionsUiSchema = uiSchema[ONE_OF_KEY];
    } else {
      // oxlint-disable-next-line no-console
      console.warn(`uiSchema.oneOf is not an array for "${title || name}"`);
    }
  } else if (ANY_OF_KEY in schema && uiSchema && ANY_OF_KEY in uiSchema) {
    if (Array.isArray(uiSchema[ANY_OF_KEY])) {
      optionsUiSchema = uiSchema[ANY_OF_KEY];
    } else {
      // oxlint-disable-next-line no-console
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
      <SchemaFieldComponent {...props} schema={optionSchema} uiSchema={optionUiSchema} />
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
