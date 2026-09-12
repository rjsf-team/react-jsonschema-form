const MISSING_SECONDS_REGEX = /(?:^|T)\d{2}:\d{2}$/;

/** Appends `:00` seconds to a bare time-of-day (`HH:MM`) or the time portion of a naive local date-time
 * string (`...THH:MM`) that is missing them, since RFC 3339 requires seconds for both the `time` and
 * `date-time` formats (independent of whether a timezone offset is present or required).
 *
 * @param value - A time or date-time string, with or without seconds
 * @returns - The value with `:00` appended if it was missing seconds, otherwise unchanged
 */
export default function padTimeSeconds(value: string) {
  return MISSING_SECONDS_REGEX.test(value) ? `${value}:00` : value;
}
