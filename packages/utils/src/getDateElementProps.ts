import { type DateObject } from './types';

type DateElementProp = {
  type: string;
  range: [number, number];
  value: number | undefined;
};

export default function getDateElementProps(
  date: DateObject,
  time: boolean,
  yearRange: [number, number] = [1900, new Date().getFullYear() + 2],
  format: 'DMY' | 'MDY' | 'YMD' = 'YMD'
) {
  const { day, month, year, hour, minute, second } = date;

  const dayObj: DateElementProp = { type: 'day', range: [1, 31], value: day };
  const monthObj: DateElementProp = { type: 'month', range: [1, 12], value: month };
  const yearObj: DateElementProp = { type: 'year', range: yearRange, value: year };

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
      { type: 'hour', range: [0, 23], value: hour },
      { type: 'minute', range: [0, 59], value: minute },
      { type: 'second', range: [0, 59], value: second }
    );
  }

  return dateElementProp;
}
