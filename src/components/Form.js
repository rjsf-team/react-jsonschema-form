import React, {Component, PropTypes} from "react";

import ErrorList from "./ErrorList";
import {
  getDefaultFormState,
  shouldRender,
  toIdSchema,
  getDefaultRegistry,
} from "../utils";
import validateFormData from "../validate";


export default class Form extends Component {
  static defaultProps = {
    uiSchema: {},
    noValidate: false,
    liveValidate: false,
    safeRenderCompletion: false,
  };

  constructor(props) {
    super(props);
    this.state = this.getStateFromProps(props);
  }

  componentDidMount() {
    const {formData} = this.state;
    const {liveValidate, noValidate, schema} = this.props;
    const {errors = [], errorSchema = {}} = this.state;
    const mustValidate = !!formData && !noValidate && liveValidate;

    Promise
      .resolve(mustValidate ? this.validate(formData, schema) : {errors, errorSchema})
      .then(this.setValidationResult);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.getStateFromProps(nextProps), function(){
      const {formData, errors = [], errorSchema = {}, schema} = this.state;
      const {liveValidate, noValidate} = this.props;
      const mustValidate = !!formData && !noValidate && liveValidate;

      Promise
        .resolve(mustValidate ? this.validate(formData, schema) : {errors, errorSchema})
        .then(this.setValidationResult);
    });

  }

  getStateFromProps(props) {
    const state = this.state || {};
    const schema = "schema" in props ? props.schema : this.props.schema;
    const uiSchema = "uiSchema" in props ? props.uiSchema : this.props.uiSchema;
    const edit = typeof props.formData !== "undefined";
    const {definitions} = schema;
    const formData = getDefaultFormState(schema, props.formData, definitions);
    const idSchema = toIdSchema(schema, uiSchema["ui:rootFieldId"], definitions);
    const {errors = [], errorSchema = {}} = state;
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

  /**
   *
   * @param formData
   * @param schema
   * @return Promise
   */
  validate(formData, schema) {
    const {validate} = this.props;
    this.setValidateStatus("in_progress");
    const deferred = validateFormData(formData, schema || this.props.schema, validate);
    deferred.then(this.setValidateStatus.bind(this, "done"));
    return deferred;
  }

  setValidateStatus = (status = "") => {
    this.setState({validation: status});
  };

  setValidationResult = (result) => {
    this.setState(result);
    return result;
  };

  renderErrors() {
    const {status, errors} = this.state;
    const {showErrorList} = this.props;

    if (status !== "editing" && errors.length && showErrorList != false) {
      return <ErrorList errors={errors}/>;
    }
    return null;
  }

  onChange = (formData, options = {validate: false}) => {
    const mustValidate = !this.props.noValidate && (this.props.liveValidate || options.validate);
    const onChange = this.props.onChange;

    this.setState({status: "editing", formData}, () => {
      Promise.resolve(mustValidate ? this.validate(formData) : {})
        .then(this.setValidationResult)
        .then(() => {
          if (typeof onChange === "function") {
            onChange(this.state);
          }
        });
    });

  };

  onSubmit = (event) => {
    event.preventDefault();
    this.setState({status: "submitted"});
    const {onError, onSubmit} = this.props;

    Promise.resolve(this.props.noValidate ? {} : this.validate(this.state.formData))
      .then((validationResult) => {
        if (Object.keys(validationResult.errors).length) {
          if (typeof onError === "function") {
            onError(validationResult.errors);
          }
          return Promise.reject(validationResult);
        }
      })
      .then(() => {
        if (typeof onSubmit === "function") {
          onSubmit(this.state);
        }
        this.setState({status: "initial", errors: [], errorSchema: {}});
      })
      .catch(this.setValidationResult);

  };

  getRegistry() {
    // For BC, accept passed SchemaField and TitleField props and pass them to
    // the "fields" registry one.
    const {fields, widgets} = getDefaultRegistry();
    return {
      fields: {...fields, ...this.props.fields},
      widgets: {...widgets, ...this.props.widgets},
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
      acceptcharset
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
        onSubmit={this.onSubmit}>
        {this.renderErrors()}
        <_SchemaField
          schema={schema}
          uiSchema={uiSchema}
          errorSchema={errorSchema}
          idSchema={idSchema}
          formData={formData}
          onChange={this.onChange}
          registry={registry}
          safeRenderCompletion={safeRenderCompletion}/>
        { children ? children :
          <p>
            <button type="submit" className="btn btn-info">Submit</button>
          </p>
        }
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
    liveValidate: PropTypes.bool,
    safeRenderCompletion: PropTypes.bool,
    formContext: PropTypes.object,
  };
}
