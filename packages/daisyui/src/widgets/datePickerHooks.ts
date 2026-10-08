import type { MouseEvent } from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { callWithDeferredThrow } from '@rjsf/utils';
import { format, isSameMonth, isValid, parseISO } from 'date-fns';

/** The document the form is rendered into, which is a document away from the one this module runs in wherever that is
 * an iframe — as the playground's frame renders it. A press, a key and a viewport width all belong to that document
 * rather than to ours, and reading it off an element the form rendered needs no setup from the consumer, where a
 * provider would.
 *
 * @param element - An element of the form, whose document answers for the whole of it
 * @returns - That element's document, falling back to this one for an element that is in no document yet
 */
function documentOf(element: Element | null) {
  return element?.ownerDocument ?? document;
}

/** The window of the document above, which is the only way to a viewport and to the events that belong to one.
 *
 * @param element - An element of the form
 * @returns - That element's window, falling back to this one for a document with no browsing context of its own
 */
export function windowOf(element: Element | null) {
  return documentOf(element).defaultView ?? window;
}

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
 * @param value - The stored value
 * @returns - That day at local midnight, or `undefined` where the value is not a day on its own
 */
export function readDateOnly(value: unknown) {
  if (typeof value !== 'string' || !DATE_ONLY.test(value)) {
    return undefined;
  }
  const day = parseISO(value);
  return isValid(day) ? day : undefined;
}

/** Reads a stored value as the instant it names, for every shape a `Date` can be built from: the text either picker
 * writes, the epoch number or `Date` a consumer can leave in the form data, and the dialects an engine accepts beyond
 * ISO 8601 — a lowercase `t`/`z`, or the space separator RFC 3339 also allows — every one of which `parseISO` rejects.
 * Shared so the two pickers agree on which stored values they can read at all, since a value one of them shows and the
 * other leaves blank is the same value either way.
 *
 * @param value - The stored value
 * @returns - The instant it names, or `undefined` for a value no `Date` can be built from, which would otherwise
 *          become an `Invalid Date` that the calendar, its month caption and the trigger would each have to guard
 *          against
 */
export function readInstant(value: unknown) {
  if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) {
    return undefined;
  }
  const instant = new Date(value);
  return isValid(instant) ? instant : undefined;
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

/** What the popup holds while it is open, tagged with the stored value it was seeded from */
interface PickerDraft {
  basis: { date: Date | undefined };
  date: Date | undefined;
  month: Date;
  /** Whether the user chose `date`, which is what makes closing the popup store it */
  picked: boolean;
}

/** The month to display for `date`, keeping `current` where `date` is in it or names no day: handing the calendar a
 * fresh `Date` naming the same month would rebuild the whole calendar, its day grid and its year dropdown, for a
 * caption that does not change
 */
function monthFor(current: Date, date: Date | undefined) {
  return date && !isSameMonth(current, date) ? date : current;
}

/** `saved`, where it was made against `basis`. A draft made against a value the parent has since replaced is discarded
 * with it: a value that arrived from outside is not one the user was in the middle of choosing
 */
