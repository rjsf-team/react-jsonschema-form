import React from "react";
import { JSONSchema7 } from "json-schema";

/** The representation of any generic object type, usually used as an intersection on other types to make them more
 * flexible in the properties they support (i.e. anything else)
 */
export type GenericObjectType = {
  [name: string]: any;
};

/** Map the JSONSchema7 to our own type so that we can easily bump to a more recent version at some future date and only
 * have to update this one type.
 */
export type StrictRJSFSchema = JSONSchema7;

/** Allow for more flexible schemas (i.e. draft-2019) than the strict JSONSchema7
 */
export type RJSFSchema = StrictRJSFSchema & GenericObjectType;

/** Alias GenericObjectType as FormContextType to allow us to remap this at some future date
 */
export type FormContextType = GenericObjectType;

/** The interface representing a Date object that contains an optional time */
export interface DateObject {
  /** The year of the Date */
  year: number;
  /** The month of the Date */
  month: number;
  /** The day of the Date */
  day: number;
  /** The optional hours for the time of a Date */
  hour?: number;
  /** The optional minutes for the time of a Date */
  minute?: number;
  /** The optional seconds for the time of a Date */
  second?: number;
}

/** Properties describing a Range specification in terms of attribute that can be added to the `HTML` `<input>` */
export type RangeSpecType = {
  /** Specifies the interval between legal numbers in an input field */
  step?: number;
  /** Specifies a minimum value for an <input> element */
  min?: number;
  /** Specifies the maximum value for an <input> element */
  max?: number;
};

/** Properties describing a Range specification in terms of attribute that can be added to the `HTML` `<input>` */
export type InputPropsType = Omit<RangeSpecType, "step"> & {
  /** Specifies the type of the <input> element */
  type: string;
  /** Specifies the interval between legal numbers in an input field or "any" */
  step?: number | "any";
  /** Specifies the `autoComplete` value for an <input> element */
  autoComplete?: HTMLInputElement["autocomplete"];
};

/** Type describing an id used for a field in the `IdSchema` */
export type FieldId = {
  /** The id for a field */
  $id: string;
};

/** Type describing a recursive structure of `FieldId`s for an object with a non-empty set of keys */
export type IdSchema<T = any> = FieldId & {
  /** The set of ids for fields in the recursive object structure */
  [key in keyof T]?: IdSchema<T[key]>;
};

/** Type describing a name used for a field in the `PathSchema` */
export type FieldPath = {
  /** The name of a field */
  $name: string;
};

/** Type describing a recursive structure of `FieldPath`s for an object with a non-empty set of keys */
export type PathSchema<T = any> = FieldPath & {
  /** The set of names for fields in the recursive object structure */
  [key in keyof T]?: PathSchema<T[key]>;
};

/** The type for error produced by RJSF schema validation */
export type RJSFValidationError = {
  /** Name of the error, for example, "required" or "minLength" */
  name?: string;
  /** Message, for example, "is a required property" or "should NOT be shorter than 3 characters" */
  message?: string;
  /** An object with the error params returned by ajv
   * ([see doc](https://github.com/ajv-validator/ajv/tree/6a671057ea6aae690b5967ee26a0ddf8452c6297#error-parameters)
   * for more info)
   */
  params?: any;
  /** A string in Javascript property accessor notation to the data path of the field with the error. For example,
   * `.name` or `['first-name']`
   */
  property?: string;
  /** JSON pointer to the schema of the keyword that failed validation. For example, `#/fields/firstName/required`.
   * (Note: this may sometimes be wrong due to a [bug in ajv](https://github.com/ajv-validator/ajv/issues/512))
   */
  schemaPath?: string;
  /** Full error name, for example ".name is a required property" */
  stack: string;
};

/** The type that describes an error in a field */
export type FieldError = string;

/** The type that describes the list of errors for a field */
export type FieldErrors = {
  /** The list of errors for the field */
  __errors?: FieldError[];
};

/** Type describing a recursive structure of `FieldErrors`s for an object with a non-empty set of keys */
export type ErrorSchema<T = any> = FieldErrors & {
  /** The set of errors for fields in the recursive object structure */
  [key in keyof T]?: ErrorSchema<T[key]>;
};

/** Type that describes the list of errors for a field being actively validated by a custom validator */
export type FieldValidation = FieldErrors & {
  /** Function that will add a new `message` to the list of errors */
  addError: (message: string) => void;
};

/** Type describing a recursive structure of `FieldValidation`s for an object with a non-empty set of keys */
export type FormValidation<T = any> = FieldValidation & {
  /** The set of validation objects for fields in the recursive object structure */
  [key in keyof T]?: FormValidation<T[key]>;
};

