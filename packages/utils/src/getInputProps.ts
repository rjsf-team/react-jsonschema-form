import getDecimalSeparator from './getDecimalSeparator.ts';
import rangeSpec from './rangeSpec.ts';
import type { FormContextType, InputPropsType, RJSFSchema, StrictRJSFSchema, UIOptionsType } from './types.ts';

// `String(value)` renders very small and very large numbers with an exponent (`1e-7`, `1e+21`), so a `pattern` that
// rejected one would block submitting a valid value. The `-` is escaped because browsers compile a `pattern` with the
// `v` flag, which rejects a bare `-` inside a character class (and then ignores the whole pattern).
const EXPONENT_PATTERN = '([eE][+\\-]?[0-9]+)?';

/** Builds the `pattern` for a `number`/`integer` field rendered as a text input. A `number` accepts the current locale's
 * decimal separator and also '.': `NumberField` only localizes the value it shows for the built-in text widget, so any
 * other widget rendering through `BaseInputTemplate` is handed, and displays, a '.'-formatted value.
 *
 * @param isInteger - True when the field is an `integer`, so no decimal separator is accepted
 * @param allowNegative - True when a leading minus sign is accepted
 * @returns - The `pattern` string
 */
function getNumericPattern(isInteger: boolean, allowNegative: boolean) {
  const sign = allowNegative ? '-?' : '';
  if (isInteger) {
    return `${sign}[0-9]*${EXPONENT_PATTERN}`;
  }
  const separator = getDecimalSeparator();
  const separators = separator === '.' ? '.' : `.${separator}`;
  return `${sign}[0-9]*[${separators}]?[0-9]*${EXPONENT_PATTERN}`;
}

/** Using the `schema`, `defaultType` and `options`, extract out the props for the <input> element that make sense.
 *
 * @param schema - The schema for the field provided by the widget
 * @param [defaultType] - The default type, if any, for the field provided by the widget
 * @param [options={}] - The UI Options for the field provided by the widget
 * @param [autoDefaultStepAny=true] - Determines whether a number or integer field with no `defaultType` is rendered as a
 *   text input with a numeric `inputMode` and `pattern`; pass false for a theme with its own numeric widget
 * @returns - The extracted `InputPropsType` object
 */
export default function getInputProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(
  schema: RJSFSchema,
  defaultType?: string,
  options: UIOptionsType<T, S, F> = {},
  autoDefaultStepAny = true,
): InputPropsType {
  const inputProps: InputPropsType = {
    type: defaultType || 'text',
    ...rangeSpec(schema),
  };

  // If options.inputType is set use that as the input type
  if (options.inputType) {
    inputProps.type = options.inputType;
  } else if (!defaultType && (schema.type === 'number' || schema.type === 'integer')) {
    if (autoDefaultStepAny) {
      // A native <input type="number"> is inconsistently keyboard-filtered across browsers, silently
      // discards typed values it can't parse, and never accepts a non-'.' locale decimal separator. A text
      // input with a numeric `inputMode` gets the same numeric keyboard on mobile without those problems,
      // and a `pattern` still lets the browser's native constraint validation reject a non-numeric value
      // the same way it already does for `required`: https://github.com/rjsf-team/react-jsonschema-form/issues/4038
      const isInteger = schema.type === 'integer';
      const allowNegative = !(typeof inputProps.min === 'number' && inputProps.min >= 0);
      inputProps.type = 'text';
      inputProps.inputMode = isInteger ? 'numeric' : 'decimal';
      inputProps.pattern = getNumericPattern(isInteger, allowNegative);
      // `step`, `min` and `max` only constrain a native number input: browsers ignore them on a text input and HTML
      // validators flag them, so leave them off. The schema's own `multipleOf`, `minimum` and `maximum` are still
      // enforced by validation.
      delete inputProps.step;
      delete inputProps.min;
      delete inputProps.max;
    } else if (schema.type === 'integer') {
      // Themes with their own numeric widget (indicated by `autoDefaultStepAny=false`) don't render a
      // native number input in the first place, so they keep the semantic type as-is.
      inputProps.type = 'number';
      // Only add step if one isn't already defined
      if (inputProps.step === undefined) {
        // Since this is integer, you always want to step up or down in multiples of 1
        inputProps.step = 1;
      }
    } else {
      // Native number inputs reject a locale decimal separator other than '.' and can discard it
      // while typing, so fall back to a text input in locales that use one.
      inputProps.type = getDecimalSeparator() === '.' ? 'number' : 'text';
    }
  }

  // For date/time input types, propagate formatMinimum/formatMaximum to min/max
  if (['date', 'datetime-local', 'time', 'week', 'month'].includes(inputProps.type)) {
    if (schema.formatMinimum !== undefined) {
      inputProps.min = schema.formatMinimum as string;
    }
    if (schema.formatMaximum !== undefined) {
      inputProps.max = schema.formatMaximum as string;
    }
  }

  if (options.autocomplete) {
    inputProps.autoComplete = options.autocomplete;
  }

  if (options.autocapitalize) {
    inputProps.autoCapitalize = options.autocapitalize;
  }

  if (options.accept) {
    inputProps.accept = options.accept as string;
  }

  return inputProps;
}
