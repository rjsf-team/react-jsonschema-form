import pad from './pad.ts';

/** Converts a UTC date string, an epoch number or a `Date` into a local Date format
 *
 * @param jsonDate - A UTC date string, an epoch number in milliseconds or a `Date`. Any other value is handed to the
 *        `Date` constructor, so an object whose `valueOf()` gives an epoch, such as a moment, dayjs or Luxon object or a
 *        `Date` from another realm, converts too
 * @returns - An empty string when `jsonDate` is `undefined`, `null` or a boolean, when `Date` can't convert it (a
 *        bigint, a symbol or an object with no primitive value), when it doesn't parse to a valid date, or when its
 *        local year is before 1. Otherwise a date string in local format
 */
export default function utcToLocal(jsonDate: unknown) {
  // `Date` reads `null` and `false` as the epoch and `true` as the millisecond after it, so they have to mean no value
  // here. Anything else names a date, parses to an invalid one, or throws in `ToPrimitive`
  if (jsonDate == null || typeof jsonDate === 'boolean') {
    return '';
  }

  // required format of `'yyyy-MM-ddThh:mm' followed by optional ':ss' or ':ss.SSS'
  // https://html.spec.whatwg.org/multipage/input.html#local-date-and-time-state-(type%3Ddatetime-local)
  // > should be a _valid local date and time string_ (not GMT)
  let date: Date;
  try {
    // `Date` takes any value through `ToPrimitive`; its types only name the usual ones. It throws for a bigint or a
    // symbol, wrapped or not, and for an object with no primitive value, such as an `Object.create(null)`
    date = new Date(jsonDate as string | number | Date);
  } catch {
    return '';
  }
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
