import { useState, useCallback } from 'react';
import type {
  ErrorSchema,
  FieldPathList,
  FieldProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { asNumber, getDecimalSeparator, getUiOptions, optionsList } from '@rjsf/utils';

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
  const escapedSeparator = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  let value = formData;

  /** Handle the change from the `StringField` to properly convert to a number
   *
   * @param value - The current value for the change occurring
   */
  const handleChange = useCallback(
    (newValue: FieldProps<T, S, F>['value'], path: FieldPathList, errorSchema?: ErrorSchema<T>, id?: string) => {
      // Cache the original value in component state
      setLastValue(newValue);

      // Convert locale separator to standard '.' first
      const standardValue = typeof newValue === 'string' ? newValue.replace(separator, '.') : newValue;

      // Normalize decimals that don't start with a zero character in advance so
      // that the rest of the normalization logic is simpler
      const normalizedValue = `${standardValue}`.startsWith('.') ? `0${standardValue}` : standardValue;

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
    // Construct a regular expression that checks for a string that consists
    // of the formData value suffixed with zero or one locale separator characters and zero
    // or more '0' characters
    const re = new RegExp(`^(${String(value).replace('.', escapedSeparator)})?${escapedSeparator}?0*$`);

    // If the cached "lastValue" is a match, use that instead of the formData
    // value to prevent the input value from changing in the UI
    if (lastValue.match(re)) {
      value = lastValue as unknown as T;
    }
  }

  // Format value to use the locale separator for rendering if it is a number
  let displayValue: T | undefined = value;
  if (typeof value === 'number' && separator !== '.') {
    const { schema, uiSchema } = props;
    const { schemaUtils } = registry;
    const enumOptions = schemaUtils.isSelect(schema) ? optionsList(schema, uiSchema) : undefined;
    const defaultWidget = enumOptions ? 'select' : 'text';
    const { widget = defaultWidget } = getUiOptions(uiSchema);

    if (widget !== 'radio' && widget !== 'select' && widget !== 'hidden') {
      displayValue = String(value).replace('.', separator) as unknown as T;
    }
  }

  return <StringField {...props} formData={displayValue} onChange={handleChange} />;
}

export default NumberField;
