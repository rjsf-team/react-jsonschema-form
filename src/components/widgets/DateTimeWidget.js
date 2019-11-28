import React from "react";
import PropTypes from "prop-types";

import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker,
  DatePicker,
  KeyboardDateTimePicker,
  DateTimePicker,
} from "@material-ui/pickers";

import MomentUtils from "@date-io/moment";
import moment from "moment";

function DateTimeWidget(props) {
  const { options, value, onChange } = props;

  const minDate = options.minDate
    ? moment(options.minDate)
    : moment().subtract(100, "years");
  const maxDate = options.maxDate
    ? moment(options.maxDate)
    : moment().add(100, "years");
  if (
    options.formatPattern === undefined ||
    options.formatPattern === null ||
    options.formatPattern === ""
  ) {
    options.formatPattern = options.renderDateTimePickerAsDatePicker
      ? "YYYY-MM-DD"
      : "YYYY-MM-DD HH:mm";
  }

  if (
    options.convertDateTimeToUtc === undefined ||
    options.convertDateTimeToUtc === null ||
    options.convertDateTimeToUtc === ""
  ) {
    options.convertDateTimeToUtc = true;
  }

  if (
    options.keyboard === undefined ||
    options.keyboard === null ||
    options.keyboard === ""
  ) {
    options.keyboard = false;
  }

  console.log(
    "options.keyboard ",
    options.keyboard,
    "typeof options.keyboard",
    typeof options.keyboard
  );

  return (
    <MuiPickersUtilsProvider
      utils={MomentUtils}
      locale={props.selectedLocale}
      moment={moment}>
      {options.keyboard && (
        <div className="picker">
          {options.renderDateTimePickerAsDatePicker ? (
            <KeyboardDatePicker
              {...props}
              {...options}
              format={options.formatPattern}
              minDate={minDate}
              maxDate={maxDate}
              value={value !== undefined ? moment(value) : null}
              onChange={date => {
                if (!date) {
                  return onChange(undefined);
                }
                if (!date._isValid) {
                  return onChange(undefined);
                }
                let utcDate = moment(date);
                var modifiedDatePerOptions = utcDate.startOf("day");
                if (options.setDateTimeToEndOf) {
                  modifiedDatePerOptions = modifiedDatePerOptions.endOf(
                    options.setDateTimeToEndOf
                  );
                }
                return onChange(
                  options.convertDateTimeToUtc
                    ? modifiedDatePerOptions.toJSON()
                    : modifiedDatePerOptions.format("YYYY-MM-DD HH:mm:ss")
                );
              }}
              onClear={e => {
                // this.setState({ selectedDate: undefined });
                return onChange(undefined);
              }}
              onInputChange={e => {
                // this.setState({ selectedDate: event.target.value });
              }}
            />
          ) : (
            <KeyboardDateTimePicker
              {...props}
              {...options}
              format={options.formatPattern}
              minDate={minDate}
              maxDate={maxDate}
              value={value !== undefined ? moment(value) : null}
              onChange={date => {
                // this.setState({ selectedDate: date });
                if (!date) {
                  return onChange(undefined);
                }
                if (!date._isValid) {
                  return onChange(undefined);
                }
                let utcDate = moment(date);
                var modifiedDatePerOptions = utcDate.startOf("minute");
                if (options.setDateTimeToEndOf) {
                  modifiedDatePerOptions = modifiedDatePerOptions.endOf(
                    options.setDateTimeToEndOf
                  );
                }
                return onChange(
                  options.convertDateTimeToUtc
                    ? modifiedDatePerOptions.toJSON()
                    : modifiedDatePerOptions.format("YYYY-MM-DD HH:mm:ss")
                );
              }}
              onClear={e => {
                // this.setState({ selectedDate: undefined });
                return onChange(undefined);
              }}
              onInputChange={e => {
                // this.setState({ selectedDate: event.target.value });
              }}
            />
          )}
        </div>
      )}

      {!options.keyboard && (
        <div className="picker">
          {options.renderDateTimePickerAsDatePicker ? (
            <DatePicker
              {...props}
              {...options}
              format={options.formatPattern}
              minDate={minDate}
              maxDate={maxDate}
              keyboard={false}
              value={value !== undefined ? moment(value) : null}
              onChange={date => {
                if (!date) {
                  return onChange(undefined);
                }
                if (!date._isValid) {
                  return onChange(undefined);
                }
                let utcDate = moment(date);
                var modifiedDatePerOptions = utcDate.startOf("day");
                if (options.setDateTimeToEndOf) {
                  modifiedDatePerOptions = modifiedDatePerOptions.endOf(
                    options.setDateTimeToEndOf
                  );
                }
                return onChange(
                  options.convertDateTimeToUtc
                    ? modifiedDatePerOptions.toJSON()
                    : modifiedDatePerOptions.format("YYYY-MM-DD HH:mm:ss")
                );
              }}
              onClear={e => {
                // this.setState({ selectedDate: undefined });
                return onChange(undefined);
              }}
              onInputChange={e => {
                // this.setState({ selectedDate: event.target.value });
              }}
            />
          ) : (
            <DateTimePicker
              {...props}
              {...options}
              format={options.formatPattern}
              minDate={minDate}
              maxDate={maxDate}
              keyboard={false}
              value={value !== undefined ? moment(value) : null}
              onChange={date => {
                // this.setState({ selectedDate: date });
                if (!date) {
                  return onChange(undefined);
                }
                if (!date._isValid) {
                  return onChange(undefined);
                }
                let utcDate = moment(date);
                var modifiedDatePerOptions = utcDate.startOf("minute");
                if (options.setDateTimeToEndOf) {
                  modifiedDatePerOptions = modifiedDatePerOptions.endOf(
                    options.setDateTimeToEndOf
                  );
                }
                return onChange(
                  options.convertDateTimeToUtc
                    ? modifiedDatePerOptions.toJSON()
                    : modifiedDatePerOptions.format("YYYY-MM-DD HH:mm:ss")
                );
              }}
              onClear={e => {
                // this.setState({ selectedDate: undefined });
                return onChange(undefined);
              }}
              onInputChange={e => {
                // this.setState({ selectedDate: event.target.value });
              }}
            />
          )}
        </div>
      )}
    </MuiPickersUtilsProvider>
  );
}

if (process.env.NODE_ENV !== "production") {
  DateTimeWidget.propTypes = {
    value: PropTypes.string,
  };
}

export default DateTimeWidget;
