import React from 'react';
import { JSONSchema7 } from 'json-schema';

export type FieldId = {
  $id: string;
};

export type IdSchema<T = any> = FieldId & {
  [key in keyof T]: IdSchema<T[key]>;
};

export type FieldPath = {
  $name: string;
};

export type PathSchema<T = any> = FieldPath & {
  [key in keyof T]: PathSchema<T[key]>;
};

export type ValidationError = {
  message?: string;
  name?: string;
  params?: any;
  property?: string;
  stack: string;
};

export type FieldError = string;

export type FieldErrors = {
  __errors?: FieldError[];
}

export type ErrorSchema<T = any> = FieldErrors & {
  [key in keyof T]: ErrorSchema<T[key]>;
};

export type FieldValidation = {
  __errors: FieldError[];
  addError: (message: string) => void;
};

export type FormValidation<T = any> = FieldValidation & {
  [key in keyof T]: FormValidation<T[key]>;
};

export type ErrorListProps<T = any> = {
  errorSchema: FormValidation;
  errors: ValidationError[];
  formContext: any;
  schema: JSONSchema7;
  uiSchema: UiSchema<T>;
};

export interface Registry<T = any> {
  fields: { [name: string]: Field<T> };
  widgets: { [name: string]: Widget<T> };
  definitions: { [name: string]: any };
  formContext: any;
  rootSchema: JSONSchema7;
}

export interface IChangeEvent<T = any> {
  edit: boolean;
  formData: T;
  errors: ValidationError[];
  errorSchema: FormValidation;
  idSchema: IdSchema;
  schema: JSONSchema7;
  uiSchema: UiSchema;
  status?: string;
}

export interface FieldProps<T = any>
  extends Pick<React.HTMLAttributes<HTMLElement>, Exclude<keyof React.HTMLAttributes<HTMLElement>, 'onBlur' | 'onFocus'>> {
  schema: JSONSchema7;
  uiSchema: UiSchema;
  idSchema: IdSchema;
  formData: T;
  errorSchema: ErrorSchema;
  onChange: (e: IChangeEvent<T> | any, es?: ErrorSchema) => any;
  onBlur: (id: string, value: any) => void;
  onFocus: (id: string, value: any) => void;
  formContext: any;
  autofocus: boolean;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  name: string;
  registry: Registry<T>;
  [prop: string]: any; // Allow for other props
}

export type Field<T = any> = React.FunctionComponent<FieldProps<T>> | React.ComponentClass<FieldProps<T>>;

export type FieldTemplateProps<T = any> = {
  id: string;
  classNames: string;
  label: string;
  description: React.ReactElement;
  rawDescription: string;
  children: React.ReactElement;
  errors: React.ReactElement;
  rawErrors: string[];
  help: React.ReactElement;
  rawHelp: string;
  hidden: boolean;
  required: boolean;
  readonly: boolean;
  disabled: boolean;
  displayLabel: boolean;
  fields: Field<T>[];
  schema: JSONSchema7;
  uiSchema: UiSchema;
  formContext: any;
  formData: T;
  onChange: (value: T) => void;
  onKeyChange: (value: string) => () => void;
  onDropPropertyClick: (value: string) => () => void;
  registry: Registry<T>;
};

export type ArrayFieldTemplateProps<T = any> = {
  DescriptionField: React.FunctionComponent<{ id: string; description: string | React.ReactElement }>;
  TitleField: React.FunctionComponent<{ id: string; title: string; required: boolean }>;
  canAdd: boolean;
  className: string;
  disabled: boolean;
  idSchema: IdSchema;
  items: {
    children: React.ReactElement;
    className: string;
    disabled: boolean;
    hasMoveDown: boolean;
    hasMoveUp: boolean;
    hasRemove: boolean;
    hasToolbar: boolean;
    index: number;
    onAddIndexClick: (index: number) => (event?: any) => void;
    onDropIndexClick: (index: number) => (event?: any) => void;
    onReorderClick: (index: number, newIndex: number) => (event?: any) => void;
    readonly: boolean;
    key: string;
  }[];
  onAddClick: (event?: any) => void;
  readonly: boolean;
  required: boolean;
  schema: JSONSchema7;
  uiSchema: UiSchema;
  title: string;
  formContext: any;
  formData: T;
  registry: Registry<T>;
};

export type ObjectFieldTemplateProps<T = any> = {
  DescriptionField: React.FunctionComponent<{ id: string; description: string | React.ReactElement }>;
  TitleField: React.FunctionComponent<{ id: string; title: string; required: boolean }>;
  title: string;
  description: string;
  disabled: boolean;
  properties: {
    content: React.ReactElement;
    name: string;
    disabled: boolean;
    readonly: boolean;
    hidden: boolean;
  }[];
  onAddClick: (schema: JSONSchema7) => () => void;
  readonly: boolean;
  required: boolean;
  schema: JSONSchema7;
  uiSchema: UiSchema;
  idSchema: IdSchema;
  formData: T;
  formContext: any;
  registry: Registry<T>;
};

export interface WidgetProps<T = any>
  extends Pick<
    React.HTMLAttributes<HTMLElement>,
    Exclude<keyof React.HTMLAttributes<HTMLElement>, 'onBlur' | 'onFocus'>
    > {
  id: string;
  schema: JSONSchema7;
  uiSchema: UiSchema;
  value: any;
  required: boolean;
  disabled: boolean;
  readonly: boolean;
  autofocus: boolean;
  placeholder: string;
  onChange: (value: any) => void;
  options: NonNullable<UiSchema['ui:options']>;
  formContext: any;
  onBlur: (id: string, value: any) => void;
  onFocus: (id: string, value: any) => void;
  label: string;
  multiple: boolean;
  rawErrors: string[];
  registry: Registry<T>;
  [prop: string]: any; // Allow for other props
}

export type Widget<T = any> = React.FunctionComponent<WidgetProps<T>> | React.ComponentClass<WidgetProps<T>>;

export type UISchemaSubmitButtonOptions = {
  submitText: string;
  norender: boolean;
  props: {
    disabled?:boolean;
    className?:string;
    [name: string]: any;
  };
}

export type UiSchema<T = any> = {
  'ui:field'?: Field<T> | string;
  'ui:widget'?: Widget<T> | string;
  'ui:options'?: { [key: string]: boolean | number | string | object | any[] | null };
  'ui:order'?: string[];
  'ui:FieldTemplate'?: React.FunctionComponent<FieldTemplateProps<T>>;
  'ui:ArrayFieldTemplate'?: React.FunctionComponent<ArrayFieldTemplateProps<T>>;
  'ui:ObjectFieldTemplate'?: React.FunctionComponent<ObjectFieldTemplateProps<T>>;
  [name: string]: any;
  'ui:submitButtonOptions'?: UISchemaSubmitButtonOptions;
};

export type CustomValidator<T = any> = (formData: T, errors: FormValidation) => FormValidation;

export type ErrorTransformer = (errors: ValidationError[]) => ValidationError[];

export type ValidationData = { errors: ValidationError[]; errorSchema: ErrorSchema };

export interface ValidatorType<T = any> {
  validateFormData: (
    formData: T,
    schema: JSONSchema7,
    customValidate?: CustomValidator<T>,
    transformErrors?: ErrorTransformer,
  ) => ValidationData;
  toErrorList: (errorSchema?: ErrorSchema, fieldName?: string) => ValidationError[];
  isValid: (schema: JSONSchema7, formData: T, rootSchema: JSONSchema7) => boolean;
}