/** The properties that are passed to an `ErrorListTemplate` implementation */
export type ErrorListProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> = {
  /** The errorSchema constructed by `Form` */
  errorSchema: ErrorSchema<T>;
  /** An array of the errors */
  errors: RJSFValidationError[];
  /** The `formContext` object that was passed to `Form` */
  formContext?: F;
  /** The schema that was passed to `Form` */
  schema: S;
  /** The uiSchema that was passed to `Form` */
  uiSchema?: UiSchema<T, S, F>;
};

/** The properties that are passed to an `FieldErrorTemplate` implementation */
export type FieldErrorProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> = {
  /** The errorSchema constructed by `Form` */
  errorSchema?: ErrorSchema<T>;
  /** An array of the errors */
  errors?: Array<string | React.ReactElement>;
  /** The tree of unique ids for every child field */
  idSchema: IdSchema<T>;
  /** The schema that was passed to field */
  schema: S;
  /** The uiSchema that was passed to field */
  uiSchema?: UiSchema<T, S, F>;
  /** The `registry` object */
  registry: Registry<T, S, F>;
};

/** The properties that are passed to an `FieldHelpTemplate` implementation */
export type FieldHelpProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> = {
  /** The help information to be rendered */
  help?: string | React.ReactElement;
  /** The tree of unique ids for every child field */
  idSchema: IdSchema<T>;
  /** The schema that was passed to field */
  schema: S;
  /** The uiSchema that was passed to field */
  uiSchema?: UiSchema<T, S, F>;
  /** Flag indicating whether there are errors associated with this field */
  hasErrors?: boolean;
  /** The `registry` object */
  registry: Registry<T, S, F>;
};

/** The set of `Fields` stored in the `Registry` */
export type RegistryFieldsType<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> = {
  /** A `Field` indexed by `name` */
  [name: string]: Field<T, S, F>;
};

/** The set of `Widgets` stored in the `Registry` */
export type RegistryWidgetsType<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> = {
  /** A `Widget` indexed by `name` */
  [name: string]: Widget<T, S, F>;
};

/** The set of RJSF templates that can be overridden by themes or users */
export interface TemplatesType<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> {
  /** The template to use while rendering normal or fixed array fields */
  ArrayFieldTemplate: React.ComponentType<ArrayFieldTemplateProps<T, S, F>>;
  /** The template to use while rendering the description for an array field */
  ArrayFieldDescriptionTemplate: React.ComponentType<
    ArrayFieldDescriptionProps<T, S, F>
  >;
  /** The template to use while rendering an item in an array field */
  ArrayFieldItemTemplate: React.ComponentType<
    ArrayFieldTemplateItemType<T, S, F>
  >;
  /** The template to use while rendering the title for an array field */
  ArrayFieldTitleTemplate: React.ComponentType<ArrayFieldTitleProps<T, S, F>>;
  /** The template to use while rendering the standard html input */
  BaseInputTemplate: React.ComponentType<WidgetProps<T, S, F>>;
  /** The template to use for rendering the description of a field */
  DescriptionFieldTemplate: React.ComponentType<DescriptionFieldProps<T, S, F>>;
  /** The template to use while rendering the errors for the whole form */
  ErrorListTemplate: React.ComponentType<ErrorListProps<T, S, F>>;
  /** The template to use while rendering the errors for a single field */
  FieldErrorTemplate: React.ComponentType<FieldErrorProps<T, S, F>>;
  /** The template to use while rendering the errors for a single field */
  FieldHelpTemplate: React.ComponentType<FieldHelpProps<T, S, F>>;
  /** The template to use while rendering a field */
  FieldTemplate: React.ComponentType<FieldTemplateProps<T, S, F>>;
  /** The template to use while rendering an object */
  ObjectFieldTemplate: React.ComponentType<ObjectFieldTemplateProps<T, S, F>>;
  /** The template to use for rendering the title of a field */
  TitleFieldTemplate: React.ComponentType<TitleFieldProps<T, S, F>>;
  /** The template to use for rendering information about an unsupported field type in the schema */
  UnsupportedFieldTemplate: React.ComponentType<UnsupportedFieldProps<T, S, F>>;
  /** The template to use for rendering a field that allows a user to add additional properties */
  WrapIfAdditionalTemplate: React.ComponentType<
    WrapIfAdditionalTemplateProps<T, S, F>
  >;
  /** The set of templates associated with buttons in the form */
  ButtonTemplates: {
    /** The template to use for the main `Submit` button  */
    SubmitButton: React.ComponentType<SubmitButtonProps<T, S, F>>;
    /** The template to use for the Add button used for AdditionalProperties and Array items */
    AddButton: React.ComponentType<IconButtonProps<T, S, F>>;
    /** The template to use for the Move Down button used for Array items */
    MoveDownButton: React.ComponentType<IconButtonProps<T, S, F>>;
    /** The template to use for the Move Up button used for Array items */
    MoveUpButton: React.ComponentType<IconButtonProps<T, S, F>>;
    /** The template to use for the Remove button used for AdditionalProperties and Array items */
    RemoveButton: React.ComponentType<IconButtonProps<T, S, F>>;
  };
}

