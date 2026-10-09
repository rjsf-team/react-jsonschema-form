import { useCallback, useMemo, useState } from 'react';
import type {
  ErrorSchema,
  FieldProps,
  FormContextType,
  Registry,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
} from '@rjsf/utils';
import {
  ANY_OF_KEY,
  deepEquals,
  ERRORS_KEY,
  getDiscriminatorFieldFromSchema,
  getTemplates,
  getUiOptions,
  getXxxOfKey,
  isFormDataAvailable,
  logOnce,
  mergeSchemas,
  ONE_OF_KEY,
  resolveWidget,
  selectOptionUiSchema,
  shouldRenderOptionalField,
  TranslatableString,
  withVariantId,
} from '@rjsf/utils';

import fieldLabelForLog from '../../fieldLabelForLog.ts';
import formDataForNewOption from './formDataForNewOption.ts';
import RawFormDataContext, { useReadsFormData } from './RawFormDataContext.ts';

/** The option an `AnyOfField` has selected, with what it last rendered, to tell a change of data from a re-render */
interface OptionSelection<T> {
  selectedOption: number;
  formData: T | undefined;
  id: string;
  /** The data the user's last option switch proposed, so re-matching the option to the data does not override the
   * explicit choice. It is needed even when the switch is accepted, since getDefaultFormState populates undefined
   * properties that make deepEquals see a false formData change.
   */
  proposal: { formData: T | undefined } | undefined;
}

/** Re-matches the selected option of an `AnyOfField` to data that changed under the same field
 *
 * @param selection - The selected option, and the data it was last matched against
 * @param formData - The data now rendered
 * @param retrievedOptions - The retrieved schema of each option
 * @param schema - The schema holding the options
 * @param registry - The `registry` object
 * @returns - The index of the option to select
 */
function optionForData<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  selection: OptionSelection<T>,
  formData: T | undefined,
  retrievedOptions: S[],
  schema: S,
  registry: Registry<T, S, F>,
): number {
  const { selectedOption, proposal } = selection;
  const { schemaUtils } = registry;
  const isFormDataChanged = !deepEquals(formData, selection.formData);
  if (proposal) {
    // A switch that proposed the data the form already held has nothing a parent could decline
    if (isFormDataChanged || deepEquals(formData, proposal.formData)) {
      return selectedOption;
    }
    // The option switch was proposed but the data did not follow it, which is what a parent declining the proposal
    // looks like (RFC, section 5): the chosen option stays while the data still fits it, so a form whose data
    // matches several options keeps the explicit choice, and one whose data does not is put back on the option that
    // describes it
    const chosen = selectedOption >= 0 ? retrievedOptions[selectedOption] : undefined;
    // The retrieved option is not the schema its own `$id` names, and a validator caches what it compiles under
    // that `$id`, so it is validated under one derived from its content, as the option scoring does
    if (chosen && schemaUtils.getValidator().isValid(withVariantId<S>(chosen), formData, registry.rootSchema)) {
      return selectedOption;
    }
  } else if (!isFormDataChanged) {
    return selectedOption;
  }
  return schemaUtils.getClosestMatchingOption(
    formData,
    retrievedOptions,
    selectedOption,
    getDiscriminatorFieldFromSchema<S>(schema),
  );
}

/** The `AnyOfField` component is used to render a field in the schema that is an `anyOf`, `allOf` or `oneOf`. It tracks
 * the currently selected option and cleans up any irrelevant data in `formData`.
 *
 * @param props - The `FieldProps` for this template. `options` is not a declared `FieldProps` key, so it would be read
 *   as `any` through `FieldProps`' `GenericObjectType` index signature; declaring it as `S[]` here names what
 *   `SchemaField` passes, but nothing checks it, since `SchemaField` renders this through a `Field` slot that only
 *   knows `FieldProps`
 */
