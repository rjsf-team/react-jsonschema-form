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
  | 'value'
  | 'name'
  | 'disabled'
  | 'readonly'
  | 'autofocus'
  | 'registry'
  | 'onBlur'
  | 'onFocus'
  | 'className'
  | 'label'
  | 'hideLabel'
> & {
  /** The root id of the field */
  rootId: string;
  /** The selector function for a specific prop within the `DateObject`, for a value */
  select: (property: keyof DateObject, value: any) => void;
  /** The type of the date element */
  type: DateElementProp['type'];
  /** The range for the date element */
  range: DateElementProp['range'];
};

/** The `DateElement` component renders one of the 6 date element selectors for an `AltDateWidget`, using the `select`
 * widget from the registry. The selector has no label of its own, so it is named through `aria-label` by the field's
 * `label` followed by the translated name of the element, such as `When, year`, and shows that translated name as its
 * placeholder.
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
    name,
    disabled,
    readonly,
    autofocus,
    registry,
    onBlur,
    onFocus,
    label,
    hideLabel,
  } = props;
  const id = dateElementId(rootId, type);
  const { widgets, translateString } = registry;
  const { SelectWidget } = widgets;
  const onChange = useCallback((newValue: any) => select(type as keyof DateObject, newValue), [select, type]);
  return (
    <SelectWidget
      schema={{ type: 'integer' } as S}
      id={id}
      name={name}
      className={className}
      options={{ enumOptions: dateRangeOptions<S>(range[0], range[1]) }}
      placeholder={dateElementLabel(type, translateString)}
      value={value}
      disabled={disabled}
      readonly={readonly}
      autofocus={autofocus}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      registry={registry}
      label=''
      aria-label={dateElementAriaLabel(type, translateString, label, hideLabel)}
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
        [property]: typeof newValue === 'undefined' ? -1 : newValue,
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
