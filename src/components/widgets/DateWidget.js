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
    <span>
      <SelectWidget
        schema={{type: "integer"}}
        id={id}
        className="form-control"
        options={rangeOptions(range[0], range[1])}
        value={value}
        onChange={(value) => select(type, value)} />
      <p className="text-center help-block">
        <label htmlFor={id}><small>{type}</small></label>
      </p>
    </span>
  );
}

class DateWidget extends Component {
  defaultProps = {
    time: false
  };

  constructor(props) {
    super(props);
    this.state = parseDateString(props.value, !!props.time);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(parseDateString(nextProps.value, !!nextProps.time));
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  onChange = (property, value) => {
    this.setState({[property]: value}, () => {
      this.props.onChange(toDateString(this.state));
    });
  };

  get dateElements() {
    const {id, time} = this.props;
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
    return data.map(props => {
      return <DateElement rootId={id} select={this.onChange} {...props} />;
    });
  }

  render() {
    return (
      <ul className="list-inline">{
        this.dateElements.map((elem, i) => <li key={i}>{elem}</li>)
      }</ul>
    );
  }
}

if (process.env.NODE_ENV !== "production") {
  DateWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: React.PropTypes.string,
    required: PropTypes.bool,
    onChange: PropTypes.func,
    time: PropTypes.bool,
  };
}

export default DateWidget;
