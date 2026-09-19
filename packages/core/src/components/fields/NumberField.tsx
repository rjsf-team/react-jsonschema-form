import { useState, useCallback } from 'react';
import type { ErrorSchema, FieldPath, FieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { asNumber, getDecimalSeparator, getUiOptions, resolveDefaultWidget } from '@rjsf/utils';

// Static matchers for standard '.' separator used during normalization inside handleChange
const trailingCharMatcherWithPrefix = /\.([0-9]*0)*$/;
const trailingCharMatcher = /[0.]0*$/;

/**
 * The NumberField class has some special handling for dealing with trailing
 * decimal points and/or zeroes. This logic is designed to allow trailing values
 * to be visible in the input element, but not be represented in the
 * corresponding form data.
 *
 * The algorithm is as follows:
 *
 * 1. When the input value changes the value is cached in the component state
 *
 * 2. The value is then normalized, removing trailing decimal points and zeros,
 *    then passed to the "onChange" callback
 *
 * 3. When the component is rendered, the formData value is checked against the
 *    value cached in the state. If it matches the cached value, the cached
 *    value is passed to the input instead of the formData value
 */
function NumberField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: FieldProps<T, S, F>,
) {
  const { registry, onChange, formData, value: initialValue } = props;
  const [lastValue, setLastValue] = useState(initialValue);
  const { StringField } = registry.fields;

  const separator = getDecimalSeparator();

  let value = formData;

  /** Handle the change from the `StringField` to properly convert to a number
   *
   * @param value - The current value for the change occurring
   */
  const handleChange = useCallback(
    (newValue: FieldProps<T, S, F>['value'], path: FieldPath, errorSchema?: ErrorSchema<T>, id?: string) => {
      // Cache the original value in component state
      setLastValue(newValue);

      // Convert locale separator to standard '.' first
      const standardValue = typeof newValue === 'string' ? newValue.replace(separator, '.') : newValue;

      // Normalize decimals that don't start with a zero character, with or without a sign, in advance so
      // that the rest of the normalization logic is simpler
      const normalizedValue =
        typeof standardValue === 'string'
          ? standardValue.replace(/^([+-]?)\./, (_, sign) => `${sign}0.`)
          : standardValue;

      // Check that the value is a string (this can happen if the widget used is a
      // <select>, due to an enum declaration etc) then, if the value ends in a
      // trailing decimal point or multiple zeroes, strip the trailing values
      const processed =
        typeof normalizedValue === 'string' && trailingCharMatcherWithPrefix.exec(normalizedValue)
          ? asNumber(normalizedValue.replace(trailingCharMatcher, ''))
          : asNumber(normalizedValue);

      onChange(processed as unknown as T, path, errorSchema, id);
    },
    [onChange, separator],
  );

  if (typeof lastValue === 'string' && typeof value === 'number') {
    // Normalize the cached input to the standard '.' separator so a user-typed '.' is
    // recognized as a pending decimal point even in locales whose separator is different.
    const canonicalLastValue = lastValue.replace(separator, '.');

    // The cached text only stands in for the formData value when it spells the same number, sign included: a lone
    // '-' or a '-5' left over from typing must not mask a formData of 7 or 5 that was set from outside. `-0` is a
    // distinct value here because `String(-0)` is '0', so the sign is compared on its own.
    const lastSign = /^[+-]/.exec(canonicalLastValue)?.[0] ?? '';
    const unsignedLastValue = canonicalLastValue.slice(lastSign.length);
    const isNegative = value < 0 || Object.is(value, -0);

    // Construct a regular expression that checks for a string that consists
    // of the formData value's magnitude suffixed with zero or one '.' characters and zero
    // or more '0' characters. Escape the value first: its own '.' is a literal
    // character here, not the regex "any character" wildcard.
    const escapedValue = String(Math.abs(value)).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`^(${escapedValue})?\\.?0*$`);

    // If the cached "lastValue" is a match, use that instead of the formData
    // value to prevent the input value from changing in the UI
    if ((lastSign === '-') === isNegative && unsignedLastValue !== '' && re.test(unsignedLastValue)) {
      value = lastValue as unknown as T;
    }
  }

  // Format value to use the locale separator for rendering if it is a number
  let displayValue: T | undefined = value;
  if (typeof value === 'number' && separator !== '.') {
    const { schema, uiSchema } = props;
    const { schemaUtils, widgets } = registry;
    const { defaultWidget } = resolveDefaultWidget<T, S, F>(schema, uiSchema, schemaUtils, widgets);
    const { widget = defaultWidget, inputType } = getUiOptions(uiSchema);

    // Only the built-in text widget renders as a plain text input in this locale (see
    // getInputProps()), so it's the only one whose displayed value needs to match the
    // locale separator. Every other widget (custom, radio, select, hidden,
    // format-registered, ...) keeps receiving the numeric formData its contract promises.
    // An explicit `inputType: 'number'` takes priority over the locale detection inside
    // getInputProps(), which still ends up rendering a native, locale-unaware
    // `<input type="number">`; skip the comma formatting there. Every other inputType
    // (including the default 'text', and any other value like 'tel' or 'email') renders as a
    // plain text input that displays a locale-formatted string just fine.
    if (widget === 'text' && inputType !== 'number') {
      displayValue = String(value).replace('.', separator) as unknown as T;
    }
  }

  return <StringField {...props} formData={displayValue} onChange={handleChange} />;
}

export default NumberField;
