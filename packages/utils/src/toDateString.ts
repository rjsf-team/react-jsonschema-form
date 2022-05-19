import { DateObject } from './types';

export default function toDateString(
  { year, month, day, hour = 0, minute = 0, second = 0 }: DateObject,
  time = true
) {
  const utcTime = Date.UTC(year, month - 1, day, hour, minute, second);
  const datetime = new Date(utcTime).toJSON();
  return time ? datetime : datetime.slice(0, 10);
}
