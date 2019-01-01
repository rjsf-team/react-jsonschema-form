import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import MomentUtils from "@date-io/moment";
import { DatePicker, MuiPickersUtilsProvider } from "material-ui-pickers";

function DateWidget(props) {
  const { value, options, onChange } = props;
  const minDate = options.minDate
    ? moment(options.minDate)
    : moment().subtract(100, "years");
  return (
    <MuiPickersUtilsProvider
      utils={MomentUtils}
      locale={props.selectedLocale}
      moment={moment}>
      <div className="picker">
        <DatePicker
          {...props}
          {...options}
          format={options.formatPattern}
          minDate={minDate}
          value={value !== undefined ? moment(value) : ""}
          onChange={date => {
            // console.log("on change DatePicker val ", date);
            onChange(
              date
                ? moment(date)
                    .startOf("day")
                    .format("YYYY-MM-DD")
                : ""
            );
          }}
        />
      </div>
    </MuiPickersUtilsProvider>
  );
}

if (process.env.NODE_ENV !== "production") {
  DateWidget.propTypes = {
    value: PropTypes.string,
  };
}

export default DateWidget;
