import React, {Component, PropTypes} from "react";

import {shouldRender, parseDateString, toDateString, pad} from "../../utils";
import SelectWidget from "../widgets/SelectWidget";

const ASCENDING = "asc"
const DESCENDING = "desc"

const monthLabels = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function rangeOptions(type, start, stop, orderYearBy) {
  // Capitalize the first character of the type
  let typeLabel = type.toLowerCase().replace(/\b[a-z](?=[a-z]{2})/g, function(letter) {
    return letter.toUpperCase(); } );

  let options = [{value: -1, label: typeLabel + "..."}];
  
  // Check if the year's options order is DESCENDING
  if (type === "year" && orderYearBy.toLowerCase() === DESCENDING) {
    for (let i=stop; i>= start; i--) {
      options.push({value: i, label: pad(i, 2)});
    } 
  } else {
    // Else, set the options in ASCENDING order
    for (let i=start; i<= stop; i++) {
      // If the type is month, use string labels instead of integers
      options.push({value: i, label: type === "month" ? monthLabels[i-1] : pad(i, 2)});
    } 
  }

  return options;
}

function readyForChange(state) {
  return Object.keys(state).every(key => {
    return state[key] !== -1
  });
}

function DateElement(props) {
  const {type, range, value, select, rootId, disabled, readonly, autofocus, widgetOptions} = props;
  const id = rootId + "_" + type;

  return (
    <SelectWidget
      schema={{type: "integer"}}
      id={id}
      className="form-control"
      options={{enumOptions: rangeOptions(type, range[0], range[1], widgetOptions.orderYearBy)}}
      value={value}
      disabled={disabled}
      readonly={readonly}
      autofocus={autofocus}
      onChange={(value) => select(type, value)}/>
  );
}

function daysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

class EPBCDateWidget extends Component {
  static defaultProps = {
    time: false,
    disabled: false,
    readonly: false,
    autofocus: false,
    options: {
      yearRange: [new Date().getFullYear() - 100, new Date().getFullYear()],
      enableNow: true,
      enableClear: true,
      orderYearBy: "ASC"
    }
  };

  constructor(props) {
    super(props);
    this.state = parseDateString(props.value, props.time);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== undefined) {
      this.setState(parseDateString(nextProps.value, nextProps.time));
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  onChange = (property, value) => {
    value = parseInt(value);

    let newState;

    // If the year has changed, and month and day is set
    if (property === "year" && this.state.month !== -1 && this.state.day !== -1){
      let newYearValue = value;

      // Check if the currently set day is within the new year and month
      if (this.state.day <= daysInMonth(newYearValue, this.state.month)) {
        newState = {[property]: value};
      } else {
        // Else, deselect the day
        newState = {[property]: value, day: -1};
      }
    
    // If the month has changed, and year and day is set
    } else if (property === "month" && this.state.year !== -1 && this.state.day !== -1) {
      let newMonthValue = value
      // Check if the currently set day is within the year and new month
      if (this.state.day <= daysInMonth(this.state.year, newMonthValue)) {
        newState = {[property]: value};
      } else {
        // Else, deselect the day
        newState = {[property]: value, day: -1};
      }
    } else {
      // Else, set the date as usual
      newState = {[property]: value};
    }

    this.setState(newState, () => {
      // Only propagate to parent state if we have a complete date{time}
      if (readyForChange(this.state)) {
         this.props.onChange(toDateString(this.state, this.props.time));
      } else {
        // Else, set the date to undefined
        this.props.onChange(undefined);
      }
    });
  };

  setNow = (event) => {
    event.preventDefault();
    const {time, disabled, readonly, onChange} = this.props;
    if (disabled || readonly) {
      return;
    }
    const nowDateObj = parseDateString(new Date().toJSON(), time);
    this.setState(nowDateObj, () => onChange(toDateString(this.state, time)));
  };

  clear = (event) => {
    event.preventDefault();
    const {time, disabled, readonly, onChange} = this.props;
    if (disabled || readonly) {
      return;
    }
    this.setState(parseDateString("", time), () => onChange(undefined));
  };

  get dateElementProps() {
    const {time, options} = this.props;
    const {year, month, day, hour, minute, second} = this.state;

    // If the year and month are set, then calculate the max number of days,
    // otherwise, set to days in the month to 31 
    let maxDays = year !== -1 && month !== -1 ? daysInMonth(year, month) : 31;

    const data = [
      {type: "year", range: [options.yearRange[0], options.yearRange[1]], value: year},
      {type: "month", range: [1, 12], value: month},
      {type: "day", range: [1, maxDays], value: day},
    ];
    if (time) {
      data.push(
        {type: "hour", range: [0, 23], value: hour},
        {type: "minutes", range: [0, 59], value: minute},
        {type: "seconds", range: [0, 59], value: second}
      );
    }
    return data;
  }

  render() {
    const {id, disabled, readonly, autofocus, options} = this.props;
    return (
      <ul className="list-inline">{
        this.dateElementProps.map((elemProps, i) => (
          <li key={i}>
            <DateElement
              rootId={id}
              select={this.onChange}
              {...elemProps}
              disabled= {disabled}
              readonly={readonly}
              autofocus={autofocus && i === 0}
              widgetOptions={options}/>
          </li>
        ))
      }
        {options.enableNow ? <li>
          <a href="#" className="btn btn-info btn-now"
             onClick={this.setNow}>Now</a>
        </li> : null}
        {options.enableClear ? <li>
          <a href="#" className="btn btn-warning btn-clear"
             onClick={this.clear}>Clear</a>
        </li> : null}
      </ul>
    );
  }
}

if (process.env.NODE_ENV !== "production") {
  EPBCDateWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    value: React.PropTypes.string,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    autofocus: PropTypes.bool,
    options: PropTypes.shape({
      yearRange: PropTypes.array,
      enableNow: PropTypes.bool,
      enableClear: PropTypes.bool,
      orderYearBy: PropTypes.string
    }),
    onChange: PropTypes.func,
    time: PropTypes.bool,
  };
}

export default EPBCDateWidget;
