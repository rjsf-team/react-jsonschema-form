import getDecimalSeparator from './getDecimalSeparator.ts';
import getSchemaType from './getSchemaType.ts';
import rangeSpec from './rangeSpec.ts';
import type { FormContextType, InputPropsType, RJSFSchema, StrictRJSFSchema, UIOptionsType } from './types.ts';

// `String(value)` renders very small and very large numbers with an exponent (`1e-7`, `1e+21`), so a `pattern` that
// rejected one would block submitting a valid value. An integer is only ever rendered that way from `1e21` up and
// always with a `+`, so accepting a negative exponent there would let `1e-7` through while `0.0000001` is refused. The
// `-` is escaped because browsers compile a `pattern` with the `v` flag, which rejects a bare `-` inside a character
// class (and then ignores the whole pattern).
const EXPONENT_PATTERN = '([eE][+\\-]?[0-9]+)?';
const INTEGER_EXPONENT_PATTERN = '[eE]\\+?[0-9]+';
const SIGN_PATTERN = '[+\\-]?';
// Every character the `v` flag reserves inside a character class, which the locale separator is interpolated into
const RESERVED_IN_CHARACTER_CLASS = /[()[\]{}/\\|-]/g;

/** Builds the `pattern` for a `number`/`integer` field rendered as a text input. It only describes the format of a
 * number: the sign is always allowed so that a value the schema's `minimum` rules out is reported by validation rather
 * than blocked by the browser. A `number` accepts the current locale's decimal separator and also '.': `NumberField`
 * only localizes the value it shows for the built-in text widget, so any other widget rendering through
 * `BaseInputTemplate` is handed, and displays, a '.'-formatted value.
 *
 * @param isInteger - True when the field is an `integer`, so a decimal separator is accepted only in the mantissa of
 *   the exponent form that `String()` renders a large one with
 * @returns - The `pattern` string
 */
function getNumericPattern(isInteger: boolean) {
  const separator = getDecimalSeparator();
  const separators = separator === '.' ? '.' : `.${separator.replace(RESERVED_IN_CHARACTER_CLASS, '\\$&')}`;
  // `NumberField` reports a lone separator as 0 and goes on showing it, so the pattern has to accept that spelling or
  // a field holding a schema-valid 0 can't be submitted while the same 0 typed as '.00' can. A lone sign is a
  // different case and stays rejected: `asNumber()` leaves it in `formData` as a string, which is no number at all
  if (isInteger) {
    // A separator followed by nothing but zeros still spells a whole number, and `NumberField` keeps showing that
    // while it is typed, so '5.', '5.0' and '5.00' are accepted where '5.5' is not. An integer large enough to be
    // rendered with an exponent can also carry a fractional mantissa (`String(2 ** 70)` is '1.1805916207174113e+21')
    return `${SIGN_PATTERN}([0-9]+[${separators}][0-9]+${INTEGER_EXPONENT_PATTERN}|[0-9]+(${INTEGER_EXPONENT_PATTERN}|[${separators}]0*)?|[${separators}])`;
  }
  return `${SIGN_PATTERN}(([0-9]+[${separators}]?[0-9]*|[${separators}][0-9]+)${EXPONENT_PATTERN}|[${separators}])`;
}

/** Using the `schema`, `defaultType` and `options`, extract out the props for the <input> element that make sense.
 *
 * @param schema - The schema for the field provided by the widget
 * @param [defaultType] - The default type, if any, for the field provided by the widget
 * @param [options={}] - The UI Options for the field provided by the widget
 * @param [plainNativeInput=true] - Whether the theme renders a plain native `<input>`. When true, a number or integer
 *   field with no `defaultType` is rendered as a text input with a numeric `inputMode` and `pattern`, and a `number`
 *   field that resolves to a native `number` input (via `inputType` or a `defaultType` of `number`) gets `step="any"`;
 *   pass false for a theme with its own numeric widget
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
  plainNativeInput = true,
): InputPropsType {
  // Resolved rather than read off `schema.type` so that a nullable schema, which `SchemaField` renders through
  // `NumberField` just like a plain one, is treated as the number or integer it is. A union of more than one non-null
  // type resolves to its first entry, which says nothing about what the others accept, so it keeps the plain text
  // input it had before
  const schemaType = getSchemaType(schema);
  const nonNullTypes = Array.isArray(schema.type) ? schema.type.filter((type) => type !== 'null') : undefined;
  const isSingleOrNullableType = !nonNullTypes || nonNullTypes.length === 1;
  const isNumericSchema = isSingleOrNullableType && (schemaType === 'number' || schemaType === 'integer');
  const isNumericText = !options.inputType && !defaultType && plainNativeInput && isNumericSchema;

  const inputProps: InputPropsType = {
    type: defaultType || 'text',
    // `step`, `min` and `max` only constrain a native number input: browsers ignore them on the text input below and
    // HTML validators flag them. The schema's own `multipleOf`, `minimum` and `maximum` are still enforced by validation
    ...(isNumericText ? undefined : rangeSpec(schema)),
  };

  // If options.inputType is set use that as the input type
  if (options.inputType) {
    inputProps.type = options.inputType;
  } else if (isNumericText) {
    // A native <input type="number"> is inconsistently keyboard-filtered across browsers, silently
    // discards typed values it can't parse, and never accepts a non-'.' locale decimal separator. A text
    // input with a numeric `inputMode` gets the same numeric keyboard on mobile without those problems,
    // and a `pattern` still lets the browser's native constraint validation reject a non-numeric value
    // the same way it already does for `required`: https://github.com/rjsf-team/react-jsonschema-form/issues/4038
    const isInteger = schemaType === 'integer';
    inputProps.type = 'text';
    inputProps.inputMode = isInteger ? 'numeric' : 'decimal';
    inputProps.pattern = getNumericPattern(isInteger);
  } else if (!defaultType && isNumericSchema && typeof schema.type === 'string') {
    // Only a theme with its own numeric widget (`plainNativeInput=false`) reaches this branch: it renders no native
    // number input and so keeps the semantic type as-is, picking that widget by the `type` returned here. A type that
    // `getSchemaType()` resolved rather than read verbatim, out of an array or inferred from a numeric `const`, would
    // route a field to that widget which used to get a text input, and that is a change for those themes to make on
    // their own terms, so they go on reading `schema.type` exactly as they did before
    if (schemaType === 'integer') {
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

  // Without a `step`, a native number input treats a decimal as a step mismatch and blocks submit. Checking the resolved
  // type covers every way of getting one: `ui:options.inputType`, a widget's `defaultType` (`updown`), or the fallback
  if (plainNativeInput && inputProps.type === 'number' && schemaType === 'number' && inputProps.step === undefined) {
    inputProps.step = 'any';
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
