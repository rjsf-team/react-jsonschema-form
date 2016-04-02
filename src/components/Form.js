import React, { Component, PropTypes } from "react";
import { Validator } from "jsonschema";

import FieldSet from "./FieldSet";
import {
  toErrorSchema,
  getDefaultFormState,
  shouldRender
} from "../utils";
import ErrorList from "./ErrorList";


export default class Form extends Component {
  static defaultProps = {
    uiSchema: {},
    liveValidate: false,
  }

  constructor(props) {
    super(props);
    this.state = this.getStateFromProps(props);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.getStateFromProps(nextProps));
  }

  getStateFromProps(props) {
    const schema = "schema" in props ? props.schema : this.props.schema;
    const edit = !!props.formData;
    const {definitions} = schema;
    const formData = getDefaultFormState(schema, props.formData, definitions);
    const errors = edit ? this.validate(formData, schema) : [];
    const errorSchema = toErrorSchema(errors);
    return {status: "initial", formData, edit, errors, errorSchema};
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  validate(formData, schema) {
    const validator = new Validator();
    return validator.validate(formData, schema || this.props.schema).errors;
  }

  renderErrors() {
    const {status, errors} = this.state;
    if (status !== "editing" && errors.length) {
      return <ErrorList errors={errors} />;
    }
    return null;
  }

  onChange = (formData, options={validate: false}) => {
    const liveValidate = this.props.liveValidate || options.validate;
    const errors = liveValidate ? this.validate(formData) :
                                  this.state.errors;
    const errorSchema = toErrorSchema(errors);
    this.setState({
      status: "editing",
      formData,
      errors,
      errorSchema
    }, _ => {
      if (this.props.onChange) {
        this.props.onChange(this.state);
      }
    });
  };

  onSubmit = (event) => {
    event.preventDefault();
    this.setState({status: "submitted"});
    const errors = this.validate(this.state.formData);
    if (Object.keys(errors).length > 0) {
      const errorSchema = toErrorSchema(errors);
      this.setState({errors, errorSchema}, _ => {
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
  };

  render() {
    const {children, schema, uiSchema, TitleField, SchemaField, fields, widgets} = this.props;
    const {formData, errorSchema} = this.state;
    return (
      <form className="rjsf" onSubmit={this.onSubmit}>
        {this.renderErrors()}
        <FieldSet
          schema={schema}
          uiSchema={uiSchema}
          TitleField={TitleField}
          SchemaField={SchemaField}
          fields={fields}
          widgets={widgets}
          errorSchema={errorSchema}
          formData={formData}
          onChange={this.onChange}/>
        { children ? children :
          <p>
            <button type="submit" className="btn btn-info">Submit</button>
          </p> }
      </form>
    );
  }
}

if (process.env.NODE_ENV !== "production") {
  Form.propTypes = {
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.object,
    TitleField: React.PropTypes.element,
    SchemaField: React.PropTypes.element,
    formData: PropTypes.any,
    widgets: PropTypes.objectOf(PropTypes.func),
    fields: PropTypes.objectOf(PropTypes.func),
    onChange: PropTypes.func,
    onError: PropTypes.func,
    onSubmit: PropTypes.func,
    liveValidate: PropTypes.bool,
  };
}

export default Form;
