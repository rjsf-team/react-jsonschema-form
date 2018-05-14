import React, { Component } from "react";
import PropTypes from "prop-types";

import {
  shouldRender,
  parseDateString as _parseDateString,
  toDateString as _toDateString,
  pad,
} from "../../utils";

function parseTimeString(dateString) {
  if (dateString) {
    dateString = "1970-01-01T" + dateString + "Z";
  }
  let result = _parseDateString(dateString, true);
  if (result) {
    delete result.year;
    delete result.month;
    delete result.day;
  }
  return result;
}

function toTimeString(dataObj) {
  let tArgs = { ...dataObj };
  tArgs.year = 1970;
  tArgs.month = 1;
  tArgs.day = 1;
  let result = _toDateString(tArgs);
  return fromDateStringToTime(result);
}

/**
 *
 * @param dateString
 * @returns {*}
 */
function fromDateStringToTime(dateString) {
  if (dateString) {
    if (dateString.length >= 23) {
      return dateString.slice(11, 23);
    } else if (dateString.length === 19) {
      return dateString.slice(11, 19);
    }
  }
  console.warn(dateString + " is an unknown date format.");
  return dateString;
}

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

class AltTimeWidget extends Component {
  static defaultProps = {
    disabled: false,
    readonly: false,
    autofocus: false,
  };

  constructor(props) {
    super(props);
    this.state = parseTimeString(props.value);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(parseTimeString(nextProps.value));
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  onChange = (property, value) => {
    this.setState(
      { [property]: typeof value === "undefined" ? -1 : value },
      () => {
        // Only propagate to parent state if we have a complete date{time}
        if (readyForChange(this.state)) {
          this.props.onChange(toTimeString(this.state));
        }
      }
    );
  };

  setNow = event => {
    event.preventDefault();
    const { disabled, readonly, onChange } = this.props;
    if (disabled || readonly) {
      return;
    }
    const nowDateObj = _parseDateString(new Date().toJSON());
    this.setState(nowDateObj, () => onChange(toTimeString(this.state)));
  };

  clear = event => {
    event.preventDefault();
    const { disabled, readonly, onChange } = this.props;
    if (disabled || readonly) {
      return;
    }
    this.setState(parseTimeString(""), () => onChange(undefined));
  };

  get dateElementProps() {
    const { hour, minute, second } = this.state;
    const data = [
      { type: "hour", range: [0, 23], value: hour },
      { type: "minute", range: [0, 59], value: minute },
      { type: "second", range: [0, 59], value: second },
    ];
    return data;
  }

  render() {
    const { id, disabled, readonly, autofocus, registry, onBlur } = this.props;
    return (
      <ul className="list-inline">
        {this.dateElementProps.map((elemProps, i) => (
          <li key={i}>
            <DateElement
              rootId={id}
              select={this.onChange}
              {...elemProps}
              disabled={disabled}
              readonly={readonly}
              registry={registry}
              onBlur={onBlur}
              autofocus={autofocus && i === 0}
            />
          </li>
        ))}
        <li>
          <a href="#" className="btn btn-info btn-now" onClick={this.setNow}>
            Now
          </a>
        </li>
        <li>
          <a
            href="#"
            className="btn btn-warning btn-clear"
            onClick={this.clear}>
            Clear
          </a>
        </li>
      </ul>
    );
  }
}
console.log("abc");
if (process.env.NODE_ENV !== "production") {
  AltTimeWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    value: PropTypes.string,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    autofocus: PropTypes.bool,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
  };
}

export default AltTimeWidget;
