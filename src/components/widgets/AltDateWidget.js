import React, { Component, PropTypes } from "react";

import { shouldRender, parseDateString, toDateString, pad } from "../../utils";
import SelectWidget from "../widgets/SelectWidget";


function rangeOptions(type, start, stop) {
  let options = [{value: -1, label: type}];
  for (let i=start; i<= stop; i++) {
    options.push({value: i, label: pad(i, 2)});
  }
  return options;
}

function valid(state) {
  return Object.keys(state).every(key => state[key] !== -1);
}

function DateElement({type, range, value, select, rootId}) {
  const id = rootId + "_" + type;
  return (
    <SelectWidget
      schema={{type: "integer"}}
      id={id}
      className="form-control"
      options={rangeOptions(type, range[0], range[1])}
      value={value}
      onChange={(value) => select(type, value)} />
  );
}

class AltDateWidget extends Component {
  static defaultProps = {
    time: false
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
      if (valid(this.state)) {
        this.props.onChange(toDateString(this.state));
      }
    });
  };

  setNow = (event) => {
    event.preventDefault();
    const {time, onChange} = this.props;
    const nowDateObj = parseDateString(new Date().toJSON(), time);
    this.setState(nowDateObj, () => onChange(toDateString(this.state)));
  };

  clear = (event) => {
    event.preventDefault();
    const {time, onChange} = this.props;
    this.setState(parseDateString("", time), () => onChange(undefined));
  };

  get dateElementProps() {
    const {time} = this.props;
    const {year, month, day, hour, minute, second} = this.state;
    const data = [
      {type: "year", range: [1900, 2020], value: year},
      {type: "month", range: [1, 12], value: month},
      {type: "day", range: [1, 31], value: day},
    ];
    if (time) {
      data.push(
        {type: "hour", range: [0, 23], value: hour},
        {type: "minute", range: [0, 59], value: minute},
        {type: "second", range: [0, 59], value: second}
      );
    }
    return data;
  }

  render() {
    const {id} = this.props;
    return (
      <ul className="list-inline">{
        this.dateElementProps.map((props, i) => (
          <li key={i}>
            <DateElement rootId={id} select={this.onChange} {...props} />
          </li>
        ))
      }
        <li>
          <a href="#" className="btn btn-info btn-now"
             onClick={this.setNow}>Now</a>
        </li>
        <li>
          <a href="#" className="btn btn-warning btn-clear"
             onClick={this.clear}>Clear</a>
        </li>
      </ul>
    );
  }
}

if (process.env.NODE_ENV !== "production") {
  AltDateWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: React.PropTypes.string,
    required: PropTypes.bool,
    onChange: PropTypes.func,
    time: PropTypes.bool,
  };
}

export default AltDateWidget;
