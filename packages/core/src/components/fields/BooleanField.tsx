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
  deepEquals,
  fieldPathToName,
  getUiOptions,
  getWidget,
  getXxxOfKey,
  isConstantOptionList,
  logOnce,
  optionsList,
  toConstant,
  TranslatableString,
} from '@rjsf/utils';

import fieldLabelForLog from '../../fieldLabelForLog.ts';

/** Returns the label a boolean constant gets when its option has no title of its own, or `undefined` for any other
 * constant so that `optionsList()` falls back to the value itself.
 *
 * @param constant - The constant value of the option being labelled
 * @param yes - The translated label for `true`
 * @param no - The translated label for `false`
 * @returns - The label for the constant, or `undefined` when it isn't a boolean
 */
function booleanConstantTitle(constant: unknown, yes: string, no: string): string | undefined {
  if (constant === true) {
    return yes;
  }
  if (constant === false) {
    return no;
  }
  return undefined;
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
    widget = 'checkbox',
    title: uiTitle,
    // Unlike the other fields, don't use `getDisplayLabel()` since it always returns false for the boolean type
    label: displayLabel = true,
    enumNames,
    placeholder,
    ...options
  } = getUiOptions<T, S, F>(uiSchema, globalUiOptions);
  const Widget = getWidget(schema, widget, widgets);
  const yes = translateString(TranslatableString.YesLabel);
  const no = translateString(TranslatableString.NoLabel);
  let enumOptions: EnumOptionsType<S>[] | undefined;
  const label = uiTitle ?? schemaTitle ?? title ?? name;
  // Read from the keyword `isSelect()` and `optionsList()` read, so this field and `SchemaField` agree on the list
  const altKey = getXxxOfKey<S>(schema);
  const altSchemas = altKey ? schema[altKey] : undefined;
  if (altKey && isConstantOptionList<S>(altSchemas, true)) {
    // The `enum` still constrains the value, so an option it rules out could only ever fail validation
    const allowed = schema.enum;
    enumOptions = optionsList<T, S, F>(
      {
        [altKey]: altSchemas.map((option) => {
          // Read the same way `optionsList()` reads it, so a single-value `enum` is labelled like the `const` spelling
          const constant = toConstant(option);
          return {
            ...option,
            // An option's own title wins, even an empty one. `ui:enumNames` names only `enum` values, so it doesn't
            // label these options
            title: option.title ?? booleanConstantTitle(constant, yes, no),
          };
        }),
      } as unknown as S,
      uiSchema,
    )?.filter(({ value }) => !allowed || allowed.some((allowedValue) => deepEquals(allowedValue, value)));
  } else {
    // `ui:enumNames` already labels the options, and a checkbox shows no option labels at all
    if (schema.enum && altSchemas?.length && !enumNames && widget !== 'checkbox') {
      logOnce(
        `${fieldLabelForLog(fieldId, fieldPath)} has an enum beside a ${altKey} whose options aren't all \`const\` ` +
          `schemas, so its options come from the enum and the ${altKey} titles aren't shown. Label the enum values ` +
          `with ui:enumNames, or make every ${altKey} option a \`const\` schema.`,
      );
    }
    const enums = schema.enum ?? [true, false];
    enumOptions = optionsList<T, S, F>({ enum: enums } as S, uiSchema)?.map((option) => {
      const enumName = Array.isArray(enumNames)
        ? enumNames[enums.indexOf(option.value)]
        : enumNames?.[String(option.value)];
      return enumName ? option : { ...option, label: booleanConstantTitle(option.value, yes, no) ?? option.label };
    });
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