function AnyOfField<T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  props: FieldProps<T, S, F> & { options: S[] },
) {
  const {
    name,
    disabled = false,
    errorSchema,
    formData,
    fieldPath,
    hideError,
    id,
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
  const readsFormData = useReadsFormData(AnyOfField);

  const retrievedOptions = useMemo(
    () => options.map((opt) => schemaUtils.retrieveSchema(opt, formData)),
    [options, schemaUtils, formData],
  );

  const [selection, setSelection] = useState<OptionSelection<T>>(() => ({
    selectedOption: schemaUtils.getClosestMatchingOption(
      formData,
      retrievedOptions,
      0,
      getDiscriminatorFieldFromSchema<S>(schema),
    ),
    formData,
    id,
    proposal: undefined,
  }));
  const { selectedOption } = selection;

  // Adjusted while rendering rather than in an effect, so the option that no longer describes the data is never
  // committed. A pending proposal is settled by the first render after it, whether or not the data followed it.
  // `Object.is`, since `NaN !== NaN` would have data a widget parsed to `NaN` set this state on every pass
  if (!Object.is(selection.formData, formData) || selection.id !== id || selection.proposal) {
    setSelection({
      selectedOption:
        selection.id === id
          ? optionForData<T, S, F>(selection, formData, retrievedOptions, schema, registry)
          : selectedOption,
      formData,
      id,
      proposal: undefined,
    });
  }

  const xxxOfKey = getXxxOfKey<S>(schema) ?? ONE_OF_KEY;
  const selectSuffix = xxxOfKey === ANY_OF_KEY ? '__anyof_select' : '__oneof_select';
  const fieldId = `${id}${selectSuffix}`;

  const { widgets, fields, translateString, globalUiOptions, uiSchemaDefinitions } = registry;
  const {
    widget = 'select',
    placeholder,
    autofocus,
    autocomplete,
    title: titleOption,
    ...uiOptions
  } = getUiOptions<T, S, F>(uiSchema, globalUiOptions);
  const title = titleOption ?? schema.title;

  // First we will check to see if there is an anyOf/oneOf override for the UI schema. Computed here, ahead of
  // `onOptionChange`, so that callback can pass the old and new options' own uiSchemas to `formDataForNewOption`,
  // letting `ui:initialValue`/`ui:emptyValue` on those options' fields apply on selection.
  // Memoized so the common case (no `uiSchema.oneOf`/`anyOf` override) doesn't hand `onOptionChange`'s `useCallback`
  // a fresh `[]` on every render, which would otherwise break its memoization.
  const optionsUiSchema = useMemo<UiSchema<T, S, F>[]>(() => {
    if (uiSchema && xxxOfKey in uiSchema) {
      if (Array.isArray(uiSchema[xxxOfKey])) {
        return uiSchema[xxxOfKey];
      }
      logOnce(`uiSchema.${xxxOfKey} is not an array for ${fieldLabelForLog(id, fieldPath)}`);
    }
    return [];
  }, [xxxOfKey, uiSchema, id, fieldPath]);

  // Then we pick the one that matches the selected option index, if one exists otherwise default to the main uiSchema
  const optionUiSchema = selectOptionUiSchema<T, S, F>(optionsUiSchema, uiSchema, selectedOption);

  /** Callback handler to remember what the currently selected option is. In addition to that the `formData` is updated
   * to remove properties that are not part of the newly selected option schema, and then the updated data is passed to
   * the `onChange` handler.
   *
   * @param option - The new option value being selected
   */
  const onOptionChange = useCallback(
    (option?: string) => {
      if (disabled || readonly) {
        return;
      }
      const intOption = option !== undefined ? parseInt(option, 10) : -1;
      if (intOption === selectedOption) {
        return;
      }
      const newOption = intOption >= 0 ? retrievedOptions[intOption] : undefined;
      const oldOption = selectedOption >= 0 ? retrievedOptions[selectedOption] : undefined;

      // `uiSchemaDefinitions` comes from the registry since an option's uiSchema is only its own sub-uiSchema and
      // never carries the root's `ui:definitions` itself.
      const newFormData = formDataForNewOption<T, S, F>(schemaUtils, formData, newOption, oldOption, schema, {
        newOptionUiSchema: selectOptionUiSchema<T, S, F>(optionsUiSchema, uiSchema, intOption),
        oldOptionUiSchema: optionUiSchema,
        uiSchemaDefinitions,
      });

      setSelection((current) => ({ ...current, selectedOption: intOption, proposal: { formData: newFormData } }));
      onChange(newFormData, fieldPath, undefined, fieldId);
    },
    [
      selectedOption,
      retrievedOptions,
      disabled,
      readonly,
      schema,
      schemaUtils,
      formData,
      fieldPath,
      onChange,
      fieldId,
      optionsUiSchema,
      optionUiSchema,
      uiSchema,
      uiSchemaDefinitions,
    ],
  );

  const { SchemaField: SchemaFieldComponent } = fields;
  const { MultiSchemaFieldTemplate } = getTemplates<T, S, F>(registry, globalUiOptions);
  const isOptionalRender = shouldRenderOptionalField<T, S, F>(registry, schema, required, uiSchema);
  const hasFormData = isFormDataAvailable<T>(formData);

  const { Widget } = resolveWidget<T, S, F>({ type: 'number' }, widget, widgets);
  const rawErrors = errorSchema?.[ERRORS_KEY] ?? [];
  const fieldErrorSchema = { ...errorSchema } as ErrorSchema<T>;
  delete fieldErrorSchema[ERRORS_KEY];
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
    // A parent allowing several types propagates all of them, since the option is one branch of the choice made here
    // rather than a narrowing of what the parent accepts: a field reading `schema.type` — `getInputProps()`, which
    // withholds the numeric `pattern` from a union precisely because the other types do not have to match it, or a
    // caller's own option field — would otherwise be told the value is of a type the parent never pinned it to. The
    // fallback UI does pin it, but it pins it on the schema it hands down, so the union never reaches here with it on
    if (schemaType !== undefined && !('type' in option)) {
      parentProps.type = schemaType as S['type'];
    }
    // Merge in all the non-oneOf/anyOf properties and also skip the special ADDITIONAL_PROPERTY_FLAG property
    optionSchema = Object.keys(parentProps).length > 0 ? (mergeSchemas(parentProps, option) as S) : option;
  }

  const translateEnum: TranslatableString = title
    ? TranslatableString.TitleOptionPrefix
    : TranslatableString.OptionPrefix;
  const translateParams = title ? [title] : [];
  const enumOptions = retrievedOptions.map((opt, index) => {
    const { title: uiTitle } = getUiOptions<T, S, F>(optionsUiSchema[index]);
    return {
      label: (uiTitle ?? opt.title) || translateString(translateEnum, translateParams.concat(String(index + 1))),
      value: index,
    };
  });

  const selector =
    !isOptionalRender || hasFormData ? (
      <Widget
        id={fieldId}
        name={`${name}${selectSuffix}`}
        schema={{ type: 'number', default: 0 } as S}
        onChange={onOptionChange}
        onBlur={onBlur}
        onFocus={onFocus}
        disabled={disabled || enumOptions.length === 0}
        multiple={false}
        hideError={hideError}
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
      <RawFormDataContext value={readsFormData ? SchemaFieldComponent : undefined}>
        <SchemaFieldComponent {...props} schema={optionSchema} uiSchema={optionUiSchema} />
      </RawFormDataContext>
    )) ||
    null;

  // The option's field is handed this field's own data, and is vouched for directly; the template and the selector are
  // not
  return (
    <RawFormDataContext value={undefined}>
      <MultiSchemaFieldTemplate
        id={id}
        schema={schema}
        registry={registry}
        uiSchema={uiSchema}
        selector={selector}
        optionSchemaField={optionsSchemaField}
      />
    </RawFormDataContext>
  );
}

export default AnyOfField;
