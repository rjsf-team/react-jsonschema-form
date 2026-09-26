import type {
  ButtonHTMLAttributes,
  ChangeEvent,
  Component,
  ComponentType,
  FocusEvent,
  HTMLAttributes,
  ReactElement,
  ReactNode,
  StyleHTMLAttributes,
} from 'react';
import type { JSONSchema7 } from 'json-schema';

import type { TranslatableString } from './enums.ts';
import './jsonSchemaAugmentation.ts';

/** The representation of any generic object type, usually used as an intersection on other types to make them more
 * flexible in the properties they support (i.e. anything else)
 */
export type GenericObjectType = Record<string, any>;

/** A callback whose parameters are checked bivariantly, the way React checks event handlers, so a props type carrying
 * one stays covariant in `T`.
 */
type Bivariant<Args extends unknown[], R = void> = { bivarianceHack(...args: Args): R }['bivarianceHack'];

/** Never constructed: its `constructor` declaration gives class components the same bivariant props check that
 * `Bivariant` gives function components, which a constructor type written out as `new (props: P) => …` would not.
 */
declare class SlotComponentClass<P> extends Component<object> {
  constructor(props: P);
}

/** A component slot in a props type, `UiSchema` or the `Registry`. Its props are checked bivariantly, for function and
 * class components alike, so a component written for `unknown` data fits a slot typed for a form's data, and a
 * `UiSchema<MyData>` is still a `UiSchema`. The function arm returns what React's `FunctionComponent` does, so a
 * component annotated as a `ComponentType` or `FunctionComponent` fits too.
 */
export type SlotComponent<P> = Bivariant<[props: P], ReactNode | Promise<ReactNode>> | typeof SlotComponentClass<P>;

/** The representation of any generic object type, usually used as an intersection on other types to make them more
 * flexible in the properties they support (i.e. anything else) AND symbol markers with a value of string or boolean
 */
export type GenericSymbolObjectType = GenericObjectType & Record<symbol, boolean | string>;

/** Map the JSONSchema7 to our own type so that we can easily bump to a more recent version at some future date and only
 * have to update this one type.
 */
export type StrictRJSFSchema = JSONSchema7;

/** Allow for more flexible schemas (i.e. draft-2019) than the strict JSONSchema7
 */
export type RJSFSchema = StrictRJSFSchema & GenericObjectType;

/** Allow for more flexible schemas (i.e. draft-2019) than the strict JSONSchema7 with special marking added by
 * `retrieveSchema()`
 */
export type RJSFMarkedSchema = StrictRJSFSchema & GenericSymbolObjectType;

/** Alias GenericObjectType as FormContextType to allow us to remap this at some future date
 */
export type FormContextType = GenericObjectType;

/** The interface for the test ID proxy objects that are returned by the `getTestId` utility function.
 */
export type TestIdShape = Record<string, string>;

/** Controls how enum-backed widgets encode option values in their DOM `value` attributes.
 *
 * - `'indexed'`: options are encoded as their array index (default, historical behavior).
 * - `'realValue'`: string, number and boolean option values are stringified directly, enabling native form
 *   submission. Object, array and `null` values are encoded as their index behind the `ENUM_OPTION_INDEX_PREFIX`
 *   (e.g. `__rjsf_index:2`), which keeps them apart from a string option that happens to look like an index.
 */
export type OptionValueFormat = 'indexed' | 'realValue';

/** Function to generate HTML name attributes from path segments */
export type NameGeneratorFunction = (path: FieldPathList, idPrefix: string, isMultiValue?: boolean) => string;

/** Specifies the Array `minItems` default form state behavior
 */
export interface ArrayMinItems {
  /** Optional enumerated flag controlling how array minItems are populated, defaulting to `all`:
   * - `all`: Legacy behavior, populate minItems entries with default values initially and include an empty array when
   *        no values have been defined.
   * - `requiredOnly`: Ignore `minItems` on a field when calculating defaults unless the field is required.
   * - `never`: Ignore `minItems` on a field even the field is required.
   */
  populate?: 'all' | 'requiredOnly' | 'never';
  /** A function that determines whether to skip populating the array with default values based on the provided validator,
   * schema, and root schema.
   * If the function returns true, the array will not be populated with default values.
   * If the function returns false, the array will be populated with default values according to the `populate` option.
   * @param validator - An implementation of the `ValidatorType` interface that is used to detect valid schema conditions
   * @param schema - The schema for which resolving a condition is desired
   * @param [rootSchema] - The root schema that will be forwarded to all the APIs
   * @returns A boolean indicating whether to skip populating the array with default values.
   */
  computeSkipPopulate?: <S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
    validator: ValidatorType<S, F>,
    schema: S,
    rootSchema?: S,
  ) => boolean;
  /** When `formData` is provided and does not contain `minItems` worth of data, this flag (`false` by default) controls
   * whether the extra data provided by the defaults is appended onto the existing `formData` items to ensure the
   * `minItems` condition is met. When false (legacy behavior), only the `formData` provided is merged into the default
   * form state, even if there are fewer than the `minItems`. When true, the defaults are appended onto the end of the
   * `formData` until the `minItems` condition is met.
   */
  mergeExtraDefaults?: boolean;
}

/** Specifies different default form state behaviors. Currently, this affects the
 * handling of optional array fields where `minItems` is set and handling of setting defaults based on the
 * value of `emptyObjectFields`. It also affects how `allOf` fields are handled and how to handle merging defaults into
 * the formData in relation to explicit `undefined` values via `mergeDefaultsIntoFormData`.
 */
export interface DefaultFormStateBehavior {
  /** Optional object, that controls how the default form state for arrays with `minItems` is handled. When not provided
   * it defaults to `{ populate: 'all' }`.
   */
  arrayMinItems?: ArrayMinItems;
  /** Optional enumerated flag controlling how empty object fields are populated, defaulting to `populateAllDefaults`:
   * - `populateAllDefaults`: Legacy behavior - set default when there is a primitive value, an non-empty object field,
   *        or the field itself is required  |
   * - `populateRequiredDefaults`: Only sets default when a value is an object and its parent field is required, or it
   *        is a primitive value and it is required |
   * - `skipDefaults`: Does not set defaults                                                                                                      |
   * - `skipEmptyDefaults`: Does not set an empty default. It will still apply the default value if a default property is defined in your schema.                                                                                                 |
   */
  emptyObjectFields?: 'populateAllDefaults' | 'populateRequiredDefaults' | 'skipDefaults' | 'skipEmptyDefaults';
  /**
   * Optional flag to compute the default form state using allOf and if/then/else schemas. Defaults to `skipDefaults'.
   */
  allOf?: 'populateDefaults' | 'skipDefaults';
  /** Optional enumerated flag controlling how the defaults are merged into the form data when dealing with undefined
   * values, defaulting to `useFormDataIfPresent`.
   * NOTE: If there is a default for a field and the `formData` is unspecified, the default ALWAYS merges.
   * - `useFormDataIfPresent`: Legacy behavior - Do not merge defaults if there is a value for a field in `formData`,
   *        even if that value is explicitly set to `undefined`
   * - `useDefaultIfFormDataUndefined`: - If the value of a field within the `formData` is `undefined`, then use the
   *        default value instead
   */
  mergeDefaultsIntoFormData?: 'useFormDataIfPresent' | 'useDefaultIfFormDataUndefined';
  /** Optional enumerated flag controlling how const values are merged into the form data as defaults when dealing with
   * undefined values, defaulting to `always`. The defaulting behavior for this flag will always be controlled by the
   * `emptyObjectField` flag value. For instance, if `populateRequiredDefaults` is set and the const value is not
   * required, it will not be set.
   * - `always`: A const value will always be merged into the form as a default. If there is are const values in a
   *        `oneOf` (for instance to create an enumeration with title different from the values), the first const value
   *        will be defaulted
   * - `skipOneOf`: If const is in a `oneOf` it will NOT pick the first value as a default
   * - `never`: A const value will never be used as a default
   *
   */
  constAsDefaults?: 'always' | 'skipOneOf' | 'never';
  /** Optional enumerated flag controlling how defaults defined on multiple levels are merged together for overlapping
   * properties, defaulting to `descendantWins`.
   * - `descendantWins`: The innermost (descendant) default value definition takes precedence over its ancestor's defaults.
   * - `ancestorWins`: The outermost (ancestor) default value definition takes precedence over any descendant's defaults.
   */
  nestedDefaultsPrecedence?: 'descendantWins' | 'ancestorWins';
}

/** Optional function that allows for custom merging of `allOf` schemas
 * @param schema - Schema with `allOf` that needs to be merged
 * @returns The merged schema
 */
export type CustomMergeAllOf<S extends StrictRJSFSchema = RJSFSchema> = (schema: S) => S;

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
export interface RangeSpecType {
  /** Specifies the interval between legal numbers in an input field */
  step?: number;
  /** Specifies a minimum value for an <input> element */
  min?: number;
  /** Specifies the maximum value for an <input> element */
  max?: number;
}

/** Properties describing a Range specification in terms of attribute that can be added to the `HTML` `<input>` */
export interface InputPropsType {
  /** Specifies the type of the <input> element */
  type: string;
  /** Specifies the interval between legal numbers in an input field or "any" */
  step?: number | 'any';
  /** Specifies a minimum value for an <input> element; accepts a number for numeric inputs or a string for date/time inputs */
  min?: number | string;
  /** Specifies the maximum value for an <input> element; accepts a number for numeric inputs or a string for date/time inputs */
  max?: number | string;
  /** Specifies the virtual keyboard to display for an <input> element, used in place of `type="number"` */
  inputMode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
  /** Specifies a regular expression the <input> element's value is checked against, used in place of `type="number"` */
  pattern?: string;
  /** Specifies the `autoComplete` value for an <input> element */
  autoComplete?: HTMLInputElement['autocomplete'];
  /** Specifies the `autoCapitalize` value for an <input> element */
  autoCapitalize?: HTMLInputElement['autocapitalize'];
  /** Specifies a filter for what file types the user can upload. */
  accept?: HTMLInputElement['accept'];
}

