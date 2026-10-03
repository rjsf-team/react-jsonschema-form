import { TranslatableString } from './enums.ts';
import type { Registry } from './types.ts';

const DATE_ELEMENT_LABELS: Readonly<Record<string, TranslatableString>> = {
  year: TranslatableString.YearLabel,
  month: TranslatableString.MonthLabel,
  day: TranslatableString.DayLabel,
  hour: TranslatableString.HourLabel,
  minute: TranslatableString.MinuteLabel,
  second: TranslatableString.SecondLabel,
};

/** Return the translated name of a date element, such as `year`, falling back to the `type` itself for a type that
 * has no `TranslatableString` of its own
 *
 * @param type - The type of the date element, as given by its `DateElementProp`
 * @param translateString - The `translateString` function from the `registry`
 * @returns - The translated name of the date element
 */
export default function dateElementLabel(type: string, translateString: Registry['translateString']) {
  const key = Object.hasOwn(DATE_ELEMENT_LABELS, type) ? DATE_ELEMENT_LABELS[type] : undefined;
  return key ? translateString(key) : type;
}

/** Return the accessible name of a date element: the field's label combined with the element's translated name through
 * `TranslatableString.DateElementAriaLabel`, such as `When, year`, so a locale controls both the order and the
 * punctuation. The label is kept even when the field hides it on screen, since that is when the parts of two date
 * fields are otherwise impossible to tell apart, and the visible name is still contained in it. Only an empty label
 * leaves the element's name alone.
 *
 * @param elementLabel - The translated name of the date element, as returned by `dateElementLabel()`
 * @param translateString - The `translateString` function from the `registry`
 * @param [label] - The label of the field the date element belongs to
 * @returns - The accessible name of the date element
 */
export function dateElementAriaLabel(
  elementLabel: string,
  translateString: Registry['translateString'],
  label?: string,
) {
  return label ? translateString(TranslatableString.DateElementAriaLabel, [label, elementLabel]) : elementLabel;
}
