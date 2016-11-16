import React, {Component, PropTypes} from "react";

class BaseInput extends Component {
  static defaultProps = {
    type: "text",
    required: false,
    disabled: false,
    readonly: false,
    autofocus: false,
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
    // Note: since React 15.2.0 we can't forward unknown element attributes, so we
    // exclude the "options" and "schema" ones here.
    const {
        value,
        required,
        readonly,
        autofocus,
        onChange,
        options,  // eslint-disable-line
        schema,   // eslint-disable-line
        formContext,  // eslint-disable-line
        ...inputProps
    } = this.props;
    const maxLength = schema.maxLength ? schema.maxLength : null;
    return (
      <input
        {...inputProps}
        className="form-control"
        readOnly={readonly}
        autoFocus={autofocus}
        maxLength={maxLength}
        value={typeof value === "undefined" ? "" : value}
        onChange={this.onChange()}
        onBlur={this.onBlur()}/>
    );
  }
}

if (process.env.NODE_ENV !== "production") {
  BaseInput.propTypes = {
    id: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.any,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    autofocus: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default BaseInput;