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
function BooleanField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: FieldProps<T, S, F>,
) {
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
  // `optionsList()` reads `anyOf` before `oneOf`, so the options come from the same keyword it would have picked, but
  // only when they are constants: it maps them with `toConstant()`, which throws for anything else
  const anyOfSchemas = schema[ANY_OF_KEY];
  const altKey =
    Array.isArray(anyOfSchemas) &&
    anyOfSchemas.length > 0 &&
    anyOfSchemas.every((option) => isObject(option) && isConstant(option))
      ? ANY_OF_KEY
      : ONE_OF_KEY;
  const altSchemas = schema[altKey];
  if (Array.isArray(altSchemas)) {
    enumOptions = optionsList<T, S, F>(
      {
        [altKey]: altSchemas
          .map((option, index) => {
            if (isObject(option)) {
              return {
                ...option,
                // An option's own title wins, then `ui:enumNames` by position, which `optionsList()` applies only to
                // an `enum` and so would otherwise be dropped by taking this path at all. Only a boolean constant
                // gets a Yes/No label after that; `optionsList()` falls back to the value for the rest, so a `null`
                // option reads as `null` rather than sharing `false`'s label. The constant is read the same way
                // `optionsList()` reads it, so a single-value `enum` is labelled like the `const` spelling
                title:
                  option.title ||
                  enumNames?.[index] ||
                  booleanConstantTitle(isConstant(option) ? toConstant(option) : undefined, yes, no),
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