/** The list of path elements that represents where in the schema a field is located. When the item in the field list is
 * a string, then it represents the name of the property within an object. When it is a number, then it represents the
 * index within an array.
 *
 * For example:
 * `[]` represents the root object of the schema
 * `['foo', 'bar']` represents the `bar` element contained within the `foo` element of the schema
 * `['baz', 1]` represents the second element in the list `baz` of the schema
 */
export type FieldPathList = (string | number)[];

/** Dot string or segment list for `getFromSchema` / `findFieldInSchema` (same segment rules as {@link FieldPathList}). */
export type SchemaFieldPath = string | FieldPathList;

declare const FIELD_PATH_BRAND: unique symbol;

/** Type identifying a field: a canonical, escaped string path such as `friends[0].firstName`, with the root
 * form as the empty string. A string's identity is its value, so a `FieldPath` passed as a prop is stable across
 * renders for free and memo boundaries keep working without deep comparison. The `$id`, HTML `name` and segment
 * list are derived from it on demand by `fieldPathToId`, `fieldPathToName` and `fieldPathToList`.
 *
 * Branded so a plain string (such as a DOM id, which is also a string) cannot be passed where a `FieldPath` is
 * expected; construct one with `toFieldPath` or start from `ROOT_FIELD_PATH`. A `FieldPath` is still assignable
 * wherever a `string` is accepted.
 */
export type FieldPath = string & { readonly [FIELD_PATH_BRAND]: true };

/** The type for error produced by RJSF schema validation */
export interface RJSFValidationError {
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
  /** The title property for the failing field*/
  title?: string;
}

/** The type that describes an error in a field */
export type FieldError = string;

/** The type that describes the list of errors for a field */
export interface FieldErrors {
  /** The list of errors for the field */
  __errors?: FieldError[];
}

/** True when `V` is `any`, which a conditional type otherwise matches on every branch at once */
type IsAny<V> = 0 extends 1 & V ? true : false;

/** Values that are objects but hold no form fields of their own, so their error node has no children and their
 * uiSchema has no nested field entries.
 *
 * `createErrorHandler()` and `toErrorList()` recurse through `isPlainObject()`, so at runtime every class instance is
 * a leaf. TypeScript has no way to say "plain object", so this lists the built-in classes a form-data type plausibly
 * holds: the two a custom widget most commonly hands back (the built-in date and file widgets store strings), and the
 * collection, pattern, URL and promise classes whose non-method properties (`size`, `source`, `href`) would otherwise
 * be offered as field names. A user-defined class instance still gets its properties offered as children, which
 * accepts a node the runtime never builds.
 */
type AtomicValue =
  | Date
  | File
  | Blob
  | RegExp
  | URL
  | Promise<unknown>
  | Map<unknown, unknown>
  | Set<unknown>
  | WeakMap<WeakKey, unknown>
  | WeakSet<WeakKey>;

/** The data whose keys become the children of an error node for a value of type `V`.
 *
 * Normalizing the data type here is what keeps an error node a plain keyed object. Mapping over `keyof V` directly
 * would be a homomorphic mapped type, and those preserve arrays and primitives instead of describing a node, so
 * `ErrorSchema<string>` would resolve to `string`. An array contributes a node per index, because
 * `ErrorSchemaBuilder` writes numeric path segments as object keys and never as array indices. The conditional
 * distributes, so a union-typed value (a `oneOf`/`anyOf` property, say) contributes the children of every member it
 * can hold. `any` and `unknown` say nothing about what the data holds, so they contribute unconstrained children.
 */
type ErrorTreeChildData<V> = unknown extends V ? Record<string, any> : ChildDataOf<NonNullable<V>>;

/** The child data one member of a value type contributes. `V` is naked so the conditional distributes over a union.
 *
 * A tuple keeps each declared position's own type, so index `0` of a `[string, { city: string }]` is a leaf while
 * index `1` has children. An array has no per-position type to keep, so it gets a numeric index signature holding the
 * element type; a tuple with a rest element gets both, and a declared position takes precedence over the index
 * signature because they live in the same object type rather than an intersection.
 */
type ChildDataOf<V> = V extends readonly unknown[]
  ? { [key in Extract<keyof V, `${number}`> | (number extends V['length'] ? number : never)]: V[key] }
  : V extends AtomicValue
    ? Record<never, never>
    : V extends object
      ? V
      : Record<never, never>;

/** The keys contributed by every member of a union of child data types */
type ChildKeys<D> = D extends unknown ? keyof D : never;

/** The child data every member of `D` holds at `key`, for the members that have one */
type ChildAt<D, K extends PropertyKey> = D extends unknown ? (K extends keyof D ? D[K] : never) : never;

/** A child error node. `any` short-circuits so that data of an unconstrained type keeps an unconstrained node */
type ErrorTreeChild<V, Node> = IsAny<V> extends true ? any : ErrorTree<V, Node>;

/** The recursive error tree for data of type `V`, carrying `Node` at every level.
 *
 * Children are optional because the tree is sparse: `toErrorSchema()` and `createErrorHandler()` only create a node
 * for data that is actually present.
 */
type ErrorTree<V, Node> = Node & {
  [key in ChildKeys<ErrorTreeChildData<V>>]?: ErrorTreeChild<ChildAt<ErrorTreeChildData<V>, key>, Node>;
};

/** Type describing a recursive structure of `FieldErrors`s for the data of type `T` */
export type ErrorSchema<T = unknown> = ErrorTree<T, FieldErrors>;

/** Type that describes the list of errors for a field being actively validated by a custom validator */
export type FieldValidation = FieldErrors & {
  /** Function that will add a new `message` to the list of errors */
  addError: (message: string) => void;
};

/** Type describing a recursive structure of `FieldValidation`s for the data of type `T` */
export type FormValidation<T = unknown> = ErrorTree<T, FieldValidation>;

/** The base properties passed to various RJSF components. */
export interface RJSFBaseProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
  /** The schema object for the field being described */
  readonly schema: S;
  /** The uiSchema object for this base component */
  readonly uiSchema?: UiSchema<T, S, F>;
  /** The `registry` object */
  readonly registry: Registry<T, S, F>;
}

export type CyclicSchemaExpandProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = RJSFBaseProps<T, S, F> & {
  /** The id of the field in the hierarchy */
  id: string;
  /** The unique name of the field, usually derived from the name of the property in the JSONSchema */
  name: string;
  /** Callback used to mark a cyclic scheme element as expanded */
  onExpand: (id: string) => void;
};

/** The properties that are passed to an `ErrorListTemplate` implementation */
export type ErrorListProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = RJSFBaseProps<T, S, F> & {
  /** The errorSchema constructed by `Form` */
  errorSchema: ErrorSchema<T>;
  /** An array of the errors */
  errors: RJSFValidationError[];
};

/** The properties that are passed to an `FieldErrorTemplate` implementation */
export type FieldErrorProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = RJSFBaseProps<T, S, F> & {
  /** The errorSchema constructed by `Form` */
  errorSchema?: ErrorSchema<T>;
  /** An array of the errors */
  errors?: (string | ReactElement)[];
  /** The id of the field in the hierarchy */
  id: string;
};

/** The properties that are passed to an `FieldHelpTemplate` implementation */
export type FieldHelpProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = RJSFBaseProps<T, S, F> & {
  /** The help information to be rendered */
  help?: string | ReactElement;
  /** The id of the field in the hierarchy */
  id: string;
  /** Flag indicating whether there are errors associated with this field */
  hasErrors?: boolean;
};

/** The properties that are passed to a `GridTemplate` */
export interface GridTemplateProps extends GenericObjectType {
  /** The contents of the grid template */
  children?: ReactNode;
  /** Optional flag indicating whether the grid element represents a column, necessary for themes which have components
   * for Rows vs Columns. NOTE: This is falsy by default when not specified
   */
  column?: boolean;
}

/** The set of `Fields` stored in the `Registry` */
export type RegistryFieldsType<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = Record<string, Field<T, S, F>>;

/** The set of `Widgets` stored in the `Registry` */
export type RegistryWidgetsType<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = Record<string, Widget<T, S, F>>;

/** The properties that are passed to a `MarkdownTemplate` implementation */
export type MarkdownTemplateProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = Pick<RJSFBaseProps<T, S, F>, 'uiSchema' | 'registry'> & {
  /** The markdown text to render */
  children: string;
};