function draftFor(saved: PickerDraft, basis: PickerDraft['basis']): PickerDraft {
  return saved.basis === basis
    ? saved
    : { basis, date: basis.date, month: monthFor(saved.month, basis.date), picked: false };
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
  // What a close leaves for the commit that renders it: the blur to report should that commit unmount the widget
  // instead, and whether the close was a press elsewhere, which takes the focus with it
  const pendingClose = useRef<{ reportBlur: () => void; isFocusLeaving: boolean } | null>(null);
  // Whether the consumer has been told that the field has the focus. Every report goes through it, so the consumer
  // hears focus and blur in turn however many of the ways in and out of the popup see the same one: opening it and the
  // trigger's own focus event, closing it and the trigger's own blur event
  const isFocusReported = useRef(false);
  // A new object for every new value, where `initialDate` alone is `undefined` for every empty one: a value the parent
  // replaces and then restores must not revive a draft made against it
  const basis = useMemo(() => ({ date: initialDate }), [initialDate]);
  const [savedDraft, setSavedDraft] = useState<PickerDraft>(() => ({
    basis,
    date: initialDate,
    month: initialDate ?? new Date(),
    picked: false,
  }));
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Derived during render, so a new value costs no second render
  const draft = useMemo(() => draftFor(savedDraft, basis), [basis, savedDraft]);
  const localDate = draft.date;

  /** Take the value the form holds, discarding anything the popup was holding before: the date, the month displaying
   * it, and the fact that the user chose a date at all. Done on the way in rather than on each way out, so a way out
   * added later cannot forget it and leave the popup reopening on a date the form never took
   */
  const resetToStoredValue = useCallback(() => {
    setSavedDraft({ basis, date: basis.date, month: basis.date ?? new Date(), picked: false });
  }, [basis]);

  /** Store what the popup is holding, which closing it does whenever the user chose a date. A field holding a `''`
   * left over from a cleared one commits its empty value instead, since `''` is no more a date than it is a date-time
   * and fails the format the field declares. That `''` is the only value dismissing the picker rewrites: a field
   * holding nothing is already empty, whatever `ui:emptyValue` would spell that as, and a stored value this widget
   * could not read is not one the user asked to throw away by dismissing a picker they chose no date in
   */
  const commitDate = useCallback(() => {
    if (draft.picked && draft.date) {
      onChange(formatDate(draft.date));
    } else if (value === '' && value !== emptyValue) {
      onChange(emptyValue);
    }
  }, [draft, emptyValue, formatDate, onChange, value]);

  /** Tell the consumer the field has the focus, unless they have been told so already: where the popup is open, and
   * so for a focus a close returns to the trigger, which `reportHeldFocus()` reports after that close's blur
   */
  const reportFocus = useCallback(() => {
    if (!isFocusReported.current) {
      isFocusReported.current = true;
      onFocus?.(id, value);
    }
  }, [id, onFocus, value]);

  /** Tell the consumer the field has lost the focus, unless they have been told so already
   */
  const reportBlur = useCallback(() => {
    if (isFocusReported.current) {
      isFocusReported.current = false;
      onBlur?.(id, value);
    }
  }, [id, onBlur, value]);

  /** Report the focus the trigger holds once a close has reported its blur, which is how the consumer hears that the
   * field was left and is now back in use: the trigger kept the focus through the close, or was handed it by one
   */
  const reportHeldFocus = useCallback(() => {
    const trigger = triggerRef.current;
    if (trigger && documentOf(trigger).activeElement === trigger) {
      reportFocus();
    }
  }, [reportFocus]);

  /** Close the popup, storing the date it holds, which every way out of it but Escape does. Blur is reported from the
   * close Effect rather than here, so the parent's update to `value` is in hand before the consumer hears about it
   *
   * @param [isFocusLeaving=false] - Whether the close is a press elsewhere, which takes the focus with it once this
   *          returns: a focus the trigger still holds is then not reported after the blur, and its loss not again
   */
  const closePicker = useCallback(
    (isFocusLeaving = false) => {
      pendingClose.current = { reportBlur, isFocusLeaving };
      setIsOpen(false);
      commitDate();
    },
    [commitDate, reportBlur],
  );

  /** Close the popup without storing anything, which Escape does: a date the user was trying out in the calendar is
   * not one they asked to store
   */
  const cancelPicker = useCallback(() => {
    // Closing from inside the popup returns focus to the trigger: the element focus was on is about to be unmounted,
    // and focus would fall to the document body, losing a keyboard user their place in the form. It moves before the
    // blur is reported, so whatever takes it afterwards keeps it, as the consumer's `onBlur` can
    const popup = containerRef.current;
    if (popup?.contains(documentOf(popup).activeElement)) {
      triggerRef.current?.focus();
    }
    setIsOpen(false);
    // Not `finally`: the React Compiler analysis behind the `react/*` lint rules does not model it, and reports this
    // callback's dependencies as unused
    try {
      reportBlur();
    } catch (error) {
      // Deferred, so a throw from the consumer's `onFocus` does not take the place of this one
      callWithDeferredThrow(reportHeldFocus);
      throw error;
    }
    reportHeldFocus();
  }, [reportBlur, reportHeldFocus]);

  // The close commit includes ordinary parent updates, but cannot await a later transition or async response. Being
  // inside the commit, a `flushSync` the consumer calls from `onBlur`, or from the `onFocus` that follows it, is
  // deferred to the next render rather than flushed, and React logs an error saying so
  useEffect(() => {
    const pending = pendingClose.current;
    if (!isOpen && pending) {
      pendingClose.current = null;
      callWithDeferredThrow(reportBlur);
      if (!pending.isFocusLeaving) {
        callWithDeferredThrow(reportHeldFocus);
      }
    }
  }, [isOpen, reportBlur, reportHeldFocus]);

  // A save can replace this widget before the close Effect runs. There is no new
  // value to read in that case, so preserve the notification with its previous value.
  useEffect(
    () => () => {
      const pending = pendingClose.current;
      pendingClose.current = null;
      if (pending) {
        callWithDeferredThrow(pending.reportBlur);
      }
    },
    [],
  );

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
      latestClose.current(true);
    };
    // The document the form is in rather than this module's: neither a press nor a key inside a framed form reaches
    // ours, which would leave Done and the trigger as the only ways out of the popup
    const doc = documentOf(triggerRef.current);
    doc.addEventListener('keydown', handleEscape);
    doc.addEventListener('mousedown', handlePressOutside);
    return () => {
      doc.removeEventListener('keydown', handleEscape);
      doc.removeEventListener('mousedown', handlePressOutside);
    };
  }, [isOpen, latestCancel, latestClose]);

  /** Take a date the user chose in the popup, which is what makes closing it store one
   *
   * @param date - The date they chose
   */
  const chooseDate = useCallback(
    (date: Date) =>
      setSavedDraft((saved) => {
        const current = draftFor(saved, basis);
        return { basis, date, month: monthFor(current.month, date), picked: true };
      }),
    [basis],
  );

  /** Move the calendar to another month without choosing a date in it
   *
   * @param date - A date in the month to display
   */
  const handleMonthChange = useCallback(
    (date: Date) => setSavedDraft((saved) => ({ ...draftFor(saved, basis), month: date })),
    [basis],
  );

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
      resetToStoredValue();
      setIsOpen(true);
      reportFocus();
    },
    [closePicker, isOpen, reportFocus, resetToStoredValue],
  );

  /** Report blur on the trigger, unless the popup is open: the focus has moved into it, which the field still holds,
   * and each way out of the popup reports the blur for itself
   */
  const handleBlur = useCallback(() => {
    if (!isOpen) {
      reportBlur();
    }
  }, [isOpen, reportBlur]);

  /** Close the popup from its Done button, returning focus to the trigger it was opened from — unconditionally, where
   * Escape returns it only from inside the popup: a browser that does not focus a button on click, as Safari does not,
   * leaves this press with no focus inside the popup to return from. Focus moves while the popup that holds it is
   * still mounted, so it never falls to the document body on the way, and before the save, so a save the parent
   * renders at once, and the close Effect with it, already finds the focus returned and whatever takes it in that
   * commit keeps it, as an `autoFocus` can
   */
  const handleDone = useCallback(() => {
    triggerRef.current?.focus();
    closePicker();
  }, [closePicker]);

  // What the trigger displays and the calendar selects: the date the user is choosing while the popup is open, and
  // otherwise the one the form holds, so nothing the form did not take is left on screen once the popup is closed
  const displayedDate = isOpen ? localDate : initialDate;

  return {
    isOpen,
    month: draft.month,
    displayedDate,
    containerRef,
    triggerRef,
    chooseDate,
    handleMonthChange,
    togglePicker,
    handleFocus: reportFocus,
    handleBlur,
    handleDone,
  };
}
