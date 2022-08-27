import { DateObject } from './types';

/** Parses the `dateString` into a `DateObject`, including the time information when `includeTime` is true
 *
 * @param dateString - The date string to parse into a DateObject
 * @param [includeTime=true] - Optional flag, if false, will not include the time data into the object
 * @returns - The date string converted to a `DateObject`
 * @throws - Error when the date cannot be parsed from the string
 */
export default function parseDateString(dateString?: string, includeTime = true): DateObject {
  if (!dateString) {
    return {
      year: -1,
      month: -1,
      day: -1,
      hour: includeTime ? -1 : 0,
      minute: includeTime ? -1 : 0,
      second: includeTime ? -1 : 0,
    };
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Unable to parse date ' + dateString);
  }
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1, // oh you, javascript.
    day: date.getUTCDate(),
    hour: includeTime ? date.getUTCHours() : 0,
    minute: includeTime ? date.getUTCMinutes() : 0,
    second: includeTime ? date.getUTCSeconds() : 0,
  };
}