/** The set of RJSF templates that can be overridden by themes or users */
export type TemplatesType<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = {
  /** The template to use while rendering normal or fixed array fields */
  ArrayFieldTemplate: SlotComponent<ArrayFieldTemplateProps<T, S, F>>;
  /** The template to use while rendering the description for an array field */
  ArrayFieldDescriptionTemplate: SlotComponent<ArrayFieldDescriptionProps<T, S, F>>;
  /** The template to use while rendering the buttons for an item in an array field */
  ArrayFieldItemButtonsTemplate: SlotComponent<ArrayFieldItemButtonsTemplateProps<T, S, F>>;
  /** The template to use while rendering an item in an array field */
  ArrayFieldItemTemplate: SlotComponent<ArrayFieldItemTemplateProps<T, S, F>>;
  /** The template to use while rendering the title for an array field */
  ArrayFieldTitleTemplate: SlotComponent<ArrayFieldTitleProps<T, S, F>>;
  /** The template to use while rendering the standard html input */
  BaseInputTemplate: SlotComponent<BaseInputTemplateProps<T, S, F>>;
  /** The template to use while rendering the cyclic schema expand controls */
  CyclicSchemaExpandTemplate: SlotComponent<CyclicSchemaExpandProps<T, S, F>>;
  /** The template to use for rendering the description of a field */
  DescriptionFieldTemplate: SlotComponent<DescriptionFieldProps<T, S, F>>;
  /** The template to use while rendering the errors for the whole form */
  ErrorListTemplate: SlotComponent<ErrorListProps<T, S, F>>;
  /** The template to use while rendering a fallback field for schemas that have an empty or unknown 'type' */
  FallbackFieldTemplate: SlotComponent<FallbackFieldTemplateProps<T, S, F>>;
  /** The template to use while rendering the errors for a single field */
  FieldErrorTemplate: SlotComponent<FieldErrorProps<T, S, F>>;
  /** The template to use while rendering the errors for a single field */
  FieldHelpTemplate: SlotComponent<FieldHelpProps<T, S, F>>;
  /** The template to use while rendering a field */
  FieldTemplate: SlotComponent<FieldTemplateProps<T, S, F>>;
  /** The template to use to render a Grid element */
  GridTemplate: SlotComponent<GridTemplateProps>;
  /** The template to use for rendering markdown text in descriptions, help text and translatable strings. The core
   * default renders it as plain text so no markdown library is bundled; `@rjsf/core/markdown` provides one built on
   * `markdown-to-jsx`.
   */
  MarkdownTemplate: SlotComponent<MarkdownTemplateProps<T, S, F>>;
  /** The template to use while rendering a multi-schema field (i.e. anyOf, oneOf) */
  MultiSchemaFieldTemplate: SlotComponent<MultiSchemaFieldTemplateProps<T, S, F>>;
  /** The template to use while rendering an object */
  ObjectFieldTemplate: SlotComponent<ObjectFieldTemplateProps<T, S, F>>;
  /** The template to use while rendering the Optional Data field controls */
  OptionalDataControlsTemplate: SlotComponent<OptionalDataControlsTemplateProps<T, S, F>>;
  /** The template to use for rendering the title of a field */
  TitleFieldTemplate: SlotComponent<TitleFieldProps<T, S, F>>;
  /** The template to use for rendering information about an unsupported field type in the schema */
  UnsupportedFieldTemplate: SlotComponent<UnsupportedFieldProps<T, S, F>>;
  /** The template to use for rendering a field that allows a user to add additional properties */
  WrapIfAdditionalTemplate: SlotComponent<WrapIfAdditionalTemplateProps<T, S, F>>;
  /** The set of templates associated with buttons in the form */
  ButtonTemplates: {
    /** The template to use for the main `Submit` button  */
    SubmitButton: SlotComponent<SubmitButtonProps<T, S, F>>;
    /** The template to use for the Add button used for AdditionalProperties and Array items */
    AddButton: SlotComponent<IconButtonProps<T, S, F>>;
    /** The template to use for the Copy button used for Array items */
    CopyButton: SlotComponent<IconButtonProps<T, S, F>>;
    /** The template to use for the Move Down button used for Array items */
    MoveDownButton: SlotComponent<IconButtonProps<T, S, F>>;
    /** The template to use for the Move Up button used for Array items */
    MoveUpButton: SlotComponent<IconButtonProps<T, S, F>>;
    /** The template to use for the Remove button used for AdditionalProperties and Array items */
    RemoveButton: SlotComponent<IconButtonProps<T, S, F>>;
    /** The template to use for the Clear button used for input fields */
    ClearButton: SlotComponent<IconButtonProps<T, S, F>>;
  };
} & Record<string, ComponentType<any> | Record<string, ComponentType<any>> | undefined>;

/** The declared keys of `GlobalUISchemaOptions`, kept separate from its `GenericObjectType &` index signature so
 * a closed vocabulary (like `UiSchema`'s `Checks`-narrowed form) can pick up these keys without also reopening
 * itself to arbitrary ones.
 */
interface GlobalUISchemaOptionsKeys {
  /** Flag, if set to `false`, new items cannot be added to array fields, unless overridden (defaults to true) */
  addable?: boolean;
  /** Flag, if set to `true`, array items can be copied (defaults to false) */
  copyable?: boolean;
  /** Flag, if set to `false`, array items cannot be ordered (defaults to true) */
  orderable?: boolean;
  /** Flag, if set to `false`, array items will not be removable (defaults to true) */
  removable?: boolean;
  /** Field labels are rendered by default. Labels may be omitted by setting the `label` option to `false` */
  label?: boolean;
  /** Flag, if set to `true`, will allow the text input fields to be cleared
   */
  allowClearTextInputs?: boolean;
  /** When using `additionalProperties`, key collision is prevented by appending a unique integer to the duplicate key.
   * This option allows you to change the separator between the original key name and the integer. Default is "-"
   */
  duplicateKeySuffixSeparator?: string;
  /** Enables the displaying of description text that contains markdown, rendered through the registered
   * `MarkdownTemplate`
   */
  enableMarkdownInDescription?: boolean;
  /** Enables the displaying of help text that contains markdown, rendered through the registered `MarkdownTemplate`
   */
  enableMarkdownInHelp?: boolean;
  /** Enables the rendering of the Optional Data Field UI for specific types of schemas, either `object`, `array` or
   * both. To disable the Optional Data Field UI for a specific field, provide an empty array within the UI schema.
   */
  enableOptionalDataFieldForType?: ('object' | 'array')[];
  /** Controls how enum-backed widgets (select, radio, checkboxes) encode option values
   *  in their DOM `value` attributes.
   *
   *  - `'indexed'` (default): options are encoded as their array index. This is the
   *    historical behavior and keeps object/array enum values addressable without
   *    stringifying them.
   *  - `'realValue'`: string, number and boolean option values are stringified directly
   *    (e.g. `"foo"`, `"42"`, `"true"`). This enables native form submission and browser
   *    autocomplete since the submitted value matches the enum value. Object, array and
   *    `null` values are encoded as their index behind the `ENUM_OPTION_INDEX_PREFIX`
   *    (e.g. `"__rjsf_index:2"`), since `String(obj)` would produce `"[object Object]"`
   *    and `String(null)` would collide with a `"null"` string option.
   *
   *  The form data passed to `onChange` is always the typed enum value; this option
   *  only affects the DOM-level encoding.
   */
  optionValueFormat?: OptionValueFormat;
  /** Controls how a deprecated property is rendered.
   * - `hide`: The field is completely hidden (via the `hidden` prop passed to FieldTemplate).
   * - `disable`: The field is rendered but disabled.
   * - `label` (default): The field is rendered with "(deprecated)" appended to its label.
   */
  deprecatedHandling?: 'hide' | 'disable' | 'label';
}

/** The set of UiSchema options that can be set globally and used as fallbacks at an individual template, field or
 * widget level when no field-level value of the option is provided. Extends GenericObjectType to support allowing users
 * to provide any value they need for their customizations.
 */
export type GlobalUISchemaOptions = GenericObjectType & GlobalUISchemaOptionsKeys;

/** The set of options from the `Form` that will be available on the `Registry` for use in everywhere the `registry` is
 * available.
 */
export interface GlobalFormOptions {
  /** To avoid collisions with existing ids in the DOM, it is possible to change the prefix used for ids;
   * Default is `root`. This prop is passed to the `toFilePathId()` function within the RJSF field implementations.
   */
  readonly idPrefix: string;
  /** To avoid using a path separator that is present in field names, it is possible to change the separator used for
   * ids; Default is `_`. This prop is passed to the `toFilePathId()` function within the RJSF field implementations.
   */
  readonly idSeparator: string;
  /** Optional function to generate custom HTML name attributes for form elements. Receives the field path segments
   * and element type (object or array), and returns a custom name string. This allows backends like PHP/Rails
   * (`root[tasks][0][title]`) or Django (`root__tasks-0__title`) to receive form data in their expected format.
   */
  readonly nameGenerator?: NameGeneratorFunction;
  /**
   * Boolean flag that, when set to true, will cause the form to use a fallback UI when encountering a schema type that
   * is not supported by RJSF or a custom field. When false, the UnsupportedField error component will be shown instead.
   */
  readonly useFallbackUiForUnsupportedType?: boolean;
}

/** The object containing the registered core, theme and custom fields and widgets as well as the root schema, form
 * context, schema utils and templates.
 */
export interface Registry<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
  /** The set of all fields used by the `Form`. Includes fields from `core`, theme-specific fields and any custom
   * registered fields
   */
  readonly fields: RegistryFieldsType<T, S, F>;
  /** The set of templates used by the `Form`. Includes templates from `core`, theme-specific templates and any custom
   * registered templates
   */
  readonly templates: TemplatesType<T, S, F>;
  /** The set of all widgets used by the `Form`. Includes widgets from `core`, theme-specific widgets and any custom
   * registered widgets
   */
  readonly widgets: RegistryWidgetsType<T, S, F>;
  /** The `formContext` object that was passed to `Form` */
  readonly formContext: F;
  /** The root schema, as passed to the `Form`, which can contain referenced definitions */
  readonly rootSchema: S;
  /** The current implementation of the `SchemaUtilsType` (from `@rjsf/utils`) in use by the `Form`.  Used to call any
   * of the validation-schema-based utility functions
   */
  readonly schemaUtils: SchemaUtilsType<T, S, F>;
  /** The string translation function to use when displaying any of the RJSF strings in templates, fields or widgets */
  readonly translateString: (stringKey: TranslatableString, params?: string[]) => string;
  /** The global Form Options that are available for all templates, fields and widgets to access */
  readonly globalFormOptions: GlobalFormOptions;
  /** The optional global UI Options that are available for all templates, fields and widgets to access */
  readonly globalUiOptions?: GlobalUISchemaOptions;
  /** The optional uiSchema definitions extracted from the root uiSchema, keyed by `$ref` paths.
   * Used to automatically apply uiSchema when a schema with a matching `$ref` is resolved.
   */
  readonly uiSchemaDefinitions?: UiSchemaDefinitions<T, S, F>;
}

/** The properties that are passed to a `Field` implementation */
export interface FieldProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>
  extends
    GenericObjectType,
    RJSFBaseProps<T, S, F>,
    Pick<HTMLAttributes<HTMLElement>, Exclude<keyof HTMLAttributes<HTMLElement>, 'onBlur' | 'onFocus' | 'onChange'>> {
  /** The `FieldPath` identifying this field in the form */
  fieldPath: FieldPath;
  /** The id of the field in the hierarchy */
  id: string;
  /** The data for this field */
  formData?: T;
  /** The tree of errors for this field and its children */
  errorSchema?: ErrorSchema<T>;
  /** The field change event handler; called with the updated field value, the `FieldPath` of the value
   * (the root of the form is `''`), an optional ErrorSchema and the optional id of the field being changed
   */
  onChange: Bivariant<[newValue: T | undefined, fieldPath: FieldPath, es?: ErrorSchema<T>, id?: string]>;
  /** The input blur event handler; call it with the field id and value */
  onBlur: (id: string, value: any) => void;
  /** The input focus event handler; call it with the field id and value */
  onFocus: (id: string, value: any) => void;
  /** A boolean value stating if the field should autofocus */
  autofocus?: boolean;
  /** A boolean value stating if the field is disabled */
  disabled?: boolean;
  /** A boolean value stating if the field is hiding its errors */
  hideError?: boolean;
  /** A boolean value stating if the field is read-only */
  readonly?: boolean;
  /** The required status of this field */
  required?: boolean;
  /** The unique name of the field, usually derived from the name of the property in the JSONSchema */
  name: string;
  /** An array of strings listing all generated error messages from encountered errors for this field */
  rawErrors?: string[];
}