/** The object containing the registered core, theme and custom fields and widgets as well as the root schema, form
 * context, schema utils and templates.
 */
export interface Registry<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> {
  /** The set of all fields used by the `Form`. Includes fields from `core`, theme-specific fields and any custom
   * registered fields
   */
  fields: RegistryFieldsType<T, S, F>;
  /** The set of templates used by the `Form`. Includes templates from `core`, theme-specific fields and any custom
   * registered templates
   */
  templates: TemplatesType<T, S, F>;
  /** The set of all widgets used by the `Form`. Includes widgets from `core`, theme-specific widgets and any custom
   * registered widgets
   */
  widgets: RegistryWidgetsType<T, S, F>;
  /** The `formContext` object that was passed to `Form` */
  formContext: F;
  /** The root schema, as passed to the `Form`, which can contain referenced definitions */
  rootSchema: S;
  /** The current implementation of the `SchemaUtilsType` (from `@rjsf/utils`) in use by the `Form`.  Used to call any
   * of the validation-schema-based utility functions
   */
  schemaUtils: SchemaUtilsType<T, S>;
}

/** The properties that are passed to a Field implementation */
export interface FieldProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> extends GenericObjectType,
    Pick<
      React.HTMLAttributes<HTMLElement>,
      Exclude<
        keyof React.HTMLAttributes<HTMLElement>,
        "onBlur" | "onFocus" | "onChange"
      >
    > {
  /** The JSON subschema object for this field */
  schema: S;
  /** The uiSchema for this field */
  uiSchema?: UiSchema<T, S, F>;
  /** The tree of unique ids for every child field */
  idSchema: IdSchema<T>;
  /** The data for this field */
  formData: T;
  /** The tree of errors for this field and its children */
  errorSchema?: ErrorSchema<T>;
  /** The field change event handler; called with the updated form data and an optional `ErrorSchema` */
  onChange: (newFormData: T, es?: ErrorSchema<T>, id?: string) => any;
  /** The input blur event handler; call it with the field id and value */
  onBlur: (id: string, value: any) => void;
  /** The input focus event handler; call it with the field id and value */
  onFocus: (id: string, value: any) => void;
  /** The `formContext` object that you passed to `Form` */
  formContext?: F;
  /** A boolean value stating if the field should autofocus */
  autofocus?: boolean;
  /** A boolean value stating if the field is disabled */
  disabled: boolean;
  /** A boolean value stating if the field is hiding its errors */
  hideError?: boolean;
  /** A boolean value stating if the field is read-only */
  readonly: boolean;
  /** The required status of this field */
  required?: boolean;
  /** The unique name of the field, usually derived from the name of the property in the JSONSchema */
  name: string;
  /** The `registry` object */
  registry: Registry<T, S, F>;
}

/** The definition of a React-based Field component */
export type Field<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> = React.ComponentType<FieldProps<T, S, F>>;

/** The properties that are passed to a FieldTemplate implementation */
export type FieldTemplateProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> = {
  /** The id of the field in the hierarchy. You can use it to render a label targeting the wrapped widget */
  id: string;
  /** A string containing the base CSS classes, merged with any custom ones defined in your uiSchema */
  classNames?: string;
  /** The computed label for this field, as a string */
  label: string;
  /** A component instance rendering the field description, if one is defined (this will use any custom
   * `DescriptionField` defined)
   */
  description?: React.ReactElement;
  /** A string containing any `ui:description` uiSchema directive defined */
  rawDescription?: string;
  /** The field or widget component instance for this field row */
  children: React.ReactElement;
  /** A component instance listing any encountered errors for this field */
  errors?: React.ReactElement;
  /** An array of strings listing all generated error messages from encountered errors for this field */
  rawErrors?: string[];
  /** A component instance rendering any `ui:help` uiSchema directive defined */
  help?: React.ReactElement;
  /** A string containing any `ui:help` uiSchema directive defined. **NOTE:** `rawHelp` will be `undefined` if passed
   * `ui:help` is a React component instead of a string
   */
  rawHelp?: string;
  /** A boolean value stating if the field should be hidden */
  hidden?: boolean;
  /** A boolean value stating if the field is required */
  required?: boolean;
  /** A boolean value stating if the field is read-only */
  readonly: boolean;
  /** A boolean value stating if the field is hiding its errors */
  hideError?: boolean;
  /** A boolean value stating if the field is disabled */
  disabled: boolean;
  /** A boolean value stating if the label should be rendered or not. This is useful for nested fields in arrays where
   * you don't want to clutter the UI
   */
  displayLabel?: boolean;
  /** The schema object for this field */
  schema: S;
  /** The uiSchema object for this field */
  uiSchema?: UiSchema<T, S, F>;
  /** The `formContext` object that was passed to `Form` */
  formContext?: F;
  /** The formData for this field */
  formData: T;
  /** The value change event handler; Can be called with a new value to change the value for this field */
  onChange: FieldProps["onChange"];
  /** The key change event handler; Called when the key associated with a field is changed for an additionalProperty */
  onKeyChange: (value: string) => () => void;
  /** The property drop/removal event handler; Called when a field is removed in an additionalProperty context */
  onDropPropertyClick: (value: string) => () => void;
  /** The `registry` object */
  registry: Registry<T, S, F>;
};

