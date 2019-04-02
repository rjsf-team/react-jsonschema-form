import { Component } from "react";
import PropTypes from "prop-types";

class NullField extends Component {
  componentDidMount() {
    if (this.props.formData === undefined) {
      this.props.onChange(null);
    }
  }

  render() {
    return null;
  }
}

if (process.env.NODE_ENV !== "production") {
  NullField.propTypes = {
    onChange: PropTypes.func,
  };
}

export default NullField;
