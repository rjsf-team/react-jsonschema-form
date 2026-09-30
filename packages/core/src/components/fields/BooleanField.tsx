import { useCallback } from 'react';
import type {
  FieldProps,
  FormContextType,
  EnumOptionsType,
  ErrorSchema,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import {
  fieldPathToName,
  getUiOptions,
  getWidget,
  getXxxOfKey,
  isConstantOptionList,
  logOnce,
  optionsList,
  TranslatableString,
} from '@rjsf/utils';

import fieldLabelForLog from '../../fieldLabelForLog.ts';
import hasOptionLabels from '../../hasOptionLabels.ts';

/** The `BooleanField` component is used to render a field in the schema is boolean. It constructs `enumOptions` for the
 * two boolean values based on the various alternatives in the schema.
 *
 * @param props - The `FieldProps` for this template
 */
function BooleanField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldProps<T, S, F>) {
  const {
    schema,
    name,
    uiSchema,
    fieldPath,
    id: fieldId,
    formData,
    registry,
    required,
    disabled,
    readonly,
    hideError,
    autofocus,
    title,
    onChange,
    onFocus,
    onBlur,
    rawErrors,
  } = props;
  const { title: schemaTitle } = schema;
  const { widgets, translateString, globalUiOptions } = registry;
  const {
    widget,
    title: uiTitle,
    // Unlike the other fields, don't use `getDisplayLabel()` since it always returns false for the boolean type
    label: displayLabel = true,
    placeholder,
    ...options
  } = getUiOptions<T, S, F>(uiSchema, globalUiOptions);
  const Widget = getWidget(schema, widget ?? 'checkbox', widgets);
  const yes = translateString(TranslatableString.YesLabel);
  const no = translateString(TranslatableString.NoLabel);
  let enumOptions: EnumOptionsType<S>[] | undefined;
  const label = uiTitle ?? schemaTitle ?? title ?? name;
  // A checkbox shows no option labels, and a hidden field no options at all, so neither can drop a label or an order
  const showsOptions = Widget !== widgets.CheckboxWidget && Widget !== widgets.HiddenWidget;
  // The label `optionsList()` falls back to for a value nothing else names; any other value is labelled with itself
  const yesNoLabel = (value: unknown) => {
    if (typeof value !== 'boolean') {
      return undefined;
    }
    return value ? yes : no;
  };
  // Read from the keyword `SchemaField` picks the widget from, so the widget and the options come from one list. Unlike
  // `optionsList()`, which lists an `enum` first, a boolean's constant options win over its `enum`, so they can title
  // its values
  const altKey = getXxxOfKey<S>(schema);
  const altSchemas = altKey ? schema[altKey] : undefined;
  if (altKey && isConstantOptionList<S>(altSchemas, true)) {
    // A checkbox `SchemaField` defaulted to over several options, rather than one the uiSchema asked for, is there
    // because nothing labels them, which these names were meant to do. A single option keeps its checkbox however it is
    // labelled, so naming it could never show
    if (showsOptions || (!widget && altSchemas.length > 1)) {
      // Read without `globalUiOptions`, as `optionsList()` reads them
      const { enumNames, enumOrder } = getUiOptions<T, S, F>(uiSchema);
      if (Object.keys(enumNames ?? {}).length > 0 || enumOrder?.length) {
        logOnce(
          `${fieldLabelForLog(fieldId, fieldPath)} sets ui:enumNames or ui:enumOrder, which apply only to \`enum\` ` +
            `values, but its options come from its constant \`${altKey}\`, so they are ignored. Label those ` +
            `options with a \`title\` or a \`ui:title\` in \`uiSchema.${altKey}\`, and list them in the order to ` +
            `show them.`,
        );
      }
    }
    // Without the `enum`, which `optionsList()` would list instead
    enumOptions = optionsList<T, S, F>({ ...schema, enum: undefined }, uiSchema, yesNoLabel);
  } else {
    let hasUnnamedValue = false;
    enumOptions = optionsList<T, S, F>({ enum: schema.enum ?? [true, false] } as S, uiSchema, (value) => {
      // Only a value `ui:enumNames` doesn't name gets here
      hasUnnamedValue = true;
      return yesNoLabel(value);
    });
    if (
      showsOptions &&
      schema.enum &&
      altKey &&
      altSchemas &&
      hasUnnamedValue &&
      hasOptionLabels<T, S, F>(altSchemas, altKey, uiSchema)
    ) {
      logOnce(
        `${fieldLabelForLog(fieldId, fieldPath)} has an \`enum\` beside \`${altKey}\` options that aren't all ` +
          `\`const\` schemas, so its options come from the \`enum\` and the \`${altKey}\` titles aren't shown. ` +
          `Label the \`enum\` values with ui:enumNames, or make every \`${altKey}\` option a \`const\` schema.`,
      );
    }
  }
  const onWidgetChange = useCallback(
    (value: T | undefined, errorSchema?: ErrorSchema, id?: string) => onChange(value, fieldPath, errorSchema, id),
    [onChange, fieldPath],
  );

  return (
    <Widget
      options={{ ...options, enumOptions }}
      schema={schema}
      uiSchema={uiSchema}
      id={fieldId}
      name={name}
      onChange={onWidgetChange}
      onFocus={onFocus}
      onBlur={onBlur}
      label={label}
      hideLabel={!displayLabel}
      value={formData}
      required={required}
      disabled={disabled}
      readonly={readonly}
      hideError={hideError}
      registry={registry}
      autofocus={autofocus}
      placeholder={placeholder}
      rawErrors={rawErrors}
      htmlName={fieldPathToName(fieldPath, registry.globalFormOptions)}
    />
  );
}

export default BooleanField;
