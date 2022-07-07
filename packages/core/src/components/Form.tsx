import React, { Component } from 'react';
import {
  ArrayFieldTemplateProps,
  CustomValidator,
  ErrorListProps,
  ErrorSchema,
  ErrorTransformer,
  FieldTemplateProps,
  GenericObjectType,
  IChangeEvent,
  IdSchema,
  ObjectFieldTemplateProps,
  PathSchema,
  RJSFSchema,
  RJSFValidationError,
  Registry,
  RegistryWidgetsType,
  RegistryFieldsType,
  SchemaUtilsType,
  UiSchema,
  ValidationData,
  ValidatorType,
  WidgetProps,
  createSchemaUtils,
  deepEquals,
  isObject,
  mergeObjects,
  shouldRender,
} from '@rjsf/utils';
import _pick from 'lodash/pick';
import _get from 'lodash/get';
import _isEmpty from 'lodash/isEmpty';

import getDefaultRegistry from '../getDefaultRegistry';
import DefaultErrorList from './ErrorList';

export interface FormProps<T = any, F = any> {
  schema: RJSFSchema;
  validator: ValidatorType<T>;
  uiSchema?: UiSchema<T, F>;
  formData?: T;
  disabled?: boolean;
  readonly?: boolean;
  widgets?: RegistryWidgetsType<T, F>;
  fields?: RegistryFieldsType<T, F>;
  ArrayFieldTemplate?: React.ComponentType<ArrayFieldTemplateProps<T, F>>;
  ObjectFieldTemplate?: React.ComponentType<ObjectFieldTemplateProps<T, F>>;
  FieldTemplate?: React.ComponentType<FieldTemplateProps<T, F>>;
  ErrorList?: React.ComponentType<ErrorListProps<T, F>>;
  onChange?: (data: IChangeEvent<T, F>) => void; // TODO fix this
  onError?: (event: any) => void; // TODO fix this
  onSubmit?: (data: IChangeEvent<T, F>, event: any) => void; // TODO fix this
  onBlur?: (id: string, event: any) => void; // TODO fix this
  onFocus?: (id: string, event: any) => void; // TODO fix this
  showErrorList?: boolean;
  id?: string;
  className?: string;
  tagName?: React.ElementType; // TODO fix this?
  _internalFormWrapper?: React.ElementType; // TODO fix this
  name?: string;
  method?: string;
  target?: string;
  action?: string;
  autoComplete?: string;
  enctype?: string;
  acceptcharset?: string;
  noValidate?: boolean;
  noHtml5Validate?: boolean;
  liveValidate?: boolean;
  liveOmit?: boolean;
  validate?: CustomValidator<T>;
  transformErrors?: ErrorTransformer;
  formContext?: F;
  omitExtraData?: boolean;
  extraErrors: ErrorSchema<T>;
  idPrefix?: string;
  idSeparator?: string;
}

export interface FormState<T = any, F = any> {
  schema: RJSFSchema;
  uiSchema: UiSchema<T, F>;
  idSchema: IdSchema<T>;
  schemaUtils: SchemaUtilsType<T>;
  formData: T;
  edit: boolean;
  errors: RJSFValidationError[];
  errorSchema: ErrorSchema<T>;
  schemaValidationErrors: RJSFValidationError[],
  schemaValidationErrorSchema: ErrorSchema<T>,
}

export default class Form<T = any, F = any> extends Component<FormProps<T, F>, FormState<T, F>> {
  formElement: React.RefObject<any>;

  constructor(props: FormProps<T, F>) {
    super(props);

    this.state = this.getStateFromProps(props, props.formData);
    if (
      this.props.onChange &&
      !deepEquals(this.state.formData, this.props.formData)
    ) {
      this.props.onChange(this.state);
    }
    this.formElement = React.createRef();
  }

