import pad from './pad.ts';

/** Converts a UTC date string, an epoch number or a `Date` into a local Date format
 *
 * @param jsonDate - A UTC date string, an epoch number in milliseconds or a `Date`
 * @returns - An empty string when `jsonDate` is not a string, a number or a `Date`, when it isn't a valid date, or when
 *        its local year is outside 0-9999. Otherwise a date string in local format
 */
export default function utcToLocal(jsonDate: unknown) {
  if (typeof jsonDate !== 'string' && typeof jsonDate !== 'number' && !(jsonDate instanceof Date)) {
    return '';
  }

  // required format of `'yyyy-MM-ddThh:mm' followed by optional ':ss' or ':ss.SSS'
  // https://html.spec.whatwg.org/multipage/input.html#local-date-and-time-state-(type%3Ddatetime-local)
  // > should be a _valid local date and time string_ (not GMT)

  // Note - date constructor passed local ISO-8601 does not correctly
  // change time to UTC in node pre-8
  const date = new Date(jsonDate);
  const yyyy = date.getFullYear();
  // An invalid date has a NaN year, and years outside 0-9999 have no four-digit local text that a picker can parse
  if (Number.isNaN(yyyy) || yyyy < 0 || yyyy > 9999) {
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