/** The definition of a React-based Field component */
export type Field<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = SlotComponent<FieldProps<T, S, F>> & {
  /** The optional TEST_IDS block that some fields contain, exported for testing purposes */
  TEST_IDS?: TestIdShape;
};

/** The properties that are passed to a `FieldTemplate` implementation */
export type FieldTemplateProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = RJSFBaseProps<T, S, F> & {
  /** The `FieldPath` identifying this field in the form */
  fieldPath: FieldPath;
  /** The id of the field in the hierarchy. You can use it to render a label targeting the wrapped widget */
  id: string;
  /** A string containing the base CSS classes, merged with any custom ones defined in your uiSchema */
  classNames?: string;
  /** An object containing the style as defined in the `uiSchema` */
  style?: StyleHTMLAttributes<any>;
  /** The computed label for this field, as a string */
  label: string;
  /** The name of this field's property in its parent object, carrying none of the decoration `label` may have picked
   * up — a `ui:title`, or the marker a `deprecated` schema adds. The key of an `additionalProperties` property is
   * this rather than its `label`, so renaming one reads and writes the real key
   */
  keyName: string;
  /** A component instance rendering the field description, if one is defined (this will use any custom
   * `DescriptionField` defined)
   */
  description?: ReactElement;
  /** A string containing any `ui:description` uiSchema directive defined */
  rawDescription?: string;
  /** The field or widget component instance for this field row */
  children: ReactElement;
  /** A component instance listing any encountered errors for this field */
  errors?: ReactElement;
  /** An array of strings listing the generated error messages this field is displaying, `undefined` while
   * `ui:hideError` is in effect, so that a template styling itself from it alone stays out of the error state.
   * To render the withheld errors yourself, read them from `errorSchema`
   */
  rawErrors?: string[];
  /** The tree of errors for this field and its children, carrying every error whatever `hideError` says, for a
   * template that renders the errors itself rather than leaving them to the `errors` component
   */
  errorSchema?: ErrorSchema<T>;
  /** A component instance rendering any `ui:help` uiSchema directive defined */
  help?: ReactElement;
  /** A string containing any `ui:help` uiSchema directive defined. **NOTE:** `rawHelp` will be `undefined` if passed
   * `ui:help` is a React element instead of a string
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
  /** The formData for this field */
  formData?: T;
  /** The value change event handler; Can be called with a new value to change the value for this field */
  onChange: FieldProps<T, S, F>['onChange'];
  /** Callback used to handle the changing of an additional property key's name with the new value
   */
  onKeyRename: (newKey: string) => void;
  /** Callback used to handle the changing of an additional property key's name when the input is blurred. The event's
   * target's value will be used as the new value. Its a wrapper callback around `onKeyRename`
   */
  onKeyRenameBlur: (event: FocusEvent<HTMLInputElement>) => void;
  /** Callback used to handle the removal of the additionalProperty */
  onRemoveProperty: () => void;
  /** The key names an `additionalProperties` property is allowed to be renamed to, derived from the parent schema's
   * `propertyNames.enum` and narrowed to the names its siblings have not already taken. Undefined when the parent
   * schema does not constrain its property names
   */
  propertyNamesEnum?: string[];
};

/**
 * The properties that are passed to a `FallbackField` implementation
 */
export type FallbackFieldProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = FieldProps<T, S, F>;

/**
 * The properties that are passed to a `FallbackFieldTemplate` implementation
 */
export type FallbackFieldTemplateProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = RJSFBaseProps<T, S, F> & {
  /** A ReactNode that allows the selecting a different type for the field */
  typeSelector: ReactNode;
  /** A ReactNode that renders the field with the present formData and matches the selected type */
  schemaField: ReactNode;
};

/** The properties that are passed to the `UnsupportedFieldTemplate` implementation */
export type UnsupportedFieldProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = RJSFBaseProps<T, S, F> & {
  /** The id of the field in the hierarchy */
  id: string;
  /** The reason why the schema field has an unsupported type */
  reason: string;
};

/** The properties that are passed to a `TitleFieldTemplate` implementation */
export type TitleFieldProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = RJSFBaseProps<T, S, F> & {
  /** The id of the field title in the hierarchy */
  id: string;
  /** The title for the field being rendered */
  title: string;
  /** A boolean value stating if the field is required */
  required?: boolean;
  /** Add optional data control */
  optionalDataControl?: ReactNode;
};

/** The properties that are passed to a `DescriptionFieldTemplate` implementation */
export type DescriptionFieldProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = RJSFBaseProps<T, S, F> & {
  /** The id of the field description in the hierarchy */
  id: string;
  /** The description of the field being rendered */
  description: string | ReactElement;
};

/** The properties that are passed to a `ArrayFieldTitleTemplate` implementation */
export type ArrayFieldTitleProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = Omit<TitleFieldProps<T, S, F>, 'id' | 'title'> & {
  /** The title for the field being rendered */
  title?: string;
  /** The id of the field in the hierarchy */
  id: string;
  /** Add optional data control */
  optionalDataControl?: ReactNode;
};

/** The properties that are passed to a `ArrayFieldDescriptionTemplate` implementation */
export type ArrayFieldDescriptionProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = Omit<DescriptionFieldProps<T, S, F>, 'id' | 'description'> & {
  /** The description of the field being rendered */
  description?: string | ReactElement;
  /** The id of the field in the hierarchy */
  id: string;
};

/** The properties of the buttons to render for each element in the ArrayFieldTemplateProps.items array */
export type ArrayFieldItemButtonsTemplateProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = RJSFBaseProps<T, S, F> & {
  /** The id of the field in the hierarchy */
  id: string;
  /** The className string */
  className?: string;
  /** Any optional style attributes */
  style?: ButtonHTMLAttributes<HTMLButtonElement>['style'];
  /** A boolean value stating if the array item is disabled */
  disabled?: boolean;
  /** A boolean value stating whether new items can be added to the array */
  canAdd: boolean;
  /** A boolean value stating whether the array item can be copied, assumed false if missing */
  hasCopy: boolean;
  /** A boolean value stating whether the array item can be moved down */
  hasMoveDown: boolean;
  /** A boolean value stating whether the array item can be moved up */
  hasMoveUp: boolean;
  /** A boolean value stating whether the array item can be removed */
  hasRemove: boolean;
  /** A number stating the index the array item occurs in `items` */
  index: number;
  /** A number stating the total number `items` in the array */
  totalItems: number;
  /** Callback function that adds a new item below this item */
  onAddItem: (event?: any) => void;
  /** Callback function that copies this item below itself */
  onCopyItem: (event?: any) => void;
  /** Callback function that moves the item up one spot in the list */
  onMoveUpItem: (event?: any) => void;
  /** Callback function that moves the item down one spot in the list */
  onMoveDownItem: (event?: any) => void;
  /** Callback function that removes the item from the list */
  onRemoveItem: (event?: any) => void;
  /** A boolean value stating if the array item is read-only */
  readonly?: boolean;
};

/** The properties used to render the ArrayFieldItemTemplate */
export type ArrayFieldItemTemplateProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = RJSFBaseProps<T, S, F> & {
  /** The html for the item's content */
  children: ReactNode;
  /** The props to pass to the `ArrayFieldItemButtonTemplate` */
  buttonsProps: ArrayFieldItemButtonsTemplateProps<T, S, F>;
  /** The className string */
  className: string;
  /** A boolean value stating if the array item is disabled */
  disabled?: boolean;
  /** A boolean value stating whether the array item has a toolbar */
  hasToolbar: boolean;
  /** A number stating the index the array item occurs in `items` */
  index: number;
  /** A number stating the total number `items` in the array */
  totalItems: number;
  /** A boolean value stating if the array item is read-only */
  readonly?: boolean;
  /** A stable, unique key for the array item */
  itemKey: string;
  /** The UI schema of the array item's parent array field used for
   * customization in some themes
   */
  parentUiSchema?: UiSchema<T, S, F>;
  /** A boolean flag indicating whether the label for the field is being shown, used to assist buttons placement */
  displayLabel?: boolean;
  /** A boolean flag indicating whether there is a description for the field, used to assist buttons placement */
  hasDescription?: boolean;
};

/** The common properties of the two container templates: `ArrayFieldTemplateProps` and `ObjectFieldTemplateProps` */
export type ContainerFieldTemplateProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = RJSFBaseProps<T, S, F> & {
  /** The className string */
  className?: string;
  /** A boolean value stating if the array is disabled */
  disabled?: boolean;
  /** The id of the field in the hierarchy */
  id: string;
  /** A boolean value stating if the array is read-only */
  readonly?: boolean;
  /** A boolean value stating if the array is required */
  required?: boolean;
  /** A boolean value stating if the field is hiding its errors */
  hideError?: boolean;
  /** A string value containing the title for the array */
  title: string;
  /** The formData for this array */
  formData?: T;
  /** The optional validation errors in the form of an `ErrorSchema` */
  errorSchema?: ErrorSchema<T>;
  /** The optional data control node to render within the ObjectFieldTemplate that controls */
  optionalDataControl?: ReactNode;
};

/** The properties that are passed to an `ArrayFieldTemplate` implementation */
export type ArrayFieldTemplateProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = ContainerFieldTemplateProps<T, S, F> & {
  /** A boolean value stating whether new elements can be added to the array */
  canAdd?: boolean;
  /** An array of React elements representing the items in the array */
  items: ReactElement[];
  /** A function that adds a new item to the end of the array */
  onAddClick: (event?: any) => void;
  /** An array of strings listing all generated error messages from encountered errors for this widget. Unlike
   * `FieldTemplateProps.rawErrors`, it carries them whatever `hideError` says, as a widget's does, so a template
   * rendering an error state from it must pair the two through `hasVisibleErrors({ rawErrors, hideError })`
   */
  rawErrors?: string[];
};

