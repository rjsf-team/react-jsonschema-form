import offsetTimeToLocalTime from './offsetTimeToLocalTime.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';
import utcToLocal from './utcToLocal.ts';

export interface DateTimeLocalValueResult {
  /** True when `schema.format` is `iso-date-time`, meaning a timezone offset is optional rather than required */
  isIsoDateTime: boolean;
  /** `value` with any timezone offset stripped when `isIsoDateTime`, otherwise unchanged; a finite epoch number or a
   * valid `Date` is converted to its UTC ISO string, or to local wall-clock time when `isIsoDateTime`; `undefined` for any other `value` */
  localValue: string | undefined;
}

/** Computes whether a date-time field's `schema.format` is `iso-date-time`, and the `value` to use for display
 * accordingly. When `isIsoDateTime`, a stored value that happens to carry a timezone offset (legal, since that
 * format's timezone is optional) is stripped, so it displays as the naive wall-clock time it represents instead
 * of being converted to another timezone by a date/time picker that parses the offset as real. To be used by
 * theme specific `DateTimeWidget` implementations.
 *
 * @param schema - The schema for the date-time field
 * @param value - The current value of the field
 * @returns - The `DateTimeLocalValueResult` to be used within a `DateTimeWidget` implementation
 */
export default function getDateTimeLocalValue<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  value: unknown,
): DateTimeLocalValueResult {
  const isIsoDateTime = schema.format === 'iso-date-time';
  let stringValue: string | undefined;
  if (typeof value === 'string') {
    stringValue = value;
  } else if (typeof value === 'number' || value instanceof Date) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      // An epoch or `Date` is an exact instant, so `iso-date-time` shows it at the reader's local wall-clock time
      const iso = date.toISOString();
      return {
        isIsoDateTime,
        localValue: isIsoDateTime ? utcToLocal(iso) : iso,
      };
    }
  }
  if (stringValue === undefined) {
    return { isIsoDateTime, localValue: undefined };
  }
  return {
    isIsoDateTime,
    localValue: isIsoDateTime ? offsetTimeToLocalTime(stringValue) : stringValue,
  };
}
