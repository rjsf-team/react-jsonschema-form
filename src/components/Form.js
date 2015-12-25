import React, { Component, PropTypes } from "react";
import { Validator } from "jsonschema";

import { getDefaultFormState } from "../utils";
import SchemaField from "./fields/SchemaField";
import ErrorList from "./ErrorList";


export default class Form extends Component {
  static defaultProps = {
    uiSchema: {}
  }

  constructor(props) {
    super(props);
    this.state = this.getStateFromProps(props);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.getStateFromProps(nextProps));
  }

  getStateFromProps(props) {
    const edit = !!props.formData;
    const formData = props.formData || getDefaultFormState(props.schema) || null;
    return {
      status: "initial",
      formData,
      edit,
      errors: edit ? this.validate(formData) : []
    };
  }

  validate(formData) {
    const validator = new Validator();
    return validator.validate(formData, this.props.schema).errors;
  }

  renderErrors() {
    const {status, errors} = this.state;
    if (status !== "editing" && errors.length) {
      return <ErrorList errors={errors} />;
    }
    return null;
  }

  onChange(formData, options={validate: true}) {
    this.setState({
      status: "editing",
      formData,
      errors: options.validate ? this.validate(formData) : this.state.errors
    }, _ => {
      if (this.props.onChange) {
        this.props.onChange(this.state);
      }
    });
  }

  onSubmit(event) {
    event.preventDefault();
    this.setState({status: "submitted"});
    const errors = this.validate(this.state.formData);
    if (Object.keys(errors).length > 0) {
      this.setState({errors}, _ => {
        if (this.props.onError) {
          this.props.onError(errors);
        } else {
          console.error("Form validation failed", errors);
        }
      });
      return;
    } else if (this.props.onSubmit) {
      this.props.onSubmit(this.state);
    }
    this.setState({status: "initial"});
  }

  render() {
    const {schema, uiSchema} = this.props;
    const {formData} = this.state;
    return (
      <form className="rjsf" onSubmit={this.onSubmit.bind(this)}>
        {this.renderErrors()}
        <SchemaField
          schema={schema}
          uiSchema={uiSchema}
          formData={formData}
          onChange={this.onChange.bind(this)} />
        <p><button type="submit">Submit</button></p>
      </form>
    );
  }
}

if (process.env.NODE_ENV !== "production") {
  Form.propTypes = {
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.object,
    formData: PropTypes.any,
    onChange: PropTypes.func,
    onError: PropTypes.func,
    onSubmit: PropTypes.func,
  };
}

export default Form;
