import React, { Component, PropTypes } from "react";

class CheckboxesWidget extends Component {
  constructor(props) {
    super(props);
    this.state = this.getStateFromProps(props);
  }

  getStateFromProps(props) {
    const selected = props.options.reduce((o, {label}) => {
      o[label] = props.value.indexOf(label) !== -1;
      return o;
    }, {});
    console.log(selected);
    return {selected};
  }

  render() {
    const {
     options,
     value,
     onChange
    } = this.props;

    return (
      <div>{
        options.map(({label}, i) => {
          return (
            <div className="checkbox">
            <label>
              <input type="checkbox"
                key={i}
                id={label}
                title={label}
                checked={value.indexOf(label) !== -1}
                onChange={(event) => {
                  this.state.selected[event.target.id] = event.target.checked;
                  this.setState(this.state);

                  const selectedKeys = Object.keys(this.state.selected).filter((key) => {
                    return this.state.selected[key];
                  });
                  onChange(selectedKeys);
                }} />
              <strong>{label}</strong>
            </label>
            </div>
          );
        })
      }</div>
    );
  }
}

if (process.env.NODE_ENV !== "production") {
  CheckboxesWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    options: PropTypes.array.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.any,
    required: PropTypes.bool,
    multiple: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default CheckboxesWidget;
