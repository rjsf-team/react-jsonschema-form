import React, {PropTypes} from "react";
import _ from "lodash";

const debouncedHandleFormOnChange = _.debounce((self, value) => {
  self.props.onChange(value);
}, 500);

class BaseInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      delayedValue: this.props.value,
    };
  }

  componentWillReceiveProps(nextProps){
    const {value} = nextProps;
    this.setState({delayedValue: value});
  }

  handleOnChange(e) {
    const {value} = e.target;
    this.setState({delayedValue: value});
    debouncedHandleFormOnChange(this, value);
  }

  render() {
    const {
      readonly,
      autofocus,
      options,  // eslint-disable-line
      schema,   // eslint-disable-line
      formContext,  // eslint-disable-line
      registry, // eslint-disable-line
      ...inputProps
    } = this.props;
    const {delayedValue} = this.state;

    return (
      <input
      {...inputProps}
      className="form-control"
      readOnly={readonly}
      autoFocus={autofocus}
      value={typeof delayedValue === "undefined" ? "" : delayedValue}
      onChange={(e) => this.handleOnChange(e)}/>
    );
  }
}

BaseInput.defaultProps = {
  type: "text",
  required: false,
  disabled: false,
  readonly: false,
  autofocus: false,
};

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
