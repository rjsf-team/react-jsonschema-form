import React, {Component, PropTypes} from "react";

import {shouldRender, parseDateString, toDateString, pad} from "../../utils";
import SelectWidget from "../widgets/SelectWidget";

const ASCENDING = "asc"
const DESCENDING = "desc"

function rangeOptions(type, start, stop, orderYearBy) {
  let options = [{value: -1, label: "-- " + type + "--"}];
  
  if (type === "year" && orderYearBy.toLowerCase() === DESCENDING) {
    for (let i=stop; i>= start; i--) {
      options.push({value: i, label: pad(i, 2)});
    } 
  } else {
    for (let i=start; i<= stop; i++) {
      options.push({value: i, label: pad(i, 2)});
    } 
  }

  return options;
}

function readyForChange(state) {
  return Object.keys(state).every(key => state[key] !== -1);
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
    this.setState(parseDateString(nextProps.value, nextProps.time));
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  onChange = (property, value) => {
    this.setState({[property]: value}, () => {
      // Only propagate to parent state if we have a complete date{time}
      if (readyForChange(this.state)) {
        this.props.onChange(toDateString(this.state, this.props.time));
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
    const data = [
      {type: "year", range: [options.yearRange[0], options.yearRange[1]], value: year},
      {type: "month", range: [1, 12], value: month},
      {type: "day", range: [1, 31], value: day},
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
