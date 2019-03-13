import { DatePicker, MuiPickersUtilsProvider } from "material-ui-pickers";

import MomentUtils from "@date-io/moment";
import PropTypes from "prop-types";
import React from "react";
import moment from "moment";

class DateWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedDate: this.props.value
    };
  }
  render() {
    const { options, onChange } = this.props;
    let { selectedDate } = this.state;
    const minDate = options.minDate
      ? moment(options.minDate)
      : moment().subtract(100, "years");
    const maxDate = options.maxDate
      ? moment(options.maxDate)
      : moment().add(100, "years");
    return (
      <MuiPickersUtilsProvider
        utils={MomentUtils}
        locale={this.props.selectedLocale}
        moment={moment}>
        <div className="picker">
          <DatePicker
            {...this.props}
            {...options}
            format={options.formatPattern}
            minDate={minDate}
            maxDate={maxDate}
            value={selectedDate !== undefined ? moment(selectedDate) : null}
            onChange={date => {
              this.setState({ selectedDate: date });
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
              return onChange(modifiedDatePerOptions.toJSON());
            }}
            onClear={e => {
              this.setState({ selectedDate: undefined });
              return onChange(undefined);
            }}
          />
        </div>
      </MuiPickersUtilsProvider>
    );
  }
}
if (process.env.NODE_ENV !== "production") {
  DateWidget.propTypes = {
    value: PropTypes.string
  };
}

export default DateWidget;
