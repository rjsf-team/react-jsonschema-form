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
  shouldComponentUpdate(nextProps, nextState) {
    let result = moment(nextState.selectedDate, nextProps.options.formatPattern, true).isValid();
    if (!result) {nextProps.onChange(undefined);}
    else {
      let utcDate = moment(nextState.selectedDate);
      var modifiedDatePerOptions = utcDate.startOf("day");
      if (nextProps.options.setDateTimeToEndOf) {
        modifiedDatePerOptions = modifiedDatePerOptions.endOf(
          nextProps.options.setDateTimeToEndOf
        );
      }
      nextProps.onChange(modifiedDatePerOptions.format("YYYY-MM-DD"));
    }
    if (nextState.selectedDate === undefined) {
      result = true;
    }
    return result;
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
if (options.formatPattern === undefined
      || options.formatPattern === null
      || options.formatPattern === '') {   
      options.formatPattern = "YYYY-MM-DD";
    }
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
              return onChange(modifiedDatePerOptions.format("YYYY-MM-DD"));
            }}
            onClear={e => {
              this.setState({ selectedDate: undefined });
              return onChange(undefined);
            }}
            onInputChange={e => {
              this.setState({ selectedDate: event.target.value });
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
