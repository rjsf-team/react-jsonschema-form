'use client';

import type { MouseEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';

import dateElementLabel, { dateElementAriaLabel } from './dateElementLabel.ts';
import dateRangeOptions from './dateRangeOptions.ts';
import type { DateElementFormat, DateElementProp } from './getDateElementProps.ts';
import getDateElementProps, { elementValue } from './getDateElementProps.ts';
import getNestedControlPresentation from './getNestedControlPresentation.ts';
import { ariaDescribedByIds, dateElementId } from './idGenerators.ts';
import parseDateString from './parseDateString.ts';
import toDateString from './toDateString.ts';
import type {
  DateObject,
  FieldPresentation,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from './types.ts';

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
  /** The plan of the field, whose parts that render describe each date element, and whose errors mark it
   * `aria-invalid` while they show
   */
  presentation?: FieldPresentation;
};

/** The `DateElement` component renders one of the 6 date element selectors for an `AltDateWidget`, using the `select`
 * widget from the registry. Each selector is a control in its own right, with the id `dateElementId(rootId, type)` as
 * its id and name and no visible label of its own, so it hands the `SelectWidget` the translated name of its element
 * as its placeholder and an `aria-label` built from the field's `label`, such as `When, year`. Given its field's plan,
 * it hands it a plan of its own, through which `widgetAriaProps()` describes it by the field's parts that render and
 * marks it `aria-invalid` while the field's errors show, without the field's `aria-labelledby`, which would outrank its
 * own name. Without one, it describes it by `ariaDescribedByIds(rootId)`. An unset element, which the hook's
 * `elements` give as `undefined` and a `DateObject` holds as -1, is no option, so it is handed to the `SelectWidget` as
 * an `undefined` value, which a native select reports to `onFocus` and `onBlur` as `undefined` and every other built-in
 * `SelectWidget` reports as it is handed.
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
    presentation,
  } = props;
  const id = dateElementId(rootId, type);
  const { widgets, translateString } = registry;
  const { SelectWidget } = widgets;
  const onChange = useCallback((newValue: any) => select(type as keyof DateObject, newValue), [select, type]);
  const elementLabel = translatedElementLabel ?? dateElementLabel(type, translateString);
  const ariaLabel = dateElementAriaLabel(elementLabel, translateString, label);
  const elementPresentation = useMemo(
    () => presentation && getNestedControlPresentation({ id, label: ariaLabel, field: presentation }),
    [id, ariaLabel, presentation],
  );
  return (
    <SelectWidget
      schema={{ type: 'integer' } as S}
      id={id}
      name={id}
      className={className}
      options={{ enumOptions: dateRangeOptions<S>(range[0], range[1]) }}
      placeholder={elementLabel}
      value={elementValue(value)}
      disabled={disabled}
      readonly={readonly}
      autofocus={autofocus}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      registry={registry}
      label=''
      aria-label={ariaLabel}
      aria-describedby={presentation ? undefined : ariaDescribedByIds(rootId)}
      presentation={elementPresentation}
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
  /** True when the widget is disabled or read-only, in which case `handleClear` and `handleSetNow` do nothing, so the
   * buttons that call them are rendered disabled
   */
  buttonsDisabled: boolean;
}

/** Hook which encapsulates the logic needed to render an `AltDateWidget` with optional `time` elements. It contains
 * the `state` of the current date(/time) selections in the widget. It returns a `UseAltDateWidgetResult` object
 * that contains the `elements: DateElementProp[]`, three callbacks needed to change one of the rendered `elements`
 * and to handle the clicking of the `clear` and `setNow` buttons, and the `buttonsDisabled` flag for those buttons.
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
  const buttonsDisabled = disabled || readonly;

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
      if (buttonsDisabled) {
        return;
      }
      setDraft(undefined);
      onChange(undefined);
    },
    [buttonsDisabled, onChange],
  );

  const handleSetNow = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      if (buttonsDisabled) {
        return;
      }
      const nextState = parseDateString(new Date().toJSON(), time);
      setDraft(undefined);
      onChange(toDateString(nextState, time));
    },
    [buttonsDisabled, time, onChange],
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
  return { elements, handleChange, handleClear, handleSetNow, buttonsDisabled };
}
