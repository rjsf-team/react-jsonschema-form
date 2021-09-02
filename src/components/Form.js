import React, { Component } from "react";
import PropTypes from "prop-types";
import _cloneDeep from "lodash.clonedeep";
import _pick from "lodash.pick";
import _get from "lodash.get";
import _isEmpty from "lodash.isempty";

import { default as DefaultErrorList } from "./ErrorList";
import {
  getDefaultFormState,
  retrieveSchema,
  shouldRender,
  toIdSchema,
  setState,
  getDefaultRegistry,
  deepEquals,
  toPathSchema,
  isObject,
} from "../utils";
import validateFormData, { toErrorList } from "../validate";

export default class Form extends Component {
  static defaultProps = {
    uiSchema: {},
    noValidate: false,
    liveValidate: false,
    disabled: false,
    safeRenderCompletion: false,
    noHtml5Validate: false,
    ErrorList: DefaultErrorList,
    omitExtraData: false,
    submitBtnClass: "btn btn-info",
    submitBtnName: "Submit"
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

  componentWillReceiveProps(nextProps) {
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
    const liveValidate = props.liveValidate || this.props.liveValidate;
    const mustValidate = edit && !props.noValidate && liveValidate;
    const { definitions } = schema;
    const formData = getDefaultFormState(schema, inputFormData, definitions);
    const retrievedSchema = retrieveSchema(schema, definitions, formData);
    const customFormats = props.customFormats;
    const additionalMetaSchemas = props.additionalMetaSchemas;
    const { errors, errorSchema } = mustValidate
      ? this.validate(formData, schema, additionalMetaSchemas, customFormats)
      : {
        errors: state.errors || [],
        errorSchema: state.errorSchema || {},
      };
    const idSchema = toIdSchema(
      retrievedSchema,
      uiSchema["ui:rootFieldId"],
      definitions,
      formData,
      props.idPrefix
    );
    return {
      schema,
      uiSchema,
      idSchema,
      formData,
      edit,
      errors,
      errorSchema,
      additionalMetaSchemas,
    };
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
    const { definitions } = this.getRegistry();
    const resolvedSchema = retrieveSchema(schema, definitions, formData);
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
          getAllPaths(_obj[key], acc, newPaths);
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
        this.state.schema.definitions,
        formData
      );
      const pathSchema = toPathSchema(
        retrievedSchema,
        "",
        this.state.schema.definitions,
        formData
      );

      const fieldNames = this.getFieldNames(pathSchema, formData);

      newFormData = this.getUsedFormData(formData, fieldNames);
      state = {
        formData: newFormData,
      };
    }

