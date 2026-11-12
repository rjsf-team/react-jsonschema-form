import { use, useCallback, useMemo } from 'react';
import type { ErrorSchema, FieldProps, FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from '@rjsf/utils';
import {
  ADDITIONAL_PROPERTY_FLAG,
  ERRORS_KEY,
  getDiscriminatorFieldFromSchema,
  getRenderedOptionSchema,
  getSelectorPresentation,
  getTemplates,
  getUiOptions,
  hasSchemaMarker,
  hasWidget,
  isFormDataAvailable,
  logOnce,
  optionSelectorId,
  resolveWidget,
  selectOptionUiSchema,
  shouldRenderOptionalField,
  TranslatableString,
} from '@rjsf/utils';

import fieldLabelForLog from '../../fieldLabelForLog.ts';
import useOptionSelection from '../../hooks/useOptionSelection.ts';
import useSendOptionSwitch, { selectSwitchedOption } from '../../hooks/useSendOptionSwitch.ts';
import { retrievedOptionListOf } from '../uiState.ts';
import AdditionalEntryContext from './AdditionalEntryContext.ts';
import {
  displaysLabel,
  getWidgetErrorProps,
  getWidgetLabelProps,
  optionsKeywordOf,
  withoutOptionalControls,
} from './fieldWidgetUtils.ts';
import formDataForNewOption from './formDataForNewOption.ts';
import getOptionFieldUiSchema from './getOptionFieldUiSchema.ts';
import { lookUpUiField } from './namedField.ts';
import NamedFieldContext from './NamedFieldContext.ts';
import OptionalControlsBesideContext from './OptionalControlsBesideContext.ts';
import SelectorsAboveContext, { useSelectorsAbove } from './SelectorsAboveContext.ts';
import TemplateWarnEntryContext, { optionWarnEntry, useTemplateWarnEntry } from './TemplateWarnEntryContext.ts';

/** The widgets the option index has an implementation of that would show the index as a number to edit */
const VALUE_ENTRY_WIDGETS = new Set<unknown>(['text', 'updown', 'range', 'TextWidget', 'UpDownWidget', 'RangeWidget']);

/** The `AnyOfField` component is used to render a field in the schema that is an `anyOf`, `allOf` or `oneOf`. It shows
 * the option `useOptionSelection()` holds for the field, selects another when the user picks one, and cleans up any
 * irrelevant data in `formData`.
 *
 * @param props - The `FieldProps` for this template. `options` holds the option schemas, each already retrieved for
 *   `formData` by `SchemaField`. A field named through `ui:field`, or rendered by a custom field, is handed none, so it
 *   retrieves them from its `schema` as `SchemaField` does
 */
function AnyOfField<T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  props: FieldProps<T, S, F>,
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
    options: givenOptions,
    readonly,
    registry,
    required = false,
    schema,
    uiSchema,
    presentation,
  } = props;
  const { schemaUtils } = registry;
  const sendOptionSwitch = useSendOptionSwitch(fieldPath);
  const options = useMemo(
    () => givenOptions ?? retrievedOptionListOf<T, S, F>(schemaUtils, schema, formData) ?? [],
    [givenOptions, schemaUtils, schema, formData],
  );

  const { selectedOption, selectOption } = useOptionSelection<T, S, F>(
    registry,
    fieldPath,
    options,
    formData,
    getDiscriminatorFieldFromSchema<S>(schema),
  );

  const xxxOfKey = optionsKeywordOf<S>(schema);
  const selectorsAbove = useSelectorsAbove(id);
  const selectorDepth = selectorsAbove[xxxOfKey] + 1;
  const fieldId = optionSelectorId(id, xxxOfKey, selectorDepth);
  const selectorsBelow = useMemo(
    () => ({ ...selectorsAbove, [xxxOfKey]: selectorDepth }),
    [selectorsAbove, xxxOfKey, selectorDepth],
  );

  const { widgets, fields, translateString, globalFormOptions, globalUiOptions, uiSchemaDefinitions } = registry;
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
  // it hands down, so such a union only reaches here with the fallback UI off or with options that leave the choice of
  // type to themselves
  // Memoized, since the meet walks every subschema the two share. `SchemaField` retrieves the options afresh when the
  // data changes, so this only spares a render that leaves the data as it was, and the switch away from the option
  const renderedOption = useMemo(() => (option ? getRenderedOptionSchema<S>(schema, option) : null), [schema, option]);
  const rendersOption = renderedOption !== null && renderedOption.type !== 'null';
  // The entry this field renders from, which the `SchemaField` rendering it provides, so an option nested in another
  // option's entry names both
  const entry = useTemplateWarnEntry(schema, fieldPath, globalFormOptions);
  // Below a field named for this path the option renders as though no field were named, which its `SchemaField` can't
  // tell apart from a `uiSchema` it inherits, so a field the option's own entry names is warned about here instead,
  // unless it is `SchemaField`, which renders the option the same either way
  const namedForPath = use(NamedFieldContext)?.fieldPath === fieldPath;
  if (rendersOption && namedForPath && optionUiSchema !== uiSchema) {
    const optionField = getUiOptions<T, S, F>(optionUiSchema).field;
    if (optionField && lookUpUiField<T, S, F>(optionField, fields) !== fields.SchemaField) {
      logOnce(
        `ui:field in uiSchema.${xxxOfKey}[${selectedOption}] for ${entry.label()} is ` +
          'ignored, since a field is already named for that path, so the option is rendered as though no ui:field ' +
          'were given.',
      );
    }
  }
  // A custom container field renders an entry with no context, which leaves its flag
  const isEntryPath = use(AdditionalEntryContext) === fieldPath || hasSchemaMarker(schema, ADDITIONAL_PROPERTY_FLAG);
  // Memoized, since the option's `SchemaField` keys its own memos on the uiSchema it is handed. An option's own uiSchema
  // or `ui:definitions` entry doesn't inherit the entry's Optional Data Controls being off, so it is turned off here too
  const optionFieldUiSchema = useMemo(() => {
    const fieldUiSchema = getOptionFieldUiSchema<T, S, F>(
      schema,
      option,
      uiSchema,
      optionUiSchema,
      renderedOption,
      registry,
    );
    return isEntryPath ? withoutOptionalControls<T, S, F>(fieldUiSchema) : fieldUiSchema;
  }, [optionUiSchema, uiSchema, schema, option, renderedOption, registry, isEntryPath]);

  // The option's `SchemaField` renders at this field's own `fieldPath`, so left to its own path its
  // template-override warnings would name this field's entry, and the two entries' mistakes would read as one under
  // `logOnce()`. It is handed the option entry's label instead, the way the `ui:field` warning above names it, or
  // this field's own where it renders from this field's entry. The fields below an option's own entry are named after
  // it too, through the anchor they inherit. The option's schema is its own either way. Memoized: a fresh label each
  // render would re-render the option past its `memo`, and the labels are read only when something is actually invalid.
  // An option's entry with no `additionalProperties` of its own renders the extra keys it takes from this field with
  // this field's. Read as a flag, since the option's uiSchema is rebuilt whenever a re-retrieved schema is
  const keysFromField =
    optionUiSchema?.additionalProperties === undefined && optionFieldUiSchema?.additionalProperties !== undefined;
  const rendersFromField = optionUiSchema === uiSchema;
  const optionEntry = useMemo(
    () => optionWarnEntry(entry, rendersFromField, keysFromField, xxxOfKey, selectedOption),
    [entry, rendersFromField, keysFromField, xxxOfKey, selectedOption],
  );

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
      const switched = formDataForNewOption<T, S, F>(schemaUtils, formData, newOption, oldOption, schema, {
        newOptionUiSchema,
        oldOptionUiSchema: optionUiSchema,
        uiSchemaDefinitions,
        globalUiOptions,
      });

      // Selected before the switch is sent, so the change's sanitize and live omit read the option it switches to
      selectOption(intOption);
      let sentData: unknown;
      const outcome = sendOptionSwitch(
        schema,
        {
          oldOption,
          oldRenderedOption: renderedOption ?? undefined,
          newOption,
          oldUiSchema: optionUiSchema,
          newUiSchema: newOptionUiSchema,
          oldIndex: selectedOption,
        },
        formData,
        switched,
        (sent) => {
          sentData = sent;
          onChange(sent, fieldPath, undefined, fieldId);
        },
      );
      selectSwitchedOption<T, S, F>(
        selectOption,
        schemaUtils,
        { from: selectedOption, to: intOption, newOption },
        formData,
        sentData,
        outcome,
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
      globalUiOptions,
    ],
  );

  const { SchemaField: SchemaFieldComponent } = fields;
  const { MultiSchemaFieldTemplate } = getTemplates<T, S, F>(registry, uiOptions);
  const isOptionalRender = shouldRenderOptionalField<T, S, F>(registry, schema, required, uiSchema, fieldPath);
  const hasFormData = isFormDataAvailable<T>(formData);
  // The object beside the options keeps everything of its own behind its Add, so the option has nothing to show yet,
  // whatever its own uiSchema says about the controls
  const hiddenBehindControlsBeside = use(OptionalControlsBesideContext) === fieldPath && !hasFormData;

  // A `ui:widget` the options inherit that enters a value rather than choosing one, or one named for a type the option
  // index isn't, renders the option, not this selector. Where every option has a `uiSchema` entry of its own none
  // inherits it, so such a widget is written for the selector
  const selectorSchema = { type: 'number' } as const;
  const rendersOnOption = optionsUiSchema.length < options.length && VALUE_ENTRY_WIDGETS.has(widget);
  const { Widget } = resolveWidget<T, S, F>(
    selectorSchema,
    !rendersOnOption && hasWidget<T, S, F>(selectorSchema, widget, widgets) ? widget : 'select',
    widgets,
  );
  const rawErrors = errorSchema?.[ERRORS_KEY] ?? [];
  const fieldErrorSchema = { ...errorSchema } as ErrorSchema<T>;
  delete fieldErrorSchema[ERRORS_KEY];

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

  const selectorPresentation = useMemo(
    () => presentation && getSelectorPresentation(presentation, fieldId),
    [presentation, fieldId],
  );
  const selectorLabelProps = getWidgetLabelProps<T, S, F>(selectorPresentation, title ?? name, () =>
    displaysLabel(registry, schema, uiSchema),
  );

  const selector =
    !isOptionalRender || hasFormData ? (
      <Widget
        id={fieldId}
        name={optionSelectorId(name, xxxOfKey, selectorDepth)}
        schema={{ type: 'number', default: 0 } as S}
        onChange={onOptionChange}
        onBlur={onBlur}
        onFocus={onFocus}
        disabled={disabled || enumOptions.length === 0}
        multiple={false}
        hideError={hideError}
        {...getWidgetErrorProps<T, S, F>(rawErrors)}
        errorSchema={fieldErrorSchema}
        value={selectedOption >= 0 ? selectedOption : undefined}
        options={{ enumOptions, ...uiOptions }}
        uiSchema={uiSchema}
        registry={registry}
        placeholder={placeholder}
        autocomplete={autocomplete}
        autofocus={autofocus}
        {...selectorLabelProps}
        presentation={selectorPresentation}
        readonly={readonly}
      />
    ) : undefined;

  const optionsSchemaField =
    rendersOption && !hiddenBehindControlsBeside ? (
      <SelectorsAboveContext value={selectorsBelow}>
        <TemplateWarnEntryContext value={optionEntry}>
          <SchemaFieldComponent {...props} schema={renderedOption} uiSchema={optionFieldUiSchema} />
        </TemplateWarnEntryContext>
      </SelectorsAboveContext>
    ) : null;

  // A theme frames the selector and option, so with neither there is only an empty box to draw
  if (!selector && !optionsSchemaField) {
    return null;
  }
  return (
    <MultiSchemaFieldTemplate
      id={id}
      schema={schema}
      registry={registry}
      uiSchema={uiSchema}
      selector={selector}
      optionSchemaField={optionsSchemaField}
    />
  );
}

export default AnyOfField;
