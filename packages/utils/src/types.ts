import React from 'react';
import { JSONSchema7, JSONSchema7Definition } from 'json-schema';

export type GenericObjectType = {
  [name: string]: any;
};

/** Map the JSONSchema7 to our own type so that we can easily bump to JSONSchema8 at some future date and only have to
 * update this one type.
 */
export type RJSFSchema = JSONSchema7;

/** Map the JSONSchema7Definition to our own type so that we can easily bump to JSONSchema8Definition at some future
 * date and only have to update this one type.
 */
export type RJSFSchemaDefinition = JSONSchema7Definition;

export interface DateObject {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
}

export type RangeSpecType = {
  step?: number;
  min?: number;
  max?: number;
};

export type FieldId = {
  $id: string;
};

export type IdSchema<T = any> = FieldId & {
  [key in keyof T]?: IdSchema<T[key]>;
};

export type FieldPath = {
  $name: string;
};

export type PathSchema<T = any> = FieldPath & {
  [key in keyof T]?: PathSchema<T[key]>;
};

export type RJSFValidationError = {
  message?: string;
  name?: string;
  params?: any;
  property?: string;
  schemaPath?: string;
  stack: string;
};

export type FieldError = string;

export type FieldErrors = {
  __errors?: FieldError[];
}

export type ErrorSchema<T = any> = FieldErrors & {
  [key in keyof T]?: ErrorSchema<T[key]>;
};

export type FieldValidation = FieldErrors & {
  addError: (message: string) => void;
};

export type FormValidation<T = any> = FieldValidation & {
  [key in keyof T]?: FormValidation<T[key]>;
};

export type ErrorListProps<T = any, F = any> = {
  errorSchema: ErrorSchema<T>;
  errors: RJSFValidationError[];
  formContext?: F;
  schema: RJSFSchema;
  uiSchema?: UiSchema<T, F>;
};

export type RegistryFieldsType<T = any, F = any> = {
  [name: string]: Field<T, F>;
};

export type RegistryWidgetsType<T = any, F = any> = {
  [name: string]: Widget<T, F>;
};

export interface Registry<T = any, F = any> {
  fields: RegistryFieldsType<T, F>;
  widgets: RegistryWidgetsType<T, F>;
  formContext: F;
  rootSchema: RJSFSchema;
  schemaUtils: SchemaUtilsType<T>;
  ArrayFieldTemplate?: React.ComponentType<ArrayFieldTemplateProps<T, F>>;
  ObjectFieldTemplate?: React.ComponentType<ObjectFieldTemplateProps<T, F>>;
  FieldTemplate?: React.ComponentType<FieldTemplateProps<T, F>>;
}

export interface IChangeEvent<T = any, F = any> {
  edit: boolean;
  formData: T;
  errors: RJSFValidationError[];
  errorSchema: ErrorSchema<T>;
  idSchema: IdSchema;
  schema: RJSFSchema;
  uiSchema?: UiSchema<T, F>;
  status?: string;
}

export interface FieldProps<T = any, F = any>
  extends GenericObjectType, Pick<
    React.HTMLAttributes<HTMLElement>,
    Exclude<keyof React.HTMLAttributes<HTMLElement>, 'onBlur' | 'onFocus'>
  > {
  schema: RJSFSchema;
  uiSchema?: UiSchema<T, F>;
  idSchema: IdSchema;
  formData: T;
  errorSchema?: ErrorSchema<T>;
  onChange: (e: IChangeEvent<T, F> | any, es?: ErrorSchema<T>) => any;
  onBlur: (id: string, value: any) => void;
  onFocus: (id: string, value: any) => void;
  formContext?: F;
  autofocus?: boolean;
  disabled: boolean;
  readonly: boolean;
  required?: boolean;
  name: string;
  registry: Registry<T, F>;
}

export type Field<T = any, F = any> = React.ComponentType<FieldProps<T, F>>;

export type FieldTemplateProps<T = any, F = any> = {
  id: string;
  classNames?: string;
  label: string;
  description?: React.ReactElement;
  rawDescription?: string;
  children: React.ReactElement;
  errors?: React.ReactElement;
  rawErrors?: string[];
  help?: React.ReactElement;
  rawHelp?: string;
  hidden?: boolean;
  required?: boolean;
  readonly: boolean;
  disabled: boolean;
  displayLabel?: boolean;
  fields: Field<T, F>[];
  schema: RJSFSchema;
  uiSchema?: UiSchema<T, F>;
  formContext?: F;
  formData: T;
  onChange: (value: T) => void;
  onKeyChange: (value: string) => () => void;
  onDropPropertyClick: (value: string) => () => void;
  registry: Registry<T, F>;
};

export type TitleFieldProps = {
  id: string;
  title: string;
  required?: boolean;
};

export type DescriptionFieldProps = {
  id: string;
  description: string | React.ReactElement;
};

export type ArrayFieldTemplateItemType = {
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
};

