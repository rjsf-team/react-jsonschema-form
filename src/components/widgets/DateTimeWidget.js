import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import MomentUtils from "@date-io/moment";

import { DateTimePicker, MuiPickersUtilsProvider } from "material-ui-pickers";

function DateTimeWidget(props) {
  const { value, options, onChange } = props;
  return (
    <MuiPickersUtilsProvider
      utils={MomentUtils}
      locale={props.selectedLocale}
      moment={moment}>
      <div className="picker">
        <DateTimePicker
          {...props}
          {...options}
          format={options.formatPattern}
          value={value ? moment(value) : value}
          onChange={date => onChange(date ? date.toJSON() : "")}
        />
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
