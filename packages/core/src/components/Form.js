import React, { Component } from "react";
import PropTypes from "prop-types";
import _pick from "lodash/pick";
import _get from "lodash/get";
import _isEmpty from "lodash/isEmpty";

import { default as DefaultErrorList } from "./ErrorList";
import {
  getDefaultFormState,
  retrieveSchema,
  shouldRender,
  toIdSchema,
  getDefaultRegistry,
  deepEquals,
  toPathSchema,
  isObject,
} from "../utils";
import validateFormData, { toErrorList } from "../validate";
import { mergeObjects } from "../utils";

export default class Form extends Component {
  static defaultProps = {
    uiSchema: {},
    noValidate: false,
    liveValidate: false,
    disabled: false,
    noHtml5Validate: false,
    ErrorList: DefaultErrorList,
    omitExtraData: false,
  };

  constructor(props) {
    super(props);
    this.state = this.getStateFromProps(props, props.formData);
    if (
      this.props.onChange &&
      !deepEquals(this.state.formData, this.props.formData)
    ) {
      this.props.onChange(this.state);
    }
    this.formElement = null;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const nextState = this.getStateFromProps(nextProps, nextProps.formData);
    if (
      !deepEquals(nextState.formData, nextProps.formData) &&
      !deepEquals(nextState.formData, this.state.formData) &&
      this.props.onChange
    ) {
      this.props.onChange(nextState);
    }
    this.setState(nextState);
  }