/** The properties of each element in the ObjectFieldTemplateProps.properties array */
export interface ObjectFieldTemplatePropertyType<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
  /** The html for the property's content */
  content: ReactElement<Pick<FieldProps<T, S, F>, 'schema' | 'uiSchema'>>;
  /** A string representing the property name */
  name: string;
  /** A boolean value stating if the object property is disabled */
  disabled?: boolean;
  /** A boolean value stating if the property is read-only */
  readonly?: boolean;
  /** A boolean value stating if the property should be hidden */
  hidden: boolean;
}

/** The properties that are passed to an ObjectFieldTemplate implementation */
export type ObjectFieldTemplateProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = ContainerFieldTemplateProps<T, S, F> & {
  /** A string value containing the description for the object */
  description?: string | ReactElement;
  /** An array of objects representing the properties in the object */
  properties: ObjectFieldTemplatePropertyType<T, S, F>[];
  /** Callback to use in order to add an new additionalProperty to the object field  (to be used with
   * additionalProperties and patternProperties)
   */
  onAddProperty: () => void;
  /** A boolean value stating if the object is read-only */
  readonly?: boolean;
  /** A boolean value stating if the object is required */
  required?: boolean;
  /** A boolean value stating if the field is hiding its errors */
  hideError?: boolean;
  /** The id of the field in the hierarchy */
  id: string;
  /** The optional validation errors in the form of an `ErrorSchema` */
  errorSchema?: ErrorSchema<T>;
  /** The form data for the object */
  formData?: T;
};

/** The properties that are passed to a OptionalDataControlsTemplate implementation */
export type OptionalDataControlsTemplateProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = RJSFBaseProps<T, S, F> & {
  /** The generated id for this Optional Data Control instance */
  id: string;
  /** The label to use for the Optional Data Control */
  label: string;
  /** Optional callback to call when clicking on the Optional Data Control to add data */
  onRemoveClick?: () => void;
  /** Optional callback to call when clicking on the Optional Data Control to remove data */
  onAddClick?: () => void;
};

/** The properties that are passed to a WrapIfAdditionalTemplate implementation */
export type WrapIfAdditionalTemplateProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = RJSFBaseProps<T, S, F> & {
  /** The field or widget component instance for this field row */
  children: ReactNode;
} & Pick<
    FieldTemplateProps<T, S, F>,
    | 'id'
    | 'classNames'
    | 'hideError'
    | 'rawDescription'
    | 'rawErrors'
    | 'style'
    | 'displayLabel'
    | 'label'
    | 'keyName'
    | 'required'
    | 'readonly'
    | 'disabled'
    | 'schema'
    | 'uiSchema'
    | 'onKeyRename'
    | 'onKeyRenameBlur'
    | 'onRemoveProperty'
    | 'propertyNamesEnum'
    | 'registry'
  >;

/** The properties that are passed to a MultiSchemaFieldTemplate implementation */
export interface MultiSchemaFieldTemplateProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> extends RJSFBaseProps<T, S, F> {
  /** The rendered widget used to select a schema option */
  selector: ReactNode;
  /** The rendered SchemaField for the selected schema option */
  optionSchemaField: ReactNode;
}

/** The properties that are passed to a `Widget` implementation */
export interface WidgetProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>
  extends
    GenericObjectType,
    RJSFBaseProps<T, S, F>,
    Pick<HTMLAttributes<HTMLElement>, Exclude<keyof HTMLAttributes<HTMLElement>, 'onBlur' | 'onFocus' | 'onChange'>> {
  /** The generated id for this widget, used to provide unique `name`s and `id`s for the HTML field elements rendered by
   * widgets
   */
  id: string;
  /** The unique name of the field, usually derived from the name of the property in the JSONSchema; Provided in support
   * of custom widgets.
   */
  name: string;
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
    enumOptions?: EnumOptionsType<S>[];
  };
  /** The input blur event handler; call it with the widget id and value */
  onBlur: (id: string, value: any) => void;
  /** The value change event handler; call it with the new value every time it changes */
  onChange: Bivariant<[value: any, es?: ErrorSchema<T>, id?: string]>;
  /** The input focus event handler; call it with the widget id and value */
  onFocus: (id: string, value: any) => void;
  /** The computed label for this widget, as a string */
  label: string;
  /** A boolean value, if true, will cause the label to be hidden. This is useful for nested fields where you don't want
   * to clutter the UI. Customized via `label` in the `UiSchema`
   */
  hideLabel?: boolean;
  /** A boolean value stating if the widget can accept multiple values */
  multiple?: boolean;
  /** An array of strings listing all generated error messages from encountered errors for this widget */
  rawErrors?: string[];
  /** The optional custom HTML name attribute generated by the nameGenerator function, if provided */
  htmlName?: string;
}

/** The definition of a React-based Widget component */
export type Widget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = SlotComponent<WidgetProps<T, S, F>>;

/** The properties that are passed to the BaseInputTemplate */
export interface BaseInputTemplateProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> extends WidgetProps<T, S, F> {
  /** A `BaseInputTemplate` implements a default `onChange` handler that it passes to the HTML input component to handle
   * the `ChangeEvent`. Sometimes a widget may need to handle the `ChangeEvent` using custom logic. If that is the case,
   * that widget should provide its own handler via this prop.
   */
  onChangeOverride?: (event: ChangeEvent<HTMLInputElement>) => void;
}

/** The type that defines the props used by the Submit button */
export interface SubmitButtonProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
  /** The uiSchema for this widget */
  readonly uiSchema?: UiSchema<T, S, F>;
  /** The `registry` object */
  readonly registry: Registry<T, S, F>;
}

/** The type that defines the props for an Icon button, extending from a basic HTML button attributes */
export type IconButtonProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = ButtonHTMLAttributes<HTMLButtonElement> &
  Omit<RJSFBaseProps<T, S, F>, 'schema'> & {
    /** An alternative specification for the type of the icon button */
    iconType?: string;
    /** The name representation or actual react element implementation for the icon */
    icon?: string | ReactElement;
  };

/** The type that defines how to change the behavior of the submit button for the form */
export interface UISchemaSubmitButtonOptions {
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
}

/** Represents a primitive JSON Schema enum value */
export type EnumValue = string | number | boolean;

/** This type represents an element used to render an enum option */
export interface EnumOptionsType<S extends StrictRJSFSchema = RJSFSchema> {
  /** The value for the enum option */
  value: any;
  /** The label for the enum options */
  label: string;
  /** The schema associated with the enum option when the option represents a `oneOf` or `anyOf` choice */
  schema?: S;
}

/** An `EnumOptionsType` enriched with the information a widget needs to render and encode it once it may have been
 * grouped by `groupEnumOptions()`
 */
export interface IndexedEnumOptionType<S extends StrictRJSFSchema = RJSFSchema> extends EnumOptionsType<S> {
  /** This option's position in the original, ungrouped `enumOptions` array. Needed because `enumOptionValueEncoder`
   * encodes values by their original index when using the `'indexed'` `optionValueFormat`
   */
  index: number;
  /** Whether this option is disabled, as determined by `ui:enumDisabled` */
  disabled: boolean;
}

/** Represents a labeled group of options produced by `groupEnumOptions()` from `ui:options.optgroups` */
export interface EnumOptionsGroupType<S extends StrictRJSFSchema = RJSFSchema> {
  /** The group's label */
  label: string;
  /** The options belonging to this group, in the order they were listed in `ui:options.optgroups` */
  options: IndexedEnumOptionType<S>[];
}

/** A single element of the tree returned by `groupEnumOptions()`: either a standalone option or a group of them */
export type GroupedEnumOptionsType<S extends StrictRJSFSchema = RJSFSchema> =
  | IndexedEnumOptionType<S>
  | EnumOptionsGroupType<S>;

/** This type remaps the keys of `Type` to prepend `ui:` onto them. As a result it does not need to be exported */
type MakeUIType<Type> = {
  [Property in keyof Type as `ui:${string & Property}`]: Type[Property];
};

/** The per-field template overrides `ui:options` supports, i.e. all the properties of `TemplatesType` except
 * "ButtonTemplates". Shared by `UIOptionsBaseType` (the open, unnarrowed vocabulary) and `CommonUiOptions` (the
 * closed vocabulary's always-available common options), so the two lists can't drift apart.
 */
type UIOptionsTemplateOverrides<T, S extends StrictRJSFSchema, F extends FormContextType> = Pick<
  TemplatesType<T, S, F>,
  | 'ArrayFieldDescriptionTemplate'
  | 'ArrayFieldItemTemplate'
  | 'ArrayFieldTemplate'
  | 'ArrayFieldTitleTemplate'
  | 'BaseInputTemplate'
  | 'DescriptionFieldTemplate'
  | 'ErrorListTemplate'
  | 'FieldErrorTemplate'
  | 'FieldHelpTemplate'
  | 'FieldTemplate'
  | 'ObjectFieldTemplate'
  | 'TitleFieldTemplate'
  | 'UnsupportedFieldTemplate'
  | 'WrapIfAdditionalTemplate'
>;

/** This type represents all the known supported options in the `ui:options` property, kept separate in order to
 * remap the keys. It also contains all the properties, optionally, of `TemplatesType` except "ButtonTemplates"
 */
