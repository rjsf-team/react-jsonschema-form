import React, {Component, PropTypes} from "react";

import SchemaField from "./fields/SchemaField";
import TitleField from "./fields/TitleField";
import DescriptionField from "./fields/DescriptionField";

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
    noValidate: false,
    liveValidate: false,
    safeRenderCompletion: false,
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
    const {validate} = this.props;
    return validateFormData(formData, schema || this.props.schema, validate);
  }

  renderErrors() {
    const {status, errors} = this.state;
    const {showErrorList} = this.props;

    if (status !== "editing" && errors.length && showErrorList != false) {
      return <ErrorList errors={errors}/>;
    }
    return null;
  }

  removeEmptyRequiredFields(schema, formData) {
    if (Array.isArray(formData)) {
      for (let i = 0; i < formData.length; i++) {
        this.removeEmptyRequiredFields(schema.items, formData[i]);
      }
    }
    else if (typeof formData === "object") {
      const keys = Object.keys(formData);
      const requiredFields = schema.required;
      for (let i = 0; i < keys.length; i++) {
        const formDataPropertyName = keys[i];
        const formDataPropertyValue = formData[formDataPropertyName];
        const formDataPropertyRequired = requiredFields ? requiredFields.indexOf(formDataPropertyName) > -1 : false;
        // If this property is an object, the recursively call removeEmptyRequiredFields...
        if (typeof formDataPropertyValue === "object") {
          this.removeEmptyRequiredFields(schema.properties[keys[i]], formData[keys[i]]);
        }
        // Otherwise, if this is a required property...
        else if (formDataPropertyRequired) {
          // If this property is an empty string, then remove it...
          if (typeof formDataPropertyValue === "string" && formDataPropertyValue.trim().length === 0) {
            delete formData[keys[i]];
          }
          // Otherwise if this property is a zero value, then remove it...
          else if (typeof formDataPropertyValue === "number" && formDataPropertyValue === 0) {
            delete formData[keys[i]];
          }
          // Otherwise if this property is undefined, then remove it...
          else if (formDataPropertyValue === undefined) {
            delete formData[keys[i]];
          }
        }
      }
    }
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

  onSubmit = (event) => {
    event.preventDefault();
    this.setState({status: "submitted"});

    if (!this.props.noValidate) {
      let sanitizedFormData = Object.assign({}, this.state.formData);
      this.removeEmptyRequiredFields(this.props.schema, sanitizedFormData);
      this.setState({ formData: sanitizedFormData }, () => {
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
      });
    }

    if (this.props.onSubmit) {
      this.props.onSubmit(this.state);
    }
    this.setState({status: "initial", errors: [], errorSchema: {}});
  };

  getRegistry() {
    // For BC, accept passed SchemaField and TitleField props and pass them to
    // the "fields" registry one.
    const _SchemaField = this.props.SchemaField || SchemaField;
    const _TitleField = this.props.TitleField || TitleField;
    const _DescriptionField = this.props.DescriptionField || DescriptionField;

    const fields = Object.assign({
      SchemaField: _SchemaField,
      TitleField: _TitleField,
      DescriptionField: _DescriptionField,
    }, this.props.fields);
    return {
      fields,
      FieldTemplate: this.props.FieldTemplate,
      widgets: this.props.widgets || {},
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
