import pad from './pad.ts';

/** Converts a UTC date string, an epoch number or a `Date` into a local Date format
 *
 * @param jsonDate - A UTC date string, an epoch number in milliseconds or a `Date`. Any other value is handed to the
 *        `Date` constructor, so an object whose `valueOf()` gives an epoch, such as a moment, dayjs or Luxon object or
 *        a `Date` from another realm, converts too. A string goes through `Date`'s string parsing, so an epoch written
 *        as text, such as `'0'`, isn't read as an epoch; what text outside the ISO format means is up to the engine,
 *        and V8 reads `'0'` as the year 2000
 * @returns - An empty string when `jsonDate` is `undefined`, `null`, a boolean or a `Boolean` object, when `Date`
 *        can't convert it (a bigint, a symbol or an object with no primitive value), when it doesn't parse to a valid
 *        date, or when its local year is before 1. Otherwise a date string in local format
 */
export default function utcToLocal(jsonDate: unknown) {
  // `Date` reads `null` and `false` as the epoch, `true` as the millisecond after it and a `Boolean` object, from any
  // realm, as the boolean it wraps, so they have to mean no value here. Anything else names a date, parses to an
  // invalid one, or throws in `ToPrimitive`
  if (jsonDate == null || typeof jsonDate === 'boolean') {
    return '';
  }
  // Only an object can be a `Boolean` object. The probe throws for anything else, so the strings and `Date`s a render
  // passes skip it rather than raising an exception each time
  if (typeof jsonDate === 'object' && !(jsonDate instanceof Date)) {
    try {
      // Throws for anything but a `Boolean` object, from any realm. Unlike `Object.prototype.toString` it reads no
      // property, so a `Symbol.toStringTag` can neither fake a `Boolean` nor throw
      Boolean.prototype.valueOf.call(jsonDate);
      return '';
    } catch {
      // Not a `Boolean` object
    }
  }

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

  // required format of `'yyyy-MM-ddThh:mm' followed by optional ':ss' or ':ss.SSS'
  // https://html.spec.whatwg.org/multipage/input.html#local-date-and-time-state-(type%3Ddatetime-local)
  // > should be a _valid local date and time string_ (not GMT)
  const MM = pad(date.getMonth() + 1, 2);
  const dd = pad(date.getDate(), 2);
  const hh = pad(date.getHours(), 2);
  const mm = pad(date.getMinutes(), 2);
  const ss = pad(date.getSeconds(), 2);
  const SSS = pad(date.getMilliseconds(), 3);

  return `${pad(yyyy, 4)}-${MM}-${dd}T${hh}:${mm}:${ss}.${SSS}`;
}
