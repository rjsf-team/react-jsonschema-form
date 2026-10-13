/** Converts a local Date string into a UTC date string
 *
 * @param dateString - The string representation of a date as accepted by the `Date()` constructor, or a
 *        `datetime-local` value whose year has five or six digits. The input writes such a year as plain digits,
 *        `10000-07-01T00:01`, which `Date` reads only in the signed six-digit form, so it is expanded to
 *        `+010000-07-01T00:01` before parsing; any other text goes to `Date` as written
 * @returns - A UTC date string if `dateString` is truthy and names a valid date; `undefined` for an empty value, and
 *        `null` for a value `Date` can't read, as `toJSON()` gives for an invalid date. Years 1-9999 are the supported
 *        range, as in `getDateTimeLocalValue()`; a five or six digit year is read all the same, up to the last instant
 *        `Date` holds, 275760-09-13T00:00Z, so the string it gives keeps that year and fails `date-time` validation
 *        instead of `null` wiping the value
 */
export default function localToUTC(dateString: unknown): string | null | undefined {
  if (!dateString) {
    return undefined;
  }
  // `Date` reads a year of more than four digits only as `+YYYYYY`, six digits behind a sign; a value that
  // isn't a string goes to `Date` as it is
  const expanded =
    typeof dateString === 'string'
      ? dateString.replace(/^\d{5,6}(?=-\d{2}-\d{2}T)/, (year) => `+${year.padStart(6, '0')}`)
      : (dateString as number | Date);
  return new Date(expanded).toJSON();
}
