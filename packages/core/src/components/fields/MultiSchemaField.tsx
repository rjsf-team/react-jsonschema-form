import { use, useCallback, useMemo } from 'react';
import type { ErrorSchema, FieldProps, FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from '@rjsf/utils';
import {
  ANY_OF_KEY,
  deepEquals,
  ERRORS_KEY,
  EXTRA_KEYS_ELSEWHERE_FLAG,
  getDiscriminatorFieldFromSchema,
  getRenderedOptionSchema,
  getSelectorPresentation,
  getTemplates,
  getUiOptions,
  getValidationTarget,
  getXxxOfKey,
  isFormDataAvailable,
  logOnce,
  ONE_OF_KEY,
  rendersOwnFieldBesideOption,
  resolveWidget,
  selectOptionUiSchema,
  shouldRenderOptionalField,
  TranslatableString,
  UI_OPTIONS_KEY,
} from '@rjsf/utils';

import fieldLabelForLog, { entryLabelForLog } from '../../fieldLabelForLog.ts';
import useOptionSelection from '../../hooks/useOptionSelection.ts';
import useSendOptionSwitch from '../../hooks/useSendOptionSwitch.ts';
import { displaysLabel, getWidgetErrorProps, getWidgetLabelProps } from './fieldWidgetUtils.ts';
import formDataForNewOption from './formDataForNewOption.ts';
import { lookUpUiField } from './namedField.ts';
import NamedFieldContext from './NamedFieldContext.ts';

/** Returns the uiSchema of an option whose field takes the extra keys of the object offering it in that object's
 * field's place (see `getRenderedOptionSchema()`), with the object's `expandable` and `additionalProperties` entry,
 * which say whether a key can be added and how each renders, beneath the option's own
 *
 * @param optionUiSchema - The option's own uiSchema
 * @param uiSchema - The uiSchema of the object offering the option
 * @returns - The uiSchema the option renders with
 */
function withParentExtraKeysUi<T, S extends StrictRJSFSchema, F extends FormContextType>(
  optionUiSchema: UiSchema<T, S, F>,
  uiSchema: UiSchema<T, S, F>,
): UiSchema<T, S, F> {
  const { expandable } = getUiOptions<T, S, F>(uiSchema);
  const layered: UiSchema<T, S, F> = { ...optionUiSchema };
  if (expandable !== undefined && getUiOptions<T, S, F>(optionUiSchema).expandable === undefined) {
    layered[UI_OPTIONS_KEY] = { ...optionUiSchema[UI_OPTIONS_KEY], expandable };
  }
  if (uiSchema.additionalProperties !== undefined && optionUiSchema.additionalProperties === undefined) {
    layered.additionalProperties = uiSchema.additionalProperties;
  }
  return layered;
}

/** Returns the field's `uiSchema` for an option that declares none of its own, without the field's title and
 * description, which the field's plan already carries to the option's, so the option keeps the title and description
 * its own schema gives it rather than taking the field's in their place. Shadowed in `ui:options` as well, as
 * `getUiOptions()` reads either spelling
 *
 * @param uiSchema - The field's uiSchema
 * @returns - The uiSchema the option renders with
 */
function withoutFieldText<T, S extends StrictRJSFSchema, F extends FormContextType>(
  uiSchema: UiSchema<T, S, F>,
): UiSchema<T, S, F> {
  const options = uiSchema[UI_OPTIONS_KEY];
  if (
    !('ui:title' in uiSchema) &&
    !('ui:description' in uiSchema) &&
    options?.title === undefined &&
    options?.description === undefined
  ) {
    return uiSchema;
  }
  const { 'ui:title': _title, 'ui:description': _description, ...rest } = uiSchema;
  return { ...rest, [UI_OPTIONS_KEY]: { ...options, title: undefined, description: undefined } };
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
    presentation,
  } = props;
  const { schemaUtils } = registry;
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

  const { widgets, fields, translateString, globalFormOptions, globalUiOptions, uiSchemaDefinitions, rootSchema } =
    registry;
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
  const rendersOption = renderedOption !== null && renderedOption.type !== 'null';
  // Below a field named for this path the option renders as though no field were named, which its `SchemaField` can't
  // tell apart from a `uiSchema` it inherits, so a field the option's own entry names is warned about here instead,
  // unless it is `SchemaField`, which renders the option the same either way
  const namedForPath = use(NamedFieldContext)?.fieldPath === fieldPath;
  if (rendersOption && namedForPath && optionUiSchema !== uiSchema) {
    const optionField = getUiOptions<T, S, F>(optionUiSchema).field;
    if (optionField && lookUpUiField<T, S, F>(optionField, fields) !== fields.SchemaField) {
      logOnce(
        `ui:field in uiSchema.${xxxOfKey}[${selectedOption}] for ${entryLabelForLog(fieldPath, globalFormOptions)} is ` +
          'ignored, since a field is already named for that path, so the option is rendered as though no ui:field ' +
          'were given.',
      );
    }
  }
  // An object parent's option is marked as leaving the extra keys to the parent's field, unless it takes them itself
  const takesParentExtraKeys =
    renderedOption !== null &&
    rendersOwnFieldBesideOption<S>(schema) &&
    !Reflect.get(renderedOption, EXTRA_KEYS_ELSEWHERE_FLAG);
  // Memoized, since the option's `SchemaField` keys its own memos on the uiSchema it is handed
  const optionFieldUiSchema = useMemo(() => {
    if (uiSchema && optionUiSchema === uiSchema) {
      return withoutFieldText<T, S, F>(uiSchema);
    }
    return uiSchema && optionUiSchema && takesParentExtraKeys
      ? withParentExtraKeysUi<T, S, F>(optionUiSchema, uiSchema)
      : optionUiSchema;
  }, [optionUiSchema, uiSchema, takesParentExtraKeys]);

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
        },
        formData,
        newFormData,
        (sent) => {
          sentData = sent;
          onChange(sent, fieldPath, undefined, fieldId);
        },
      );
      // A switch the form refused changed nothing, so the option shown before is shown again, even where the data fits
      // the one picked. One the form took holds for what it stored, which the form records as it takes it, and one no
      // form answered for what it sent. One `transformChange` rewrote here holds while the data the form kept still fits
      // the chosen option, so data several options fit keeps the explicit choice, and is otherwise matched again
      if (outcome === undefined) {
        selectOption(intOption, [sentData]);
      } else if (outcome.kind === 'refused') {
        selectOption(selectedOption, [formData]);
      } else if (
        outcome.kind === 'rewritten' &&
        !deepEquals(outcome.kept, outcome.edited) &&
        !(
          newOption !== undefined &&
          schemaUtils.getValidator().isValid(getValidationTarget<S>(newOption, rootSchema), outcome.kept, rootSchema)
        )
      ) {
        selectOption(intOption, []);
      }
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
      rootSchema,
    ],
  );

  const { SchemaField: SchemaFieldComponent } = fields;
  const { MultiSchemaFieldTemplate } = getTemplates<T, S, F>(registry, uiOptions);
  const isOptionalRender = shouldRenderOptionalField<T, S, F>(registry, schema, required, uiSchema, fieldPath);
  const hasFormData = isFormDataAvailable<T>(formData);

  const { Widget } = resolveWidget<T, S, F>({ type: 'number' }, widget, widgets);
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
        name={`${name}${selectSuffix}`}
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

  const optionsSchemaField = rendersOption ? (
    <SchemaFieldComponent {...props} schema={renderedOption} uiSchema={optionFieldUiSchema} />
  ) : null;

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
