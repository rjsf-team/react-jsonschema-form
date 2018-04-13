import React from "react";
import PropTypes from "prop-types";
import { pad } from "../../utils";

export function utcToLocal(jsonDate) {
  if (!jsonDate) {
    return "";
  }

  // required format of `"yyyy-MM-ddThh:mm" followed by optional ":ss" or ":ss.SSS"
  // https://html.spec.whatwg.org/multipage/input.html#local-date-and-time-state-(type%3Ddatetime-local)
  // > should be a _valid local date and time string_ (not GMT)

  // Note - date constructor passed local ISO-8601 does not correctly
  // change time to UTC in node pre-8
  const date = new Date(jsonDate);

  const yyyy = pad(date.getFullYear(), 4);
  const MM = pad(date.getMonth() + 1, 2);
  const dd = pad(date.getDate(), 2);
  const hh = pad(date.getHours(), 2);
  const mm = pad(date.getMinutes(), 2);
  const ss = pad(date.getSeconds(), 2);
  const SSS = pad(date.getMilliseconds(), 3);

  // Users can specify precision using step attribute otherwise (some) browsers automatically trim off when 0
  // and this value difference breaks the cursor position from ambiguity in the change diff
  // For example if an existing value is set and user focuses into the year field and types 1957, they
  // go from 0001 and inbetween the 1 and the 9 the field renders current value in a format browser changes and
  // so react sees the values as diff and resets cursor resulting in 0009 and then 0005 instead of the intended 1957.
  return SSS === "000"
    ? ss === "00"
      ? `${yyyy}-${MM}-${dd}T${hh}:${mm}`
      : `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}`
    : `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}.${SSS}`;
}

export function localToUTC(dateString) {
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
      value={utcToLocal(value)}
      onChange={value => onChange(localToUTC(value))}
    />
  );
}

if (process.env.NODE_ENV !== "production") {
  DateTimeWidget.propTypes = {
    value: PropTypes.string,
  };
}

export default DateTimeWidget;
