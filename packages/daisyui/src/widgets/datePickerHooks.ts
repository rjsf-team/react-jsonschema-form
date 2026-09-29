import type { MouseEvent } from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { format, isValid, parseISO } from 'date-fns';

/** A `date` proper: a calendar day with no time and no zone */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** The shapes either picker knows how to commit, and so the ones it takes from the schema rather than from its own
 * fallback: any other format is one neither picker can spell
 */
const KNOWN_FORMATS = ['date', 'date-time', 'iso-date-time'];

/** Reads a stored value that is a `date` proper as the day it names, at local midnight. The `Date` constructor reads
 * a day with no zone as UTC midnight, which names the day before to every reader behind UTC once date-fns formats it
 * in their own zone.
 *
 * @param text - The stored value's text
 * @returns - That day at local midnight, or `undefined` where the text is not a day on its own
 */
export function readDateOnly(text: string) {
  if (!DATE_ONLY.test(text)) {
    return undefined;
  }
  const day = parseISO(text);
  return isValid(day) ? day : undefined;
}

/** Builds the formatter that turns the date a picker is holding into the text the field stores. Either picker can be
 * pointed at either kind of field — `widgetMap` resolves `ui:widget: 'date'` and `'date-time'` on any `string` schema,
 * whatever `format` it declares — and a value in the other shape fails the field's own format check, so the schema
 * decides the shape rather than the widget that happens to be rendering it.
 *
 * A format neither picker knows is one it cannot spell any better than the widget's own fallback can, so the widget
 * decides those: a custom `date` dialect registered with ajv is far likelier to accept the day a `date` picker writes
 * than the instant a `date-time` one does.
 *
 * @param schema - The schema for the field, whose `format` names the shape it stores
 * @param fallback - The shape to commit where the schema declares no format either picker knows
 * @returns - The formatter for the field's committed value
 */
