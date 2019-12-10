import React, { Component } from "react";
import PropTypes from "prop-types";

import { shouldRender, parseDateString, toDateString, pad } from "../../utils";

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
    placeholder,
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
      placeholder={placeholder}
      value={value}
      disabled={disabled}
      readonly={readonly}
      autofocus={autofocus}
      onChange={value => select(type, value)}
      onBlur={onBlur}
    />
  );
}

const defaultLabels = {
  now: "Now",
  clear: "Clear",
};

const defaultPlaceholders = {
  year: "year",
  month: "month",
  day: "day",
  hour: "hour",
  minute: "minute",
  second: "second",
};

class AltDateWidget extends Component {
  static defaultProps = {
    time: false,
    disabled: false,
    readonly: false,
    autofocus: false,
    options: {
      yearsRange: [1900, new Date().getFullYear() + 2],
      labels: defaultLabels,
      placeholders: defaultPlaceholders,
    },
  };

  constructor(props) {
    super(props);
    this.state = parseDateString(props.value, props.time);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState(parseDateString(nextProps.value, nextProps.time));
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
          this.props.onChange(toDateString(this.state, this.props.time));
        }
      }
    );
  };

  setNow = event => {
    event.preventDefault();
    const { time, disabled, readonly, onChange } = this.props;
    if (disabled || readonly) {
      return;
    }
    const nowDateObj = parseDateString(new Date().toJSON(), time);
    this.setState(nowDateObj, () => onChange(toDateString(this.state, time)));
  };

  clear = event => {
    event.preventDefault();
    const { time, disabled, readonly, onChange } = this.props;
    if (disabled || readonly) {
      return;
    }
    this.setState(parseDateString("", time), () => onChange(undefined));
  };

  get dateElementProps() {
    const {
      time,
      options: { placeholders, ...options },
    } = this.props;
    const { year, month, day, hour, minute, second } = this.state;
    const data = [
      {
        type: "year",
        placeholder: placeholders.year || defaultPlaceholders.year,
        range: options.yearsRange,
        value: year,
      },
      {
        type: "month",
        placeholder: placeholders.month || defaultPlaceholders.month,
        range: [1, 12],
        value: month,
      },
      {
        type: "day",
        placeholder: placeholders.day || defaultPlaceholders.day,
        range: [1, 31],
        value: day,
      },
    ];
    if (time) {
      data.push(
        {
          type: "hour",
          placeholder: placeholders.hour || defaultPlaceholders.hour,
          range: [0, 23],
          value: hour,
        },
        {
          type: "minute",
          placeholder: placeholders.minute || defaultPlaceholders.minute,
          range: [0, 59],
          value: minute,
        },
        {
          type: "second",
          placeholder: placeholders.second || defaultPlaceholders.second,
          range: [0, 59],
          value: second,
        }
      );
    }
    return data;
  }

  render() {
    const {
      id,
      disabled,
      readonly,
      autofocus,
      registry,
      onBlur,
      options: { labels, ...options },
    } = this.props;
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
        {(options.hideNowButton !== "undefined"
          ? !options.hideNowButton
          : true) && (
          <li>
            <a href="#" className="btn btn-info btn-now" onClick={this.setNow}>
              {labels.now || defaultLabels.now}
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
              onClick={this.clear}>
              {labels.clear || defaultLabels.clear}
            </a>
          </li>
        )}
      </ul>
    );
  }
}

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
