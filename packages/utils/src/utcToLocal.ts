import pad from './pad.ts';

/** Converts a UTC date string, an epoch number or a `Date` into a local Date format
 *
 * @param jsonDate - A UTC date string, an epoch number in milliseconds or a `Date`. Any other value is handed to the
 *        `Date` constructor, so an object whose `valueOf()` gives an epoch, such as a moment, dayjs or Luxon object or a
 *        `Date` from another realm, converts too
 * @returns - An empty string when `jsonDate` is `undefined`, `null`, a boolean, a bigint or a symbol, when it doesn't
 *        parse to a valid date, or when its local year is before 1. Otherwise a date string in local format
 */
export default function utcToLocal(jsonDate: unknown) {
  // `Date` reads `null` and `false` as the epoch and `true` as the millisecond after it, and throws for a bigint or a
  // symbol. Anything else names a date, parses to an invalid one, or throws in `ToPrimitive` as it did before, as an
  // `Object.create(null)` does
  if (
    jsonDate == null ||
    typeof jsonDate === 'boolean' ||
    typeof jsonDate === 'bigint' ||
    typeof jsonDate === 'symbol'
  ) {
    return '';
  }

  // required format of `'yyyy-MM-ddThh:mm' followed by optional ':ss' or ':ss.SSS'
  // https://html.spec.whatwg.org/multipage/input.html#local-date-and-time-state-(type%3Ddatetime-local)
  // > should be a _valid local date and time string_ (not GMT)
  // `Date` takes any value through `ToPrimitive`; its types only name the usual ones
  const date = new Date(jsonDate as string | number | Date);
  const yyyy = date.getFullYear();
  // An invalid date has a NaN year. A `datetime-local` input takes a year of four or more digits greater than 0, so a
  // year before 1 has no text it accepts, while a year past 9999 does
  if (Number.isNaN(yyyy) || yyyy < 1) {
    return '';
  }

  const MM = pad(date.getMonth() + 1, 2);
  const dd = pad(date.getDate(), 2);
  const hh = pad(date.getHours(), 2);
  const mm = pad(date.getMinutes(), 2);
  const ss = pad(date.getSeconds(), 2);
  const SSS = pad(date.getMilliseconds(), 3);

  return `${pad(yyyy, 4)}-${MM}-${dd}T${hh}:${mm}:${ss}.${SSS}`;
}