    if (mustValidate) {
      const { errors, errorSchema } = this.validate(newFormData);
      state = { formData: newFormData, errors, errorSchema };
    } else if (!this.props.noValidate && newErrorSchema) {
      state = {
        formData: newFormData,
        errorSchema: newErrorSchema,
        errors: toErrorList(newErrorSchema),
      };
    }
    setState(this, state, () => {
      if (this.props.onChange) {
        this.props.onChange(this.state);
      }
    });
  };

  onBlur = (...args) => {
    const { formData } = this.state;
    const { errors, errorSchema } = this.validate(formData);
    const { onBlurSubmit } = this.props;
    if(onBlurSubmit){
      this.setState({ errors, errorSchema }, () => onBlurSubmit(this.state));
    }
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
        this.state.schema.definitions,
        newFormData
      );
      const pathSchema = toPathSchema(
        retrievedSchema,
        "",
        this.state.schema.definitions,
        newFormData
      );

      const fieldNames = this.getFieldNames(pathSchema, newFormData);

      newFormData = this.getUsedFormData(newFormData, fieldNames);
    }

    if (!this.props.noValidate) {
      const { errors, errorSchema } = this.validate(newFormData);
      if (Object.keys(errors).length > 0) {
        setState(this, { errors, errorSchema }, () => {
          if (this.props.onError) {
            this.props.onError(errors);
          } else {
            console.error("Form validation failed", errors);
          }
        });
        return;
      }
    }

    this.setState(
      { formData: newFormData, errors: [], errorSchema: {} },
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
      formContext: this.props.formContext || {},
    };
  }

  submit() {
    if (this.formElement) {
      this.formElement.dispatchEvent(new Event("submit", { cancelable: true }));
    }
  }
  iterate(obj, stack, fields, unsetField) {
    for (var property in obj) {
      if (obj.hasOwnProperty(property)) {
        if (typeof obj[property] == "object") {
          if (property === "required" && unsetField !== 5 && unsetField !== 4) {
            if (obj[property].length > 0) {
              const unsetRequiredField = obj[property].filter(val => !fields.includes(val));
              obj[property] = unsetRequiredField;
            }
          } else if ((unsetField === 5) && fields.indexOf(property) > -1) {
            if (obj[property].type && obj[property].type === "array" && obj[property].items && obj[property].items.required) {
              obj[property].items.required = [];
            } else if (obj[property].type && obj[property].type === "object" && obj[property].properties && obj[property].properties.required) {
              obj[property].properties.required = [];
            }
          } else if (unsetField === 4 && fields.indexOf(property) > -1) {
            delete obj[property];
          }
          this.iterate(obj[property], stack + '.' + property, fields, unsetField);
        }
      }
    }
    return obj;
  }

  render() {
    const {
      permission,
      isAuth,
      taskData,
      children,
      safeRenderCompletion,
      id,
      idPrefix,
      className,
      tagName,
      name,
      method,
      target,
      action,
      autocomplete,
      enctype,
      acceptcharset,
      noHtml5Validate,
      disabled,
      formContext,
      updatedFields,
      updatedFieldClassName,
      realtimeUserPositionField,
      isDataLoaded,
      AuthID,
      EditorType,
      TaskID,
      timezone,
      roleId,
      onOptionResponse,
      submitBtnClass,
      submitBtnName,
      onOptionFilter,
      subForms,
    } = this.props;
    const { schema, uiSchema, formData, errorSchema, idSchema } = this.state;
    const registry = this.getRegistry();
    const _SchemaField = registry.fields.SchemaField;
    const FormTag = tagName ? tagName : "form";
    if (permission && roleId && roleId !== undefined && permission[roleId]) {
      const unsetRequired = [0, 1, 2, 4, 5];
      unsetRequired.forEach((unsetField) => {
        if (permission && permission[roleId][unsetField] && permission[roleId][unsetField].length > 0) {
          this.iterate(schema, '', permission[roleId][unsetField], unsetField);
        }
      });
    }
    var size = 0;
    if (schema.properties) {
      size = Object.keys(schema.properties).length;
    }
    const schemaLength = size;
    const tmpTaskData = _cloneDeep(taskData);
    if (tmpTaskData !== undefined && tmpTaskData['front_fields'] !== null) {
      tmpTaskData['front_fields'] = formData;
    }
    return (
      <>
        {(schemaLength > 0) &&
          <FormTag
            className={className ? className : "rjsf"}
            id={id}
            name={name}
            method={method}
            target={target}
            action={action}
            autoComplete={autocomplete}
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
              updatedFields={updatedFields}
              updatedFieldClassName={updatedFieldClassName}
              realtimeUserPositionField={realtimeUserPositionField}
              isDataLoaded={isDataLoaded}
              AuthID={AuthID}
              EditorType={EditorType}
              TaskID={TaskID}
              timezone={timezone}
              subForms={subForms}
              roleId={roleId}
              uiSchema={uiSchema}
              permission={permission}
              isAuth={isAuth}
              errorSchema={errorSchema}
              idSchema={idSchema}
              idPrefix={idPrefix}
              formContext={formContext}
              taskData={tmpTaskData}
              formData={formData}
              onChange={this.onChange}
              onBlur={this.onBlur}
              onOptionFilter={onOptionFilter}
              onOptionResponse={onOptionResponse}
              onFocus={this.onFocus}
              registry={registry}
              safeRenderCompletion={safeRenderCompletion}
              disabled={disabled}
            />
            {!this.props.onBlurSubmit && (
              <>
                {children ? (
                  children
                ) : (
                    <div>
                      <button type="submit" className={submitBtnClass}>
                        {submitBtnName}
                      </button>
                    </div>
                  )}
              </>
            )
            }

          </FormTag>

        }
      </>
    );
  }
}

if (process.env.NODE_ENV !== "production") {
  Form.propTypes = {
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.object,
    permission: PropTypes.object,
    isAuth: PropTypes.bool,
    AuthID: PropTypes.number,
    EditorType:PropTypes.number,
    TaskID: PropTypes.string,
    updatedFields: PropTypes.any,
    realtimeUserPositionField: PropTypes.any,
    updatedFieldClassName: PropTypes.string,
    isDataLoaded: PropTypes.bool,
    roleId: PropTypes.string,
    timezone: PropTypes.string,
    subForms: PropTypes.object,
    formData: PropTypes.any,
    taskData: PropTypes.any,
    widgets: PropTypes.objectOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object])
    ),
    fields: PropTypes.objectOf(PropTypes.func),
    ArrayFieldTemplate: PropTypes.func,
    ObjectFieldTemplate: PropTypes.func,
    FieldTemplate: PropTypes.func,
    ErrorList: PropTypes.func,
    onChange: PropTypes.func,
    onError: PropTypes.func,
    showErrorList: PropTypes.bool,
    onSubmit: PropTypes.func,
    id: PropTypes.string,
    className: PropTypes.string,
    tagName: PropTypes.string,
    name: PropTypes.string,
    method: PropTypes.string,
    target: PropTypes.string,
    action: PropTypes.string,
    submitBtnClass: PropTypes.string,
    submitBtnName: PropTypes.string,
    autocomplete: PropTypes.string,
    enctype: PropTypes.string,
    acceptcharset: PropTypes.string,
    noValidate: PropTypes.bool,
    noHtml5Validate: PropTypes.bool,
    liveValidate: PropTypes.bool,
    validate: PropTypes.func,
    onBlurSubmit: PropTypes.func,
    transformErrors: PropTypes.func,
    safeRenderCompletion: PropTypes.bool,
    formContext: PropTypes.object,
    customFormats: PropTypes.object,
    additionalMetaSchemas: PropTypes.arrayOf(PropTypes.object),
    omitExtraData: PropTypes.bool,
  };
}