/** The properties that are passed to the `UnsupportedFieldTemplate` implementation */
export type UnsupportedFieldProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> = {
  /** The schema object for this field */
  schema: S;
  /** The tree of unique ids for every child field */
  idSchema?: IdSchema<T>;
  /** The reason why the schema field has an unsupported type */
  reason: string;
  /** The `registry` object */
  registry: Registry<T, S, F>;
};

/** The properties that are passed to a `TitleFieldTemplate` implementation */
export type TitleFieldProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> = {
  /** The id of the field title in the hierarchy */
  id: string;
  /** The title for the field being rendered */
  title: string;
  /** The schema object for the field being titled */
  schema: S;
  /** The uiSchema object for this title field */
  uiSchema?: UiSchema<T, S, F>;
  /** A boolean value stating if the field is required */
  required?: boolean;
  /** The `registry` object */
  registry: Registry<T, S, F>;
};

/** The properties that are passed to a `DescriptionFieldTemplate` implementation */
export type DescriptionFieldProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> = {
  /** The id of the field description in the hierarchy */
  id: string;
  /** The schema object for the field being described */
  schema: S;
  /** The uiSchema object for this description field */
  uiSchema?: UiSchema<T, S, F>;
  /** The description of the field being rendered */
  description: string | React.ReactElement;
  /** The `registry` object */
  registry: Registry<T, S, F>;
};

/** The properties that are passed to a `ArrayFieldTitleTemplate` implementation */
export type ArrayFieldTitleProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> = Omit<TitleFieldProps<T, S, F>, "id" | "title"> & {
  /** The title for the field being rendered */
  title?: string;
  /** The idSchema of the field in the hierarchy */
  idSchema: IdSchema<T>;
};

/** The properties that are passed to a `ArrayFieldDescriptionTemplate` implementation */
export type ArrayFieldDescriptionProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> = Omit<DescriptionFieldProps<T, S, F>, "id" | "description"> & {
  /** The description of the field being rendered */
  description?: string | React.ReactElement;
  /** The idSchema of the field in the hierarchy */
  idSchema: IdSchema<T>;
};

/** The properties of each element in the ArrayFieldTemplateProps.items array */
export type ArrayFieldTemplateItemType<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> = {
  /** The html for the item's content */
  children: React.ReactElement;
  /** The className string */
  className: string;
  /** A boolean value stating if the array item is disabled */
  disabled: boolean;
  /** A boolean value stating whether new items can be added to the array */
  canAdd: boolean;
  /** A boolean value stating whether the array item can be moved down */
  hasMoveDown: boolean;
  /** A boolean value stating whether the array item can be moved up */
  hasMoveUp: boolean;
  /** A boolean value stating whether the array item can be removed */
  hasRemove: boolean;
  /** A boolean value stating whether the array item has a toolbar */
  hasToolbar: boolean;
  /** A number stating the index the array item occurs in `items` */
  index: number;
  /** A number stating the total number `items` in the array */
  totalItems: number;
  /** Returns a function that adds a new item at `index` */
  onAddIndexClick: (index: number) => (event?: any) => void;
  /** Returns a function that removes the item at `index` */
  onDropIndexClick: (index: number) => (event?: any) => void;
  /** Returns a function that swaps the items at `index` with `newIndex` */
  onReorderClick: (index: number, newIndex: number) => (event?: any) => void;
  /** A boolean value stating if the array item is read-only */
  readonly: boolean;
  /** A stable, unique key for the array item */
  key: string;
  /** The schema object for this array item */
  schema: S;
  /** The uiSchema object for this array item */
  uiSchema?: UiSchema<T, S, F>;
  /** The `registry` object */
  registry: Registry<T, S, F>;
};

