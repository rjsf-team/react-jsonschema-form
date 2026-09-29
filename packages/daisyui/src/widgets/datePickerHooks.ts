import type { RefObject } from 'react';
import { useCallback, useEffect, useState } from 'react';

/** Manages a date picker's popup state and the month its calendar displays, shared by the two picker widgets so the
 * one that gains a behavior does not leave the other behind.
 *
 * @param initialDate - The date to open the calendar on, defaulting to today
 * @returns - The popup's open state and the displayed month, with their setters
 */
export function useDatePickerState(initialDate?: Date) {
  const [isOpen, setIsOpen] = useState(false);
  const [month, setMonth] = useState<Date>(initialDate ?? new Date());
  return { isOpen, setIsOpen, month, setMonth };
}

/** Whether a press landed on the button that opens the popup, either directly or on a label pointing at it. The
 * browser forwards a label's click to its control, so treating either as a press outside would close the popup on the
 * way to the trigger that opens it straight back, and the label could never close it at all.
 *
 * @param target - The node the press landed on
 * @param trigger - The button that opens the popup
 * @returns - True if the press will reach that button
 */
function pressOpensThePopup(target: EventTarget | null, trigger: HTMLElement | null) {
  if (!trigger || !(target instanceof Element)) {
    return false;
  }
  return trigger.contains(target) || target.closest('label')?.control === trigger;
}

/** Runs a callback when a press lands outside a picker's popup, which is how closing it commits what it holds. A press
 * that will reach the trigger is not outside: that button closes the popup itself.
 *
 * @param popupRef - A ref to the popup
 * @param triggerRef - A ref to the button that opens it
 * @param callback - What to run when the press is outside both
 */
export function useClickOutside(
  popupRef: RefObject<HTMLDivElement | null>,
  triggerRef: RefObject<HTMLButtonElement | null>,
  callback: () => void,
) {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        !pressOpensThePopup(event.target, triggerRef.current)
      ) {
        callback();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popupRef, triggerRef, callback]);
}

interface UseCommitDateProps<V> {
  /** The day or instant the popup is holding, `undefined` where the stored value could not be read */
  localDate?: Date;
  /** The field's stored value, which tells an empty field apart from one holding a value the widget cannot read */
  value: unknown;
  /** Formats the chosen date for the format the field declares */
  formatDate: (date: Date) => V;
  /** What the field commits when it holds no date */
  emptyValue: V;
  /** The widget's `onChange` */
  onChange: (value: V) => void;
}

/** Builds the callback that commits what a picker is holding, which closing it does whether or not the user chose a
 * date. Shared so the rule about a value the widget could not read cannot end up spelled two different ways.
 *
 * @param props - The date the popup holds and the stored value, with the formatter and `onChange` to commit through
 * @returns - The commit callback
 */
export function useCommitDate<V>({ localDate, value, formatDate, emptyValue, onChange }: UseCommitDateProps<V>) {
  return useCallback(() => {
    if (localDate) {
      onChange(formatDate(localDate));
    } else if (!value) {
      // A stored value this widget could not read is left alone: the user dismissed the picker without choosing a
      // date, which is not a request to throw that value away
      onChange(emptyValue);
    }
  }, [emptyValue, formatDate, localDate, onChange, value]);
}
