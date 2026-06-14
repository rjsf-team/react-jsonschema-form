import { pad } from '../pad';
import type { EnumOptionsType, RJSFSchema, StrictRJSFSchema } from '../types';

/** Returns a list of options for a date range between `start` and `stop`. If the start date is greater than the end
 * date, then the date range is reversed. If `start` and `stop` are negative numbers (or zero), then they will be
 * treated as relative to the current year.
 *
 * @param start - The starting point of the date range
 * @param stop - The ending point of the date range
 * @returns - The list of EnumOptionsType for the date range between `start` and `stop`
 * @throws - Error when `start` and `stop` aren't both <= 0 or > 0
 */
export default function dateRangeOptions<S extends StrictRJSFSchema = RJSFSchema>(
  start: number,
  stop: number,
): EnumOptionsType<S>[] {
  const bothRelative = start <= 0 && stop <= 0;
  const eitherNegative = start < 0 || stop < 0;
  if (!bothRelative && eitherNegative) {
    throw new Error(`Both start (${start}) and stop (${stop}) must both be <= 0 or > 0, got one of each`);
  }
  const currentYear = new Date().getFullYear();
  const resolvedStart = bothRelative ? currentYear + start : start;
  const resolvedStop = bothRelative ? currentYear + stop : stop;
  if (resolvedStart > resolvedStop) {
    return dateRangeOptions<S>(stop, start).reverse();
  }
  const options: EnumOptionsType<S>[] = [];
  for (let i = resolvedStart; i <= resolvedStop; i += 1) {
    options.push({ value: i, label: pad(i, 2) });
  }
  return options;
}
