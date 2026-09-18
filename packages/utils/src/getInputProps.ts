import getDecimalSeparator from './getDecimalSeparator.ts';
import rangeSpec from './rangeSpec.ts';
import type { FormContextType, InputPropsType, RJSFSchema, StrictRJSFSchema, UIOptionsType } from './types.ts';

/** Using the `schema`, `defaultType` and `options`, extract out the props for the <input> element that make sense.
 *
 * @param schema - The schema for the field provided by the widget
 * @param [defaultType] - The default type, if any, for the field provided by the widget
 * @param [options={}] - The UI Options for the field provided by the widget
 * @param [autoDefaultStepAny=true] - Determines whether to auto-default step=any when the type is number and no step
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
  } else if (!defaultType) {
    // If the schema is of type number or integer, set the input type to number
    if (schema.type === 'number') {
      // Native number inputs reject a locale decimal separator other than '.' and can discard it
      // while typing, so fall back to a text input in locales that use one.
      if (getDecimalSeparator() === '.') {
        inputProps.type = 'number';
        // Only add step if one isn't already defined and we are auto-defaulting the "any" step
        if (autoDefaultStepAny && inputProps.step === undefined) {
          // Setting step to 'any' fixes a bug in Safari where decimals are not
          // allowed in number inputs
          inputProps.step = 'any';
        }
      } else {
        inputProps.type = 'text';
      }
    } else if (schema.type === 'integer') {
      inputProps.type = 'number';
      // Only add step if one isn't already defined
      if (inputProps.step === undefined) {
        // Since this is integer, you always want to step up or down in multiples of 1
        inputProps.step = 1;
      }
    }

    // A native <input type="number"> is inconsistently keyboard-filtered across browsers, silently
    // discards typed values it can't parse, and never accepts a non-'.' locale decimal separator. A text
    // input with a numeric `inputMode` gets the same numeric keyboard on mobile without those problems,
    // and a `pattern` still lets the browser's native constraint validation reject a non-numeric value
    // the same way it already does for `required`: https://github.com/rjsf-team/react-jsonschema-form/issues/4038
    // Themes with their own numeric widget (indicated by `autoDefaultStepAny=false`) don't render a
    // native number input in the first place, so they keep the semantic type as-is.
    if (autoDefaultStepAny && (schema.type === 'number' || schema.type === 'integer')) {
      const allowNegative = !(typeof inputProps.min === 'number' && inputProps.min >= 0);
      const sign = allowNegative ? '-?' : '';
      inputProps.type = 'text';
      inputProps.inputMode = schema.type === 'integer' ? 'numeric' : 'decimal';
      // Only digits, and only the current locale's decimal separator for a `number`: a native
      // `<input type="number">` never accepted any other separator either.
      inputProps.pattern =
        schema.type === 'integer' ? `${sign}[0-9]*` : `${sign}[0-9]*[${getDecimalSeparator()}]?[0-9]*`;
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
