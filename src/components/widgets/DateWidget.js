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
  const maxDate = options.maxDate
    ? moment(options.maxDate)
    : moment().add(100, "years");
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
          maxDate={maxDate}
          value={value !== undefined ? moment.utc(value) : ""}
          onChange={date => {
            if (!date) {
              return onChange("");
            }
            let utcDate = moment(date);
            var modifiedDatePerOptions = utcDate.startOf("day");
            if (options.setDateTimeToEndOf) {
              modifiedDatePerOptions = modifiedDatePerOptions.endOf(
                options.setDateTimeToEndOf
              );
            }
            return onChange(modifiedDatePerOptions.format("YYYY-MM-DD"));
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
