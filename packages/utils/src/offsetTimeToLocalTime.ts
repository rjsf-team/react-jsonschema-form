// The minutes group is optional to match ajv-formats' own offset grammar (`[+-]\d\d(?::?\d\d)?`), which
// accepts an hour-only offset like `+05` with no minutes. The captured prefix keeps it off the `-DD` a bare day ends
// in; a capture rather than a lookbehind, which Safari before 16.4 can't parse, failing the whole module.
const TIME_OFFSET_REGEX = /(:\d{2}(?:\.\d+)?|\d{4}-\d{2}-\d{2})(?:Z|[+-]\d{2}(?::?\d{2})?)$/i;

/** Strips a trailing timezone offset (`Z` or `+HH:MM`/`+HH`/`-HH:MM`/`-HH`) from a `time` string, returning the
 * bare `HH:MM:SS` portion suitable for a native `<input type="time">`, which does not understand offsets. An offset
 * is only stripped after a time or a full `YYYY-MM-DD` day, so a bare day is returned unchanged.
 *
 * @param time - A time string, optionally suffixed with a timezone offset
 * @returns - The `time` string with any trailing offset removed
 */
export default function offsetTimeToLocalTime(time: string) {
  return time.replace(TIME_OFFSET_REGEX, '$1');
}
