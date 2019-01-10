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
            value={value !== undefined ? moment(value) : null}
            onChange={date =>
              onChange(
                date
                  ? moment(date)
                      .startOf("day")
                      .toJSON()
                  : ""
              )
            }
            // onChange={date => onChange(date ? moment(date).startOf("day").format("MM-DD-YYYY HH:MM:SS") : "")}
          />
        ) : (
          <DateTimePicker
            {...props}
            {...options}
            format={options.formatPattern}
            value={value !== undefined ? moment(value) : null}
            onChange={date => onChange(date ? moment(date).toJSON() : "")}
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
