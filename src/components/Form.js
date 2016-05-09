import React, { Component, PropTypes } from "react";

import SchemaField from "./fields/SchemaField";
import TitleField from "./fields/TitleField";
import ErrorList from "./ErrorList";
import {
  getDefaultFormState,
  shouldRender,
  toIdSchema,
  setState,
} from "../utils";
import validateFormData from "../validate";


export default class Form extends Component {
  static defaultProps = {
    uiSchema: {},
    liveValidate: false,
    safeRenderCompletion: false,
  }

  static defaultState = {
    status: "initial",
    formData: undefined,
    edit: false,
    errors: [],
    errorSchema: {},
    idSchema: {},
  };

  constructor(props) {
    super(props);
    this.state = Form.defaultState;
    this.getStateFromProps(props)
      .then(state => {
        this.setState(state);
      });
  }

  componentWillReceiveProps(nextProps) {
    this.getStateFromProps(nextProps)
      .then(state => {
        this.setState(state);
      });
  }

  getStateFromProps(props) {
    const state = this.state || Form.defaultState;
    const schema = "schema" in props ? props.schema : this.props.schema;
    const uiSchema = "uiSchema" in props ? props.uiSchema : this.props.uiSchema;
    const edit = typeof props.formData !== "undefined";
    const liveValidate = props.liveValidate || this.props.liveValidate;
    const mustValidate = edit && liveValidate;
    const {definitions} = schema;
    const formData = getDefaultFormState(schema, props.formData, definitions);
    return Promise.resolve(mustValidate ?
      this.validate(formData, schema) : {
        errors: state.errors || [],
        errorSchema: state.errorSchema || {}
      })
        .then(({errors, errorSchema}) => {
          const idSchema = toIdSchema(schema, uiSchema["ui:rootFieldId"], definitions);
          return {
            status: "initial",
            formData,
            edit,
            errors,
            errorSchema,
            idSchema,
          };
        });
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  validate(formData, schema) {
    const {validate} = this.props;
    return validateFormData(formData, schema || this.props.schema, validate);
  }

  renderErrors() {
    const {status, errors} = this.state;
    if (status !== "editing" && errors.length) {
      return <ErrorList errors={errors} />;
    }
    return null;
  }

  onChange = (formData, options={validate: false}) => {
    const mustValidate = this.props.liveValidate || options.validate;
    let state = {status: "editing", formData};
    let promise;
    if (mustValidate) {
      promise = this.validate(formData)
        .then(({errors, errorSchema}) => {
          return {...state, errors, errorSchema};
        });
    } else {
      promise = Promise.resolve(state);
    }
    return promise
      .then(state => {
        setState(this, state, () => {
          if (this.props.onChange) {
            this.props.onChange(this.state);
          }
        });
      });
  };

  onSubmit = (event) => {
    event.preventDefault();
    this.setState({status: "submitted"});
    this.validate(this.state.formData)
      .then(({errors, errorSchema}) => {
        if (Object.keys(errors).length > 0) {
          setState(this, {errors, errorSchema}, () => {
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
        this.setState({status: "initial", errors: [], errorSchema: {}});
      });
  };

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
    const {children, schema, uiSchema, safeRenderCompletion} = this.props;
    const {formData, errorSchema, idSchema} = this.state;
    const registry = this.getRegistry();
    const _SchemaField = registry.fields.SchemaField;
    return (
      <form className="rjsf" onSubmit={this.onSubmit}>
        {this.renderErrors()}
        <_SchemaField
          schema={schema}
          uiSchema={uiSchema}
          errorSchema={errorSchema}
          idSchema={idSchema}
          formData={formData}
          onChange={this.onChange}
          registry={registry}
          safeRenderCompletion={safeRenderCompletion} />
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
    widgets: PropTypes.objectOf(PropTypes.func),
    fields: PropTypes.objectOf(PropTypes.func),
    onChange: PropTypes.func,
    onError: PropTypes.func,
    onSubmit: PropTypes.func,
    liveValidate: PropTypes.bool,
    safeRenderCompletion: PropTypes.bool,
  };
}

export default Form;