export function useDateFormatter<S extends StrictRJSFSchema = RJSFSchema>(schema: S, fallback: 'date' | 'date-time') {
  const schemaFormat =
    typeof schema.format === 'string' && KNOWN_FORMATS.includes(schema.format) ? schema.format : undefined;
  return useCallback(
    (date: Date) => {
      switch (schemaFormat ?? fallback) {
        case 'date':
          return format(date, 'yyyy-MM-dd');
        // That format's timezone is optional, so it stores the naive wall-clock time its widget displays
        case 'iso-date-time':
          return format(date, "yyyy-MM-dd'T'HH:mm:ss");
        default:
          return date.toISOString();
      }
    },
    [fallback, schemaFormat],
  );
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

/** Keeps a callback reachable from a listener without the listener having to be rebound each time the callback is
 * rebuilt, which every render does for one written inline.
 *
 * @param callback - The callback to reach
 * @returns - A ref holding the latest one
 */
function useLatest<A extends unknown[]>(callback: (...args: A) => void) {
  const ref = useRef(callback);
  // In an effect rather than during render, which React forbids writing a ref in: a render that is discarded, as a
  // transition or a Suspense retry can be, would otherwise leave the listeners holding a callback closed over state
  // the form never committed. A layout effect, so the ref is current before the effect below binds them
  useLayoutEffect(() => {
    ref.current = callback;
  }, [callback]);
  return ref;
}

interface UseDatePickerProps<V> {
  /** The field's `id`, which is also the trigger's */
  id: string;
  /** The field's stored value, which tells an empty field apart from one holding a value the widget cannot read */
  value: unknown;
  /** The day or instant the stored value names, `undefined` where there is none to read */
  initialDate?: Date;
  /** Formats the chosen date for the format the field declares */
  formatDate: (date: Date) => V;
  /** What the field commits when it holds no date */
  emptyValue: V;
  /** The widget's `onChange` */
  onChange: (value: V) => void;
  /** The widget's `onFocus` */
  onFocus?: (id: string, value: unknown) => void;
  /** The widget's `onBlur` */
  onBlur?: (id: string, value: unknown) => void;
}

/** Runs the popup behind both picker widgets: the state it holds while it is open, every way out of it, and which of
 * those ways stores what it holds. Shared so the one that gains a behavior does not leave the other behind — the two
 * differ only in what their popup renders and how they format what it holds.
 *
 * Closing stores the date only where the user chose one. Merely opening the popup and dismissing it is not an edit,
 * and a field whose stored value is a date-time this widget reads as a day would otherwise have that day written back
 * over it — silently rewriting data the user never touched, and in a zone far enough from the value's own, a
 * different day than it started with.
 *
 * @param props - The stored value and the day it names, with the formatter and the callbacks to report through
 * @returns - The popup's state, the refs to attach, and the handler for each way in and out of it
 */
export function useDatePicker<V>({
  id,
  value,
  initialDate,
  formatDate,
  emptyValue,
  onChange,
  onFocus,
  onBlur,
}: UseDatePickerProps<V>) {
  const [isOpen, setIsOpen] = useState(false);
  const [month, setMonth] = useState<Date>(initialDate ?? new Date());
  const [localDate, setLocalDate] = useState<Date | undefined>(initialDate);
  const pickedADate = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // When the parent's value changes externally, update local state. Anything the popup was holding is discarded with
  // it: a value that arrived from outside is not one the user was in the middle of choosing
  useEffect(() => {
    setLocalDate(initialDate);
    pickedADate.current = false;
  }, [initialDate]);

  // When the local date changes, update the displayed month.
  useEffect(() => {
    if (localDate) {
      setMonth(localDate);
    }
  }, [localDate]);

  /** Store what the popup is holding, which closing it does whenever the user chose a date. A field holding a `''`
   * left over from a cleared one commits its empty value instead, since `''` is no more a date than it is a date-time
   * and fails the format the field declares. That `''` is the only value dismissing the picker rewrites: a field
   * holding nothing is already empty, whatever `ui:emptyValue` would spell that as, and a stored value this widget
   * could not read is not one the user asked to throw away by dismissing a picker they chose no date in
   */
  const commitDate = useCallback(() => {
    if (pickedADate.current && localDate) {
      onChange(formatDate(localDate));
    } else if (value === '' && value !== emptyValue) {
      onChange(emptyValue);
    }
  }, [emptyValue, formatDate, localDate, onChange, value]);

  /** Close the popup, storing the date it holds, which every way out of it but Escape does
   */
  const closePicker = useCallback(() => {
    setIsOpen(false);
    commitDate();
    pickedADate.current = false;
    // Manually invoke the blur handler to ensure blur event is triggered
    if (onBlur) {
      onBlur(id, value);
    }
  }, [commitDate, id, onBlur, value]);

  /** Close the popup without storing anything, which Escape does: a date the user was trying out in the calendar is
   * not one they asked to store. The popup goes back to the stored value entirely — the date it holds and the month it
   * displays — so the trigger stops showing a day the form does not hold and reopening does not land on the month the
   * user just discarded
   */
  const cancelPicker = useCallback(() => {
    setLocalDate(initialDate);
    setMonth(initialDate ?? new Date());
    pickedADate.current = false;
    setIsOpen(false);
    if (onBlur) {
      onBlur(id, value);
    }
  }, [id, initialDate, onBlur, value]);

  const latestCancel = useLatest(cancelPicker);
  const latestClose = useLatest(closePicker);

  // Close the popup on Escape, and on a press outside it. Both listeners are bound only while it is open: a closed
  // picker has nothing to close, and a form of date fields would otherwise hold two document listeners apiece
  useEffect(() => {
    if (!isOpen) {
      return () => {};
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        latestCancel.current();
      }
    };
    const handlePressOutside = (e: MouseEvent | globalThis.MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node) || pressOpensThePopup(e.target, triggerRef.current)) {
        return;
      }
      latestClose.current();
    };
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handlePressOutside);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handlePressOutside);
    };
  }, [isOpen, latestCancel, latestClose]);

  /** Take a date the user chose in the popup, which is what makes closing it store one
   *
   * @param date - The date they chose
   */
  const chooseDate = useCallback((date: Date) => {
    pickedADate.current = true;
    setLocalDate(date);
  }, []);

  /** Move the calendar to another month without choosing a date in it
   *
   * @param date - A date in the month to display
   */
  const handleMonthChange = useCallback((date: Date) => setMonth(date), []);

  /** Open the popup, or close it where a press on the trigger is the way out
   *
   * @param e - The press on the trigger
   */
  const togglePicker = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      if (isOpen) {
        // The one way out of the popup that is a press on the trigger itself, or on the label pointing at it, which
        // the press-outside listener leaves alone so that press does not close and reopen in one gesture
        closePicker();
        return;
      }
      setIsOpen(true);
      if (onFocus) {
        onFocus(id, value);
      }
    },
    [closePicker, id, isOpen, onFocus, value],
  );

  /** Report focus on the trigger
   */
  const handleFocus = useCallback(() => {
    if (onFocus) {
      onFocus(id, value);
    }
  }, [id, onFocus, value]);

  /** Report blur on the trigger, which the popup's own close paths report for themselves
   */
  const handleBlur = useCallback(() => {
    if (!isOpen && onBlur) {
      onBlur(id, value);
    }
  }, [id, isOpen, onBlur, value]);

  /** Close the popup from its Done button, returning focus to the trigger it was opened from
   */
  const handleDone = useCallback(() => {
    closePicker();
    triggerRef.current?.focus();
  }, [closePicker]);

  return {
    isOpen,
    month,
    localDate,
    containerRef,
    triggerRef,
    chooseDate,
    handleMonthChange,
    togglePicker,
    handleFocus,
    handleBlur,
    handleDone,
  };
}
