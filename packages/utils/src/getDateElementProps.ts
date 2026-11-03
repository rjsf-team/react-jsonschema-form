import toNumericValue from './toNumericValue.ts';
import type { DateObject } from './types.ts';

/** The widest `yearsRange` read. A year select offers one option per year, built during render, so a span such as
 * `[1, 1e9]` would hang the page; no date picker needs to offer more than a thousand years
 */
const MAX_YEARS_SPAN = 1000;

/** Available options for re-ordering date input element */
export type DateElementFormat = 'DMY' | 'MDY' | 'YMD';

/** Whether `value` is a `DateElementFormat`, as the `format` option an `AltDateWidget` reads, which another widget can
 * read as a format of its own, such as a color's
 *
 * @param value - The value of the `format` option
 * @returns - Whether `value` orders the date elements
 */
export function isDateElementFormat(value: unknown): value is DateElementFormat {
  return value === 'DMY' || value === 'MDY' || value === 'YMD';
}

/** The `[first, last]` years for a `yearsRange` option, which a JSON uiSchema can hold as anything. A year held as a
 * numeric string counts as its number, and a fractional year is rounded down. A range that isn't a list of two years,
 * that mixes a relative and an absolute year, which `dateRangeOptions()` throws for, or that spans more than a
 * thousand years gives `undefined`, for the default years
 *
 * @param yearsRange - The `yearsRange` option
 * @returns - The range to pass `getDateElementProps()`, or `undefined` for the default years
 */
export function normalizeYearsRange(yearsRange: unknown): [number, number] | undefined {
  const [first, last]: unknown[] = Array.isArray(yearsRange) ? yearsRange.map(toNumericValue) : [];
  if (typeof first !== 'number' || typeof last !== 'number') {
    return undefined;
  }
  const firstYear = Math.floor(first);
  const lastYear = Math.floor(last);
  if (Math.sign(firstYear) * Math.sign(lastYear) < 0 || Math.abs(lastYear - firstYear) > MAX_YEARS_SPAN) {
    return undefined;
  }
  return [firstYear, lastYear];
}

/** Type describing format of DateElement prop */
export interface DateElementProp {
  type: string;
  range: readonly [number, number];
  value: number | undefined;
}

/** The value of a date element for a part of a `DateObject`, which holds `-1` for a part no one has picked yet. That is
 * no option, so it is given as `undefined`
 *
 * @param part - The part of the `DateObject`
 * @returns - The `part`, or `undefined` where it is unset
 */
export function elementValue(part?: number) {
  return part === undefined || part < 0 ? undefined : part;
}

/** Given date & time information with optional yearRange & format, returns props for DateElement, an unset part of the
 * `date` given an `undefined` value
 *
 * @param date - Object containing date with optional time information
 * @param time - Determines whether to include time or not
 * @param [yearRange=[1900, new Date().getFullYear() + 2]] - Controls the list of years to be displayed
 * @param [format='YMD'] - Controls the order in which day, month and year input element will be displayed
 * @returns Array of props for DateElement
 */

export default function getDateElementProps(
  date: DateObject,
  time: boolean,
  yearRange: readonly [number, number] = [1900, new Date().getFullYear() + 2],
  format: DateElementFormat = 'YMD',
) {
  const { day, month, year, hour, minute, second } = date;

  const dayObj: DateElementProp = { type: 'day', range: [1, 31], value: elementValue(day) };
  const monthObj: DateElementProp = { type: 'month', range: [1, 12], value: elementValue(month) };
  const yearObj: DateElementProp = { type: 'year', range: yearRange, value: elementValue(year) };

  const dateElementProp: DateElementProp[] = [];
  switch (format) {
    case 'MDY':
      dateElementProp.push(monthObj, dayObj, yearObj);
      break;
    case 'DMY':
      dateElementProp.push(dayObj, monthObj, yearObj);
      break;
    case 'YMD':
    default:
      dateElementProp.push(yearObj, monthObj, dayObj);
  }

  if (time) {
    dateElementProp.push(
      { type: 'hour', range: [0, 23], value: elementValue(hour) },
      { type: 'minute', range: [0, 59], value: elementValue(minute) },
      { type: 'second', range: [0, 59], value: elementValue(second) },
    );
  }

  return dateElementProp;
}
