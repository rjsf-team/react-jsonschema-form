import offsetTimeToLocalTime from './offsetTimeToLocalTime.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';
import utcToLocal from './utcToLocal.ts';

export interface DateTimeLocalValueResult {
  /** True when `schema.format` is `iso-date-time`, meaning a timezone offset is optional rather than required */
  isIsoDateTime: boolean;
  /** True when `schema.format` is `date-time` or `datetime`, meaning the stored value must carry a timezone offset */
  requiresOffset: boolean;
  /** `value` with any timezone offset stripped when `isIsoDateTime`, otherwise unchanged. A finite epoch number or a
   * valid `Date` is converted to its UTC ISO string for `date-time`/`datetime`, to the UTC day it names for `date` when
   * it is a UTC midnight, and to local wall-clock time otherwise (`undefined` when that falls outside the years
   * 0-9999). `undefined` for any other `value` */
  localValue: string | undefined;
}

/** Computes whether a date-time field's `schema.format` is `iso-date-time`, and the `value` to use for display
 * accordingly. When `isIsoDateTime`, a stored value that happens to carry a timezone offset (legal, since that
 * format's timezone is optional) is stripped, so it displays as the naive wall-clock time it represents instead
 * of being converted to another timezone by a date/time picker that parses the offset as real. To be used by
 * theme specific `DateTimeWidget` implementations.
 *
 * A finite epoch number or a valid `Date` is an exact instant. It is converted to its UTC ISO string when
 * `schema.format` requires an offset (`date-time`/`datetime`), to the day it names when `schema.format` is `date` and
 * the instant is a UTC midnight, and to local wall-clock time for any other format. A local year outside 0-9999 has no
 * text a picker can parse, so it gives `undefined`.
 *
 * @param schema - The schema for the date-time field
 * @param value - The current value of the field
 * @returns - The `DateTimeLocalValueResult` to be used within a `DateTimeWidget` implementation
 */
export default function getDateTimeLocalValue<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  value: unknown,
): DateTimeLocalValueResult {
  const { format } = schema;
  const isIsoDateTime = format === 'iso-date-time';
  const requiresOffset = format === 'date-time' || format === 'datetime';
  let localValue: string | undefined;
  if (typeof value === 'string') {
    localValue = isIsoDateTime ? offsetTimeToLocalTime(value) : value;
  } else if (typeof value === 'number' || value instanceof Date) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      // An epoch or `Date` is an exact instant; only formats that require an offset keep the UTC ISO string
      const iso = date.toISOString();
      if (requiresOffset) {
        localValue = iso;
      } else if (format === 'date' && iso.endsWith('T00:00:00.000Z')) {
        // A day stored as a `Date` or epoch is its UTC midnight, which names that day rather than the evening before it
        localValue = /^\d{4}-/.test(iso) ? iso.slice(0, 10) : undefined;
      } else {
        // `utcToLocal()` gives '' for a local year outside 0-9999, which has no text a picker can parse
        localValue = utcToLocal(date) || undefined;
      }
    }
  }
  return { isIsoDateTime, requiresOffset, localValue };
}
