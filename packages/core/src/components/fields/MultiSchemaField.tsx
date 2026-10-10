import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ErrorSchema, FieldProps, FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from '@rjsf/utils';
import {
  ANY_OF_KEY,
  deepEquals,
  ERRORS_KEY,
  getDiscriminatorFieldFromSchema,
  getTemplates,
  getUiOptions,
  getXxxOfKey,
  hashObject,
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
import useSendOptionSwitch from '../../hooks/useSendOptionSwitch.ts';
import formDataForNewOption from './formDataForNewOption.ts';
import RawFormDataContext, { useReadsFormData } from './RawFormDataContext.ts';

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

  // Hash formData by value so the memo only invalidates when data actually changes, not on every
  // new object reference. hashObject(undefined) throws, so null is used as the fallback.
  const formDataHash = hashObject(formData ?? null);

  // retrievedOptions is purely derived from options — useMemo handles re-derivation automatically
  // when options, schemaUtils, or formData's value changes, with no render-phase dispatch needed.
  const retrievedOptions = useMemo(
    () => options.map((opt) => schemaUtils.retrieveSchema(opt, formData)),
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- formDataHash is the value-stable proxy for formData
    [options, schemaUtils, formDataHash],
  );

  const [selectedOption, setSelectedOption] = useState<number>(() => {
    const discriminator = getDiscriminatorFieldFromSchema<S>(schema);
    return schemaUtils.getClosestMatchingOption(formData, retrievedOptions, 0, discriminator);
  });

  /** The data the user's last option switch proposed, so the formData-change-driven option recalculation does not
   * override the explicit choice. Set in onOptionChange (before onChange is called), consumed and reset in the update
   * effect. It is needed even when the switch is accepted, since getDefaultFormState populates undefined properties
   * that make deepEquals see a false formData change.
   */
  const optionSwitchProposal = useRef<{ formData: T | undefined } | undefined>(undefined);
  const sendOptionSwitch = useSendOptionSwitch(fieldPath);
  const prevFormDataRef = useRef<T | undefined>(formData);
  const prevFieldIdRef = useRef(id);

  // Mirrors componentDidUpdate: re-match selectedOption when formData changes on the same field.
  // Runs after every render (no deps array) to compare against prev values stored in refs.
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const prevFormData = prevFormDataRef.current;
    const prevFieldId = prevFieldIdRef.current;
    prevFormDataRef.current = formData;
    prevFieldIdRef.current = id;

    if (id !== prevFieldId) {
      return;
    }
    const isFormDataChanged = !deepEquals(formData, prevFormData);
    const proposal = optionSwitchProposal.current;
    if (proposal) {
      optionSwitchProposal.current = undefined;
      // A switch that proposed the data the form already held has nothing a parent could decline
      if (isFormDataChanged || deepEquals(formData, proposal.formData)) {
        return;
      }
      // The option switch was proposed but the data did not follow it, which is what a parent declining the proposal
      // looks like (RFC, section 5): the chosen option stays while the data still fits it, so a form whose data
      // matches several options keeps the explicit choice, and one whose data does not is put back on the option that
      // describes it
      const chosen = selectedOption >= 0 ? retrievedOptions[selectedOption] : undefined;
      // The retrieved option is not the schema its own `$id` names, and a validator caches what it compiles under
      // that `$id`, so it is validated under one derived from its content, as the option scoring does
      if (chosen && schemaUtils.getValidator().isValid(withVariantId<S>(chosen), formData, registry.rootSchema)) {
        return;
      }
    } else if (!isFormDataChanged) {
      return;
    }
    const discriminator = getDiscriminatorFieldFromSchema<S>(schema);
    const matchingOption = schemaUtils.getClosestMatchingOption(
      formData,
      retrievedOptions,
      selectedOption,
      discriminator,
    );
    if (matchingOption !== selectedOption) {
      setSelectedOption(matchingOption);
    }
  });

  const xxxOfKey = getXxxOfKey<S>(schema) ?? ONE_OF_KEY;
  const selectSuffix = xxxOfKey === ANY_OF_KEY ? '__anyof_select' : '__oneof_select';
  const fieldId = `${id}${selectSuffix}`;

  const { widgets, fields, translateString, globalUiOptions, uiSchemaDefinitions } = registry;
  const {
    widget = 'select',
    placeholder,
    autofocus,
    autocomplete,
    title = schema.title,
    ...uiOptions
  } = getUiOptions<T, S, F>(uiSchema, globalUiOptions);

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

      setSelectedOption(intOption);
      optionSwitchProposal.current = { formData: newFormData };
      sendOptionSwitch(schema, oldOption, formData, () => onChange(newFormData, fieldPath, undefined, fieldId));
    },
    // setSelectedOption is stable (guaranteed by useState); optionSwitchProposal is a ref
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
      sendOptionSwitch,
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
