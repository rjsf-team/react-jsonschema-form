import React from "react";
import PropTypes from "prop-types";

function pad(p, n) {
  return String(n).padStart(p, 0);
}

function fromJSONDate(jsonDate) {
  if (!jsonDate) {
    return "";
  }

  // required format of `"yyyy-MM-ddThh:mm" followed by optional ":ss" or ":ss.SSS"
  // https://html.spec.whatwg.org/multipage/input.html#local-date-and-time-state-(type%3Ddatetime-local)
  // > should be a _valid local date and time string_ (not GMT)

  const date = Date.parse(jsonDate);

  const yyyy = pad(4, date.getFullYear());
  const MM = pad(2, date.getMonth() + 1);
  const dd = pad(2, date.getDate());
  const hh = pad(2, date.getHours());
  const mm = pad(2, date.getMinutes());
  const ss = pad(2, date.getSeconds());
  const SSS = pad(3, date.getMilliseconds());

  return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}.${SSS}`;
}

function toJSONDate(dateString) {
  if (dateString) {
    return new Date(dateString).toJSON();
  }
}

function DateTimeWidget(props) {
  const { value, onChange, registry: { widgets: { BaseInput } } } = props;
  return (
    <BaseInput
      type="datetime-local"
      {...props}
      value={fromJSONDate(value)}
      onChange={value => onChange(toJSONDate(value))}
    />
  );
}

if (process.env.NODE_ENV !== "production") {
  DateTimeWidget.propTypes = {
    value: PropTypes.string,
  };
}

export default DateTimeWidget;
