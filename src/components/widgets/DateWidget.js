import React from "react";
import PropTypes from "prop-types";
import { DatePicker, MuiPickersUtilsProvider } from "material-ui-pickers";
import MomentUtils from "@date-io/moment";
import moment from "moment";

function DateWidget(props) {
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
    options.formatPattern = "YYYY-MM-DD";
  }
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
          value={value !== undefined ? moment(value) : null}
          onChange={date => {
            // this.setState({ selectedDate: date });
            if (!date) {
              return onChange(undefined);
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
          onClear={e => {
            // this.setState({ selectedDate: undefined });
            return onChange(undefined);
          }}
          onInputChange={e => {
            // this.setState({ selectedDate: event.target.value });
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
