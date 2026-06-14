/** Determines whether a value represents an empty or non-numeric case that should not be
 * converted to a number. This includes empty strings, null values, and strings with
 * trailing decimal patterns that indicate the user is still typing.
 *
 * @param value - The string or null value to check
 * @returns - true if the value is empty, null, or has a trailing decimal pattern
 */
export function isEmptyOrNaN(value: string | null): boolean {
  if (value === '' || value === null) {
    return true;
  }
  // oxlint-disable-next-line typescript/prefer-string-starts-ends-with -- regex test() coerces undefined to "undefined" safely; endsWith() throws on undefined values passed at runtime
  if (/\.$/.test(value)) {
    // '3.' can't really be considered a number even if it parses in js. The
    // user is most likely entering a float.
    return true;
  }
  // oxlint-disable-next-line typescript/prefer-string-starts-ends-with -- same as above
  if (/\.0$/.test(value)) {
    // we need to return this as a string here, to allow for input like 3.07
    return true;
  }

  if (/\.\d*0$/.test(value)) {
    // It's a number, that's cool - but we need it as a string so it doesn't screw
    // with the user when entering dollar amounts or other values (such as those with
    // specific precision or number of significant digits)
    return true;
  }

  return false;
}

/** Attempts to convert the string into a number. If an empty string is provided, then `undefined` is returned. If a
 * `null` is provided, it is returned. If the string ends in a `.` then the string is returned because the user may be
 * in the middle of typing a float number. If a number ends in a pattern like `.0`, `.20`, `.030`, string is returned
 * because the user may be typing number that will end in a non-zero digit. Otherwise, the string is wrapped by
 * `Number()` and if that result is not `NaN`, that number will be returned, otherwise the string `value` will be.
 *
 * @param value - The string or null value to convert to a number
 * @returns - The `value` converted to a number when appropriate, otherwise the `value`
 */
export default function asNumber(value: string | null) {
  if (value === '') {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (isEmptyOrNaN(value)) {
    return value;
  }

  const n = Number(value);
  const valid = typeof n === 'number' && !Number.isNaN(n);

  return valid ? n : value;
}
