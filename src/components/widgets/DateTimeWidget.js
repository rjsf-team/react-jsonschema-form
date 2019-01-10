import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import MomentUtils from "@date-io/moment";

import {
  DatePicker,
  DateTimePicker,
  MuiPickersUtilsProvider,
} from "material-ui-pickers";

function DateTimeWidget(props) {
  const { value, options, onChange } = props;
  const minDate = options.minDate
    ? moment(options.minDate)
    : moment().subtract(100, "years");
  const maxDate = options.maxDate
    ? moment(options.maxDate)
    : moment().add(100, "years");
  return (
    <MuiPickersUtilsProvider
      utils={MomentUtils}
      locale={props.selectedLocale}
      moment={moment}>
      <div className="picker">
        {options.renderDateTimePickerAsDatePicker ? (
          <DatePicker
            {...props}
            {...options}
            format={options.formatPattern}
            minDate={minDate}
            maxDate={maxDate}
            value={value !== undefined ? moment(value) : null}
            onChange={date => {
              return onChange(
                date
                  ? moment(date)
                      .startOf("day")
                      .toJSON()
                  : ""
              );
            }}
            // onChange={date => onChange(date ? moment(date).startOf("day").format("MM-DD-YYYY HH:MM:SS") : "")}
          />
        ) : (
          <DateTimePicker
            {...props}
            {...options}
            format={options.formatPattern}
            minDate={minDate}
            maxDate={maxDate}
            value={value !== undefined ? moment(value) : null}
            onChange={date => {
              // console.log("on change DateTimePicker val ", date);
              onChange(
                date
                  ? moment(date)
                      .startOf("minute")
                      .toJSON()
                  : ""
              );
            }}
            // onChange={date => onChange(date ? moment(date).startOf("day").format("MM-DD-YYYY HH:MM:SS") : "")}
          />
        )}
      </div>
    </MuiPickersUtilsProvider>
  );
}

if (process.env.NODE_ENV !== "production") {
  DateTimeWidget.propTypes = {
    value: PropTypes.string,
  };
}

export default DateTimeWidget;
