import type { FocusEvent, MouseEvent } from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
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

/** Keep the displayed month stable when a selected day is in the same month. */
function monthFor(current: Date, date: Date | undefined) {
  return date && !isSameMonth(current, date) ? date : current;
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
  /** The widget's `onChange` */
  onChange: (value: V) => void;
  /** The widget's `onFocus` */
  onFocus?: (id: string, value: unknown) => void;
  /** The widget's `onBlur` */
  onBlur?: (id: string, value: unknown) => void;
}

/** Share immediate selection and focus handling between the custom date pickers.
 * The parent value is authoritative; closing the calendar does not save or revert it.
 */
export function useDatePicker<V>({
  id,
  value,
  initialDate,
  formatDate,
  onChange,
  onFocus,
  onBlur,
}: UseDatePickerProps<V>) {
  const [isOpen, setIsOpen] = useState(false);
  const basis = useMemo(() => ({ date: initialDate }), [initialDate]);
  const [navigation, setNavigation] = useState(() => ({ basis, month: initialDate ?? new Date() }));
  const month = navigation.basis === basis ? navigation.month : monthFor(navigation.month, initialDate);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Return focus before unmounting a focused popup control. Moving within the
  // picker does not report blur; an outside focus change will report it normally.
  const returnFocusFromPopup = useCallback(() => {
    const popup = containerRef.current;
    if (popup?.contains(documentOf(popup).activeElement)) {
      triggerRef.current?.focus();
    }
  }, []);

  const closePicker = useCallback(() => {
    returnFocusFromPopup();
    setIsOpen(false);
  }, [returnFocusFromPopup]);

  const latestClose = useLatest(closePicker);

  // These listeners synchronize the open picker with its document, including
  // when the form is rendered in an iframe.
  useEffect(() => {
    if (!isOpen) {
      return () => {};
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        latestClose.current();
      }
    };
    const handlePressOutside = (e: globalThis.MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node) || pressOpensThePopup(e.target, triggerRef.current)) {
        return;
      }
      latestClose.current();
    };
    const doc = documentOf(triggerRef.current);
    doc.addEventListener('keydown', handleEscape);
    doc.addEventListener('mousedown', handlePressOutside);
    return () => {
      doc.removeEventListener('keydown', handleEscape);
      doc.removeEventListener('mousedown', handlePressOutside);
    };
  }, [isOpen, latestClose]);

  const chooseDate = useCallback(
    (date: Date) => {
      setNavigation({ basis, month: monthFor(month, date) });
      onChange(formatDate(date));
    },
    [basis, formatDate, month, onChange],
  );

  const handleMonthChange = useCallback(
    (date: Date) => {
      setNavigation({ basis, month: date });
    },
    [basis],
  );

  const togglePicker = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      if (isOpen) {
        closePicker();
      } else {
        setNavigation({ basis, month: initialDate ?? new Date() });
        setIsOpen(true);
      }
    },
    [basis, closePicker, initialDate, isOpen],
  );

  const handleFocus = useCallback(
    (e: FocusEvent<HTMLDivElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget)) {
        onFocus?.(id, value);
      }
    },
    [id, onFocus, value],
  );

  const handleBlur = useCallback(
    (e: FocusEvent<HTMLDivElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget)) {
        // A real outside focus target also dismisses the popup. A null target
        // can be the intermediate step of a label forwarding its click.
        if (e.relatedTarget) {
          setIsOpen(false);
        }
        onBlur?.(id, value);
      }
    },
    [id, onBlur, value],
  );

  const handleDone = useCallback(() => {
    triggerRef.current?.focus();
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    month,
    displayedDate: initialDate,
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