/** The properties that are passed to an ArrayFieldTemplate implementation */
export type ArrayFieldTemplateProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> = {
  /** A boolean value stating whether new elements can be added to the array */
  canAdd?: boolean;
  /** The className string */
  className?: string;
  /** A boolean value stating if the array is disabled */
  disabled?: boolean;
  /** An object containing the id for this object & ids for its properties */
  idSchema: IdSchema<T>;
  /** An array of objects representing the items in the array */
  items: ArrayFieldTemplateItemType<T, S, F>[];
  /** A function that adds a new item to the array */
  onAddClick: (event?: any) => void;
  /** A boolean value stating if the array is read-only */
  readonly?: boolean;
  /** A boolean value stating if the array is required */
  required?: boolean;
  /** A boolean value stating if the field is hiding its errors */
  hideError?: boolean;
  /** The schema object for this array */
  schema: S;
  /** The uiSchema object for this array field */
  uiSchema?: UiSchema<T, S, F>;
  /** A string value containing the title for the array */
  title: string;
  /** The `formContext` object that was passed to Form */
  formContext?: F;
  /** The formData for this array */
  formData: T;
  /** An array of strings listing all generated error messages from encountered errors for this widget */
  rawErrors?: string[];
  /** The `registry` object */
  registry: Registry<T, S, F>;
};

/** The properties of each element in the ObjectFieldTemplateProps.properties array */
export type ObjectFieldTemplatePropertyType = {
  /** The html for the property's content */
  content: React.ReactElement;
  /** A string representing the property name */
  name: string;
  /** A boolean value stating if the object property is disabled */
  disabled: boolean;
  /** A boolean value stating if the property is read-only */
  readonly: boolean;
  /** A boolean value stating if the property should be hidden */
  hidden: boolean;
};

/** The properties that are passed to an ObjectFieldTemplate implementation */
export type ObjectFieldTemplateProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> = {
  /** A string value containing the title for the object */
  title: string;
  /** A string value containing the description for the object */
  description?: string;
  /** A boolean value stating if the object is disabled */
  disabled?: boolean;
  /** An array of objects representing the properties in the object */
  properties: ObjectFieldTemplatePropertyType[];
  /** Returns a function that adds a new property to the object (to be used with additionalProperties) */
  onAddClick: (schema: S) => () => void;
  /** A boolean value stating if the object is read-only */
  readonly?: boolean;
  /** A boolean value stating if the object is required */
  required?: boolean;
  /** A boolean value stating if the field is hiding its errors */
  hideError?: boolean;
  /** The schema object for this object */
  schema: S;
  /** The uiSchema object for this object field */
  uiSchema?: UiSchema<T, S, F>;
  /** An object containing the id for this object & ids for its properties */
  idSchema: IdSchema<T>;
  /** The form data for the object */
  formData: T;
  /** The `formContext` object that was passed to Form */
  formContext?: F;
  /** The `registry` object */
  registry: Registry<T, S, F>;
};

/** The properties that are passed to a WrapIfAdditionalTemplate implementation */
export type WrapIfAdditionalTemplateProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> = {
  /** The field or widget component instance for this field row */
  children: React.ReactNode;
} & Pick<
  FieldTemplateProps<T, S, F>,
  | "id"
  | "classNames"
  | "label"
  | "required"
  | "readonly"
  | "disabled"
  | "schema"
  | "uiSchema"
  | "onKeyChange"
  | "onDropPropertyClick"
  | "registry"
>;

/** The properties that are passed to a Widget implementation */
export interface WidgetProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> extends GenericObjectType,
    Pick<
      React.HTMLAttributes<HTMLElement>,
      Exclude<keyof React.HTMLAttributes<HTMLElement>, "onBlur" | "onFocus">
    > {
  /** The generated id for this widget */
  id: string;
  /** The JSONSchema subschema object for this widget */
  schema: S;
  /** The uiSchema for this widget */
  uiSchema?: UiSchema<T, S, F>;
  /** The current value for this widget */
  value: any;
  /** The required status of this widget */
  required?: boolean;
  /** A boolean value stating if the widget is disabled */
  disabled?: boolean;
  /** A boolean value stating if the widget is read-only */
  readonly?: boolean;
  /** A boolean value stating if the widget is hiding its errors */
  hideError?: boolean;
  /** A boolean value stating if the widget should autofocus */
  autofocus?: boolean;
  /** The placeholder for the widget, if any */
  placeholder?: string;
  /** A map of UI Options passed as a prop to the component, including the optional `enumOptions`
   * which is a special case on top of `UIOptionsType` needed only by widgets
   */
  options: NonNullable<UIOptionsType<T, S, F>> & {
    /** The enum options list for a type that supports them */
    enumOptions?: EnumOptionsType[];
  };
  /** The `formContext` object that you passed to `Form` */
  formContext?: F;
  /** The input blur event handler; call it with the widget id and value */
  onBlur: (id: string, value: any) => void;
  /** The value change event handler; call it with the new value every time it changes */
  onChange: (value: any) => void;
  /** The input focus event handler; call it with the widget id and value */
  onFocus: (id: string, value: any) => void;
  /** The computed label for this widget, as a string */
  label: string;
  /** A boolean value stating if the widget can accept multiple values */
  multiple?: boolean;
  /** An array of strings listing all generated error messages from encountered errors for this widget */
  rawErrors?: string[];
  /** The `registry` object */
  registry: Registry<T, S, F>;
}

