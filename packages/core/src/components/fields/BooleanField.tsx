import { useCallback } from 'react';
import type {
  FieldProps,
  FormContextType,
  EnumOptionsType,
  ErrorSchema,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
} from '@rjsf/utils';
import {
  ANY_OF_KEY,
  deepEquals,
  fieldPathToName,
  getUiOptions,
  getXxxOfKey,
  isConstantOptionList,
  logOnce,
  ONE_OF_KEY,
  optionsList,
  resolveWidget,
  toConstant,
  TranslatableString,
} from '@rjsf/utils';

import fieldLabelForLog from '../../fieldLabelForLog.ts';
import hasOptionLabels from '../../hasOptionLabels.ts';

/** Whether `ui:enumOrder` would reorder or drop any of the constant `options` if it applied to them
 *
 * @param options - The constant options of the keyword being rendered
 * @param [uiSchema] - The `uiSchema` for the field, which holds the `ui:enumOrder`
 * @returns - True when the order differs from the order the options already have
 */
function enumOrderChangesOptions<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(options: S[], uiSchema?: UiSchema<T, S, F>): boolean {
  const constants = options.map((option) => toConstant(option));
  const ordered = optionsList<T, S, F>({ enum: constants } as S, uiSchema)?.map(({ value }) => value);
  return !deepEquals(ordered, constants);
}

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
    // Applied through the `enumOptions` it labels, and ignored by constant options, so a widget mustn't apply it again
    enumNames: _enumNames,
    placeholder,
    ...options
  } = getUiOptions<T, S, F>(uiSchema, globalUiOptions);
  const { Widget } = resolveWidget<T, S, F>(schema, widget ?? 'checkbox', widgets);
  const yes = translateString(TranslatableString.YesLabel);
  const no = translateString(TranslatableString.NoLabel);
  let enumOptions: EnumOptionsType<S>[] | undefined;
  const label = uiTitle ?? schemaTitle ?? title ?? name;
  // Only a select and radios are known to list the options, so only they can drop a label or an order. A checkbox, a
  // hidden field or a custom widget such as a toggle may show no option labels, which would make the warnings noise
  const showsOptions = Widget === widgets.SelectWidget || Widget === widgets.RadioWidget;
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
      // No order shows on a checkbox, and an order that would leave the options as they are has nothing to ignore
      const uiOptionsIgnored =
        Object.keys(enumNames ?? {}).length > 0 ||
        (showsOptions && enumOrder !== undefined && enumOrderChangesOptions<T, S, F>(altSchemas, uiSchema));
      if (uiOptionsIgnored) {
        // A checkbox shows neither list, and dropping the `anyOf`/`oneOf` wouldn't turn it into a widget that shows the
        // `enum`, so only a widget that lists the options is pointed at the `enum`, and only at one with values to show
        const showsOverEnum = showsOptions && Boolean(schema.enum?.length);
        // Dropping the keyword shows the `enum` only when the other keyword wouldn't take its place with constants
        const nextKey = getXxxOfKey<S>({ ...schema, [altKey]: undefined });
        const enumBehind = !nextKey || !isConstantOptionList<S>(schema[nextKey], true);
        const source = showsOverEnum
          ? `it shows its constant \`${altKey}\` options rather than its \`enum\``
          : `its options come from its constant \`${altKey}\``;
        const alternative = showsOverEnum && enumBehind ? `, or drop the \`${altKey}\` to show the \`enum\`` : '';
        logOnce(
          `${fieldLabelForLog(fieldId, fieldPath)} sets ui:enumNames or ui:enumOrder, which apply only to \`enum\` ` +
            `values, but ${source}, so they are ignored. Label those options with a \`title\` or a \`ui:title\` in ` +
            `\`uiSchema.${altKey}\`, and list them in the order to show them${alternative}.`,
        );
      }
    }
    // Without the `enum`, which `optionsList()` would list instead
    enumOptions = optionsList<T, S, F>({ ...schema, enum: undefined }, uiSchema, yesNoLabel);
  } else {
    // Only tracked when the warning below can fire, since this runs on every render of every boolean field
    const unnamedValues = showsOptions && schema.enum && altSchemas ? new Set<unknown>() : undefined;
    enumOptions = optionsList<T, S, F>(
      { enum: schema.enum ?? [true, false] } as S,
      uiSchema,
      unnamedValues
        ? (value) => {
            // `optionsList()` calls the fallback for each value `ui:enumNames` doesn't name, and for no other
            unnamedValues.add(value);
            return yesNoLabel(value);
          }
        : yesNoLabel,
    );
    if (
      unnamedValues &&
      altKey &&
      altSchemas &&
      // Checked on the options left once `ui:enumOrder` has dropped any, since an unnamed value it drops isn't shown
      enumOptions?.some(({ value }) => unnamedValues.has(value))
    ) {
      if (hasOptionLabels<T, S, F>(altSchemas, altKey, uiSchema)) {
        logOnce(
          `${fieldLabelForLog(fieldId, fieldPath)} has an \`enum\` beside \`${altKey}\` options that aren't all ` +
            `\`const\` schemas, so its options come from the \`enum\` and the \`${altKey}\` titles aren't shown. ` +
            `Label the \`enum\` values with ui:enumNames, or make every \`${altKey}\` option a \`const\` schema.`,
        );
      } else if (
        // `getXxxOfKey()` reads a non-empty `anyOf` first, so a titled `oneOf` behind it is hidden as well
        altKey === ANY_OF_KEY &&
        Array.isArray(schema[ONE_OF_KEY]) &&
        hasOptionLabels<T, S, F>(schema[ONE_OF_KEY], ONE_OF_KEY, uiSchema)
      ) {
        logOnce(
          `${fieldLabelForLog(fieldId, fieldPath)} has an \`enum\` beside an \`anyOf\` whose options aren't all ` +
            `\`const\` schemas and which is read before its \`oneOf\`, so its options come from the \`enum\` and ` +
            `the \`oneOf\` titles aren't shown. Label the \`enum\` values with ui:enumNames.`,
        );
      }
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
