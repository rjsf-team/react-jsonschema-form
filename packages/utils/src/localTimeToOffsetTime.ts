import pad from './pad.ts';

/** Appends the browser's current local UTC offset to a bare `time` string (`HH:MM` or `HH:MM:SS`), producing
 * a `time` compliant with the JSON Schema `time` format (RFC 3339 `full-time`), which requires a timezone.
 * The wall-clock value itself is left untouched; only the offset annotation is added.
 *
 * @param time - A time string without a timezone offset
 * @returns - The `time` string suffixed with `Z` (UTC) or a `+HH:MM`/`-HH:MM` offset
 */
export default function localTimeToOffsetTime(time: string) {
  // getTimezoneOffset() returns minutes to ADD to local time to reach UTC, the inverse of the sign convention
  // used in a timestamp (e.g. Eastern time, UTC-5, returns +300); negate it to get the conventional offset.
  const offsetMinutes = -new Date().getTimezoneOffset();
  if (offsetMinutes === 0) {
    return `${time}Z`;
  }
  const sign = offsetMinutes > 0 ? '+' : '-';
  const absMinutes = Math.abs(offsetMinutes);
  const hours = pad(Math.floor(absMinutes / 60), 2);
  const minutes = pad(absMinutes % 60, 2);
  return `${time}${sign}${hours}:${minutes}`;
}