  UNSAFE_componentWillReceiveProps(nextProps: FormProps<T, F>) {
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

  getStateFromProps(props: FormProps<T, F>, inputFormData?: T): FormState<T, F> {
    const state: FormState<T, F> = this.state || {};
    const schema = 'schema' in props ? props.schema : this.props.schema;
    const uiSchema: UiSchema<T, F> = ('uiSchema' in props ? props.uiSchema! : this.props.uiSchema!) || {};
    const edit = typeof inputFormData !== 'undefined';
    const liveValidate =
      'liveValidate' in props ? props.liveValidate : this.props.liveValidate;
    const mustValidate = edit && !props.noValidate && liveValidate;
    const rootSchema = schema;
    let schemaUtils: SchemaUtilsType<T> = state.schemaUtils;
    if (!schemaUtils || schemaUtils.doesSchemaUtilsDiffer(props.validator, rootSchema)) {
      schemaUtils = createSchemaUtils<T>(props.validator, rootSchema);
    }
    const formData: T = schemaUtils.getDefaultFormState(schema, inputFormData) as T;
    const retrievedSchema = schemaUtils.retrieveSchema(schema, formData);

    const getCurrentErrors = (): ValidationData<T> => {
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

    let errors: RJSFValidationError[];
    let errorSchema: ErrorSchema<T> | undefined;
    let schemaValidationErrors: RJSFValidationError[] = state.schemaValidationErrors;
    let schemaValidationErrorSchema: ErrorSchema<T> = state.schemaValidationErrorSchema;
    if (mustValidate) {
      const schemaValidation = this.validate(
        schemaUtils,
        formData,
        schema,
      );
      errors = schemaValidation.errors;
      errorSchema = schemaValidation.errorSchema;
      schemaValidationErrors = errors;
      schemaValidationErrorSchema = errorSchema;
    } else {
      const currentErrors = getCurrentErrors();
      errors = currentErrors.errors;
      errorSchema = currentErrors.errorSchema;
    }
    if (props.extraErrors) {
      errorSchema = mergeObjects(errorSchema, props.extraErrors, true) as ErrorSchema<T>;
      errors = schemaUtils.getValidator().toErrorList(errorSchema);
    }
    const idSchema = schemaUtils.toIdSchema(
      retrievedSchema,
      uiSchema['ui:rootFieldId'],
      formData,
      props.idPrefix,
      props.idSeparator
    );
    const nextState: FormState<T, F> = {
      schemaUtils,
      schema,
      uiSchema,
      idSchema,
      formData,
      edit,
      errors,
      errorSchema,
      schemaValidationErrors,
      schemaValidationErrorSchema,
    };
    return nextState;
  }

  shouldComponentUpdate(nextProps: FormProps<T, F>, nextState: FormState<T, F>): boolean {
    return shouldRender(this, nextProps, nextState);
  }

  validate(
    schemaUtils: SchemaUtilsType<T>,
    formData: T,
    schema = this.props.schema,
  ): ValidationData<T> {
    const { validate, transformErrors } = this.props;
    const resolvedSchema = schemaUtils.retrieveSchema(schema, formData);
    return schemaUtils.getValidator().validateFormData(
      formData,
      resolvedSchema,
      validate,
      transformErrors
    );
  }

  renderErrors() {
    const { errors, errorSchema, schema, uiSchema } = this.state;
    const { ErrorList = DefaultErrorList, showErrorList, formContext } = this.props;

    if (errors && errors.length && showErrorList != false) {
      return (
        <ErrorList
          errors={errors}
          errorSchema={errorSchema || {}}
          schema={schema}
          uiSchema={uiSchema}
          formContext={formContext}
        />
      );
    }
    return null;
  }

  getUsedFormData = (formData: T, fields: string[]): T => {
    // For the case of a single input form
    if (fields.length === 0 && typeof formData !== 'object') {
      return formData;
    }

    const data: GenericObjectType = _pick(formData, fields);
    if (Array.isArray(formData)) {
      return Object.keys(data).map((key: string) => data[key]) as unknown as T;
    }

    return data as T;
  };

  getFieldNames = (pathSchema: PathSchema<T>, formData: T) => {
    const getAllPaths = (_obj: GenericObjectType, acc: string[] = [], paths = ['']) => {
      Object.keys(_obj).forEach((key: string) => {
        if (typeof _obj[key] === 'object') {
          const newPaths = paths.map(path => `${path}.${key}`);
          // If an object is marked with additionalProperties, all its keys are valid
          if (_obj[key].__rjsf_additionalProperties && _obj[key].$name !== '') {
            acc.push(_obj[key].$name);
          } else {
            getAllPaths(_obj[key], acc, newPaths);
          }
        } else if (key === '$name' && _obj[key] !== '') {
          paths.forEach(path => {
            path = path.replace(/^\./, '');
            const formValue = _get(formData, path);
            // adds path to fieldNames if it points to a value
            // or an empty object/array
            if (typeof formValue !== 'object' || _isEmpty(formValue)) {
              acc.push(path);
            }
          });
        }
      });
      return acc;
    };

    return getAllPaths(pathSchema);
  };

  onChange = (formData: T, newErrorSchema?: ErrorSchema<T>) => {
    const { extraErrors, omitExtraData, liveOmit, noValidate, liveValidate, onChange } = this.props;
    const { schemaUtils, schema } = this.state;
    if (isObject(formData) || Array.isArray(formData)) {
      const newState = this.getStateFromProps(this.props, formData);
      formData = newState.formData;
    }

    const mustValidate = !noValidate && liveValidate;
    let state: Partial<FormState<T, F>> = { formData, schema };
    let newFormData = formData;

    if (omitExtraData === true && liveOmit === true) {
      const retrievedSchema = schemaUtils.retrieveSchema(schema, formData);
      const pathSchema = schemaUtils.toPathSchema(retrievedSchema, '', formData);

      const fieldNames = this.getFieldNames(pathSchema, formData);

      newFormData = this.getUsedFormData(formData, fieldNames);
      state = {
        formData: newFormData,
      };
    }

    if (mustValidate) {
      const schemaValidation = this.validate(schemaUtils, newFormData);
      let errors = schemaValidation.errors;
      let errorSchema = schemaValidation.errorSchema;
      const schemaValidationErrors = errors;
      const schemaValidationErrorSchema = errorSchema;
      if (extraErrors) {
        errorSchema = mergeObjects(errorSchema, extraErrors, true) as ErrorSchema<T>;
        errors = schemaUtils.getValidator().toErrorList(errorSchema);
      }
      state = {
        formData: newFormData,
        errors,
        errorSchema,
        schemaValidationErrors,
        schemaValidationErrorSchema,
      };
    } else if (!noValidate && newErrorSchema) {
      const errorSchema = extraErrors
        ? mergeObjects(newErrorSchema, extraErrors, true) as ErrorSchema<T>
        : newErrorSchema;
      state = {
        formData: newFormData,
        errorSchema: errorSchema,
        errors: schemaUtils.getValidator().toErrorList(errorSchema),
      };
    }
    this.setState(
      state as FormState<T, F>,
      () => onChange && onChange(this.state)
    );
  };

  onBlur = (id: string, event: any) => {
    const { onBlur } = this.props;
    if (onBlur) {
      onBlur(id, event);
    }
  };

  onFocus = (id: string, event: any) => {
    const { onFocus } = this.props;
    if (onFocus) {
      onFocus(id, event);
    }
  };

  onSubmit = (event: React.FormEvent<any>) => {
    event.preventDefault();
    if (event.target !== event.currentTarget) {
      return;
    }

    event.persist();
    const { omitExtraData, extraErrors, noValidate, onSubmit, onError } = this.props;
    let { formData: newFormData } = this.state;
    const { schema, schemaUtils } = this.state;

    if (omitExtraData === true) {
      const retrievedSchema = schemaUtils.retrieveSchema(schema, newFormData);
      const pathSchema = schemaUtils.toPathSchema(retrievedSchema, '', newFormData);

      const fieldNames = this.getFieldNames(pathSchema, newFormData);

      newFormData = this.getUsedFormData(newFormData, fieldNames);
    }

    if (!noValidate) {
      const schemaValidation = this.validate(schemaUtils, newFormData);
      let errors = schemaValidation.errors;
      let errorSchema = schemaValidation.errorSchema;
      const schemaValidationErrors = errors;
      const schemaValidationErrorSchema = errorSchema;
      if (errors.length > 0) {
        if (extraErrors) {
          errorSchema = mergeObjects(errorSchema, extraErrors, true) as ErrorSchema<T>;
          errors = schemaUtils.getValidator().toErrorList(errorSchema);
        }
        this.setState(
          {
            errors,
            errorSchema,
            schemaValidationErrors,
            schemaValidationErrorSchema,
          },
          () => {
            if (onError) {
              onError(errors);
            } else {
              console.error('Form validation failed', errors);
            }
          }
        );
        return;
      }
    }

    // There are no errors generated through schema validation.
    // Check for user provided errors and update state accordingly.
    const errorSchema = extraErrors || {};
    const errors = extraErrors ? schemaUtils.getValidator().toErrorList(extraErrors) : [];
    this.setState(
      {
        formData: newFormData,
        errors,
        errorSchema,
        schemaValidationErrors: [],
        schemaValidationErrorSchema: {},
      },
      () => {
        if (onSubmit) {
          onSubmit(
            { ...this.state, formData: newFormData, status: 'submitted' },
            event
          );
        }
      }
    );
  };

  getRegistry(): Registry<T, F> {
    const { schemaUtils } = this.state;
    // For BC, accept passed SchemaField and TitleField props and pass them to
    // the 'fields' registry one.
    const { fields, widgets } = getDefaultRegistry();
    return {
      fields: { ...fields, ...this.props.fields },
      widgets: { ...widgets, ...this.props.widgets },
      ArrayFieldTemplate: this.props.ArrayFieldTemplate,
      ObjectFieldTemplate: this.props.ObjectFieldTemplate,
      FieldTemplate: this.props.FieldTemplate,
      rootSchema: this.props.schema,
      formContext: this.props.formContext || {} as F,
      schemaUtils,
    };
  }

  submit() {
    if (this.formElement.current) {
      this.formElement.current.dispatchEvent(
        new CustomEvent('submit', {
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
      idSeparator,
      className = '',
      tagName,
      name,
      method,
      target,
      action,
      autoComplete,
      enctype,
      acceptcharset,
      noHtml5Validate = false,
      disabled = false,
      readonly = false,
      formContext,
      /**
       * _internalFormWrapper is currently used by the material-ui and semantic-ui themes to provide a custom wrapper
       * around `<Form />` that supports the proper rendering of those themes. To use this prop, one must pass a
       * component that takes two props: `children` and `as`. That component, at minimum, should render the `children`
       * inside of a <form /> tag unless `as` is provided, in which case, use the `as` prop in place of `<form />`.
       * i.e.:
       * ```
       * export default function InternalForm({ children, as }) {
       *   const FormTag = as || 'form';
       *   return <FormTag>{children}</FormTag>;
       * }
       * ```
       */
      _internalFormWrapper,
    } = this.props;

    const { schema, uiSchema, formData, errorSchema, idSchema } = this.state;
    const registry = this.getRegistry();
    const _SchemaField = registry.fields.SchemaField;
    // The `semantic-ui` and `material-ui` themes have `_internalFormWrapper`s that take an `as` prop that is the
    // PropTypes.elementType to use for the inner tag so we'll need to pass `tagName` along if it is provided.
    // NOTE, the `as` prop is native to `semantic-ui` and is emulated in the `material-ui` theme
    const as = _internalFormWrapper ? tagName : undefined;
    const FormTag = _internalFormWrapper || tagName || 'form';
    const SubmitButton = registry.widgets.SubmitButton as React.ComponentType<Partial<WidgetProps<T, F>>>;

    return (
      <FormTag
        className={className ? className : 'rjsf'}
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
        as={as}
        ref={this.formElement}
      >
        {this.renderErrors()}
        <_SchemaField
          name=""
          schema={schema}
          uiSchema={uiSchema}
          errorSchema={errorSchema}
          idSchema={idSchema}
          idPrefix={idPrefix}
          idSeparator={idSeparator}
          formContext={formContext}
          formData={formData}
          onChange={this.onChange}
          onBlur={this.onBlur}
          onFocus={this.onFocus}
          registry={registry}
          disabled={disabled}
          readonly={readonly}
        />
        {children ? children : <SubmitButton uiSchema={uiSchema} />}
      </FormTag>
    );
  }
}
