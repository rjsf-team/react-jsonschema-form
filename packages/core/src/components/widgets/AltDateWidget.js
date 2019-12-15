import React, { useReducer, useEffect } from "react";
import PropTypes from "prop-types";

import { parseDateString, toDateString, pad } from "../../utils";

function rangeOptions(start, stop) {
  let options = [];
  for (let i = start; i <= stop; i++) {
    options.push({ value: i, label: pad(i, 2) });
  }
  return options;
}

function readyForChange(state) {
  return Object.keys(state).every(key => state[key] !== -1);
}

function DateElement(props) {
  const {
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
  } = props;
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
      onChange={value => select(type, value)}
      onBlur={onBlur}
    />
  );
}

function dateElementProps(state, time, options) {
  const { year, month, day, hour, minute, second } = state;
  const data = [
    { type: "year", range: options.yearsRange, value: year },
    { type: "month", range: [1, 12], value: month },
    { type: "day", range: [1, 31], value: day },
  ];
  if (time) {
    data.push(
      { type: "hour", range: [0, 23], value: hour },
      { type: "minute", range: [0, 59], value: minute },
      { type: "second", range: [0, 59], value: second }
    );
  }
  return data;
}

function AltDateWidget({
  time,
  disabled,
  readonly,
  autofocus,
  options,
  id,
  registry,
  onBlur,
  value,
  onChange,
}) {
  const [state, setState] = useReducer((state, action) => {
    const newState = { ...state, ...action };
    if (newState.millisecond === -1) {
      newState.millisecond = 0;
    }
    return newState;
  }, parseDateString(value, time));

  useEffect(
    () => {
      if (value !== toDateString(state, time)) {
        setState(parseDateString(value, time));
      }
    },
    [value]
  );

  useEffect(
    () => {
      if (readyForChange(state)) {
        // Only propagate to parent state if we have a complete date{time}
        onChange(toDateString(state, time));
      }
    },
    [state, time]
  );

  const handleChangeProp = (prop, newValue) => {
    setState({ [prop]: newValue });
  };

  const setNow = event => {
    event.preventDefault();
    if (disabled || readonly) {
      return;
    }
    const nowDateObj = parseDateString(new Date().toJSON(), time);
    setState(nowDateObj);
  };

  const clear = event => {
    event.preventDefault();
    if (disabled || readonly) {
      return;
    }
    setState(parseDateString("", time));
    onChange(undefined);
  };

  return (
    <ul className="list-inline">
      {dateElementProps(state, time, options).map((elemProps, i) => (
        <li key={i}>
          <DateElement
            rootId={id}
            select={handleChangeProp}
            {...elemProps}
            disabled={disabled}
            readonly={readonly}
            registry={registry}
            onBlur={onBlur}
            autofocus={autofocus && i === 0}
          />
        </li>
      ))}
      {(options.hideNowButton !== "undefined"
        ? !options.hideNowButton
        : true) && (
        <li>
          <a href="#" className="btn btn-info btn-now" onClick={setNow}>
            Now
          </a>
        </li>
      )}
      {(options.hideClearButton !== "undefined"
        ? !options.hideClearButton
        : true) && (
        <li>
          <a href="#" className="btn btn-warning btn-clear" onClick={clear}>
            Clear
          </a>
        </li>
      )}
    </ul>
  );
}

AltDateWidget.defaultProps = {
  time: false,
  disabled: false,
  readonly: false,
  autofocus: false,
  options: {
    yearsRange: [1900, new Date().getFullYear() + 2],
  },
};

if (process.env.NODE_ENV !== "production") {
  AltDateWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    value: PropTypes.string,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    autofocus: PropTypes.bool,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    time: PropTypes.bool,
    options: PropTypes.object,
  };
}

export default AltDateWidget;