/** The definition of a React-based Widget component */
export type Widget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> = React.ComponentType<WidgetProps<T, S, F>>;

/** The type that defines the props used by the Submit button */
export type SubmitButtonProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> = {
  /** The uiSchema for this widget */
  uiSchema?: UiSchema<T, S, F>;
  /** The `registry` object */
  registry: Registry<T, S, F>;
};

/** The type that defines the props for an Icon button, extending from a basic HTML button attributes */
export type IconButtonProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** An alternative specification for the type of the icon button */
  iconType?: string;
  /** The name representation or actual react element implementation for the icon */
  icon?: string | React.ReactElement;
  /** The uiSchema for this widget */
  uiSchema?: UiSchema<T, S, F>;
  /** The `registry` object */
  registry: Registry<T, S, F>;
};

/** The type that defines how to change the behavior of the submit button for the form */
export type UISchemaSubmitButtonOptions = {
  /** The text of the submit button. Set to "Submit" by default */
  submitText?: string;
  /** Flag, if `true`, removes the submit button completely from the form */
  norender?: boolean;
  /** Any other props to be passed to the submit button itself */
  props?: GenericObjectType & {
    /** A boolean value stating if the submit button is disabled */
    disabled?: boolean;
    /** The class name for the submit button */
    className?: string;
  };
};

/** This type represents an element used to render an enum option */
export type EnumOptionsType<S extends StrictRJSFSchema = RJSFSchema> = {
  /** The value for the enum option */
  value: any;
  /** The label for the enum options */
  label: string;
  /** The schema associated with the enum option when the option represents a `oneOf` or `anyOf` choice */
  schema?: S;
};

/** This type remaps the keys of `Type` to prepend `ui:` onto them. As a result it does not need to be exported */
type MakeUIType<Type> = {
  [Property in keyof Type as `ui:${string & Property}`]: Type[Property];
};

/** This type represents all the known supported options in the `ui:options` property, kept separate in order to
 * remap the keys. It also contains all the properties, optionally, of `TemplatesType` except "ButtonTemplates"
 */
type UIOptionsBaseType<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> = Partial<Omit<TemplatesType<T, S, F>, "ButtonTemplates">> & {
  /** Any classnames that the user wants to be applied to a field in the ui */
  classNames?: string;
  /** We know that for title, it will be a string, if it is provided */
  title?: string;
  /** We know that for description, it will be a string, if it is provided */
  description?: string;
  /** We know that for placeholder, it will be a string, if it is provided */
  placeholder?: string;
  /** Used to add text next to a field to guide the end user in filling it in */
  help?: string;
  /** Flag, if set to `true`, will mark the field as automatically focused on a text input or textarea input */
  autofocus?: boolean;
  /** Use to mark the field as supporting auto complete on a text input or textarea input */
  autocomplete?: HTMLInputElement["autocomplete"];
  /** Flag, if set to `true`, will mark all child widgets from a given field as disabled */
  disabled?: boolean;
  /** The default value to use when an input for a field is empty */
  emptyValue?: any;
  /** Will disable any of the enum options specified in the array (by value) */
  enumDisabled?: Array<string | number | boolean>;
  /** Flag, if set to `true`, will hide the default error display for the given field AND all of its child fields in the
   * hierarchy
   */
  hideError?: boolean;
  /** Flag, if set to `true`, will mark all child widgets from a given field as read-only */
  readonly?: boolean;
  /** This property allows you to reorder the properties that are shown for a particular object */
  order?: string[];
  /** Flag, if set to `false`, will mark array fields as NOT being able to be added to (defaults to true) */
  addable?: boolean;
  /** Flag, if set to `false`, will mark array fields as NOT being able to be ordered (defaults to true) */
  orderable?: boolean;
  /** Flag, if set to `false`, will mark array fields as NOT being able to be removed (defaults to true) */
  removable?: boolean;
  /** Flag, if set to `true`, will mark a list of checkboxes as displayed all on one line instead of one per row */
  inline?: boolean;
  /** Used to change the input type (for example, `tel` or `email`) for an <input> */
  inputType?: string;
  /** Field labels are rendered by default. Labels may be omitted by setting the `label` option to `false` */
  label?: boolean;
  /** Provides a means to set the initial height of a textarea widget */
  rows?: number;
  /** If submitButtonOptions is provided it should match the `UISchemaSubmitButtonOptions` type */
  submitButtonOptions?: UISchemaSubmitButtonOptions;
  /** Allows RJSF to override the default widget implementation by specifying either the name of a widget that is used
   * to look up an implementation from the `widgets` list or an actual one-off widget implementation itself
   */
  widget?: Widget<T, S, F> | string;
  /** When using `additionalProperties`, key collision is prevented by appending a unique integer to the duplicate key.
   * This option allows you to change the separator between the original key name and the integer. Default is "-"
   */
  duplicateKeySuffixSeparator?: string;
};