  getStateFromProps(props, inputFormData) {
    const state = this.state || {};
    const schema = "schema" in props ? props.schema : this.props.schema;
    const uiSchema = "uiSchema" in props ? props.uiSchema : this.props.uiSchema;
    const edit = typeof inputFormData !== "undefined";
    const liveValidate =
      "liveValidate" in props ? props.liveValidate : this.props.liveValidate;
    const mustValidate = edit && !props.noValidate && liveValidate;
    const rootSchema = schema;
    const formData = getDefaultFormState(schema, inputFormData, rootSchema);
    const retrievedSchema = retrieveSchema(schema, rootSchema, formData);
    const customFormats = props.customFormats;
    const additionalMetaSchemas = props.additionalMetaSchemas;

    const getCurrentErrors = () => {
      if (props.noValidate) {
        return { errors: [], errorSchema: {} };
      } else if (!props.liveValidate) {
        return {
          errors: state.schemaValidationErrors || [],
          errorSchema: state.schemaValidationErrorSchema || {},
        };
      }
      return {
        errors: state.errors || [],
        errorSchema: state.errorSchema || {},
      };
    };

    let errors,
      errorSchema,
      schemaValidationErrors,
      schemaValidationErrorSchema;
    if (mustValidate) {
      const schemaValidation = this.validate(
        formData,
        schema,
        additionalMetaSchemas,
        customFormats
      );
      errors = schemaValidation.errors;
      errorSchema = schemaValidation.errorSchema;
      schemaValidationErrors = errors;
      schemaValidationErrorSchema = errorSchema;
    } else {
      const currentErrors = getCurrentErrors();
      errors = currentErrors.errors;
      errorSchema = currentErrors.errorSchema;
      schemaValidationErrors = state.schemaValidationErrors;
      schemaValidationErrorSchema = state.schemaValidationErrorSchema;
    }
    if (props.extraErrors) {
      errorSchema = mergeObjects(
        errorSchema,
        props.extraErrors,
        !!"concat arrays"
      );
      errors = toErrorList(errorSchema);
    }
    const idSchema = toIdSchema(
      retrievedSchema,
      uiSchema["ui:rootFieldId"],
      rootSchema,
      formData,
      props.idPrefix
    );
    const nextState = {
      schema,
      uiSchema,
      idSchema,
      formData,
      edit,
      errors,
      errorSchema,
      additionalMetaSchemas,
    };
    if (schemaValidationErrors) {
      nextState.schemaValidationErrors = schemaValidationErrors;
      nextState.schemaValidationErrorSchema = schemaValidationErrorSchema;
    }
    return nextState;
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  validate(
    formData,
    schema = this.props.schema,
    additionalMetaSchemas = this.props.additionalMetaSchemas,
    customFormats = this.props.customFormats
  ) {
    const { validate, transformErrors } = this.props;
    const { rootSchema } = this.getRegistry();
    const resolvedSchema = retrieveSchema(schema, rootSchema, formData);
    return validateFormData(
      formData,
      resolvedSchema,
      validate,
      transformErrors,
      additionalMetaSchemas,
      customFormats
    );
  }

  renderErrors() {
    const { errors, errorSchema, schema, uiSchema } = this.state;
    const { ErrorList, showErrorList, formContext } = this.props;

    if (errors.length && showErrorList != false) {
      return (
        <ErrorList
          errors={errors}
          errorSchema={errorSchema}
          schema={schema}
          uiSchema={uiSchema}
          formContext={formContext}
        />
      );
    }
    return null;
  }

  getUsedFormData = (formData, fields) => {
    //for the case of a single input form
    if (fields.length === 0 && typeof formData !== "object") {
      return formData;
    }

    let data = _pick(formData, fields);
    if (Array.isArray(formData)) {
      return Object.keys(data).map(key => data[key]);
    }

    return data;
  };

  getFieldNames = (pathSchema, formData) => {
    const getAllPaths = (_obj, acc = [], paths = [""]) => {
      Object.keys(_obj).forEach(key => {
        if (typeof _obj[key] === "object") {
          let newPaths = paths.map(path => `${path}.${key}`);
          // If an object is marked with additionalProperties, all its keys are valid
          if (_obj[key].__rjsf_additionalProperties && _obj[key].$name !== "") {
            acc.push(_obj[key].$name);
          } else {
            getAllPaths(_obj[key], acc, newPaths);
          }
        } else if (key === "$name" && _obj[key] !== "") {
          paths.forEach(path => {
            path = path.replace(/^\./, "");
            const formValue = _get(formData, path);
            // adds path to fieldNames if it points to a value
            // or an empty object/array
            if (typeof formValue !== "object" || _isEmpty(formValue)) {
              acc.push(path);
            }
          });
        }
      });
      return acc;
    };

    return getAllPaths(pathSchema);
  };

  onChange = (formData, newErrorSchema) => {
    if (isObject(formData) || Array.isArray(formData)) {
      const newState = this.getStateFromProps(this.props, formData);
      formData = newState.formData;
    }
    const mustValidate = !this.props.noValidate && this.props.liveValidate;
    let state = { formData };
    let newFormData = formData;

    if (this.props.omitExtraData === true && this.props.liveOmit === true) {
      const retrievedSchema = retrieveSchema(
        this.state.schema,
        this.state.schema,
        formData
      );
      const pathSchema = toPathSchema(
        retrievedSchema,
        "",
        this.state.schema,
        formData
      );

      const fieldNames = this.getFieldNames(pathSchema, formData);

      newFormData = this.getUsedFormData(formData, fieldNames);
      state = {
        formData: newFormData,
      };
    }

    if (mustValidate) {
      let schemaValidation = this.validate(newFormData);
      let errors = schemaValidation.errors;
      let errorSchema = schemaValidation.errorSchema;
      const schemaValidationErrors = errors;
      const schemaValidationErrorSchema = errorSchema;
      if (this.props.extraErrors) {
        errorSchema = mergeObjects(
          errorSchema,
          this.props.extraErrors,
          !!"concat arrays"
        );
        errors = toErrorList(errorSchema);
      }
      state = {
        formData: newFormData,
        errors,
        errorSchema,
        schemaValidationErrors,
        schemaValidationErrorSchema,
      };
    } else if (!this.props.noValidate && newErrorSchema) {
      const errorSchema = this.props.extraErrors
        ? mergeObjects(
            newErrorSchema,
            this.props.extraErrors,
            !!"concat arrays"
          )
        : newErrorSchema;
      state = {
        formData: newFormData,
        errorSchema: errorSchema,
        errors: toErrorList(errorSchema),
      };
    }
    this.setState(
      state,
      () =>
        this.props.onChange && this.props.onChange({ ...this.state, ...state })
    );
  };

  onBlur = (...args) => {
    if (this.props.onBlur) {
      this.props.onBlur(...args);
    }
  };

  onFocus = (...args) => {
    if (this.props.onFocus) {
      this.props.onFocus(...args);
    }
  };

  onSubmit = event => {
    event.preventDefault();
    if (event.target !== event.currentTarget) {
      return;
    }

    event.persist();
    let newFormData = this.state.formData;

    if (this.props.omitExtraData === true) {
      const retrievedSchema = retrieveSchema(
        this.state.schema,
        this.state.schema,
        newFormData
      );
      const pathSchema = toPathSchema(
        retrievedSchema,
        "",
        this.state.schema,
        newFormData
      );

      const fieldNames = this.getFieldNames(pathSchema, newFormData);

      newFormData = this.getUsedFormData(newFormData, fieldNames);
    }

    if (!this.props.noValidate) {
      let schemaValidation = this.validate(newFormData);
      let errors = schemaValidation.errors;
      let errorSchema = schemaValidation.errorSchema;
      const schemaValidationErrors = errors;
      const schemaValidationErrorSchema = errorSchema;
      if (Object.keys(errors).length > 0) {
        if (this.props.extraErrors) {
          errorSchema = mergeObjects(
            errorSchema,
            this.props.extraErrors,
            !!"concat arrays"
          );
          errors = toErrorList(errorSchema);
        }
        this.setState(
          {
            errors,
            errorSchema,
            schemaValidationErrors,
            schemaValidationErrorSchema,
          },
          () => {
            if (this.props.onError) {
              this.props.onError(errors);
            } else {
              console.error("Form validation failed", errors);
            }
          }
        );
        return;
      }
    }

    let errorSchema;
    let errors;
    if (this.props.extraErrors) {
      errorSchema = this.props.extraErrors;
      errors = toErrorList(errorSchema);
    } else {
      errorSchema = {};
      errors = [];
    }

    this.setState(
      { formData: newFormData, errors: errors, errorSchema: errorSchema },
      () => {
        if (this.props.onSubmit) {
          this.props.onSubmit(
            { ...this.state, formData: newFormData, status: "submitted" },
            event
          );
        }
      }
    );
  };

  getRegistry() {
    // For BC, accept passed SchemaField and TitleField props and pass them to
    // the "fields" registry one.
    const { fields, widgets } = getDefaultRegistry();
    return {
      fields: { ...fields, ...this.props.fields },
      widgets: { ...widgets, ...this.props.widgets },
      ArrayFieldTemplate: this.props.ArrayFieldTemplate,
      ObjectFieldTemplate: this.props.ObjectFieldTemplate,
      FieldTemplate: this.props.FieldTemplate,
      definitions: this.props.schema.definitions || {},
      rootSchema: this.props.schema,
      formContext: this.props.formContext || {},
    };
  }

  submit() {
    if (this.formElement) {
      this.formElement.dispatchEvent(
        new CustomEvent("submit", {
          cancelable: true,
        })
      );
    }
  }

  render() {
    const {
      children,
      id,
      idPrefix,
      className,
      tagName,
      name,
      method,
      target,
      action,
      autocomplete: deprecatedAutocomplete,
      autoComplete: currentAutoComplete,
      enctype,
      acceptcharset,
      noHtml5Validate,
      disabled,
      formContext,
    } = this.props;

    const { schema, uiSchema, formData, errorSchema, idSchema } = this.state;
    const registry = this.getRegistry();
    const _SchemaField = registry.fields.SchemaField;
    const FormTag = tagName ? tagName : "form";
    if (deprecatedAutocomplete) {
      console.warn(
        "Using autocomplete property of Form is deprecated, use autoComplete instead."
      );
    }
    const autoComplete = currentAutoComplete
      ? currentAutoComplete
      : deprecatedAutocomplete;

    return (
      <FormTag
        className={className ? className : "rjsf"}
        id={id}
        name={name}
        method={method}
        target={target}
        action={action}
        autoComplete={autoComplete}
        encType={enctype}
        acceptCharset={acceptcharset}
        noValidate={noHtml5Validate}
        onSubmit={this.onSubmit}
        ref={form => {
          this.formElement = form;
        }}>
        {this.renderErrors()}
        <_SchemaField
          schema={schema}
          uiSchema={uiSchema}
          errorSchema={errorSchema}
          idSchema={idSchema}
          idPrefix={idPrefix}
          formContext={formContext}
          formData={formData}
          onChange={this.onChange}
          onBlur={this.onBlur}
          onFocus={this.onFocus}
          registry={registry}
          disabled={disabled}
        />
        {children ? (
          children
        ) : (
          <div>
            <button type="submit" className="btn btn-info">
              Submit
            </button>
          </div>
        )}
      </FormTag>
    );
  }
}

if (process.env.NODE_ENV !== "production") {
  Form.propTypes = {
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.object,
    formData: PropTypes.any,
    widgets: PropTypes.objectOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object])
    ),
    fields: PropTypes.objectOf(PropTypes.elementType),
    ArrayFieldTemplate: PropTypes.elementType,
    ObjectFieldTemplate: PropTypes.elementType,
    FieldTemplate: PropTypes.elementType,
    ErrorList: PropTypes.func,
    onChange: PropTypes.func,
    onError: PropTypes.func,
    showErrorList: PropTypes.bool,
    onSubmit: PropTypes.func,
    id: PropTypes.string,
    className: PropTypes.string,
    tagName: PropTypes.elementType,
    name: PropTypes.string,
    method: PropTypes.string,
    target: PropTypes.string,
    action: PropTypes.string,
    autocomplete: PropTypes.string,
    autoComplete: PropTypes.string,
    enctype: PropTypes.string,
    acceptcharset: PropTypes.string,
    noValidate: PropTypes.bool,
    noHtml5Validate: PropTypes.bool,
    liveValidate: PropTypes.bool,
    validate: PropTypes.func,
    transformErrors: PropTypes.func,
    formContext: PropTypes.object,
    customFormats: PropTypes.object,
    additionalMetaSchemas: PropTypes.arrayOf(PropTypes.object),
    omitExtraData: PropTypes.bool,
    extraErrors: PropTypes.object,
  };
}
