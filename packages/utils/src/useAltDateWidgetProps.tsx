'use client';

import type { MouseEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';

import dateElementLabel, { dateElementAriaLabel } from './dateElementLabel.ts';
import dateRangeOptions from './dateRangeOptions.ts';
import type { DateElementFormat, DateElementProp } from './getDateElementProps.ts';
import getDateElementProps from './getDateElementProps.ts';
import { ariaDescribedByIds, dateElementId } from './idGenerators.ts';
import parseDateString from './parseDateString.ts';
import toDateString from './toDateString.ts';
import type { DateObject, FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';

/** Function that checks to see if a `DateObject` is ready for the onChange callback to be triggered
 *
 * @param state - The current `DateObject`
 * @returns - True if the `state` is ready to trigger an onChange
 */
function readyForChange(state: DateObject) {
  return Object.values(state).every((value) => value !== -1);
}

/** The Props for the `DateElement` component */
export type DateElementProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = Pick<
  WidgetProps<T, S, F>,
  'value' | 'disabled' | 'readonly' | 'autofocus' | 'registry' | 'onBlur' | 'onFocus' | 'className'
> & {
  /** The root id of the field */
  rootId: string;
  /** The name of the field. Ignored: each date element is a control of its own, so it is given its own id as its name
   * rather than its field's, which a select would otherwise read as the field it names
   *
   * @deprecated - Ignored; each date element takes `dateElementId(rootId, type)` as its name
   */
  name?: string;
  /** The label of the field, which leads the accessible name of each date element, such as `When, year` */
  label?: string;
  /** The translated name of the date element, for a caller that already translated it to display it. Defaults to
   * `dateElementLabel(type, translateString)`
   */
  elementLabel?: string;
  /** The selector function for a specific prop within the `DateObject`, for a value */
  select: (property: keyof DateObject, value: any) => void;
  /** The type of the date element */
  type: DateElementProp['type'];
  /** The range for the date element */
  range: DateElementProp['range'];
};

/** The `DateElement` component renders one of the 6 date element selectors for an `AltDateWidget`, using the `select`
 * widget from the registry. Each selector is a control in its own right, with the id `dateElementId(rootId, type)` as
 * its id and name and no visible label of its own, so it hands the `SelectWidget` the translated name of its element
 * as its placeholder, an `aria-label` built from the field's `label`, such as `When, year`, and an `aria-describedby`
 * pointing at the field's description, help and errors, which `widgetAriaProps()` has the `SelectWidget` forward.
 *
 * @param props - The `DateElementProps` for the date element
 */
export function DateElement<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: DateElementProps<T, S, F>) {
  const {
    className = 'form-control',
    type,
    range,
    value,
    select,
    rootId,
    disabled,
    readonly,
    autofocus,
    registry,
    onBlur,
    onFocus,
    label,
    elementLabel: translatedElementLabel,
  } = props;
  const id = dateElementId(rootId, type);
  const { widgets, translateString } = registry;
  const { SelectWidget } = widgets;
  const onChange = useCallback((newValue: any) => select(type as keyof DateObject, newValue), [select, type]);
  const elementLabel = translatedElementLabel ?? dateElementLabel(type, translateString);
  return (
    <SelectWidget
      schema={{ type: 'integer' } as S}
      id={id}
      name={id}
      className={className}
      options={{ enumOptions: dateRangeOptions<S>(range[0], range[1]) }}
      placeholder={elementLabel}
      value={value}
      disabled={disabled}
      readonly={readonly}
      autofocus={autofocus}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      registry={registry}
      label=''
      aria-label={dateElementAriaLabel(elementLabel, translateString, label)}
      aria-describedby={ariaDescribedByIds(rootId)}
    />
  );
}

/** The result of a call to the `useAltDateWidgetProps()` hook */
export interface UseAltDateWidgetResult {
  /** The list of `DateElementProp` data to render for the `AltDateWidget` */
  elements: DateElementProp[];
  /** The callback that handles the changing of DateElement components */
  handleChange: (property: keyof DateObject, value?: string) => void;
  /** The callback that will clear the `AltDateWidget` when a button is clicked */
  handleClear: (event: MouseEvent) => void;
  /** The callback that will set the `AltDateWidget` to NOW when a button is clicked */
  handleSetNow: (event: MouseEvent) => void;
}

/** Hook which encapsulates the logic needed to render an `AltDateWidget` with optional `time` elements. It contains
 * the `state` of the current date(/time) selections in the widget. It returns a `UseAltDateWidgetResult` object
 * that contains the `elements: DateElementProp[]` and three callbacks needed to change one of the rendered `elements`,
 * and to handle the clicking of the `clear` and `setNow` buttons.
 *
 * @param props - The `WidgetProps` for the `AltDateWidget`
 */
export default function useAltDateWidgetProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>): UseAltDateWidgetResult {
  const { time = false, disabled = false, readonly = false, options, onChange, value } = props;
  const parsed = useMemo(() => parseDateString(value, time), [value, time]);
  // A selection that isn't complete yet, kept only for the parse it was made against, so a new value from the parent
  // replaces it. Tagged with that parse rather than with `value`, since the memo builds a new one on every change: a
  // value the parent replaces and then restores must not revive the draft. Dropped whenever a value is sent, so a
  // parent that rejects it or stores it later shows the value it holds
  const [draft, setDraft] = useState<{ basis: DateObject; state: DateObject }>();
  const state = draft?.basis === parsed ? draft.state : parsed;

  const handleChange = useCallback(
    (property: keyof DateObject, newValue?: string) => {
      const nextState = {
        ...state,
        [property]: newValue === undefined || newValue === '' ? -1 : Number(newValue),
      };

      if (readyForChange(nextState)) {
        setDraft(undefined);
        onChange(toDateString(nextState, time));
      } else {
        setDraft({ basis: parsed, state: nextState });
      }
    },
    [state, onChange, time, parsed],
  );

  const handleClear = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      if (disabled || readonly) {
        return;
      }
      setDraft(undefined);
      onChange(undefined);
    },
    [disabled, readonly, onChange],
  );

  const handleSetNow = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      if (disabled || readonly) {
        return;
      }
      const nextState = parseDateString(new Date().toJSON(), time);
      setDraft(undefined);
      onChange(toDateString(nextState, time));
    },
    [disabled, readonly, time, onChange],
  );

  const elements = useMemo(
    () =>
      getDateElementProps(
        state,
        time,
        options.yearsRange as [number, number] | undefined,
        options.format as DateElementFormat | undefined,
      ),
    [state, time, options.yearsRange, options.format],
  );
  return { elements, handleChange, handleClear, handleSetNow };
}