/** The type that represents the Options potentially provided by `ui:options` */
export type UIOptionsType<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> = UIOptionsBaseType<T, S, F> & {
  /** Anything else will be one of these types */
  [key: string]: boolean | number | string | object | any[] | null | undefined;
};

/** Type describing the well-known properties of the `UiSchema` while also supporting all user defined properties,
 * starting with `ui:`.
 */
export type UiSchema<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> = GenericObjectType &
  MakeUIType<UIOptionsBaseType<T, S, F>> & {
    /** Allows the form to generate a unique prefix for the `Form`'s root prefix */
    "ui:rootFieldId"?: string;
    /** Allows RJSF to override the default field implementation by specifying either the name of a field that is used
     * to look up an implementation from the `fields` list or an actual one-off `Field` component implementation itself
     */
    "ui:field"?: Field<T, S, F> | string;
    /** An object that contains all the potential UI options in a single object */
    "ui:options"?: UIOptionsType<T, S, F>;
  };

/** A `CustomValidator` function takes in a `formData` and `errors` object and returns the given `errors` object back,
 * while potentially adding additional messages to the `errors`
 */
export type CustomValidator<T = any> = (
  formData: T,
  errors: FormValidation<T>
) => FormValidation<T>;

/** An `ErrorTransformer` function will take in a list of `errors` and potentially return a transformation of those
 * errors in what ever way it deems necessary
 */
export type ErrorTransformer = (
  errors: RJSFValidationError[]
) => RJSFValidationError[];

/** The type that describes the data that is returned from the `ValidatorType.validateFormData()` function */
export type ValidationData<T> = {
  /** The validation errors as a list of `RJSFValidationError` objects */
  errors: RJSFValidationError[];
  /** The validation errors in the form of an `ErrorSchema` */
  errorSchema: ErrorSchema<T>;
};

/** The interface that describes the validation functions that are provided by a Validator implementation used by the
 * schema utilities.
 */
export interface ValidatorType<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema
> {
  /** This function processes the `formData` with an optional user contributed `customValidate` function, which receives
   * the form data and a `errorHandler` function that will be used to add custom validation errors for each field. Also
   * supports a `transformErrors` function that will take the raw AJV validation errors, prior to custom validation and
   * transform them in what ever way it chooses.
   *
   * @param formData - The form data to validate
   * @param schema - The schema against which to validate the form data
   * @param [customValidate] - An optional function that is used to perform custom validation
   * @param [transformErrors] - An optional function that is used to transform errors after AJV validation
   */
  validateFormData(
    formData: T | undefined,
    schema: S,
    customValidate?: CustomValidator<T>,
    transformErrors?: ErrorTransformer
  ): ValidationData<T>;
  /** Converts an `errorSchema` into a list of `RJSFValidationErrors`
   *
   * @param errorSchema - The `ErrorSchema` instance to convert
   * @param [fieldPath=[]] - The current field path, defaults to [] if not specified
   */
  toErrorList(
    errorSchema?: ErrorSchema<T>,
    fieldPath?: string[]
  ): RJSFValidationError[];
  /** Validates data against a schema, returning true if the data is valid, or
   * false otherwise. If the schema is invalid, then this function will return
   * false.
   *
   * @param schema - The schema against which to validate the form data   * @param schema
   * @param formData - The form data to validate
   * @param rootSchema - The root schema used to provide $ref resolutions
   */
  isValid(schema: S, formData: T, rootSchema: S): boolean;
  /** Runs the pure validation of the `schema` and `formData` without any of the RJSF functionality. Provided for use
   * by the playground. Returns the `errors` from the validation
   *
   * @param schema - The schema against which to validate the form data   * @param schema
   * @param formData - The form data to validate
   */
  rawValidation<Result = any>(
    schema: S,
    formData?: T
  ): { errors?: Result[]; validationError?: Error };
}

/** The `SchemaUtilsType` interface provides a wrapper around the publicly exported APIs in the `@rjsf/utils/schema`
 * directory such that one does not have to explicitly pass the `validator` or `rootSchema` to each method. Since both
 * the `validator` and `rootSchema` generally does not change across a `Form`, this allows for providing a simplified
 * set of APIs to the `@rjsf/core` components and the various themes as well.
 */
