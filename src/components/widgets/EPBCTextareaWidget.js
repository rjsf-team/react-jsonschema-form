import React, {Component, PropTypes} from "react";

class TextareaWidget extends Component {
  static defaultProps = {
    autofocus: false
  };

  constructor(props) {
    super(props);
    const {value} = props;
    this.state = { value: value };
  }

  onChange() {
    const {onChange} = this.props;
    return (event) => {
        const value = event.target.value.length === 0 && this.props.required  ? undefined : event.target.value;
        this.setState({ value: value }, () => { 
            onChange(value)
        });
    };
  }

  onBlur() {
    const {onChange} = this.props;
    return (event) => {
        const rawValue = event.target.value;
        const trimmedValue = event.target.value.trim();
        const value = trimmedValue.length === 0 && this.props.required ? undefined : trimmedValue;
        // If whitespace was leading or trailing the input value, then
        // re-set the value with the trimmed value...
        if (rawValue !== value) {            
            this.setState({ value: value }, () => { 
                onChange(value)
            });
        }
    };
  }

  render() {
    const {
      schema,
      id,
      placeholder,
      value,
      disabled,
      readonly,
      autofocus,
      onChange
    } = this.props;
    return (
      <textarea
        id={id}
        className="form-control"
        value={typeof value === "undefined" ? "" : value}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readonly}
        autoFocus={autofocus}
        onChange={this.onChange()}
        onBlur={this.onBlur()}/>
    );
  }
}

if (process.env.NODE_ENV !== "production") {
  TextareaWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    required: PropTypes.bool,
    autofocus: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default TextareaWidget;