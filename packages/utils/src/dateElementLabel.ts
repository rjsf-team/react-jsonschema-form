import { TranslatableString } from './enums.ts';
import type { Registry } from './types.ts';

/** The `TranslatableString` naming each type of date element an `AltDateWidget` renders, keyed by the `type` of its
 * `DateElementProp`
 */
export const DATE_ELEMENT_LABELS: Readonly<Record<string, TranslatableString>> = {
  year: TranslatableString.YearLabel,
  month: TranslatableString.MonthLabel,
  day: TranslatableString.DayLabel,
  hour: TranslatableString.HourLabel,
  minute: TranslatableString.MinuteLabel,
  second: TranslatableString.SecondLabel,
};

/** Return the translated name of a date element, such as `year`, falling back to the `type` itself for a type that
 * `DATE_ELEMENT_LABELS` has no string for
 *
 * @param type - The type of the date element, as given by its `DateElementProp`
 * @param translateString - The `translateString` function from the `registry`
 * @returns - The translated name of the date element
 */
export default function dateElementLabel(type: string, translateString: Registry['translateString']) {
  const key = Object.hasOwn(DATE_ELEMENT_LABELS, type) ? DATE_ELEMENT_LABELS[type] : undefined;
  return key ? translateString(key) : type;
}

/** Return the accessible name of a date element: the field's label followed by the translated name of the element,
 * such as `When, year`. The field's label is left out when it is empty or hidden, leaving the element's name alone,
 * since nothing on screen would match it
 *
 * @param type - The type of the date element, as given by its `DateElementProp`
 * @param translateString - The `translateString` function from the `registry`
 * @param [label] - The label of the field the date element belongs to
 * @param [hideLabel] - Flag, if true, the field's label is hidden and is left out of the name
 * @returns - The accessible name of the date element
 */
export function dateElementAriaLabel(
  type: string,
  translateString: Registry['translateString'],
  label?: string,
  hideLabel?: boolean,
) {
  const elementLabel = dateElementLabel(type, translateString);
  return label && !hideLabel ? `${label}, ${elementLabel}` : elementLabel;
}
