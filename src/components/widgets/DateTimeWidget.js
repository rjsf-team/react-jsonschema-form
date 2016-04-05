import React, { Component, PropTypes } from "react";

import { shouldRender, parseDateString, toDateString, pad } from "../../utils";
import SelectWidget from "../widgets/SelectWidget";


function rangeOptions(start, stop) {
  let options = [];
  for (let i=start; i<= stop; i++) {
    options.push({value: i, label: pad(i, 2)});
  }
  return options;
}

function DateElement({type, range, value, select, rootId}) {
  const id = rootId + "_" + type;
  return (
    <li>
      <SelectWidget
        schema={{type: "integer"}}
        id={id}
        className="form-control"
        options={rangeOptions(range[0], range[1])}
        value={value}
        onChange={select} />
      <p className="text-center help-block">
        <label htmlFor={id}><small>{type}</small></label>
      </p>
    </li>
  );
}

class DateTimeWidget extends Component {
  constructor(props) {
    super(props);
    this.state = parseDateString(props.value || props.defaultValue);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(parseDateString(nextProps.value || nextProps.defaultValue));
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  onChange = (property, value) => {
    this.setState({[property]: value}, () => {
      this.props.onChange(toDateString(this.state));
    });
  };

  onYearChange   = (value) => this.onChange("year", value);
  onMonthChange  = (value) => this.onChange("month", value);
  onDayChange    = (value) => this.onChange("day", value);
  onHourChange   = (value) => this.onChange("hour", value);
  onMinuteChange = (value) => this.onChange("minute", value);
  onSecondChange = (value) => this.onChange("second", value);

  render() {
    const {id} = this.props;
    const {year, month, day, hour, minute, second} = this.state;
    return (
      <ul className="list-inline">
        <DateElement type="year" rootId={id} range={[1900, 2020]}
          value={year} select={this.onYearChange} />
        <DateElement type="month" rootId={id} range={[1, 12]}
          value={month} select={this.onMonthChange} />
        <DateElement type="day" rootId={id} range={[1, 31]}
          value={day} select={this.onDayChange} />
        <DateElement type="hour" rootId={id} range={[0, 23]}
          value={hour} select={this.onHourChange} />
        <DateElement type="minute" rootId={id} range={[0, 59]}
          value={minute} select={this.onMinuteChange} />
        <DateElement type="second" rootId={id} range={[0, 59]}
          value={second} select={this.onSecondChange} />
      </ul>
    );
  }
}

if (process.env.NODE_ENV !== "production") {
  DateTimeWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: React.PropTypes.string,
    defaultValue: React.PropTypes.string,
    required: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default DateTimeWidget;