type UIOptionsBaseType<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = Partial<UIOptionsTemplateOverrides<T, S, F>> &
  GlobalUISchemaOptions & {
    /** Allows RJSF to override the default field implementation by specifying either the name of a field that is used
     * to look up an implementation from the `fields` list or an actual one-off `Field` component implementation itself
     */
    field?: Field<T, S, F> | string;
    /** Any classnames that the user wants to be applied to a field in the ui */
    classNames?: string;
    /** Any custom style that the user wants to apply to a field in the ui, applied on the same element as classNames */
    style?: StyleHTMLAttributes<any>;
    /** We know that for title, it will be a string, if it is provided */
    title?: string;
    /** We know that for description, it will be a string, if it is provided */
    description?: string;
    /** We know that for placeholder, it will be a string, if it is provided */
    placeholder?: string;
    /** Used to add text next to a field to guide the end user in filling it in */
    help?: string | ReactElement;
    /** Flag, if set to `true`, will mark the field as automatically focused on a text input or textarea input */
    autofocus?: boolean;
    /** Use to mark the field as supporting auto complete on a text input or textarea input */
    autocomplete?: HTMLInputElement['autocomplete'];
    /** Controls automatic capitalization for text entered on supporting virtual keyboards */
    autocapitalize?: HTMLInputElement['autocapitalize'];
    /** Flag, if set to `true`, will mark all child widgets from a given field as disabled */
    disabled?: boolean;
    /** The default value to use when an input for a field is empty */
    emptyValue?: any;
    /** Pre-fills the field on initial render and after a form reset. Takes priority over `schema.default`, but never
     * overrides form data the user (or caller) has already provided.
     */
    initialValue?: any;
    /** Overrides the schema's `required` status for the field on the UI side only: `true` shows the required
     * indicator and adds the field to the effective required set used for validation; `false` hides the indicator
     * but does not suppress schema-level validation for a field the schema itself marks required.
     */
    required?: boolean;
    /** Will disable any of the enum options specified in the array (by value) */
    enumDisabled?: EnumValue[];
    /** Allows a user to provide a list of labels for enum values in the schema.
     * Can be an array (positional, matched by index) or a Record mapping enum values to labels (matched by value).
     */
    enumNames?: string[] | Record<string | number, string>;
    /** Controls the display order of enum options, following the same pattern as `ui:order` for object properties.
     * Supports a `'*'` wildcard to represent all remaining values in their original schema order.
     */
    enumOrder?: EnumValue[];
    /** Groups enum options into labeled `<optgroup>`-like sections. Keys are group labels, values are arrays of enum
     * values belonging to that group. Enum values not listed in any group are rendered ungrouped after the groups.
     */
    optgroups?: Record<string, EnumValue[]>;
    /** Provides an optional field within a schema to be used as the oneOf/anyOf selector when there isn't a
     * discriminator
     */
    optionsSchemaSelector?: string;
    /** Flag, if set to `true`, will hide the default error display for the given field AND all of its child fields in the
     * hierarchy
     */
    hideError?: boolean;
    /** Flag, if set to `true`, will mark all child widgets from a given field as read-only */
    readonly?: boolean;
    /** This property allows you to reorder the properties that are shown for a particular object */
    order?: string[];
    /** Flag, if set to `true`, will cause the `FileWidget` to show a preview (with download for non-image files) */
    filePreview?: boolean;
    /** Flag, if set to `true`, will mark a list of checkboxes as displayed all on one line instead of one per row */
    inline?: boolean;
    /** Used to change the input type (for example, `tel` or `email`) for an <input> */
    inputType?: string;
    /** Provides a means to set the initial height of a textarea widget */
    rows?: number;
    /** If submitButtonOptions is provided it should match the `UISchemaSubmitButtonOptions` type */
    submitButtonOptions?: UISchemaSubmitButtonOptions;
    /** Allows RJSF to override the default widget implementation by specifying either the name of a widget that is used
     * to look up an implementation from the `widgets` list or an actual one-off widget implementation itself
     */
    widget?: Widget<T, S, F> | string;
  };

/** The type that represents the Options potentially provided by `ui:options` */
export type UIOptionsType<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = UIOptionsBaseType<T, S, F> & Record<string, boolean | number | string | object | any[] | null | undefined>;

/**
 * A utility type that extracts the element type from an array type.
 * If the type is not an array, it returns the type itself as a safe fallback.
 * Handles both standard arrays and readonly arrays.
 */
export type ArrayElement<A> = A extends readonly (infer E)[] ? E : A;

/** A single `{ when, then }` rule: when a field's form-data type is assignable to `when`, the widget/field names and
 * options listed in `then` become valid `ui:widget`/`ui:field`/`ui:options` values for that field in `UiSchema`,
 * once a `Checks` union is passed as `UiSchema`'s fourth type parameter. Build a union of these to extend the
 * type-safe vocabulary a `Checks` union accepts - a theme package builds a union of its own widgets this way and
 * exports it for its users to pass as `Checks` (e.g. `@rjsf/core`'s `CoreUiOptionsChecks`), and a consumer of a
 * theme adds their own domain-specific options the same way, unioned into what they pass.
 */
export interface UiOptionsCheck<When = any, Then = GenericObjectType> {
  when: When;
  then: Then;
}

/** @internal Merges a union of object types into a single object type, unioning each key's value type across every
 * union member that declares it, rather than intersecting them. A plain intersection collapses a key declared with a
 * different type in two matching `Checks` members - e.g. `emptyValue: string` on the string check and
 * `emptyValue: number` on the number check, both matching a `T = unknown` or `T = string | number` field - down to
 * `string & number` = `never`. Unioning by key keeps it usable as `string | number` instead.
 */
type UnionToMergedKeys<U> = {
  [K in U extends unknown ? keyof U : never]?: U extends unknown ? (K extends keyof U ? U[K] : never) : never;
};

/** @internal Whether `Then` declares its own `K` key, as opposed to merely admitting one through a string index
 * signature (as `UiOptionsCheck`'s default `Then = GenericObjectType` does). Without this guard, `Then extends {
 * [K]?: infer W }` matches an index-signature `Then` too - inferring `W` as whatever the index signature's value
 * type is (typically `any`) - so a `UiOptionsCheck` written without a `widget`/`field` key would otherwise silently
 * widen the vocabulary for every field its `when` matches, rather than contributing nothing.
 *
 * TypeScript has no way to tell "a key admitted only by an index signature" apart from "a key admitted by an index
 * signature that also happens to declare it explicitly", so a `Then` combining the two (e.g. `GenericObjectType &
 * { widget: 'Foo' }`) is treated as declaring neither - a narrow, silent under-inclusion rather than a type error.
 * Not a concern for `Then`s written as an explicit object literal, which is the documented, expected shape.
 */
type DeclaresKey<Then, K extends PropertyKey> = string extends keyof Then ? false : K extends keyof Then ? true : false;

/** @internal Whether a `Checks` member written for `When` applies to form-data type `T`: when any member of a union
 * `T` matches, or when `T` is unknown, since data of an unknown type could be any of them (as it could when `T`
 * defaulted to `any`).
 */
type ChecksApply<T, When> = unknown extends T ? true : true extends (T extends When ? true : false) ? true : false;

/** @internal The union of `then.widget` names valid for form-data type `T`, drawn from `Checks`. */
type WidgetsFor<T, Checks> =
  Checks extends UiOptionsCheck<infer When, infer Then>
    ? DeclaresKey<Then, 'widget'> extends true
      ? Then extends { widget?: infer W }
        ? ChecksApply<T, When> extends true
          ? W
          : never
        : never
      : never
    : never;

/** @internal The union of `then.field` names valid for form-data type `T`, drawn from `Checks`. */
type FieldsFor<T, Checks> =
  Checks extends UiOptionsCheck<infer When, infer Then>
    ? DeclaresKey<Then, 'field'> extends true
      ? Then extends { field?: infer Fl }
        ? ChecksApply<T, When> extends true
          ? Fl
          : never
        : never
      : never
    : never;

/** @internal The `ui:`-prefixed options (minus `widget`/`field`) valid for form-data type `T`, merged by key across
 * every matching `Checks` member - see `UnionToMergedKeys`.
 */
type RawOptsFor<T, Checks> = UnionToMergedKeys<
  Checks extends UiOptionsCheck<infer When, infer Then>
    ? ChecksApply<T, When> extends true
      ? Omit<Then, 'widget' | 'field'>
      : never
    : never
>;

/** @internal The `ui:widget`/`ui:field`/`ui:options` shape for a single field of form-data type `T`, narrowed by
 * `Checks` and still allowing a one-off `Widget`/`Field` component instance instead of a registered name.
 */
interface UiOptionsComponentPart<T, S extends StrictRJSFSchema, F extends FormContextType, Checks> {
  'ui:widget'?: WidgetsFor<T, Checks> | Widget<T, S, F>;
  'ui:field'?: FieldsFor<T, Checks> | Field<T, S, F>;
  'ui:options'?: {
    widget?: WidgetsFor<T, Checks> | Widget<T, S, F>;
    field?: FieldsFor<T, Checks> | Field<T, S, F>;
  } & RawOptsFor<T, Checks> &
    CommonUiOptions<T, S, F>;
}

/** @internal Common `ui:*` options valid on any field regardless of its type, kept separate from a `Checks` union
 * since they aren't type-specific vocabulary - available whenever `Checks` narrows the vocabulary, same as they
 * always are through `UIOptionsBaseType` when it doesn't. Includes the same per-field template overrides and
 * `GlobalUISchemaOptions` keys the open vocabulary carries, since those are also type-agnostic and unrecoverable
 * through `Checks` otherwise.
 */
type CommonUiOptions<T, S extends StrictRJSFSchema, F extends FormContextType> = Partial<
  UIOptionsTemplateOverrides<T, S, F>
> &
  GlobalUISchemaOptionsKeys & {
    help?: string | ReactElement;
    title?: string;
    description?: string;
    classNames?: string;
    style?: StyleHTMLAttributes<any>;
    autofocus?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    hideError?: boolean;
    submitButtonOptions?: UISchemaSubmitButtonOptions;
  };

/** @internal The vocabulary part of `UiSchema`: `ui:widget`/`ui:field`/`ui:options` and their `ui:`-prefixed raw
 * option equivalents. `[Checks] extends [never]` (tuple-wrapped to avoid distribution) is `UiSchema`'s default,
 * unnarrowed, permissive shape - identical to what `UiSchema` has always had. A concrete `Checks` union instead
 * narrows `ui:widget`/`ui:field` to only the names `Checks` declares for the field's type, and closes the `ui:`
 * namespace to just the options it declares plus `CommonUiOptions`: every other key, including a typo like
 * `ui:wigdet`, becomes a type error instead of only failing at runtime. `@rjsf/utils` has no built-in vocabulary of
 * its own to always include here - a theme's `Checks` union (e.g. `@rjsf/core`'s `CoreUiOptionsChecks`) is meant to
 * be unioned in by whoever passes `Checks`, not baked into `UiSchema` itself.
 */
