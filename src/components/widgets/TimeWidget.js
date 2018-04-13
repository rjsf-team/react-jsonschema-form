import React from "react";
import PropTypes from "prop-types";
import { pad } from "../../utils";

export const isHHMMFormat = /^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]$/;
export const is24HourFormatWithMilli = /^(?:2[0-3]|[01]?[0-9]):[0-5][0-9](?::[0-5][0-9](?:.[0-9][0-9][0-9])?)?$/;

/**
 * Convert stored form RFC3339 format HH:MM:SS into format suitable for input in typical browsers (HH:MM).
 *
 * Ideal world could hand as-is, but for browsers that do not support input="time" we can do the formatting for them.
 *
 * @param jsonDate
 * @returns {string}
 */
export function sanitizeValueForBrowserInput(jsonDate) {
  if (!jsonDate) {
    return "";
  }

  // If we do not understand we should either bail or maintain value
  // Unsure of proper avenue we are maintaining value in hopes to do least harm incase of data mismatch..
  // Validator should catch it as should browser. Alternative deletes their data and enforce valid values.
  if (!jsonDate.match(is24HourFormatWithMilli)) {
    return jsonDate;
  }

  // https://tools.ietf.org/html/rfc3339

  // https://html.spec.whatwg.org/multipage/input.html#time-state-(type=time)
  // The algorithm to convert a string to a Date object, given a string input, is as follows: If parsing a time from
  // input results in an error, then return an error; otherwise, return a new Date object representing the parsed
  // time in UTC on 1970-01-01.

  const date = new Date("1970-01-01T" + jsonDate);

  const hh = pad(date.getHours(), 2);
  const mm = pad(date.getMinutes(), 2);
  const ss = pad(date.getSeconds(), 2);
  const SSS = pad(date.getMilliseconds(), 3);

  // Users can specify precision using step attribute otherwise (some) browsers automatically trim off when 0
  // and this value difference breaks the cursor position from ambiguity in the change diff
  // For example if existing value is 1:10 and want 1:15 then when typing "1" and "5" into minutes section
  // state will quickly go to 1:10:00.000 and when diffed with "1:10" will accept next keypress as 1:05 instead of
  // the intended 1:15
  return SSS === "000"
    ? ss === "00" ? `${hh}:${mm}` : `${hh}:${mm}:${ss}`
    : `${hh}:${mm}:${ss}.${SSS}`;
}

/**
 * Convert HH:MM to HH:MM:SS.SSS
 *
 * Use of ajv and [RFC3339](https://tools.ietf.org/html/rfc3339) means we need the seconds to be present
 * for valid "time" format but browsers tend to prefer HH:MM without :SS which ajv will fail.
 *
 * https://html.spec.whatwg.org/multipage/input.html#time-state-(type=time) describes the algorithm for parsing
 * string to Date object as using the given time on date 1970-01-01, so this function uses this that approach.
 *
 * @param time Time string from input.
 * @returns {string}
 */
export function ensureSecondsArePresentInTimeFormat(time) {
  if (!time) {
    return "";
  }

  // if (!time.match(isHHMMFormat)) {
  //   return time;
  // }

  const timeVers = new Date("1970-01-01T" + time);
  return (
    pad(timeVers.getHours(), 2) +
    ":" +
    pad(timeVers.getMinutes(), 2) +
    ":" +
    pad(timeVers.getSeconds(), 2) +
    "." +
    (timeVers.getMilliseconds() / 1000).toFixed(3).slice(2, 5)
  );
}

function TimeWidget(props) {
  const {
    value,
    onChange,
    registry: { widgets: { BaseInput } },
    options: { step },
  } = props;
  return (
    <BaseInput
      type="time"
      {...props}
      value={sanitizeValueForBrowserInput(value)}
      onChange={value => onChange(ensureSecondsArePresentInTimeFormat(value))}
      step={step ? step : null}
    />
  );
}

if (process.env.NODE_ENV !== "production") {
  TimeWidget.propTypes = {
    value: PropTypes.string,
  };
}

export default TimeWidget;