export type ArrayFieldTemplateProps<T = any, F = any> = {
  DescriptionField: React.ComponentType<DescriptionFieldProps>;
  TitleField: React.ComponentType<TitleFieldProps>;
  canAdd?: boolean;
  className?: string;
  disabled?: boolean;
  idSchema: IdSchema;
  items: ArrayFieldTemplateItemType[];
  onAddClick: (event?: any) => void;
  readonly?: boolean;
  required?: boolean;
  schema: RJSFSchema;
  uiSchema?: UiSchema<T, F>;
  title: string;
  formContext?: F;
  formData: T;
  registry: Registry<T, F>;
};

export type ObjectFieldTemplatePropertyType = {
  content: React.ReactElement;
  name: string;
  disabled: boolean;
  readonly: boolean;
  hidden: boolean;
};

export type ObjectFieldTemplateProps<T = any, F = any> = {
  DescriptionField: React.ComponentType<DescriptionFieldProps>;
  TitleField: React.ComponentType<TitleFieldProps>;
  title: string;
  description?: string;
  disabled?: boolean;
  properties: ObjectFieldTemplatePropertyType[];
  onAddClick: (schema: RJSFSchema) => () => void;
  readonly?: boolean;
  required?: boolean;
  schema: RJSFSchema;
  uiSchema?: UiSchema<T, F>;
  idSchema: IdSchema;
  formData: T;
  formContext?: F;
  registry: Registry<T, F>;
};

export interface WidgetProps<T = any, F = any>
  extends GenericObjectType, Pick<
    React.HTMLAttributes<HTMLElement>,
    Exclude<keyof React.HTMLAttributes<HTMLElement>, 'onBlur' | 'onFocus'>
  > {
  id: string;
  schema: RJSFSchema;
  uiSchema?: UiSchema<T, F>;
  value: any;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  autofocus?: boolean;
  placeholder?: string;
  options: NonNullable<UIOptionsType>;
  formContext?: F;
  onBlur: (id: string, value: any) => void;
  onChange: (value: any) => void;
  onFocus: (id: string, value: any) => void;
  label: string;
  multiple?: boolean;
  rawErrors?: string[];
  registry: Registry<T, F>;
}

export type Widget<T = any, F = any> = React.ComponentType<WidgetProps<T, F>>;

export type UISchemaSubmitButtonOptions = {
  submitText?: string;
  norender?: boolean;
  props?: GenericObjectType & {
    disabled?: boolean;
    className?: string;
  };
}

export type UIOptionsType = {
  /** We know that for title, it will be a string, if it is provided */
  title?: string;
  /** We know that for description, it will be a string, if it is provided */
  description?: string;
  /** Anything else will be one of these types */
  [key: string]: boolean | number | string | object | any[] | null | undefined;
};

export type UiSchema<T = any, F = any> = GenericObjectType & {
  'ui:field'?: Field<T, F> | string;
  'ui:widget'?: Widget<T, F> | string;
  'ui:options'?: UIOptionsType;
  'ui:order'?: string[];
  'ui:FieldTemplate'?: React.ComponentType<FieldTemplateProps<T, F>>;
  'ui:ArrayFieldTemplate'?: React.ComponentType<ArrayFieldTemplateProps<T, F>>;
  'ui:ObjectFieldTemplate'?: React.ComponentType<ObjectFieldTemplateProps<T, F>>;
  'ui:submitButtonOptions'?: UISchemaSubmitButtonOptions;
};

export type CustomValidator<T = any> = (formData: T, errors: FormValidation<T>) => FormValidation<T>;

export type ErrorTransformer = (errors: RJSFValidationError[]) => RJSFValidationError[];

export type ValidationData<T> = { errors: RJSFValidationError[]; errorSchema: ErrorSchema<T> };

export interface ValidatorType<T = any> {
  validateFormData(
    formData: T,
    schema: RJSFSchema,
    customValidate?: CustomValidator<T>,
    transformErrors?: ErrorTransformer,
  ): ValidationData<T>;
  toErrorList(errorSchema?: ErrorSchema<T>, fieldName?: string): RJSFValidationError[];
  isValid(schema: RJSFSchema, formData: T, rootSchema: RJSFSchema): boolean;
}

export interface SchemaUtilsType<T = any> {
  getValidator(): ValidatorType<T>;
  doesSchemaUtilsDiffer(validator: ValidatorType, rootSchema: RJSFSchema): boolean;
  getDefaultFormState(schema: RJSFSchema, formData?: T, includeUndefinedValues?: boolean): T | T[] | undefined;
  getDisplayLabel<F = any>(schema: RJSFSchema, uiSchema?: UiSchema<T, F>): boolean;
  getMatchingOption(formData: T, options: RJSFSchema[]): number;
  isFilesArray<F = any>(schema: RJSFSchema, uiSchema?: UiSchema<T, F>): boolean;
  isMultiSelect(schema: RJSFSchema): boolean;
  isSelect(schema: RJSFSchema): boolean;
  retrieveSchema(schema: RJSFSchema, formData: T): RJSFSchema;
  toIdSchema(schema: RJSFSchema, id?: string, formData?: T, idPrefix?: string, idSeparator?: string): IdSchema<T>;
  toPathSchema(schema: RJSFSchema, name?: string, formData?: T): PathSchema<T>;
}
