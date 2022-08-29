import React, { MouseEvent, useCallback, useEffect, useReducer } from "react";

import {
  parseDateString,
  toDateString,
  pad,
  WidgetProps,
  DateObject,
} from "@rjsf/utils";

function rangeOptions(start: number, stop: number) {
  const options = [];
  for (let i = start; i <= stop; i++) {
    options.push({ value: i, label: pad(i, 2) });
  }
  return options;
}

function readyForChange(state: DateObject) {
  return Object.values(state).every((value) => value !== -1);
}

function dateElementProps(
  state: DateObject,
  time: boolean,
  yearsRange: [number, number] = [1900, new Date().getFullYear() + 2]
) {
  const { year, month, day, hour, minute, second } = state;
  const data = [
    {
      type: "year",
      range: yearsRange,
      value: year,
    },
    { type: "month", range: [1, 12], value: month },
    { type: "day", range: [1, 31], value: day },
  ] as { type: string; range: [number, number]; value: number | undefined }[];
  if (time) {
    data.push(
      { type: "hour", range: [0, 23], value: hour },
      { type: "minute", range: [0, 59], value: minute },
      { type: "second", range: [0, 59], value: second }
    );
  }
  return data;
}

type DateElementProps<T, F> = Pick<
  WidgetProps<T, F>,
  | "value"
  | "disabled"
  | "readonly"
  | "autofocus"
  | "registry"
  | "onBlur"
  | "onFocus"
> & {
  rootId: string;
  select: (property: keyof DateObject, value: any) => void;
  type: string;
  range: [number, number];
};

function DateElement<T, F>({
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
}: DateElementProps<T, F>) {
  const id = rootId + "_" + type;
  const { SelectWidget } = registry.widgets;
  return (
    <SelectWidget
      schema={{ type: "integer" }}
      id={id}
      className="form-control"
      options={{ enumOptions: rangeOptions(range[0], range[1]) }}
      placeholder={type}
      value={value}
      disabled={disabled}
      readonly={readonly}
      autofocus={autofocus}
      onChange={(value: any) => select(type as keyof DateObject, value)}
      onBlur={onBlur}
      onFocus={onFocus}
      registry={registry}
      label=""
    />
  );
}

/** The `AltDateWidget` is an alternative widget for rendering date properties.
 * @param props - The `WidgetProps` for this component
 */
function AltDateWidget<T = any, F = any>({
  time = false,
  disabled = false,
  readonly = false,
  autofocus = false,
  options,
  id,
  registry,
  onBlur,
  onFocus,
  onChange,
  value,
}: WidgetProps<T, F>) {
  const [state, setState] = useReducer(
    (state: DateObject, action: Partial<DateObject>) => {
      return { ...state, ...action };
    },
    parseDateString(value, time)
  );

  useEffect(() => {
    if (value && value !== toDateString(state, time)) {
      setState(parseDateString(value, time));
    }
  }, [value, state, time]);

  useEffect(() => {
    if (readyForChange(state)) {
      // Only propagate to parent state if we have a complete date{time}
      onChange(toDateString(state, time));
    }
  }, [state, time, onChange]);

  const handleChange = useCallback(
    (property: keyof DateObject, value: string) => {
      setState({ [property]: value });
    },
    []
  );

  const handleSetNow = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      if (disabled || readonly) {
        return;
      }
      const nowDateObj = parseDateString(new Date().toJSON(), time);
      setState(nowDateObj);
    },
    [disabled, readonly, time]
  );

  const handleClear = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      if (disabled || readonly) {
        return;
      }
      setState(parseDateString("", time));
      onChange(undefined);
    },
    [disabled, readonly, time, onChange]
  );

  return (
    <ul className="list-inline">
      {dateElementProps(
        state,
        time,
        options.yearsRange as [number, number] | undefined
      ).map((elemProps, i) => (
        <li key={i}>
          <DateElement
            rootId={id}
            select={handleChange}
            {...elemProps}
            disabled={disabled}
            readonly={readonly}
            registry={registry}
            onBlur={onBlur}
            onFocus={onFocus}
            autofocus={autofocus && i === 0}
          />
        </li>
      ))}
      {(options.hideNowButton !== "undefined"
        ? !options.hideNowButton
        : true) && (
        <li>
          <a href="#" className="btn btn-info btn-now" onClick={handleSetNow}>
            Now
          </a>
        </li>
      )}
      {(options.hideClearButton !== "undefined"
        ? !options.hideClearButton
        : true) && (
        <li>
          <a
            href="#"
            className="btn btn-warning btn-clear"
            onClick={handleClear}
          >
            Clear
          </a>
        </li>
      )}
    </ul>
  );
}

export default AltDateWidget;