export interface SchemaUtilsType<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> {
  /** Returns the `ValidatorType` in the `SchemaUtilsType`
   *
   * @returns - The `ValidatorType`
   */
  getValidator(): ValidatorType<T, S>;
  /** Determines whether either the `validator` and `rootSchema` differ from the ones associated with this instance of
   * the `SchemaUtilsType`. If either `validator` or `rootSchema` are falsy, then return false to prevent the creation
   * of a new `SchemaUtilsType` with incomplete properties.
   *
   * @param validator - An implementation of the `ValidatorType` interface that will be compared against the current one
   * @param rootSchema - The root schema that will be compared against the current one
   * @returns - True if the `SchemaUtilsType` differs from the given `validator` or `rootSchema`
   */
  doesSchemaUtilsDiffer(validator: ValidatorType<T, S>, rootSchema: S): boolean;
  /** Returns the superset of `formData` that includes the given set updated to include any missing fields that have
   * computed to have defaults provided in the `schema`.
   *
   * @param schema - The schema for which the default state is desired
   * @param [formData] - The current formData, if any, onto which to provide any missing defaults
   * @param [includeUndefinedValues=false] - Optional flag, if true, cause undefined values to be added as defaults.
   *          If "excludeObjectChildren", pass `includeUndefinedValues` as false when computing defaults for any nested
   *          object properties.
   * @returns - The resulting `formData` with all the defaults provided
   */
  getDefaultFormState(
    schema: S,
    formData?: T,
    includeUndefinedValues?: boolean | "excludeObjectChildren"
  ): T | T[] | undefined;
  /** Determines whether the combination of `schema` and `uiSchema` properties indicates that the label for the `schema`
   * should be displayed in a UI.
   *
   * @param schema - The schema for which the display label flag is desired
   * @param [uiSchema] - The UI schema from which to derive potentially displayable information
   * @returns - True if the label should be displayed or false if it should not
   */
  getDisplayLabel(schema: S, uiSchema?: UiSchema<T, S, F>): boolean;
  /** Given the `formData` and list of `options`, attempts to find the index of the option that best matches the data.
   *
   * @param formData - The current formData, if any, onto which to provide any missing defaults
   * @param options - The list of options to find a matching options from
   * @returns - The index of the matched option or 0 if none is available
   */
  getMatchingOption(formData: T, options: S[]): number;
  /** Checks to see if the `schema` and `uiSchema` combination represents an array of files
   *
   * @param schema - The schema for which check for array of files flag is desired
   * @param [uiSchema] - The UI schema from which to check the widget
   * @returns - True if schema/uiSchema contains an array of files, otherwise false
   */
  isFilesArray(schema: S, uiSchema?: UiSchema<T, S, F>): boolean;
  /** Checks to see if the `schema` combination represents a multi-select
   *
   * @param schema - The schema for which check for a multi-select flag is desired
   * @returns - True if schema contains a multi-select, otherwise false
   */
  isMultiSelect(schema: S): boolean;
  /** Checks to see if the `schema` combination represents a select
   *
   * @param schema - The schema for which check for a select flag is desired
   * @returns - True if schema contains a select, otherwise false
   */
  isSelect(schema: S): boolean;
  /** Merges the errors in `additionalErrorSchema` into the existing `validationData` by combining the hierarchies in the
   * two `ErrorSchema`s and then appending the error list from the `additionalErrorSchema` obtained by calling
   * `validator.toErrorList()` onto the `errors` in the `validationData`. If no `additionalErrorSchema` is passed, then
   * `validationData` is returned.
   *
   * @param validationData - The current `ValidationData` into which to merge the additional errors
   * @param [additionalErrorSchema] - The additional set of errors
   * @returns - The `validationData` with the additional errors from `additionalErrorSchema` merged into it, if provided.
   */
  mergeValidationData(
    validationData: ValidationData<T>,
    additionalErrorSchema?: ErrorSchema<T>
  ): ValidationData<T>;
  /** Retrieves an expanded schema that has had all of its conditions, additional properties, references and
   * dependencies resolved and merged into the `schema` given a `rawFormData` that is used to do the potentially
   * recursive resolution.
   *
   * @param schema - The schema for which retrieving a schema is desired
   * @param [formData] - The current formData, if any, to assist retrieving a schema
   * @returns - The schema having its conditions, additional properties, references and dependencies resolved
   */
  retrieveSchema(schema: S, formData?: T): S;
  /** Generates an `IdSchema` object for the `schema`, recursively
   *
   * @param schema - The schema for which the display label flag is desired
   * @param [id] - The base id for the schema
   * @param [formData] - The current formData, if any, onto which to provide any missing defaults
   * @param [idPrefix='root'] - The prefix to use for the id
   * @param [idSeparator='_'] - The separator to use for the path segments in the id
   * @returns - The `IdSchema` object for the `schema`
   */
  toIdSchema(
    schema: S,
    id?: string,
    formData?: T,
    idPrefix?: string,
    idSeparator?: string
  ): IdSchema<T>;
  /** Generates an `PathSchema` object for the `schema`, recursively
   *
   * @param schema - The schema for which the display label flag is desired
   * @param [name] - The base name for the schema
   * @param [formData] - The current formData, if any, onto which to provide any missing defaults
   * @returns - The `PathSchema` object for the `schema`
   */
  toPathSchema(schema: S, name?: string, formData?: T): PathSchema<T>;
}
