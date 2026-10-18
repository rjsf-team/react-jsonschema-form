import { useCallback, useMemo } from 'react';
import type { ErrorSchema, FieldProps, FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from '@rjsf/utils';
import {
  ANY_OF_KEY,
  ERRORS_KEY,
  getDiscriminatorFieldFromSchema,
  getRenderedOptionSchema,
  getTemplates,
  getUiOptions,
  getXxxOfKey,
  isFormDataAvailable,
  logOnce,
  ONE_OF_KEY,
  resolveWidget,
  selectOptionUiSchema,
  shouldRenderOptionalField,
  TranslatableString,
  UI_OPTIONS_KEY,
} from '@rjsf/utils';

import fieldLabelForLog from '../../fieldLabelForLog.ts';
import useOptionSelection from '../../hooks/useOptionSelection.ts';
import useSendOptionSwitch from '../../hooks/useSendOptionSwitch.ts';
import formDataForNewOption from './formDataForNewOption.ts';
import optionRendersFieldLabel from './optionRendersFieldLabel.ts';
import RawFormDataContext, { useReadsFormData } from './RawFormDataContext.ts';

/** Returns `optionUiSchema` with the given `title` and `description` in place of the option's own, each where one is
 * given. They go in `ui:options`, and the option's top-level `ui:title`/`ui:description` they replace are
 * dropped, since `getUiOptions()` lets whichever of the two keys comes later win.
 *
 * @param optionUiSchema - The uiSchema the option's field renders with
 * @param [title] - The field's title
 * @param [description] - The option's own description, or the field's when the option declares none
 * @returns - The uiSchema the option's field renders the given title and description with
 */
function withFieldLabel<T, S extends StrictRJSFSchema, F extends FormContextType>(
  optionUiSchema: UiSchema<T, S, F>,
  title?: string,
  description?: string,
): UiSchema<T, S, F> {
  if (title === undefined && description === undefined) {
    return optionUiSchema;
  }
  const uiSchema: UiSchema<T, S, F> = { ...optionUiSchema };
  if (title !== undefined) {
    delete uiSchema['ui:title'];
  }
  if (description !== undefined) {
    delete uiSchema['ui:description'];
  }
  uiSchema[UI_OPTIONS_KEY] = {
    ...optionUiSchema[UI_OPTIONS_KEY],
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
  };
  return uiSchema;
}

/** The `AnyOfField` component is used to render a field in the schema that is an `anyOf`, `allOf` or `oneOf`. It shows
 * the option `useOptionSelection()` holds for the field, selects another when the user picks one, and cleans up any
 * irrelevant data in `formData`.
 *
 * @param props - The `FieldProps` for this template. `options` holds the option schemas, each already retrieved for
 *   `formData` by `SchemaField`, which is the one place they are retrieved; a custom field rendering this itself
 *   retrieves them the same way. It is not a declared `FieldProps` key, so it would be read as `any` through
 *   `FieldProps`' `GenericObjectType` index signature; declaring it as `S[]` here names what `SchemaField` passes,
 *   but nothing checks it, since `SchemaField` renders this through a `Field` slot that only knows `FieldProps`
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
  const sendOptionSwitch = useSendOptionSwitch(fieldPath);

  const { selectedOption, selectOption } = useOptionSelection<T, S, F>(
    registry,
    fieldPath,
    options,
    formData,
    getDiscriminatorFieldFromSchema<S>(schema),
  );

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

  const option = selectedOption >= 0 ? options[selectedOption] || null : null;
  // A parent allowing several types passes all of them on: when the fallback UI is on, it pins one type on the schema
  // it hands down, so such a union only reaches here with the fallback UI off
  // Memoized, since the meet walks every subschema the two share. `SchemaField` retrieves the options afresh when the
  // data changes, so this only spares a render that leaves the data as it was, and the switch away from the option
  const renderedOption = useMemo(() => (option ? getRenderedOptionSchema<S>(schema, option) : null), [schema, option]);

  /** Callback handler to remember what the currently selected option is. In addition to that the `formData` is updated
   * to remove properties that are not part of the newly selected option schema, and then the updated data is passed to
   * the `onChange` handler.
   *
   * @param value - The new option value being selected
   */
  const onOptionChange = useCallback(
    (value?: string) => {
      if (disabled || readonly) {
        return;
      }
      const intOption = value !== undefined ? parseInt(value, 10) : -1;
      if (intOption === selectedOption) {
        return;
      }
      const newOption = intOption >= 0 ? options[intOption] : undefined;
      const oldOption = selectedOption >= 0 ? options[selectedOption] : undefined;

      // `uiSchemaDefinitions` comes from the registry since an option's uiSchema is only its own sub-uiSchema and
      // never carries the root's `ui:definitions` itself.
      const newOptionUiSchema = selectOptionUiSchema<T, S, F>(optionsUiSchema, uiSchema, intOption);
      const newFormData = formDataForNewOption<T, S, F>(schemaUtils, formData, newOption, oldOption, schema, {
        newOptionUiSchema,
        oldOptionUiSchema: optionUiSchema,
        uiSchemaDefinitions,
      });

      selectOption(intOption);
      sendOptionSwitch(
        schema,
        {
          oldOption,
          oldRenderedOption: renderedOption ?? undefined,
          newOption,
          oldUiSchema: optionUiSchema,
          newUiSchema: newOptionUiSchema,
        },
        formData,
        newFormData,
        () => onChange(newFormData, fieldPath, undefined, fieldId),
      );
    },
    [
      selectedOption,
      options,
      disabled,
      readonly,
      schema,
      schemaUtils,
      formData,
      fieldPath,
      onChange,
      fieldId,
      selectOption,
      sendOptionSwitch,
      optionsUiSchema,
      optionUiSchema,
      renderedOption,
      uiSchema,
      uiSchemaDefinitions,
    ],
  );

  const { SchemaField: SchemaFieldComponent } = fields;
  const { MultiSchemaFieldTemplate } = getTemplates<T, S, F>(registry, globalUiOptions);
  const isOptionalRender = shouldRenderOptionalField<T, S, F>(registry, schema, required, uiSchema, fieldPath);
  const hasFormData = isFormDataAvailable<T>(formData);

  const { Widget } = resolveWidget<T, S, F>({ type: 'number' }, widget, widgets);
  const rawErrors = errorSchema?.[ERRORS_KEY] ?? [];
  const fieldErrorSchema = { ...errorSchema } as ErrorSchema<T>;
  delete fieldErrorSchema[ERRORS_KEY];
  const displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema, globalUiOptions);

  // The field's own title is the one the option's field renders in its place, since the selector already shows an
  // option's title. It shows no description, so an option's own is what explains the alternative chosen, and the
  // field's is the one rendered only for an option that declares none. An option without a uiSchema of its own is
  // handed the field's, whose `ui:description` is the field's rather than the option's
  const description =
    getUiOptions<T, S, F>(optionsUiSchema[selectedOption]).description ??
    renderedOption?.description ??
    uiOptions.description ??
    schema.description;
  const rendersFieldLabel =
    renderedOption !== null && optionRendersFieldLabel<S>(schema, uiOptions.label, displayLabel);
  // Memoized as well, since the option's `SchemaField` keys its own memos on the schema it is handed
  const optionSchema = useMemo(
    () =>
      rendersFieldLabel
        ? {
            ...renderedOption,
            ...(title !== undefined && { title }),
            ...(description !== undefined && { description }),
          }
        : renderedOption,
    [rendersFieldLabel, renderedOption, title, description],
  );
  // An option's own uiSchema would otherwise label its field with the option's `ui:title`, which the selector already
  // shows, over the field's own, and the field's uiSchema, handed to an option without one, its `ui:description` over
  // the option's
  const optionFieldUiSchema = useMemo(
    () =>
      rendersFieldLabel && optionUiSchema
        ? withFieldLabel<T, S, F>(optionUiSchema, title, description)
        : optionUiSchema,
    [rendersFieldLabel, optionUiSchema, title, description],
  );

  const translateEnum: TranslatableString = title
    ? TranslatableString.TitleOptionPrefix
    : TranslatableString.OptionPrefix;
  const translateParams = title ? [title] : [];
  const enumOptions = options.map((opt, index) => {
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
        <SchemaFieldComponent {...props} schema={optionSchema} uiSchema={optionFieldUiSchema} />
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
