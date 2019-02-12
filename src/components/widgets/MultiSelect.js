import React from "react";
import Select from "react-select";

class MultiSelect extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: [],
      suggestions: [],
    };
  }

  componentDidMount = () =>
    this.setState({ suggestions: this.props.schema.suggestions });

  handleChange = selectedvalue => this.setState({ value: selectedvalue });

  render() {
    const { schema, placeholder } = this.props;
    let isMulti, isClearable;
    const { value, suggestions } = this.state;
    schema ? ({ isMulti, isClearable } = schema) : null;
    return (
      <Select
        value={value}
        options={suggestions}
        onChange={this.handleChange}
        placeholder={placeholder}
        isMulti={isMulti ? true : false}
        isClearable={isClearable ? true : false}
      />
    );
  }
}

export default MultiSelect;
