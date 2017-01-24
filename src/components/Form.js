import React, {Component, PropTypes} from "react";

import ErrorList from "./ErrorList";
import {
  getDefaultFormState,
  shouldRender,
  toIdSchema,
  setState,
  getDefaultRegistry,
} from "../utils";
import validateFormData from "../validate";


export default class Form extends Component {
  static defaultProps = {
    uiSchema: {},
    noValidate: false,
    liveValidate: false,
    safeRenderCompletion: false,
    noHtml5Validate: false
  }

  constructor(props) {
    super(props);
    this.state = this.getStateFromProps(props);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.getStateFromProps(nextProps));
  }

  getStateFromProps(props) {
    const state = this.state || {};
    const schema = "schema" in props ? props.schema : this.props.schema;
    const uiSchema = "uiSchema" in props ? props.uiSchema : this.props.uiSchema;
    const edit = typeof props.formData !== "undefined";
    const liveValidate = props.liveValidate || this.props.liveValidate;
    const mustValidate = edit && !props.noValidate && liveValidate;
    const {definitions} = schema;
    const formData = getDefaultFormState(schema, props.formData, definitions);
    const {errors, errorSchema} = mustValidate ?
      this.validate(formData, schema) : {
        errors: state.errors || [],
        errorSchema: state.errorSchema || {}
      };
    const idSchema = toIdSchema(schema, uiSchema["ui:rootFieldId"], definitions);
    return {
      status: "initial",
      schema,
      uiSchema,
      idSchema,
      formData,
      edit,
      errors,
      errorSchema
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  validate(formData, schema) {
    const {validate, transformErrors} = this.props;
    return validateFormData(formData, schema || this.props.schema, validate, transformErrors);
  }

  renderErrors() {
    const {status, errors} = this.state;
    const {showErrorList} = this.props;

    if (status !== "editing" && errors.length && showErrorList != false) {
      return <ErrorList errors={errors}/>;
    }
    return null;
  }

  onChange = (formData, options={validate: false}) => {
    const mustValidate = !this.props.noValidate && (this.props.liveValidate || options.validate);
    let state = {status: "editing", formData};
    if (mustValidate) {
      const {errors, errorSchema} = this.validate(formData);
      state = {...state, errors, errorSchema};
    }
    setState(this, state, () => {
      if (this.props.onChange) {
        this.props.onChange(this.state);
      }
    });
  };

  onBlur = (...args) => {
    if (this.props.onBlur) {
      this.props.onBlur(...args);
    }
  }

  onSubmit = (event) => {
    event.preventDefault();
    this.setState({status: "submitted"});

    if (!this.props.noValidate) {
      const {errors, errorSchema} = this.validate(this.state.formData);
      if (Object.keys(errors).length > 0) {
        setState(this, {errors, errorSchema}, () => {
          if (this.props.onError) {
            this.props.onError(errors);
          } else {
            console.error("Form validation failed", errors);
          }
        });
        return;
      }
    }

    if (this.props.onSubmit) {
      this.props.onSubmit(this.state);
    }
    this.setState({status: "initial", errors: [], errorSchema: {}});
  };

  getRegistry() {
    // For BC, accept passed SchemaField and TitleField props and pass them to
    // the "fields" registry one.
    const {fields, widgets} = getDefaultRegistry();
    return {
      fields: {...fields, ...this.props.fields},
      widgets: {...widgets, ...this.props.widgets},
      ArrayFieldTemplate: this.props.ArrayFieldTemplate,
      FieldTemplate: this.props.FieldTemplate,
      definitions: this.props.schema.definitions || {},
      formContext: this.props.formContext || {},
    };
  }

  render() {
    const {
      children,
      safeRenderCompletion,
      id,
      className,
      name,
      method,
      target,
      action,
      autocomplete,
      enctype,
      acceptcharset,
      noHtml5Validate
    } = this.props;

    const {schema, uiSchema, formData, errorSchema, idSchema} = this.state;
    const registry = this.getRegistry();
    const _SchemaField = registry.fields.SchemaField;

    return (
      <form className={className ? className : "rjsf"}
        id={id}
        name={name}
        method={method}
        target={target}
        action={action}
        autoComplete={autocomplete}
        encType={enctype}
        acceptCharset={acceptcharset}
        noValidate={noHtml5Validate}
        onSubmit={this.onSubmit}>
        {this.renderErrors()}
        <_SchemaField
          schema={schema}
          uiSchema={uiSchema}
          errorSchema={errorSchema}
          idSchema={idSchema}
          formData={formData}
          onChange={this.onChange}
          onBlur={this.onBlur}
          registry={registry}
          safeRenderCompletion={safeRenderCompletion}/>
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
    formData: PropTypes.any,
    widgets: PropTypes.objectOf(PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.object,
    ])),
    fields: PropTypes.objectOf(PropTypes.func),
    ArrayFieldTemplate: PropTypes.func,
    FieldTemplate: PropTypes.func,
    onChange: PropTypes.func,
    onError: PropTypes.func,
    showErrorList: PropTypes.bool,
    onSubmit: PropTypes.func,
    id: PropTypes.string,
    className: PropTypes.string,
    name: PropTypes.string,
    method: PropTypes.string,
    target: PropTypes.string,
    action: PropTypes.string,
    autocomplete: PropTypes.string,
    enctype: PropTypes.string,
    acceptcharset: PropTypes.string,
    noValidate: PropTypes.bool,
    noHtml5Validate: PropTypes.bool,
    liveValidate: PropTypes.bool,
    validate: PropTypes.func,
    transformErrors: PropTypes.func,
    safeRenderCompletion: PropTypes.bool,
    formContext: PropTypes.object,
  };
}
