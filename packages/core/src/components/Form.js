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
    const liveValidate = props.liveValidate || this.props.liveValidate;
    const mustValidate = edit && !props.noValidate && liveValidate;
    const { definitions } = schema;
    const formData = getDefaultFormState(schema, inputFormData, definitions);
    const retrievedSchema = retrieveSchema(schema, definitions, formData);
    const customFormats = props.customFormats;
    const additionalMetaSchemas = props.additionalMetaSchemas;
    let { errors, errorSchema } = mustValidate
      ? this.validate(formData, schema, additionalMetaSchemas, customFormats)
      : {
          errors: state.errors || [],
          errorSchema: state.errorSchema || {},
        };
    if (props.extraErrors) {
      errorSchema = mergeObjects(errorSchema, props.extraErrors);
      errors = toErrorList(errorSchema);
    }
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
      let { errors, errorSchema } = this.validate(newFormData);
      if (this.props.extraErrors) {
        errorSchema = mergeObjects(errorSchema, this.props.extraErrors);
        errors = toErrorList(errorSchema);
      }
      state = { formData: newFormData, errors, errorSchema };
    } else if (!this.props.noValidate && newErrorSchema) {
      const errorSchema = this.props.extraErrors
        ? mergeObjects(newErrorSchema, this.props.extraErrors)
        : newErrorSchema;
      state = {
        formData: newFormData,
        errorSchema: errorSchema,
        errors: toErrorList(errorSchema),
      };
    }
    this.setState(
      state,
      () => this.props.onChange && this.props.onChange(state)
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
      let { errors, errorSchema } = this.validate(newFormData);
      if (Object.keys(errors).length > 0) {
        if (this.props.extraErrors) {
          errorSchema = mergeObjects(errorSchema, this.props.extraErrors);
          errors = toErrorList(errorSchema);
        }
        const sortedErrors = this.orderErrorsByUiSchema(errors, errorSchema);

        this.setState({ sortedErrors, errorSchema }, () => {
          if (this.props.onError) {
            this.props.onError(sortedErrors);
          } else {
            console.error("Form validation failed", sortedErrors);
          }
        });
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

  orderErrorsByUiSchema = (_errors, _errorSchema) => {
    console.log("");
    console.log("");
    console.log(998, _errors);
    console.log(999, _errorSchema);

    const { uiSchema } = this.state;
    const errorsWithFlattenedPath = {};
    const flattenErrorSchema = (errorSchema, currentPath = "") => {
      Object.entries(errorSchema).forEach(([schemaKey, schemaValue]) => {
        if (Array.isArray(schemaValue)) {
          // we found the __errors array
          // find the error in _errors for this path
          const pathWithoutErrorsArray = currentPath
            .split(".")
            .filter(x => x !== "__errors");
          errorsWithFlattenedPath[currentPath] = _errors.filter(e => {
            return (
              e.property ===
              `.${pathWithoutErrorsArray.reduce(
                (acc, curVal) =>
                  `${acc}${
                    e.property.includes(`[${curVal}]`)
                      ? `[${curVal}]`
                      : `.${curVal}`
                  }`
              )}`
            );
          });
        } else {
          // we did not find the __errors array, yet. Let's go deeper
          let nextLevelPath;
          if (
            _errors.some(err =>
              err.property.includes(`${currentPath}[${schemaKey}]`)
            )
          ) {
            // array!
            nextLevelPath = `${currentPath}[${schemaKey}]`;
          } else {
            nextLevelPath = [currentPath, schemaKey].filter(x => !!x).join(".");
          }
          console.log(
            `going from (${currentPath}) with (${schemaKey}) into ${nextLevelPath}`
          );
          flattenErrorSchema(schemaValue, nextLevelPath);
        }
      });
    };
    flattenErrorSchema(_errorSchema);

    console.log("");
    console.log(
      4242,
      "outcome of creating the errorsWithFlattenedPath: ",
      errorsWithFlattenedPath,
      88854
    );

    const orderedErrors = [];

    const addErrorsForNode = (uiSchemaNode, currentPath = ".") => {
      const currentNodeUiOrder = uiSchemaNode["ui:order"];
      if (currentNodeUiOrder) {
        // there is an ui order here
        currentNodeUiOrder.forEach(propInOrder => {
          const getPropInOrderPath = () =>
            [
              currentPath
                .split(".")
                .filter(x => !!x)
                .join("."),
              propInOrder,
            ]
              .filter(x => !!x)
              .join(".");

          // TODO check for *
          const currentErrorPath = getPropInOrderPath();
          const errorForThisProp = errorsWithFlattenedPath[currentErrorPath];

          console.log(
            `we are looking at uiOrder prop (${propInOrder}) in path (${currentErrorPath})`,
            errorForThisProp,
            currentPath,
            1133
          );
          // TODO see if there are errors in errorsWithFlattenedPath that match currentErrorPath{somenumber}.propInOrder

          if (errorForThisProp) {
            // there is an error for this exact path
            // console.log('there is an error for this exact path!!!!!', errorForThisProp)
            if (!orderedErrors.includes(errorForThisProp)) {
              // it's not in the orderer errors so we add it
              orderedErrors.push(errorForThisProp);
            }
            // we don't want to stop adding the errors for this property (maybe it's a list with minItems and there are errors in the nested children)
            const flattenedErrosWithCurrentErrorPath = Object.entries(
              errorsWithFlattenedPath
            ).filter(([errPath]) => errPath.startsWith(`${currentErrorPath}[`));
            console.log("xD", flattenedErrosWithCurrentErrorPath);
            flattenedErrosWithCurrentErrorPath.forEach(([errPath]) => {
              // there in an error in this array so we want to go through them one by one and add them individually
              addErrorsForNode(
                uiSchemaNode[propInOrder],
                errPath.substring(0, errPath.lastIndexOf("."))
              );
            });
          } else {
            // there is no error for this uiorder field, we try to go deeper
            if (uiSchemaNode[propInOrder]) {
              console.log(`1 going into with ${currentErrorPath}`);
              const flattenedErrosWithCurrentErrorPath = Object.entries(
                errorsWithFlattenedPath
              ).filter(([errPath]) =>
                errPath.startsWith(`${currentErrorPath}[`)
              );
              console.log("xD", flattenedErrosWithCurrentErrorPath);
              flattenedErrosWithCurrentErrorPath.forEach(([errPath]) => {
                // there in an error in this array so we want to go through them one by one and add them individually
                addErrorsForNode(
                  uiSchemaNode[propInOrder],
                  errPath.substring(0, errPath.lastIndexOf("."))
                );
              });

              // TODO call new function to order it for error array?
              // TODO iterate over all errors to see if there are errors for this array, then call addErrorsForNode for every error
              addErrorsForNode(uiSchemaNode[propInOrder], getPropInOrderPath());
            } else {
              console.log("heawhehaw", currentErrorPath);
              // there's no error for this exact prop, but maybe it's an array
              // console.log('xaxaxa', currentPath, currentErrorPath, errorsWithFlattenedPath);
              const errorsThatStartWithThisPath = _errors.filter(err => {
                // console.log(`iterating over the errors to see if the err property (${err.property}) starts with (${`.${currentErrorPath}[`})`, err.property.startsWith(`.${currentErrorPath}[`));
                return err.property.startsWith(`.${currentErrorPath}[`);
              });
              // console.log('there are errors that start with this path!!!!!', currentErrorPath, errorsThatStartWithThisPath, 77, orderedErrors)
              errorsThatStartWithThisPath
                .filter(er => !orderedErrors.includes(er))
                .forEach(er => orderedErrors.push(er));
            }
          }
        });
      } else {
        // find errors on the current level
        const errorsOnTheCurrentPath = _errors.filter(err =>
          err.property.startsWith(err.property)
        );
        errorsOnTheCurrentPath.forEach(e => {
          const pathForProblematicThing = e.property.substring(
            e.property.indexOf(currentPath) + 1
          );
          const pathFor = pathForProblematicThing.substring(
            0,
            pathForProblematicThing.indexOf(".")
          );
          // is there a prop in the uiSchema for this? -> go deeper
          if (uiSchemaNode[pathFor]) {
            // the uiSchema node has a property for this ui:order element! Maybe it has an uiOrder itself
            // console.log(`going into 2 with ${`.${pathFor}`}`);

            addErrorsForNode(uiSchemaNode[pathFor], `.${pathFor}`);
          } else {
            // there is no property for this element in the current uiSchema so we simply add it to this position
            orderedErrors.push(e);
          }
        });
      }

      // go deeper
      Object.entries(uiSchemaNode).forEach(([k, v]) => {
        if (typeof v === "object" && !Array.isArray(v)) {
          // console.log(`going into 2 with ${`${currentPath}${k}`}`);
          addErrorsForNode(v, `${currentPath}${k}`);
        }
      });
    };

    addErrorsForNode(uiSchema);

    // flatten thing
    const flattened = [].concat(...orderedErrors);
    console.log();
    console.log(
      "outcome of the sorting: ",
      flattened,
      "hehe",
      flattened.length
    );
    return flattened;
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
    tagName: PropTypes.string,
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
