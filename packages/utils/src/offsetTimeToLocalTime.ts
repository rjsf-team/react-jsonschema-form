// The minutes group is optional to match ajv-formats' own offset grammar (`[+-]\d\d(?::?\d\d)?`), which
// accepts an hour-only offset like `+05` with no minutes.
const TIME_OFFSET_REGEX = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i;

/** Strips a trailing timezone offset (`Z` or `+HH:MM`/`+HH`/`-HH:MM`/`-HH`) from a `time` string, returning the
 * bare `HH:MM:SS` portion suitable for a native `<input type="time">`, which does not understand offsets.
 *
 * @param time - A time string, optionally suffixed with a timezone offset
 * @returns - The `time` string with any trailing offset removed
 */
export default function offsetTimeToLocalTime(time: string) {
  return time.replace(TIME_OFFSET_REGEX, '');
}