type UiVocabularyPart<T, S extends StrictRJSFSchema, F extends FormContextType, Checks> = [Checks] extends [never]
  ? MakeUIType<UIOptionsBaseType<T, S, F>> & { 'ui:options'?: UIOptionsType<T, S, F> }
  : MakeUIType<CommonUiOptions<T, S, F>> & UiOptionsComponentPart<T, S, F, Checks> & MakeUIType<RawOptsFor<T, Checks>>;

/** Type describing the uiSchema definitions that can be applied to schemas referenced by `$ref`.
 * Keys are the full `$ref` path (e.g., '#/$defs/node', '#/definitions/address').
 * When a schema with a matching `$ref` is resolved, the corresponding uiSchema definition
 * is automatically applied and merged with any local uiSchema overrides.
 */
export type UiSchemaDefinitions<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
  Checks = never,
> = Record<string, UiSchema<T, S, F, Checks>>;

/** The members of `T` that can hold nested form fields: the object ones, minus arrays, which nest through `items`
 * rather than by key, and minus the atomic objects. A primitive member is dropped rather than left in, since `keyof`
 * a primitive is its prototype's method names.
 */
type UiSchemaFieldMembers<T> = Exclude<Extract<NonNullable<T>, object>, readonly unknown[] | AtomicValue>;

/** The data whose keys become the nested per-field entries of a `UiSchema` for data of type `T`. Data of an unknown
 * type keeps every field name open; an array nests through `items` rather than by index; a leaf has no nested fields.
 */
type UiSchemaChildData<T> = unknown extends T ? GenericObjectType : UnionMembersMerged<UiSchemaFieldMembers<T>>;

/** The keys of `X` that name form fields. A method is not a field, and mapping one would also break assignability
 * for every uiSchema literal, since an object literal's apparent type carries `Object.prototype`'s methods.
 */
type FieldKeys<X> = { [K in keyof X]-?: NonNullable<X[K]> extends (...args: never[]) => unknown ? never : K }[keyof X];

/** Every field-naming key of every member of a union, each typed as the union of what the members that declare it
 * hold. A `oneOf`/`anyOf` field's data is a union, and its uiSchema legitimately names keys from any branch.
 */
type UnionMembersMerged<T> = {
  [K in T extends unknown ? FieldKeys<T> : never]: T extends unknown ? (K extends keyof T ? T[K] : never) : never;
};

/** The data an `additionalProperties` key holds: what `T`'s index signature declares, or `any` when it has none */
type AdditionalPropertyData<T> = string extends keyof NonNullable<T> ? NonNullable<T>[string] : any;

/** A nested field entry. For unknown data the entry is unconstrained, as the open index signature it replaces was */
type UiSchemaChild<V, S extends StrictRJSFSchema, F extends FormContextType, Checks> =
  IsAny<V> extends true ? any : UiSchema<V, S, F, Checks>;

/** Type describing the well-known properties of the `UiSchema` while also supporting all user defined properties,
 * starting with `ui:`.
 *
 * `Checks` (a union of `UiOptionsCheck`, defaulting to `never`) is an opt-in, stricter mode: with no `Checks`
 * supplied, `UiSchema` behaves exactly as it always has, accepting any `ui:widget`/`ui:field` name and any
 * `ui:`-prefixed option. Pass a `Checks` union to narrow `ui:widget`/`ui:field` to only the names valid for each
 * field's form-data type and close the `ui:` namespace to just the options they declare - see `UiOptionsCheck`.
 * `@rjsf/utils` has no widgets of its own, so it doesn't export a `Checks` union to pass; use a theme's, e.g.
 * `@rjsf/core`'s `CoreUiOptionsChecks`.
 */
export type UiSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
  Checks = never,
> = {
  [K in keyof UiSchemaChildData<T>]?: UiSchemaChild<UiSchemaChildData<T>[K], S, F, Checks>;
} & UiVocabularyPart<T, S, F, Checks> & {
    /** The set of Globally relevant UI Schema options that are read from the root-level UiSchema and stored in the
     * Registry for use everywhere.
     */
    'ui:globalOptions'?: GlobalUISchemaOptions;
    /** By default, any field that is rendered for an `anyOf`/`oneOf` schema will be wrapped inside the `AnyOfField` or
     * `OneOfField` component. This default behavior may be undesirable if your custom field already handles behavior
     * related to choosing one or more subschemas contained in the `anyOf`/`oneOf` schema.
     * By providing a `true` value for this flag in association with a custom `ui:field`, the wrapped components will be
     * omitted, so just one instance of the custom field will be rendered. If the flag is omitted or set to `false`,
     * your custom field will be wrapped by `AnyOfField`/`OneOfField`.
     */
    'ui:fieldReplacesAnyOrOneOf'?: boolean;
    /** The uiSchema for items in an array. Can be an object for a uniform uiSchema across all items, an array of
     * per-tuple-position uiSchemas for a fixed (tuple) `items` schema, or a function that returns a dynamic uiSchema
     * based on the item's data and index.
     * When using a function, it receives the item data, index, and optionally the form context as parameters.
     */
    items?:
      | UiSchema<ArrayElement<T>, S, F, Checks>
      | UiSchema<ArrayElement<T>, S, F, Checks>[]
      | Bivariant<[itemData: ArrayElement<T>, index: number, formContext?: F], UiSchema<ArrayElement<T>, S, F, Checks>>;
    /** The uiSchema applied to properties added through the schema's `additionalProperties`, typed by the data those
     * properties hold: the index signature's value type when `T` declares one, otherwise unconstrained
     */
    additionalProperties?: UiSchema<AdditionalPropertyData<T>, S, F, Checks>;
    /** The uiSchema applied to the items a fixed-items array accepts beyond its tuple, per `additionalItems` */
    additionalItems?: UiSchema<ArrayElement<T>, S, F, Checks>;
    /** The uiSchema for each subschema of an `anyOf`, positionally */
    anyOf?: UiSchema<T, S, F, Checks>[];
    /** The uiSchema for each subschema of a `oneOf`, positionally */
    oneOf?: UiSchema<T, S, F, Checks>[];
    /** Class names applied to the field, consumed by `SchemaField` rather than passed down. `ui:classNames` is the
     * prefixed spelling of the same thing; this unprefixed one is kept for backwards compatibility.
     */
    classNames?: string;
    /** An object containing uiSchema definitions keyed by JSON Schema `$ref` paths.
     * When a schema with a `$ref` is resolved, the corresponding uiSchema definition is automatically
     * applied and merged with any local uiSchema overrides at that path.
     * Keys must be full `$ref` paths (e.g., '#/$defs/node', '#/definitions/address').
     */
    'ui:definitions'?: UiSchemaDefinitions<T, S, F, Checks>;
  };

/** A `CustomValidator` function takes in a `formData`, `errors`, `uiSchema` and `errorSchema` objects and returns the given `errors`
 * object back, while potentially adding additional messages to the `errors`
 */
export type CustomValidator<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = (
  formData: T | undefined,
  errors: FormValidation<T>,
  uiSchema?: UiSchema<T, S, F>,
  errorSchema?: ErrorSchema<T>,
) => FormValidation<T>;

/** An `ErrorTransformer` function will take in a list of `errors` & a `uiSchema` and potentially return a
 * transformation of those errors in what ever way it deems necessary
 */
export type ErrorTransformer<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = (errors: RJSFValidationError[], uiSchema?: UiSchema<T, S, F>) => RJSFValidationError[];

/** The type that describes the data that is returned from the `ValidatorType.validateFormData()` function */
export interface ValidationData<T> {
  /** The validation errors as a list of `RJSFValidationError` objects */
  errors: RJSFValidationError[];
  /** The validation errors in the form of an `ErrorSchema` */
  errorSchema: ErrorSchema<T>;
}

/** The interface that describes the validation functions that are provided by a Validator implementation used by the
 * schema utilities.
 */
export interface ValidatorType<S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType> {
  /** This function processes the `formData` with an optional user contributed `customValidate` function, which receives
   * the form data and a `errorHandler` function that will be used to add custom validation errors for each field. Also
   * supports a `transformErrors` function that will take the raw AJV validation errors, prior to custom validation and
   * transform them in what ever way it chooses. The form data type `T` is a parameter of the call rather than of the
   * validator, since a validator checks data of any shape against a schema and one instance serves every `Form`.
   *
   * @param formData - The form data to validate
   * @param schema - The schema against which to validate the form data
   * @param [customValidate] - An optional function that is used to perform custom validation
   * @param [transformErrors] - An optional function that is used to transform errors after AJV validation
   * @param [uiSchema] - An optional uiSchema that is passed to `transformErrors` and `customValidate`
   */
  validateFormData<T = unknown>(
    formData: T | undefined,
    schema: S,
    customValidate?: CustomValidator<T, S, F>,
    transformErrors?: ErrorTransformer<T, S, F>,
    uiSchema?: UiSchema<T, S, F>,
  ): ValidationData<T>;
  /** Validates data against a schema, returning true if the data is valid, or
   * false otherwise. If the schema is invalid, then this function will return
   * false.
   *
   * @param schema - The schema against which to validate the form data
   * @param formData - The form data to validate
   * @param rootSchema - The root schema used to provide $ref resolutions
   */
  isValid(schema: S, formData: unknown, rootSchema: S): boolean;
  /** Runs the pure validation of the `schema` and `formData` without any of the RJSF functionality. Provided for use
   * by the playground. Returns the `errors` from the validation
   *
   * @param schema - The schema against which to validate the form data
   * @param formData - The form data to validate
   */
  rawValidation<Result = any>(schema: S, formData?: unknown): { errors?: Result[]; validationError?: Error };
  /** An optional function that can be used to reset validator implementation. Useful for clear schemas in the AJV
   * instance for tests.
   */
  reset?: () => void;
}

/** The interface for the return value of the `findFieldInSchema` function
 */
export interface FoundFieldType<S extends StrictRJSFSchema = RJSFSchema> {
  /** The field that was found, or undefined if it wasn't */
  field?: S;
  /** The requiredness of the field found or undefined if it wasn't */
  isRequired?: boolean;
}

