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
  ANY_OF_KEY,
  fieldPathToName,
  getUiOptions,
  getWidget,
  isConstant,
  isConstantOptionList,
  isObject,
  ONE_OF_KEY,
  optionsList,
  toConstant,
  TranslatableString,
} from '@rjsf/utils';

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
  // The options come from a constant `anyOf`, the keyword `isSelect()` and `optionsList()` read first, and otherwise
  // from `oneOf`: a non-constant `anyOf` is rendered by `AnyOfField`, whose option carries the parent's `oneOf` along,
  // so those labels still reach the widget. A `oneOf` that isn't made of constants gives `optionsList()` nothing to
  // list, which leaves the widget without `enumOptions`
  const anyOfSchemas = schema[ANY_OF_KEY];
  const altKey = isConstantOptionList<S>(anyOfSchemas) && anyOfSchemas.length > 0 ? ANY_OF_KEY : ONE_OF_KEY;
  const altSchemas = schema[altKey];
  if (Array.isArray(altSchemas)) {
    enumOptions = optionsList<T, S, F>(
      {
        [altKey]: altSchemas
          .map((option, index) => {
            if (isObject(option)) {
              // Read the same way `optionsList()` reads it, so a single-value `enum` is labelled like the `const`
              // spelling
              const constant = isConstant(option) ? toConstant(option) : undefined;
              return {
                ...option,
                // An option's own title wins, then `ui:enumNames`, which `optionsList()` applies only to an `enum` and
                // so would otherwise be dropped by taking this path at all. Both of its spellings are honored: an
                // array by position and a record by value. Only a boolean constant gets a Yes/No label after that;
                // `optionsList()` falls back to the value for the rest, so a `null` option reads as `null` rather than
                // sharing `false`'s label
                title:
                  option.title ||
                  (Array.isArray(enumNames) ? enumNames[index] : enumNames?.[String(constant)]) ||
                  booleanConstantTitle(constant, yes, no),
              };
            }
            return undefined;
          })
          .filter((o: any) => o) as S[], // cast away the error that typescript can't grok is fixed
      } as unknown as S,
      uiSchema,
    );
  } else {
    const enums = schema.enum ?? [true, false];
    if (!enumNames && enums.length === 2 && enums.every((v: any) => typeof v === 'boolean')) {
      enumOptions = [
        {
          value: enums[0],
          label: enums[0] ? yes : no,
        },
        {
          value: enums[1],
          label: enums[1] ? yes : no,
        },
      ];
    } else {
      enumOptions = optionsList<T, S, F>({ enum: enums } as S, uiSchema);
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
