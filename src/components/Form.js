import React, { Component, PropTypes } from "react";
import { Validator } from "jsonschema";

import SchemaField from "./fields/SchemaField";
import TitleField from "./fields/TitleField";
import { getDefaultFormState, shouldRender } from "../utils";
import ErrorList from "./ErrorList";

export default class Form extends Component {
  static defaultProps = {
    uiSchema: {}
  }

  constructor(props) {
    super(props);
    this.state = this.getStateFromProps(props);
    // Caching bound instance methods for rendering perf optimization.
    this._onChange = this.onChange.bind(this);
    this._onSubmit = this.onSubmit.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.getStateFromProps(nextProps));
  }

  getStateFromProps(props) {
    const schema = "schema" in props ? props.schema : this.props.schema;
    const edit = !!props.formData;
    const {definitions} = schema;
    const formData = getDefaultFormState(schema, props.formData, definitions) || null;
    return {
      status: "initial",
      formData,
      edit,
      errors: edit ? this.validate(formData, schema) : []
    };
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

  getRegistry() {
    // For BC, accept passed SchemaField and TitleField props and pass them to
    // the "fields" registry one.
    const _SchemaField = this.props.SchemaField || SchemaField;
    const _TitleField = this.props.TitleField || TitleField;
    const fields = Object.assign({
      SchemaField: _SchemaField,
      TitleField: _TitleField,
    }, this.props.fields);
    return {
      fields,
      widgets: this.props.widgets || {},
      definitions: this.props.schema.definitions || {},
    };
  }

  render() {
    const {children, schema, uiSchema} = this.props;
    const {formData} = this.state;
    const registry = this.getRegistry();
    const _SchemaField = registry.fields.SchemaField;
    return (
      <form className="rjsf" onSubmit={this._onSubmit}>
        {this.renderErrors()}
        <_SchemaField
          schema={schema}
          uiSchema={uiSchema}
          formData={formData}
          onChange={this._onChange}
          registry={registry}/>
        { children ? children : <p><button type="submit">Submit</button></p> }
      </form>
    );
  }
}

if (process.env.NODE_ENV !== "production") {
  Form.propTypes = {
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.object,
    formData: PropTypes.any,
    widgets: PropTypes.objectOf(PropTypes.func),
    fields: PropTypes.objectOf(PropTypes.func),
    onChange: PropTypes.func,
    onError: PropTypes.func,
    onSubmit: PropTypes.func,
  };
}

export default Form;