/** The `SchemaUtilsType` interface provides a wrapper around the publicly exported APIs in the `@rjsf/utils/schema`
 * directory such that one does not have to explicitly pass the `validator` or `rootSchema` to each method. Since both
 * the `validator` and `rootSchema` generally does not change across a `Form`, this allows for providing a simplified
 * set of APIs to the `@rjsf/core` components and the various themes as well.
 */
export interface SchemaUtilsType<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
  /** Returns the `rootSchema` in the `SchemaUtilsType`
   *
   * @returns - The rootSchema
   */
  getRootSchema(): S;
  /** Returns the `ValidatorType` in the `SchemaUtilsType`
   *
   * @returns - The `ValidatorType`
   */
  getValidator(): ValidatorType<S, F>;
  /** Determines whether either the `validator` and `rootSchema` differ from the ones associated with this instance of
   * the `SchemaUtilsType`. If either `validator` or `rootSchema` are falsy, then return false to prevent the creation
   * of a new `SchemaUtilsType` with incomplete properties.
   *
   * @param validator - An implementation of the `ValidatorType` interface that will be compared against the current one
   * @param rootSchema - The root schema that will be compared against the current one
   * @param [defaultFormStateBehavior] - Optional configuration object, if provided, allows users to override default form state behavior
   * @param [customMergeAllOf] - Optional function that allows for custom merging of `allOf` schemas
   * @returns - True if the `SchemaUtilsType` differs from the given `validator` or `rootSchema`
   */
  doesSchemaUtilsDiffer(
    validator: ValidatorType<S, F>,
    rootSchema: S,
    defaultFormStateBehavior?: DefaultFormStateBehavior,
    customMergeAllOf?: CustomMergeAllOf<S>,
  ): boolean;
  /** Finds the field specified by the `path` within the root or recursed `schema`. If there is no field for the specified
   * `path`, then the default `{ field: undefined, isRequired: undefined }` is returned. It determines whether a leaf
   * field is in the `required` list for its parent and if so, it is marked as required on return.
   *
   * @param schema - The current node within the JSON schema
   * @param path - The remaining keys in the path to the desired field
   * @param [formData] - The form data that is used to determine which oneOf option
   * @returns - An object that contains the field and its required state. If no field can be found then
   *            `{ field: undefined, isRequired: undefined }` is returned.
   */
  findFieldInSchema(schema: S, path: SchemaFieldPath, formData?: T): FoundFieldType<S>;
  /** Finds the oneOf option inside the `schema['any/oneOf']` list which has the `properties[selectorField].default` that
   * matches the `formData[selectorField]` value. For the purposes of this function, `selectorField` is either
   * `schema.discriminator.propertyName` or `fallbackField`.
   *
   * @param schema - The schema element in which to search for the selected oneOf option
   * @param fallbackField - The field to use as a backup selector field if the schema does not have a required field
   * @param xxx - Either `oneOf` or `anyOf`, defines which value is being sought
   * @param [formData] - The form data that is used to determine which oneOf option
   * @returns - The anyOf/oneOf option that matches the selector field in the schema or undefined if nothing is selected
   */
  findSelectedOptionInXxxOf(schema: S, fallbackField: string, xxx: 'anyOf' | `oneOf`, formData?: T): S | undefined;
  /** Returns the superset of `formData` that includes the given set updated to include any missing fields that have
   * computed to have defaults provided in the `schema`.
   *
   * @param schema - The schema for which the default state is desired
   * @param [formData] - The current formData, if any, onto which to provide any missing defaults
   * @param [includeUndefinedValues=false] - Optional flag, if true, cause undefined values to be added as defaults.
   *          If "excludeObjectChildren", cause undefined values for this object and pass `includeUndefinedValues` as
   *          false when computing defaults for any nested object properties.
   * @param initialDefaultsGenerated - Indicates whether or not initial defaults have been generated
   * @param [uiSchema] - Optional uiSchema, used to apply `ui:emptyValue` and `ui:initialValue` as defaults
   * @param [uiSchemaDefinitions] - Optional `ui:definitions`, applied at every `$ref`-resolved node the same way
   *          `SchemaField` applies them. Defaults to `uiSchema['ui:definitions']`; pass it explicitly when `uiSchema`
   *          is itself a sub-uiSchema (an array item, a `oneOf`/`anyOf` option, `additionalProperties`, ...) that
   *          doesn't carry the root's own `ui:definitions`.
   * @returns - The resulting `formData` with all the defaults provided
   */
  getDefaultFormState(
    schema: S,
    formData?: T,
    includeUndefinedValues?: boolean | 'excludeObjectChildren',
    initialDefaultsGenerated?: boolean,
    uiSchema?: UiSchema<T, S, F>,
    uiSchemaDefinitions?: UiSchemaDefinitions<T, S, F>,
  ): T | T[] | undefined;
  /** Determines whether the combination of `schema` and `uiSchema` properties indicates that the label for the `schema`
   * should be displayed in a UI.
   *
   * @param schema - The schema for which the display label flag is desired
   * @param [uiSchema] - The UI schema from which to derive potentially displayable information
   * @param [globalOptions={}] - The Global UI Schema from which to get any fallback `xxx` options
   * @returns - True if the label should be displayed or false if it should not
   */
  getDisplayLabel(schema: S, uiSchema?: UiSchema<T, S, F>, globalOptions?: GlobalUISchemaOptions): boolean;
  /** Determines which of the given `options` provided most closely matches the `formData`.
   * Returns the index of the option that is valid and is the closest match, or 0 if there is no match.
   *
   * The closest match is determined using the number of matching properties, and more heavily favors options with
   * matching readOnly, default, or const values.
   *
   * @param formData - The form data associated with the schema
   * @param options - The list of options that can be selected from
   * @param [selectedOption] - The index of the currently selected option, defaulted to -1 if not specified
   * @param [discriminatorField] - The optional name of the field within the options object whose value is used to
   *          determine which option is selected
   * @returns - The index of the option that is the closest match to the `formData` or the `selectedOption` if no match
   */
  getClosestMatchingOption(
    formData: T | undefined,
    options: S[],
    selectedOption?: number,
    discriminatorField?: string,
  ): number;
  /** Given the `formData` and list of `options`, attempts to find the index of the first option that matches the data.
   * Always returns the first option if there is nothing that matches.
   *
   * @param formData - The current formData, if any, used to figure out a match
   * @param options - The list of options to find a matching options from
   * @param [discriminatorField] - The optional name of the field within the options object whose value is used to
   *          determine which option is selected
   * @returns - The firstindex of the matched option or 0 if none is available
   */
  getFirstMatchingOption(formData: T | undefined, options: S[], discriminatorField?: string): number;
  /** Reads the value at `path` within a schema, additionally retrieving `$ref`s as needed to resolve
   * schemas containing potentially nested `$ref`s.
   *
   * @param schema - The current node within the JSON schema recursion
   * @param path - The remaining keys in the path to the desired property
   * @param defaultValue - The value to return if a value is not found for the `pathList` path
   * @returns - The internal schema from the `schema` for the given `path` or the `defaultValue` if not found
   */
  getFromSchema(schema: S, path: SchemaFieldPath, defaultValue: T): T;
  getFromSchema(schema: S, path: SchemaFieldPath, defaultValue: S): S;
  getFromSchema(schema: S, path: SchemaFieldPath, defaultValue: T | S): S | T;
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
  /**
   * The function takes a `schema` and `formData` and returns a copy of the formData with any fields not defined in the schema removed.
   * This is useful for ensuring that only data that is relevant to the schema is preserved. Objects with `additionalProperties`
   * keyword set to `true` will not have their extra fields removed.
   *
   * @param schema - The schema to use for filtering the `formData`
   * @param [formData] - The formData to filter
   * @returns The new form data, with any fields not defined in the schema removed
   */
  omitExtraData(schema: S, formData?: T): T | undefined;
  /** Retrieves an expanded schema that has had all of its conditions, additional properties, references and
   * dependencies resolved and merged into the `schema` given a `rawFormData` that is used to do the potentially
   * recursive resolution.
   *
   * @param schema - The schema for which retrieving a schema is desired
   * @param [formData] - The current formData, if any, to assist retrieving a schema
   * @param [resolveAnyOfOrOneOfRefs] - Optional flag indicating whether to resolved refs in anyOf/oneOf lists
   * @returns - The schema having its conditions, additional properties, references and dependencies resolved
   */
  retrieveSchema(schema: S, formData?: T, resolveAnyOfOrOneOfRefs?: boolean): S;
  /** Returns an `ErrorSchema` holding a required error for every field marked `ui:required: true` (via
   * `ui:options.required` or its shorthand) in `uiSchema` whose value is missing from `formData`.
   *
   * @param uiSchema - The uiSchema to scan for `ui:required` fields
   * @param [formData] - The current formData, used to determine which `ui:required` fields are missing
   * @param [uiSchemaDefinitions] - Optional uiSchema fragments keyed by $ref path, resolved via `ui:definitions`
   * @param [globalUiOptions] - Optional global ui:options applied to every field
   * @param [formContext] - Optional formContext passed to the function form of `uiSchema.items`
   * @returns - An `ErrorSchema` with a required error for every missing `ui:required` field
   */
  getUiRequiredErrorSchema(
    uiSchema: UiSchema<T, S, F> | undefined,
    formData?: T,
    uiSchemaDefinitions?: UiSchemaDefinitions<T, S, F>,
    globalUiOptions?: GlobalUISchemaOptions,
    formContext?: F,
  ): ErrorSchema<T>;
  /** Sanitize the `data` associated with the `oldSchema` so it is considered appropriate for the `newSchema`. If the
   * new schema does not contain any properties, then `undefined` is returned to clear all the form data. Due to the
   * nature of schemas, this sanitization happens recursively for nested objects of data. Also, any properties in the
   * old schema that are non-existent in the new schema are set to `undefined`.
   *
   * @param [newSchema] - The new schema for which the data is being sanitized
   * @param [oldSchema] - The old schema from which the data originated
   * @param [data={}] - The form data associated with the schema, defaulting to an empty object when undefined
   * @returns - The new form data, with all of the fields uniquely associated with the old schema set
   *      to `undefined`. Will return `undefined` if the new schema is not an object containing properties.
   */
  sanitizeDataForNewSchema(newSchema?: S, oldSchema?: S, data?: any): T;
}
