import type { DateObject } from './types.ts';

/** Available options for re-ordering date input element */
export type DateElementFormat = 'DMY' | 'MDY' | 'YMD';

/** Type describing format of DateElement prop */
export interface DateElementProp {
  type: string;
  range: [number, number];
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
  yearRange: [number, number] = [1900, new Date().getFullYear() + 2],
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
