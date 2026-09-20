import type { ElementType, ReactNode, Ref, RefObject, SubmitEvent } from 'react';
import { PureComponent, createRef } from 'react';
import type {
  CustomValidator,
  ErrorSchema,
  ErrorTransformer,
  FieldPath,
  FieldPathList,
  FormContextType,
  GenericObjectType,
  StrictRJSFSchema,
  Registry,
  RegistryFieldsType,
  RegistryWidgetsType,
  RJSFSchema,
  RJSFValidationError,
  SchemaUtilsType,
  TemplatesType,
  UiSchema,
  ValidationData,
  ValidatorType,
  DefaultFormStateBehavior,
  CustomMergeAllOf,
  NameGeneratorFunction,
} from '@rjsf/utils';
import {
  getByPath,
  setByPath,
  toPath,
  unsetByPath,
  createSchemaUtils,
  deepEquals,
  ErrorSchemaBuilder,
  getChangedFields,
  getTemplate,
  getUiOptions,
  hashObject,
  isObject,
  mergeObjects,
  replaceEqualDeep,
  schemaHasNestedConditional,
  SUBMIT_BTN_OPTIONS_KEY,
  toErrorList,
  fieldPathFromList,
  fieldPathToId,
  fieldPathToList,
  ROOT_FIELD_PATH,
  UI_GLOBAL_OPTIONS_KEY,
  UI_OPTIONS_KEY,
  validationDataMerge,
  ERRORS_KEY,
  ANY_OF_KEY,
  ONE_OF_KEY,
} from '@rjsf/utils';

import { buildRegistry } from '../Theme.ts';
import { ADDITIONAL_PROPERTY_KEY_REMOVE, IS_RESET } from './constants.ts';
import type { FormHandle } from './FormHandle.ts';
import type { IChangeEvent } from './IChangeEvent.ts';

/** The properties that are passed to the `Form` */
export interface FormProps<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any> {
  /** The JSON schema object for the form */
  schema: S;
  /** An implementation of the `ValidatorType` interface that is needed for form validation to work */
  validator: ValidatorType<T, S, F>;
  /** The optional children for the form, if provided, it will replace the default `SubmitButton` */
  children?: ReactNode;
  /** The uiSchema for the form */
  uiSchema?: UiSchema<T, S, F>;
  /** The data for the form, used to load a "controlled" form with its current data. If you want an "uncontrolled" form
   * with initial data, then use `initialFormData` instead.
   */
  formData?: T;
  /** The initial data for the form, used to fill an "uncontrolled" form with existing data on the initial render and
   * when `reset()` is called programmatically.
   */
  initialFormData?: T;
  // Form presentation and behavior modifiers
  /** You can provide a `formContext` object to the form, which is passed down to all fields and widgets. Useful for
   * implementing context aware fields and widgets.
   *
   * NOTE: Setting `{readonlyAsDisabled: false}` on the formContext will make the antd theme treat readOnly fields as
   * disabled.
   */
  formContext?: F;
  /** To avoid collisions with existing ids in the DOM, it is possible to change the prefix used for ids;
   * Default is `root`
   */
  idPrefix?: string;
  /** To avoid using a path separator that is present in field names, it is possible to change the separator used for
   * ids (Default is `_`)
   */
  idSeparator?: string;
  /** It's possible to disable the whole form by setting the `disabled` prop. The `disabled` prop is then forwarded down
   * to each field of the form. If you just want to disable some fields, see the `ui:disabled` parameter in `uiSchema`
   */
  disabled?: boolean;
  /** It's possible to make the whole form read-only by setting the `readonly` prop. The `readonly` prop is then
   * forwarded down to each field of the form. If you just want to make some fields read-only, see the `ui:readonly`
   * parameter in `uiSchema`
   */
  readonly?: boolean;
  // Form registry
  /** The dictionary of registered fields in the form */
  fields?: RegistryFieldsType<T, S, F>;
  /** The dictionary of registered templates in the form; Partial allows a subset to be provided beyond the defaults */
  templates?: Partial<Omit<TemplatesType<T, S, F>, 'ButtonTemplates'>> & {
    ButtonTemplates?: Partial<TemplatesType<T, S, F>['ButtonTemplates']>;
  };
  /** The dictionary of registered widgets in the form */
  widgets?: RegistryWidgetsType<T, S, F>;
  // Callbacks
  /** If you plan on being notified every time the form data are updated, you can pass an `onChange` handler, which will
   * receive the same args as `onSubmit` any time a value is updated in the form. Can also return the `id` of the field
   * that caused the change
   */
  onChange?: (data: IChangeEvent<T, S, F>, id?: string) => void;
  /** To react when submitted form data are invalid, pass an `onError` handler. It will be passed the list of
   * encountered errors
   */
  onError?: (errors: RJSFValidationError[]) => void;
  /** You can pass a function as the `onSubmit` prop of your `Form` component to listen to when the form is submitted
   * and its data are valid. It will be passed a result object having a `formData` attribute, which is the valid form
   * data you're usually after. The original event will also be passed as a second parameter
   */
  onSubmit?: (data: IChangeEvent<T, S, F>, event: SubmitEvent<HTMLFormElement>) => void;
  /** Sometimes you may want to trigger events or modify external state when a field has been touched, so you can pass
   * an `onBlur` handler, which will receive the id of the input that was blurred and the field value
   */
  onBlur?: (id: string, data: unknown) => void;
  /** Sometimes you may want to trigger events or modify external state when a field has been focused, so you can pass
   * an `onFocus` handler, which will receive the id of the input that is focused and the field value
   */
  onFocus?: (id: string, data: unknown) => void;
  /** The value of this prop will be passed to the `accept-charset` HTML attribute on the form */
  acceptCharset?: string;
  /** The value of this prop will be passed to the `action` HTML attribute on the form
   *
   * NOTE: this just renders the `action` attribute in the HTML markup. There is no real network request being sent to
   * this `action` on submit. Instead, react-jsonschema-form catches the submit event with `event.preventDefault()`
   * and then calls the `onSubmit` function, where you could send a request programmatically with `fetch` or similar.
   */
  action?: string;
  /** The value of this prop will be passed to the `autocomplete` HTML attribute on the form */
  autoComplete?: string;
  /** The value of this prop will be passed to the `class` HTML attribute on the form */
  className?: string;
  /** The value of this prop will be passed to the `enctype` HTML attribute on the form */
  enctype?: string;
  /** The value of this prop will be passed to the `id` HTML attribute on the form */
  id?: string;
  /** The value of this prop will be passed to the `name` HTML attribute on the form */
  name?: string;
  /** The value of this prop will be passed to the `method` HTML attribute on the form */
  method?: string;
  /** It's possible to change the default `form` tag name to a different HTML tag, which can be helpful if you are
   * nesting forms. However, native browser form behaviour, such as submitting when the `Enter` key is pressed, may no
   * longer work
   */
  tagName?: ElementType;
  /** The value of this prop will be passed to the `target` HTML attribute on the form */
  target?: string;
  // Errors and validation
  /** Formerly the `validate` prop; Takes a function that specifies custom validation rules for the form */
  customValidate?: CustomValidator<T, S, F>;
  /** This prop allows passing in custom errors that are augmented with the existing JSON Schema errors on the form; it
   * can be used to implement asynchronous validation. By default, these errors block form submission just like
   * JSON Schema errors do.
   */
  extraErrors?: ErrorSchema<T>;
  /** If set to true, treats `extraErrors` as warnings instead of blocking form submission */
  extraErrorsAreWarnings?: boolean;
  /** If set to true, turns off HTML5 validation on the form; Set to `false` by default */
  noHtml5Validate?: boolean;
  /** If set to true, turns off all validation. Set to `false` by default
   *
   * @deprecated - In a future release, this switch may be replaced by making `validator` prop optional
   */
  noValidate?: boolean;
  /** Flag that describes when live validation will be performed. Live validation means that the form will perform
   * validation and show any validation errors whenever the form data is updated, rather than just on submit.
   *
   * If no value is provided, then live validation will not happen. If `onChange` is provided for the flag, then live
   * validation will be performed after processing of all pending changes has completed. If `onBlur` is provided, then
   * live validation will be performed when a field that was updated is blurred (as a performance optimization).
   */
  liveValidate?: 'onChange' | 'onBlur';
  /** Flag that describes when live omit will be performed. Live omit happens only when `omitExtraData` is also set to
   * to `true` and the form's data is updated by the user.
   *
   * If no value is provided, then live omit will not happen. If `onChange` is provided for the flag, then live omit
   * will be performed after processing of all pending changes has completed. If `onBlur` is provided, then live omit
   * will be performed when a field that was updated is blurred (as a performance optimization).
   */
  liveOmit?: 'onChange' | 'onBlur';
  /** If set to true, then extra form data values that are not in any form field will be removed whenever `onSubmit` is
   * called. Set to `false` by default.
   */
  omitExtraData?: boolean;
  /** When this prop is set to `top` or 'bottom', a list of errors (or the custom error list defined in the `ErrorList`) will also
   * show. When set to false, only inline input validation errors will be shown. Set to `top` by default
   */
  showErrorList?: false | 'top' | 'bottom';
  /** A function can be passed to this prop in order to make modifications to the default errors resulting from JSON
   * Schema validation
   */
  transformErrors?: ErrorTransformer<T, S, F>;
  /** If set to true, then the first field with an error will receive the focus when the form is submitted with errors
   */
  focusOnFirstError?: boolean | ((error: RJSFValidationError) => void);
  /** Optional string translation function, if provided, allows users to change the translation of the RJSF internal
   * strings. Some strings contain replaceable parameter values as indicated by `%1`, `%2`, etc. The number after the
   * `%` indicates the order of the parameter. The ordering of parameters is important because some languages may choose
   * to put the second parameter before the first in its translation.
   */
  translateString?: Registry['translateString'];
  /** Optional function to generate custom HTML `name` attributes for form fields.
   */
  nameGenerator?: NameGeneratorFunction;
  /** Optional flag that, when set to true, will cause the `FallbackField` to render a type selector for unsupported
   * fields instead of the default UnsupportedField error UI.
   */
  useFallbackUiForUnsupportedType?: boolean;
  /** Optional configuration object with flags, if provided, allows users to override default form state behavior
   * Currently only affecting minItems on array fields and handling of setting defaults based on the value of
   * `emptyObjectFields`
   */
  defaultFormStateBehavior?: DefaultFormStateBehavior;
  /** Optional function that allows for custom merging of `allOf` schemas
   */
  customMergeAllOf?: CustomMergeAllOf<S>;
  /** Support receiving a React ref to the Form. Type it as the `Form` class, but write against `FormHandle`: only the
   * handle's members are supported API. TSX types a class element's `ref` by the instance, so this cannot be
   * `Ref<FormHandle>` until `Form` is a function component; `ref.current` assigns to a `FormHandle` today.
   */
  ref?: Ref<Form<T, S, F>>;
}

/** The data that is contained within the state for the `Form` */
export interface FormState<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any> {
  /** The JSON schema object for the form */
  schema: S;
  /** The uiSchema for the form */
  uiSchema: UiSchema<T, S, F>;
  /** The schemaUtils implementation used by the `Form`, created from the `validator` and the `schema` */
  schemaUtils: SchemaUtilsType<T, S, F>;
  /** The current data for the form, computed from the `formData` prop and the changes made by the user */
  formData?: T;
  /** Flag indicating whether the form is in edit mode, true when `formData` is passed to the form, otherwise false */
  edit: boolean;
  /** The current list of errors for the form, includes `extraErrors` */
  errors: RJSFValidationError[];
  /** The current errors, in `ErrorSchema` format, for the form, includes `extraErrors` */
  errorSchema: ErrorSchema<T>;
  // Private
  /** The current list of errors for the form directly from schema validation, does NOT include `extraErrors` */
  schemaValidationErrors: RJSFValidationError[];
  /** The current errors, in `ErrorSchema` format, for the form directly from schema validation, does NOT include
   * `extraErrors`
   */
  schemaValidationErrorSchema: ErrorSchema<T>;
  /** A container used to handle custom errors provided via `onChange` */
  customErrors?: ErrorSchemaBuilder<T>;
  /** The result of `schemaUtils.retrieveSchema(schema, formData)` for the state's data, kept so the edit path and
   * live validation do not resolve it again
   */
  retrievedSchema: S;
  /** @description result of schemaHasNestedConditional(rootSchema, rootSchema). A memoized value, recomputed only
   * when `schemaUtils` (and thus the root schema) is rebuilt, to avoid re-walking the whole schema on every
   * derivation
   */
  hasNestedConditionalSchema: boolean;
  /** Flag indicating whether the initial form defaults have been generated */
  initialDefaultsGenerated: boolean;
  /** The registry (re)computed only when props changed */
  registry: Registry<T, S, F>;
  /** Tracks the previous `extraErrors` prop reference so that `getDerivedStateFromProps` can detect changes */
  prevExtraErrors?: ErrorSchema<T>;
}

/** Converts the full `FormState` into the `IChangeEvent` version by picking out the public values
 *
 * @param state - The state of the form
 * @param status - The status provided by the onSubmit
 * @returns - The `IChangeEvent` for the state
 */
function toIChangeEvent<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  state: FormState<T, S, F>,
  status?: IChangeEvent['status'],
): IChangeEvent<T, S, F> {
  const { schema, uiSchema, schemaUtils, formData, edit, errors, errorSchema } = state;
  return {
    schema,
    uiSchema,
    schemaUtils,
    formData,
    edit,
    errors,
    errorSchema,
    ...(status !== undefined && { status }),
  };
}

/** The definition of a pending change that will be processed in the `onChange` handler
 */
interface PendingChange<T> {
  /** The `FieldPath` into the formData/errorSchema at which the `newValue`/`newErrorSchema` will be set */
  fieldPath: FieldPath;
  /** The new value to set into the formData */
  newValue?: T;
  /** The new errors to be set into the errorSchema, if any */
  newErrorSchema?: ErrorSchema<T>;
  /** The optional id of the field for which the change is being made */
  id?: string;
}

/** The props state derives from whose values may hold functions or class instances, which `deepEquals()` treats as
 * equal. These are compared with functions by identity, so a changed callback or template re-derives state and one
 * recreated on every render re-derives it on every render; wrap those in `useCallback` or hoist them. Data-only props
 * are caught by the deep comparison of all props.
 */
const IDENTITY_PROP_KEYS = [
  'schema',
  'validator',
  'uiSchema',
  'customMergeAllOf',
  'customValidate',
  'transformErrors',
  'fields',
  'templates',
  'widgets',
  'formContext',
  'translateString',
  'nameGenerator',
] as const satisfies readonly (keyof FormProps)[];

/** The identity props that take part in validation. Only a change to one of these re-validates unchanged data: a
 * fresh `formContext` or `widgets` has nothing to say about the data's validity, and validating on it would show
 * errors on fields the user never touched whenever the parent re-renders.
 */
const VALIDATION_PROP_KEYS: ReadonlySet<(typeof IDENTITY_PROP_KEYS)[number]> = new Set([
  'schema',
  'validator',
  'customMergeAllOf',
  'customValidate',
  'transformErrors',
]);

/** The part of the state that rendering derives from the props and the data alone: the schema utilities, the root and
 * resolved schemas, the uiSchema and the registry. Error and edit bookkeeping is the rest of `FormState`.
 */
type RenderContext<T, S extends StrictRJSFSchema, F extends FormContextType> = Pick<
  FormState<T, S, F>,
  'schemaUtils' | 'schema' | 'uiSchema' | 'retrievedSchema' | 'hasNestedConditionalSchema' | 'registry'
>;

/** Keeps the previous `schemaUtils` unless the props it was built from changed, in which case both it and the
 * nested-conditional flag, a pure function of its root schema, are rebuilt.
 */
function resolveSchemaUtils<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  prev: Pick<RenderContext<T, S, F>, 'schemaUtils' | 'hasNestedConditionalSchema'> | undefined,
): Pick<RenderContext<T, S, F>, 'schemaUtils' | 'hasNestedConditionalSchema'> {
  const { schema, validator, defaultFormStateBehavior, customMergeAllOf } = props;
  if (prev && !prev.schemaUtils.doesSchemaUtilsDiffer(validator, schema, defaultFormStateBehavior, customMergeAllOf)) {
    return prev;
  }
  const schemaUtils = createSchemaUtils<T, S, F>(validator, schema, defaultFormStateBehavior, customMergeAllOf);
  // A `dependencies`/`if` branch switch nested inside an object property never changes the ROOT retrieved schema (only
  // the schema's own top-level `dependencies`/`if` get resolved into it), so comparing the retrieved schema to the
  // previous one can't detect it (#5250). `hasNestedConditionalSchema` lets sanitization run anyway when that's
  // possible. It's a pure function of the root schema, so it only needs to be recomputed when `schemaUtils` (and thus
  // the root schema) is rebuilt.
  const rootSchema = schemaUtils.getRootSchema();
  return { schemaUtils, hasNestedConditionalSchema: schemaHasNestedConditional(rootSchema, rootSchema) };
}

/** Derives the `RenderContext` for the given `props` and `formData`. The result is shared against `prev`, so a value
 * the parent rebuilt but did not change keeps the reference the fields already hold, functions included: a changed
 * template, widget or field is not mistaken for the old one, and the validator's compiled-schema cache and the
 * sanitize check, which compare the retrieved schema by reference, see the same object while it is unchanged.
 *
 * @param props - The current props
 * @param formData - The data the resolved schema is for
 * @param prev - The previous context, or the state holding one, whose references are retained where possible
 * @returns - The render context for the inputs
 */
function deriveRenderContext<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  formData: T | undefined,
  prev: RenderContext<T, S, F> | undefined,
): RenderContext<T, S, F> {
  const { uiSchema = {} } = props;
  const { schemaUtils, hasNestedConditionalSchema } = resolveSchemaUtils(props, prev);
  const rootSchema = schemaUtils.getRootSchema();
  return replaceEqualDeep(prev, {
    schemaUtils,
    schema: rootSchema,
    uiSchema,
    retrievedSchema: schemaUtils.retrieveSchema(rootSchema, formData),
    hasNestedConditionalSchema,
    registry: buildRegistry(props, rootSchema, schemaUtils),
  });
}

/** Merges any `extraErrors` or `customErrors` into the given `schemaValidation` object, returning the result
 *
 * @param schemaValidation - The `ValidationData` object into which additional errors are merged
 * @param [extraErrors] - The extra errors from the props
 * @param [customErrors] - The customErrors from custom components
 * @return - The `extraErrors` and `customErrors` merged into the `schemaValidation`
 */
function mergeErrors<T>(
  schemaValidation: ValidationData<T>,
  extraErrors?: FormProps['extraErrors'],
  customErrors?: ErrorSchemaBuilder,
): ValidationData<T> {
  let { errorSchema, errors } = schemaValidation;
  if (extraErrors) {
    const merged = validationDataMerge(schemaValidation, extraErrors);
    errorSchema = merged.errorSchema;
    errors = merged.errors;
  }
  if (customErrors) {
    const merged = validationDataMerge({ errors, errorSchema }, customErrors.ErrorSchema, true);
    errorSchema = merged.errorSchema;
    errors = merged.errors;
  }
  return { errors, errorSchema };
}

/** Validates the `formData` against the `schema` using the `schemaUtils` and the validation props, returning the
 * results.
 *
 * @param props - The props holding `customValidate`, `transformErrors`, `uiSchema` and `formContext`
 * @param schemaUtils - The schemaUtils whose validator runs
 * @param schema - The schema used to validate against
 * @param formData - The form data to validate
 * @param [retrievedSchema] - An optionally pre-resolved schema to validate against instead of `schema`
 */
function validateFormData<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  schemaUtils: SchemaUtilsType<T, S, F>,
  schema: S,
  formData: T | undefined,
  retrievedSchema?: S,
): ValidationData<T> {
  const { customValidate, transformErrors, uiSchema } = props;
  // When a pre-resolved schema is provided (e.g., from live validation), use it directly.
  // Otherwise validate against the original schema so AJV sees the full constraint set.
  const validationSchema = retrievedSchema ?? schema;
  // JSON.stringify drops keys with `undefined` values; JSON.parse on the result gives AJV a clean
  // object that avoids spurious type errors for `type: "string"` fields that were cleared (#4518).
  const validationFormData = formData ? JSON.parse(JSON.stringify(formData)) : undefined;

  const schemaValidation = schemaUtils
    .getValidator()
    .validateFormData(validationFormData, validationSchema, customValidate, transformErrors, uiSchema);
  // ui:required only exists in the uiSchema, so it is enforced here rather than by rewriting the schema the
  // validator sees: that keeps the submit and live paths, precompiled validators and AJV error paths unchanged.
  const uiRequiredErrorSchema = schemaUtils.getUiRequiredErrorSchema(
    uiSchema,
    formData,
    undefined,
    uiSchema?.[UI_GLOBAL_OPTIONS_KEY],
    // Matches the registry's own normalization (see `buildRegistry()` in Theme.ts), so a function-form
    // `uiSchema.items` sees the same `formContext` here as it does while rendering, instead of `undefined` when
    // the prop is unset.
    props.formContext ?? ({} as F),
  );
  if (Object.keys(uiRequiredErrorSchema).length === 0) {
    // validationDataMerge() isn't a no-op for an empty-but-truthy additional errorSchema: when `schemaValidation`
    // has message-less errors (e.g. from a `transformErrors` that clears `message`), its own `errorSchema` can have
    // fewer keys than its `errors` list (`toErrorSchema()` only adds entries with a truthy message), so merging in
    // `{}` would silently drop those entries from `errors` instead of returning `schemaValidation` unchanged.
    return schemaValidation;
  }
  return validationDataMerge<T>(schemaValidation, uiRequiredErrorSchema);
}

/** Performs live validation and then returns the errors and error schemas with `extraErrors` and `customErrors`
 * merged in, alongside the validator's own results.
 *
 *
 * @param props - The current props
 * @param schemaUtils - The `SchemaUtilsType` whose validator runs
 * @param rootSchema - The root schema
 * @param formData - The form data to validate
 * @param [customErrors] - The customErrors from custom components
 * @param [retrievedSchema] - An optionally pre-resolved schema to validate against
 * @returns - An object containing `errorSchema`, `errors`, `schemaValidationErrors` and `schemaValidationErrorSchema`
 */
function runLiveValidation<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  schemaUtils: SchemaUtilsType<T, S, F>,
  rootSchema: S,
  formData: T | undefined,
  customErrors?: ErrorSchemaBuilder<T>,
  retrievedSchema?: S,
) {
  const schemaValidation = validateFormData(props, schemaUtils, rootSchema, formData, retrievedSchema);
  const { errors: schemaValidationErrors, errorSchema: schemaValidationErrorSchema } = schemaValidation;
  const mergedErrors = mergeErrors<T>(schemaValidation, props.extraErrors, customErrors);
  return { ...mergedErrors, schemaValidationErrors, schemaValidationErrorSchema };
}

/** How one derivation pass differs from the default, which computes defaults for the data and validates it */
interface DeriveOptions {
  /** The schema changed, so the existing errors describe another schema and are dropped */
  isSchemaChanged?: boolean;
  /** Returns the path of each `formData` field that changed; called only when live validation is not going to run,
   * which is when those paths are needed to clear the fields' errors
   */
  getFormDataChangedFields?: () => string[];
  /** Skip live validation, because the caller runs it itself or this pass must not show errors yet */
  skipLiveValidate?: boolean;
  /** Attempt to sanitize the data for a retrieved schema that changed */
  shouldSanitize?: boolean;
  /** This pass originated from `reset()` and computes defaults the same way an initial render does, even though the
   * instance has generated defaults before. Determined explicitly rather than inferred from `inputFormData ===
   * IS_RESET`, since `reset()` doesn't always pass that sentinel (e.g. when the caller provided an explicit
   * `initialFormData`/`formData`).
   */
  isReset?: boolean;
}

/** Derives the next state from `current` and `inputFormData`. The data first gets any missing required defaults and
 * is sanitized for its resolved schema when asked; the render context is derived for the result; then the data is run
 * through validation IF required by the props and options.
 *
 * @param current - The state the pass starts from; `undefined` on construction
 * @param inputFormData - The new or current data for the `Form`, or `IS_RESET` to start from nothing
 * @param options - How this pass differs from the default
 * @param props - The current props
 * @returns - The new state for the `Form`
 */
function deriveFormState<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F> | undefined,
  inputFormData: T | typeof IS_RESET | undefined,
  options: DeriveOptions,
  props: FormProps<T, S, F>,
): FormState<T, S, F> {
  const {
    isSchemaChanged = false,
    getFormDataChangedFields = () => [],
    skipLiveValidate = false,
    shouldSanitize = false,
    isReset = false,
  } = options;
  const { uiSchema = {}, liveValidate } = props;
  const isUncontrolled = props.formData === undefined;
  const edit = inputFormData !== undefined;
  // `'onBlur'` owns its validation pass in `onBlur()`; deriving state must not run one for it, or the errors show
  // up before the field the user is editing has been left
  // oxlint-disable-next-line typescript/no-deprecated
  const mustValidate = edit && !props.noValidate && liveValidate === 'onChange';
  const { schemaUtils } = resolveSchemaUtils(props, current);
  const rootSchema = schemaUtils.getRootSchema();

  // An uncontrolled form with no new data keeps its own; a reset starts from nothing
  let defaultsFormData: T | undefined;
  if (inputFormData === IS_RESET) {
    defaultsFormData = undefined;
  } else if (inputFormData === undefined && isUncontrolled) {
    defaultsFormData = current?.formData;
  } else {
    defaultsFormData = inputFormData;
  }
  // The data is shared against the committed data when there is some, so an unchanged subtree keeps the reference the
  // fields hold; on construction, against the caller's own value
  const shareBase = current ? current.formData : defaultsFormData;
  // A reset re-runs the same "initial" defaults pass a first render does, so `ui:initialValue` applies again even
  // though this instance has generated defaults before.
  const initialDefaultsGenerated = (current?.initialDefaultsGenerated ?? false) && !isReset;
  let formData: T;
  let renderContext: RenderContext<T, S, F>;
  let wasSanitized = false;
  const preventInfiniteSanitize: string[] = [];
  do {
    formData = replaceEqualDeep(
      shareBase,
      schemaUtils.getDefaultFormState(rootSchema, defaultsFormData, false, initialDefaultsGenerated, uiSchema) as T,
    );
    // Only hash when sanitizing, wrapping `formData` in an object to deal with a scalar/undefined value
    const formHash = shouldSanitize ? hashObject({ formData }) : '';
    renderContext = deriveRenderContext(props, formData, current);
    const { retrievedSchema } = renderContext;
    if (
      shouldSanitize &&
      !preventInfiniteSanitize.includes(formHash) &&
      (renderContext.hasNestedConditionalSchema || retrievedSchema !== current?.retrievedSchema)
    ) {
      // Sanitize the form data if shouldSanitize is true, we haven't already processed this same formData AND
      // either the retrieved schema changed or the schema has a nested conditional that the check above can't see
      const sanitizedFormData = replaceEqualDeep(
        formData,
        schemaUtils.sanitizeDataForNewSchema(retrievedSchema, current?.retrievedSchema, formData),
      );
      wasSanitized = sanitizedFormData !== formData;
      if (wasSanitized) {
        // Update both the formData AND defaultsFormData due to the sanitize so the loop works with the new data
        formData = sanitizedFormData;
        defaultsFormData = sanitizedFormData;
        const sanitizedFormHash = hashObject({ formData: sanitizedFormData });
        // If we've seen the sanitized data before, we are done
        wasSanitized = !preventInfiniteSanitize.includes(sanitizedFormHash);
        preventInfiniteSanitize.push(sanitizedFormHash);
      }
      preventInfiniteSanitize.push(formHash);
    } else {
      wasSanitized = false;
    }
  } while (wasSanitized);

  const getCurrentErrors = (): ValidationData<T> => {
    // If the `props.noValidate` option is set or the schema has changed, we reset the error state.
    // oxlint-disable-next-line typescript/no-deprecated
    if (props.noValidate || isSchemaChanged) {
      return { errors: [], errorSchema: {} };
    }
    // `extraErrors` and `customErrors` are merged in below, so the base has to be the validator's own result;
    // `state.errors` already carries them and would merge each in a second time
    return {
      errors: current?.schemaValidationErrors || [],
      errorSchema: current?.schemaValidationErrorSchema || {},
    };
  };

  let errors: RJSFValidationError[];
  let errorSchema: ErrorSchema<T> | undefined;
  let schemaValidationErrors = current?.schemaValidationErrors;
  let schemaValidationErrorSchema = current?.schemaValidationErrorSchema;
  // If we are skipping live validate, it means that the state has already been updated with live validation errors
  if (mustValidate && !skipLiveValidate) {
    const liveValidation = runLiveValidation(
      props,
      schemaUtils,
      rootSchema,
      formData,
      current?.customErrors,
      renderContext.retrievedSchema,
    );
    errors = liveValidation.errors;
    errorSchema = liveValidation.errorSchema;
    schemaValidationErrors = liveValidation.schemaValidationErrors;
    schemaValidationErrorSchema = liveValidation.schemaValidationErrorSchema;
  } else {
    const currentErrors = getCurrentErrors();
    errors = currentErrors.errors;
    errorSchema = currentErrors.errorSchema;
    // We only update the error schema for changed fields if mustValidate is false
    if (!mustValidate) {
      const formDataChangedFields = getFormDataChangedFields();
      if (formDataChangedFields.length > 0) {
        // `formDataChangedFields` carries the path of each field that changed, so clearing has to follow that path
        // instead of dropping the whole branch it starts in. The path is split with `toPath()`, the same way
        // `toErrorSchema()` splits a validation error property, so the two address the same entry. Intermediate
        // objects are forced so the numeric segment of an array item stays an object key, which is how an
        // `ErrorSchema` addresses array items.
        const newErrorSchema = formDataChangedFields.reduce<GenericObjectType>((acc, path) => {
          const pathOfField = toPath(path);
          // Every container holding the field changed along with it, so an error of their own, such as the
          // `uniqueItems` of the array the field sits in, is cleared too. Only their own errors go: the other
          // fields they hold did not change and keep theirs.
          for (let i = 1; i < pathOfField.length; i++) {
            setByPath(acc, [...pathOfField.slice(0, i), ERRORS_KEY], undefined, true);
          }
          return setByPath(acc, pathOfField, undefined, true);
        }, {});
        schemaValidationErrorSchema = mergeObjects(
          currentErrors.errorSchema,
          newErrorSchema,
          'preventDuplicates',
        ) as ErrorSchema<T>;
        errorSchema = schemaValidationErrorSchema;
      }
    }
    const mergedErrors = mergeErrors<T>({ errorSchema, errors }, props.extraErrors, current?.customErrors);
    errors = mergedErrors.errors;
    errorSchema = mergedErrors.errorSchema;
  }

  return {
    ...renderContext,
    formData,
    edit,
    errors,
    errorSchema,
    schemaValidationErrors: schemaValidationErrors ?? [],
    schemaValidationErrorSchema: schemaValidationErrorSchema ?? {},
    initialDefaultsGenerated: true,
  };
}

/** Applies one `change` to `current`, returning the next state. The `newValue` is set at the change's path in the
 * data, which is then run through `deriveFormState()` for any missing defaults and, when the resolved schema changed,
 * sanitization. If `omitExtraData` and `liveOmit` are turned on, the data is filtered to remove any extra data not in
 * a form field. The change's `newErrorSchema`, if any, either updates an existing validation error at its path or
 * becomes a custom error; then the data is validated if required. Reads nothing but its arguments and performs no
 * callbacks: committing the result and notifying are the caller's, which is what lets one pipeline serve a form that
 * owns its data and one whose parent does.
 *
 * @param current - The state the change applies to
 * @param change - The change to apply
 * @param props - The current props
 * @param deferLiveValidate - Whether live validation waits for a later queued change; it runs once, for the last one
 * @returns - The next state, sharing every unchanged subtree with `current`
 */
function applyChange<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  change: PendingChange<T>,
  props: FormProps<T, S, F>,
  deferLiveValidate: boolean,
): FormState<T, S, F> {
  const { newValue, fieldPath, newErrorSchema } = change;
  // The single place where a `FieldPath` is parsed back into segments for writing into the formData
  const path = fieldPathToList(fieldPath);
  // oxlint-disable-next-line typescript/no-deprecated
  const { extraErrors, omitExtraData, liveOmit, noValidate, liveValidate, disabled, readonly } = props;
  const { formData: oldFormData, schemaUtils, schema, schemaValidationErrorSchema, errors } = current;
  let { customErrors, retrievedSchema } = current;
  // Use the un-merged AJV-only schema as the base for re-merging extraErrors. Mirrors the
  // pattern in deriveFormState/getDerivedStateFromProps and avoids the duplication that
  // happened when state.errorSchema (already containing merged extraErrors) was passed in.
  let mergeBaseErrorSchema: ErrorSchema<T> = schemaValidationErrorSchema;
  const isRootPath = path.length === 0;
  let formData = isRootPath ? newValue : structuredClone(oldFormData);

  // When switching from null to an object option in oneOf, MultiSchemaField sends
  // an object with property names but undefined values (e.g., {types: undefined, content: undefined}).
  // In this case, pass undefined to deriveFormState to trigger fresh default computation.
  // Only do this when the previous formData was null/undefined (switching FROM null).
  const hasOnlyUndefinedValues =
    isObject(formData) &&
    Object.keys(formData as object).length > 0 &&
    Object.values(formData as object).every((v) => v === undefined);
  const wasPreviouslyNull = oldFormData === null || oldFormData === undefined;
  const inputForDefaults = hasOnlyUndefinedValues && wasPreviouslyNull ? undefined : formData;

  if (isObject(formData) || Array.isArray(formData)) {
    // Tracks if the user cleared a plain (non-oneOf/anyOf) leaf field.
    // The key is removed twice: once before deriveFormState so inputForDefaults
    // reflects an empty field for conditional schema resolution, and once after so
    // the user's clear overrides any schema default deriveFormState re-applied (#5125)
    // and AJV never receives { key: undefined } for type:"string" fields (#4518).
    let plainLeafWasCleared = false;

    if (newValue === ADDITIONAL_PROPERTY_KEY_REMOVE) {
      // For additional properties, this key was explicitly removed, so unset it
      unsetByPath(formData, path);
    } else if (!isRootPath) {
      // Set the new value at its path in the form data.
      let valueForPath: T | null | undefined = newValue;

      if (newValue === undefined) {
        const lastSegment = path[path.length - 1];
        if (typeof lastSegment === 'number') {
          // Array items: match ArrayField `handleChange` — AJV needs `null`, not undefined.
          valueForPath = null;
        } else {
          const { field: leaf } = schemaUtils.findFieldInSchema(schema, path, oldFormData);
          const isOneOfOrAnyOfLeaf = leaf && (ONE_OF_KEY in leaf || ANY_OF_KEY in leaf);
          // oneOf/anyOf and unresolved leaves keep `undefined` so mergeDefaults doesn't
          // re-apply a branch default when the user clears the widget.
          // Plain resolved leaves use plainLeafWasCleared instead (see below).
          if (!isOneOfOrAnyOfLeaf && leaf !== undefined) {
            plainLeafWasCleared = true;
          }
        }
      }

      if (plainLeafWasCleared) {
        setByPath(formData, path, undefined);
      } else {
        setByPath(formData, path, valueForPath);
      }
    }
    const shouldSanitize =
      retrievedSchema !== undefined &&
      !isRootPath &&
      !isObject(newValue) &&
      !Array.isArray(newValue) &&
      !disabled &&
      !readonly;
    // Skip live validation here; it runs later in this function.
    const newState = deriveFormState(current, inputForDefaults, { skipLiveValidate: true, shouldSanitize }, props);
    formData = newState.formData;
    retrievedSchema = newState.retrievedSchema;

    // Re-set to undefined after merging defaults so the user's clear is preserved in
    // state (#5125 regression: without this, clearing a second field re-applies the
    // default to previously-cleared fields). The undefined key is stripped from the
    // formData copy passed to AJV via JSON.parse(JSON.stringify(...)) so the validator never
    // sees { [key]: undefined } for type:"string" or patternProperties fields (#4518).
    if (plainLeafWasCleared && formData) {
      // `replaceEqualDeep()` may have handed this object straight back from the committed state, so the clear lands
      // on a copy rather than in place
      formData = setByPath((Array.isArray(formData) ? [...formData] : { ...formData }) as T, path, undefined);
    }
  }

  const mustValidate = !noValidate && liveValidate === 'onChange';
  let newFormData = formData;

  if (omitExtraData === true && liveOmit === 'onChange') {
    newFormData = schemaUtils.omitExtraData(schema, formData);
  }

  if (newErrorSchema) {
    // First check to see if there is an existing validation error on this path...
    const oldValidationError = !isRootPath ? getByPath(schemaValidationErrorSchema, path) : schemaValidationErrorSchema;
    // If there is an old validation error for this path, assume we are updating it directly
    if (oldValidationError && Object.keys(oldValidationError).length > 0) {
      // Apply the user-supplied newErrorSchema onto a clone of the AJV-only base, so that
      // mergeErrors below sees the user's error at this path without mutating shared state.
      if (!isRootPath) {
        mergeBaseErrorSchema = structuredClone(schemaValidationErrorSchema);
        // An `ErrorSchema` nests plain objects even at numeric segments, so never auto-vivify arrays
        setByPath(mergeBaseErrorSchema, path, newErrorSchema, true);
      } else {
        mergeBaseErrorSchema = newErrorSchema;
      }
    } else {
      // The committed builder is left as it is; the edit lands on a copy, which the constructor clones
      customErrors = new ErrorSchemaBuilder<T>(customErrors?.ErrorSchema);
      if (isRootPath) {
        const pathErrors = newErrorSchema[ERRORS_KEY];
        if (pathErrors) {
          // only set errors when there are some
          customErrors.setErrors(pathErrors);
        }
      } else {
        // An `ErrorSchema` nests plain objects even at numeric segments, so never auto-vivify arrays
        setByPath(customErrors.ErrorSchema, path, newErrorSchema, true);
      }
    }
  }
  let clearedCustomError = false;
  if (!newErrorSchema && customErrors && getByPath(customErrors.ErrorSchema, [...path, ERRORS_KEY])) {
    // If we have custom errors and the path has an error, then we need to clear it
    customErrors = new ErrorSchemaBuilder<T>(customErrors.ErrorSchema).clearErrors(path);
    clearedCustomError = true;
  }
  let next: Partial<FormState<T, S, F>> = { formData: newFormData, retrievedSchema, customErrors };
  if (mustValidate && !deferLiveValidate) {
    const liveValidation = runLiveValidation(props, schemaUtils, schema, newFormData, customErrors, retrievedSchema);
    next = { ...next, ...liveValidation };
  } else if (!noValidate && newErrorSchema) {
    // Merging 'newErrorSchema' into 'errorSchema' to display the custom raised errors.
    const mergedErrors = mergeErrors<T>({ errorSchema: mergeBaseErrorSchema, errors }, extraErrors, customErrors);
    next = { ...next, ...mergedErrors };
  } else if (clearedCustomError) {
    // The displayed errors are rebuilt from the validator's own result so the cleared one leaves both the field and
    // the error list; the committed `errorSchema` used to alias the builder's and lose the entry by mutation
    const mergedErrors = mergeErrors<T>(
      { errorSchema: schemaValidationErrorSchema, errors: current.schemaValidationErrors },
      extraErrors,
      customErrors,
    );
    next = { ...next, ...mergedErrors };
  }
  return replaceEqualDeep(current, { ...current, ...next });
}

/** The `Form` component renders the outer form and all the fields defined in the `schema` */
export default class Form<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>
  extends PureComponent<FormProps<T, S, F>, FormState<T, S, F>>
  implements FormHandle<T, S, F>
{
  /** The ref used to hold the rendered form element. `tagName` can swap `<form>` for another element, so the
   * form-only members are reached behind an `instanceof` narrowing rather than assumed present.
   */
  formElement: RefObject<HTMLElement | null>;

  /** The list of pending changes
   */
  pendingChanges: PendingChange<T>[] = [];

  /** `setState` sharing every unchanged subtree of `state` with the current state, so fields' memo boundaries hold
   * across the update. The updater form keeps it correct under batching.
   */
  private setSharedState<K extends keyof FormState<T, S, F>>(
    state: Pick<FormState<T, S, F>, K>,
    callback?: () => void,
  ) {
    this.setState((prevState) => replaceEqualDeep(prevState, state), callback);
  }

  /** Flag to track when we're processing a user-initiated field change.
   * This prevents componentDidUpdate from reverting oneOf/anyOf option switches.
   */
  private isProcessingUserChange = false;

  /** When the `extraErrors` prop changes, re-merges `schemaValidationErrors` + `extraErrors` + `customErrors` into
   * state before render, ensuring the updated errors are visible immediately in a single render cycle.
   *
   * @param props - The current props
   * @param state - The current state
   * @returns Partial state with re-merged errors if `extraErrors` changed, or `null` if no update is needed
   */
  static getDerivedStateFromProps<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
    props: FormProps<T, S, F>,
    state: FormState<T, S, F>,
  ): Partial<FormState<T, S, F>> | null {
    if (props.extraErrors !== state.prevExtraErrors) {
      const baseErrors: ValidationData<T> = {
        errors: state.schemaValidationErrors || [],
        errorSchema: state.schemaValidationErrorSchema || {},
      };
      let { errors, errorSchema } = baseErrors;
      if (props.extraErrors) {
        ({ errors, errorSchema } = validationDataMerge<T>(baseErrors, props.extraErrors));
      }
      if (state.customErrors) {
        ({ errors, errorSchema } = validationDataMerge<T>(
          { errors, errorSchema },
          state.customErrors.ErrorSchema,
          true,
        ));
      }
      return { prevExtraErrors: props.extraErrors, errors, errorSchema };
    }
    return null;
  }

  /** Constructs the `Form` from the `props`. Will setup the initial state from the props. It will also call the
   * `onChange` handler if the initially provided `formData` is modified to add missing default values as part of the
   * state construction.
   *
   * @param props - The initial props for the `Form`
   */
  constructor(props: FormProps<T, S, F>) {
    super(props);

    if (!props.validator) {
      throw new Error('A validator is required for Form functionality to work');
    }

    const { formData: propsFormData, initialFormData, onChange } = props;
    const formData = propsFormData ?? initialFormData;
    this.state = {
      ...deriveFormState(undefined, formData, { skipLiveValidate: true }, props),
      prevExtraErrors: props.extraErrors,
    };
    if (onChange && this.state.formData !== formData) {
      onChange(toIChangeEvent(this.state));
    }
    this.formElement = createRef();
  }

  /**
   * `getSnapshotBeforeUpdate` is a React lifecycle method that is invoked right before the most recently rendered
   * output is committed to the DOM. It enables your component to capture current values (e.g., scroll position) before
   * they are potentially changed.
   *
   * Here it checks whether any prop changed and, if so, derives the next state for
   * `componentDidUpdate` to commit, flagging `shouldUpdate` only when that state differs from the previous one.
   *
   * @param prevProps - The previous set of props before the update.
   * @param prevState - The previous state before the update.
   * @returns Either an object containing the next state and a flag indicating that an update should occur, or an object
   *        with a flag indicating that an update is not necessary.
   */
  getSnapshotBeforeUpdate(
    prevProps: FormProps<T, S, F>,
    prevState: FormState<T, S, F>,
  ): { nextState: FormState<T, S, F>; shouldUpdate: true } | { shouldUpdate: false } {
    // A state-only update hands over the same props object
    if (this.props === prevProps) {
      return { shouldUpdate: false };
    }
    // `replaceEqualDeep()` hands back `prev` exactly when the values are deep-equal with functions by identity
    let isIdentityPropChanged = false;
    let isValidationPropChanged = false;
    let isSchemaChanged = false;
    for (const key of IDENTITY_PROP_KEYS) {
      if (replaceEqualDeep(prevProps[key], this.props[key]) !== prevProps[key]) {
        isIdentityPropChanged = true;
        isValidationPropChanged ||= VALIDATION_PROP_KEYS.has(key);
        isSchemaChanged ||= key === 'schema';
      }
    }
    // Any other prop change still re-derives state, which is what snaps a controlled form back to its `formData` prop
    if (!isIdentityPropChanged && deepEquals(this.props, prevProps)) {
      return { shouldUpdate: false };
    }
    // Shared against the state, so a prop echoing the state's own formData is that formData
    const formData = replaceEqualDeep(this.state.formData, this.props.formData);
    const isStateDataChanged = formData !== this.state.formData;
    // An accepting parent hands the proposal back as a prop; without sharing, the rebuilt state would re-render every
    // field. Only the derived keys are shared and later committed, so `customErrors` and `prevExtraErrors`, which
    // `deriveFormState()` never sets, are left to whatever React holds for them
    const nextState = replaceEqualDeep(
      prevState,
      deriveFormState(
        this.state,
        formData,
        {
          isSchemaChanged,
          // Only the error clearing needs the path of each changed field, and it runs only when live validation does
          // not, so the walk that produces them is left for `deriveFormState` to ask for
          getFormDataChangedFields: () => getChangedFields(formData, prevProps.formData, true),
          // Live validation is skipped only when neither the data nor anything that takes part in validating it
          // changed. A changed validation prop counts only in `onChange` mode: `onBlur` owes its errors to the blur,
          // not to the parent handing over a fresh callback
          skipLiveValidate: !isStateDataChanged && !(isValidationPropChanged && this.props.liveValidate === 'onChange'),
        },
        this.props,
      ),
    );
    const shouldUpdate = Object.entries(nextState).some(
      ([key, value]) => value !== prevState[key as keyof FormState<T, S, F>],
    );
    return { nextState, shouldUpdate };
  }

  /**
   * `componentDidUpdate` is a React lifecycle method that is invoked immediately after updating occurs. This method is
   * not called for the initial render.
   *
   * Here, it checks if an update is necessary based on the `shouldUpdate` flag received from `getSnapshotBeforeUpdate`.
   * If an update is required, it applies the next state and, if needed, triggers the `onChange` handler to inform about
   * changes.
   *
   * @param _ - The previous set of props.
   * @param prevState - The previous state of the component before the update.
   * @param snapshot - The value returned from `getSnapshotBeforeUpdate`.
   */
  componentDidUpdate(
    _: FormProps<T, S, F>,
    prevState: FormState<T, S, F>,
    snapshot: { nextState: FormState<T, S, F>; shouldUpdate: true } | { shouldUpdate: false },
  ) {
    if (snapshot.shouldUpdate) {
      const { nextState } = snapshot;

      // Prevent oneOf/anyOf option switches from reverting when deriveFormState
      // re-evaluates and produces stale formData.
      const nextStateDiffersFromProps = !deepEquals(nextState.formData, this.props.formData);
      const wasProcessingUserChange = this.isProcessingUserChange;
      this.isProcessingUserChange = false;

      if (wasProcessingUserChange && nextStateDiffersFromProps) {
        // Skip - the user's option switch is already applied via processPendingChange
        return;
      }

      if (nextStateDiffersFromProps && nextState.formData !== prevState.formData && this.props.onChange) {
        this.props.onChange(toIChangeEvent(nextState));
      }
      // oxlint-disable-next-line react/no-did-update-set-state -- guarded to prevent infinite loop
      this.setSharedState(nextState);
    }
  }

  /** Validates the `formData` against the `schema` using the `altSchemaUtils` (if provided otherwise it uses the
   * `schemaUtils` in the state), returning the results.
   *
   * @param formData - The new form data to validate
   * @param schema - The schema used to validate against
   * @param [altSchemaUtils] - The alternate schemaUtils to use for validation
   * @param [retrievedSchema] - An optionally retrieved schema for per
   */
  validate = (
    formData: T | undefined,
    schema = this.state.schema,
    altSchemaUtils?: SchemaUtilsType<T, S, F>,
    retrievedSchema?: S,
  ): ValidationData<T> =>
    validateFormData(this.props, altSchemaUtils || this.state.schemaUtils, schema, formData, retrievedSchema);

  /** Renders any errors contained in the `state` in using the `ErrorList`, if not disabled by `showErrorList`. */
  renderErrors(registry: Registry<T, S, F>) {
    const { errors, errorSchema, schema, uiSchema } = this.state;
    const options = getUiOptions<T, S, F>(uiSchema);
    const ErrorListTemplate = getTemplate<'ErrorListTemplate', T, S, F>('ErrorListTemplate', registry, options);

    if (errors?.length) {
      return (
        <ErrorListTemplate
          errors={errors}
          errorSchema={errorSchema || {}}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      );
    }
    return null;
  }

  /** Allows a user to set a value for the provided `fieldPath`, which must be either a dotted path to the field OR a
   * `FieldPathList`. To set the root element, used either `''` or `[]` for the path. Passing undefined will clear the
   * value in the field.
   *
   * The dotted form splits on `.` only, so it cannot express an array index as a number or a property name
   * containing a dot. Pass a `FieldPathList` for either — an item of an array wants the numeric index, since
   * that is what makes a cleared item resolve to `null` rather than `undefined`.
   *
   * @param fieldPath - Either a dotted path to the field or the `FieldPathList` to the field
   * @param [newValue] - The new value for the field
   */
  setFieldValue = (fieldPath: string | FieldPathList, newValue?: T) => {
    const { registry } = this.state;
    let path = fieldPath;
    if (typeof path === 'string') {
      // `''` is the documented spelling of the root; splitting it would name a property called `''` instead
      path = path === '' ? [] : path.split('.');
    }
    const targetFieldPath = fieldPathFromList(path);
    this.onChange(newValue, targetFieldPath, undefined, fieldPathToId(targetFieldPath, registry.globalFormOptions));
  };

  /** Pushes the given change information into the `pendingChanges` array and then calls `processPendingChanges()` if
   * the array only contains a single pending change.
   *
   * @param newValue - The new form data from a change to a field
   * @param fieldPath - The `FieldPath` of the change at which to set the formData
   * @param [newErrorSchema] - The new `ErrorSchema` based on the field change
   * @param [id] - The id of the field that caused the change
   */
  onChange = (newValue: T | undefined, fieldPath: FieldPath, newErrorSchema?: ErrorSchema<T>, id?: string) => {
    this.pendingChanges.push({ newValue, fieldPath, newErrorSchema, id });
    if (this.pendingChanges.length === 1) {
      this.processPendingChange();
    }
  };

  /** Function to handle changes made to a field in the `Form`. This handler applies the first change from the
   * `pendingChanges` list with `applyChange()`, commits the result and then, once React has committed it, calls the
   * `onChange` callback, if specified, with the updated state and calls `processPendingChange()` again for the next
   * change in the list.
   */
  processPendingChange() {
    if (this.pendingChanges.length === 0) {
      return;
    }
    // Mark that we're processing a user-initiated change.
    // This prevents componentDidUpdate from reverting oneOf/anyOf option switches.
    this.isProcessingUserChange = true;
    const change = this.pendingChanges[0];
    const { onChange } = this.props;
    // If there are pending changes in the queue, skip live validation since it will happen with the last change
    const next = applyChange(this.state, change, this.props, this.pendingChanges.length > 1);
    // Unchanged subtrees keep their state references, so sibling fields' memo boundaries hold across the change
    this.setSharedState(next, () => {
      if (onChange) {
        onChange(toIChangeEvent(this.state), change.id);
      }
      // Now remove the change we just completed and call this again
      this.pendingChanges.shift();
      this.processPendingChange();
    });
  }

  /** Filters the given `formData` down to only the elements described by the current `schema`, using the
   * `schemaUtils` from state.
   *
   * @param formData - The data for the `Form`
   * @returns The `formData` after omitting extra data
   */
  private omitFormExtraData(formData?: T): T | undefined {
    const { schema, schemaUtils } = this.state;
    return schemaUtils.omitExtraData(schema, formData);
  }

  /** Returns the form data currently rendered, see `FormHandle.getFormData()`. Until strict ownership lands this is the
   * reconciled internal value in both modes; afterwards it reads the owner directly.
   */
  getFormData = (): T | undefined => this.state.formData;

  /**
   * Callback function to handle reset form data.
   * - Reset all fields with default values.
   * - Reset validations and errors
   *
   */
  reset = () => {
    const { formData: propsFormData, initialFormData, onChange } = this.props;
    const newState = deriveFormState(
      this.state,
      propsFormData ?? (initialFormData === undefined ? IS_RESET : initialFormData),
      { skipLiveValidate: true, isReset: true },
      this.props,
    );
    const newFormData = newState.formData;
    this.setSharedState(
      {
        formData: newFormData,
        errorSchema: {},
        errors: [],
        schemaValidationErrors: [],
        schemaValidationErrorSchema: {},
        // Matches what this reset pass actually computed defaults with (see deriveFormState's `isReset` handling),
        // keeping the flag in sync with the formData it describes — otherwise the next unrelated recompute would
        // treat itself as an initial pass too and resurrect a `ui:initialValue` the user had since cleared.
        initialDefaultsGenerated: newState.initialDefaultsGenerated,
        customErrors: undefined,
      },
      () => onChange?.(toIChangeEvent(this.state)),
    );
  };

  /** Callback function to handle when a field on the form is blurred. Calls the `onBlur` callback for the `Form` if it
   * was provided. Also runs any live validation and/or live omit operations if the flags indicate they should happen
   * during `onBlur`.
   *
   * @param id - The unique `id` of the field that was blurred
   * @param data - The data associated with the field that was blurred
   */
  onBlur = (id: string, data: unknown) => {
    const { onBlur, omitExtraData, liveOmit, liveValidate } = this.props;
    if (onBlur) {
      onBlur(id, data);
    }
    if ((omitExtraData === true && liveOmit === 'onBlur') || liveValidate === 'onBlur') {
      const { onChange } = this.props;
      const { formData } = this.state;
      let newFormData: T | undefined = formData;
      let state: Partial<FormState<T, S, F>> = { formData: newFormData };
      if (omitExtraData === true && liveOmit === 'onBlur') {
        newFormData = this.omitFormExtraData(formData);
        state = { formData: newFormData };
      }
      if (liveValidate === 'onBlur') {
        const { schema, schemaUtils, customErrors, retrievedSchema } = this.state;
        const liveValidation = runLiveValidation(
          this.props,
          schemaUtils,
          schema,
          newFormData,
          customErrors,
          retrievedSchema,
        );
        state = { formData: newFormData, ...liveValidation, customErrors };
      }
      const committed = this.state;
      this.setSharedState(state as FormState<T, S, F>, () => {
        // `schemaValidationErrors` and `schemaValidationErrorSchema` are left out since they aren't IChangeEvent props
        const hasChanges = Object.keys(state).some(
          (key) =>
            !key.startsWith('schemaValidation') &&
            committed[key as keyof FormState<T, S, F>] !== this.state[key as keyof FormState<T, S, F>],
        );
        if (onChange && hasChanges) {
          onChange(toIChangeEvent(this.state), id);
        }
      });
    }
  };

  /** Callback function to handle when a field on the form is focused. Calls the `onFocus` callback for the `Form` if it
   * was provided.
   *
   * @param id - The unique `id` of the field that was focused
   * @param data - The data associated with the field that was focused
   */
  onFocus = (id: string, data: unknown) => {
    const { onFocus } = this.props;
    if (onFocus) {
      onFocus(id, data);
    }
  };

  /** Callback function to handle when the form is submitted. First, it prevents the default event behavior. Nothing
   * happens if the target and currentTarget of the event are not the same. It will omit any extra data in the
   * `formData` in the state if `omitExtraData` is true. It will validate the resulting `formData`, reporting errors
   * via the `onError()` callback unless validation is disabled. Finally, it will add in any `extraErrors` and then call
   * back the `onSubmit` callback if it was provided.
   *
   * @param event - The submit HTML form event
   */
  onSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (event.target !== event.currentTarget) {
      return;
    }

    event.persist();
    // oxlint-disable-next-line typescript/no-deprecated
    const { omitExtraData, extraErrors, noValidate, onSubmit } = this.props;
    let { formData: newFormData } = this.state;

    if (omitExtraData === true) {
      newFormData = this.omitFormExtraData(newFormData);
    }

    if (noValidate || this.validateFormWithFormData(newFormData)) {
      // There are no errors generated through schema validation.
      // Check for user provided errors and update state accordingly.
      const errorSchema = extraErrors || {};
      const errors = extraErrors ? toErrorList(extraErrors) : [];
      this.setSharedState(
        {
          formData: newFormData,
          errors,
          errorSchema,
          schemaValidationErrors: [],
          schemaValidationErrorSchema: {},
        },
        () => {
          if (onSubmit) {
            onSubmit(toIChangeEvent({ ...this.state, formData: newFormData }, 'submitted'), event);
          }
        },
      );
    }
  };

  /** Provides a function that can be used to programmatically submit the `Form` */
  submit = () => {
    const form = this.formElement.current;
    if (form) {
      const submitCustomEvent = new CustomEvent('submit', {
        cancelable: true,
      });
      submitCustomEvent.preventDefault();
      form.dispatchEvent(submitCustomEvent);
      if (form instanceof HTMLFormElement) {
        form.requestSubmit();
      }
    }
  };

  /** Attempts to focus on the field associated with the `error`. Uses the `property` field to compute path of the error
   * field, then, using the `idPrefix` and `idSeparator` converts that path into an id. Then the input element with that
   * id is attempted to be found using the `formElement` ref. If it is located, then it is focused.
   *
   * @param error - The error on which to focus
   */
  focusOnError = (error: RJSFValidationError) => {
    const { idPrefix = 'root', idSeparator = '_' } = this.props;
    const { property } = error;
    const path = toPath(property ?? '');
    // The id of the root element is the idPrefix, so prepend it to the path
    path.unshift(idPrefix);

    const elementId = path.join(idSeparator);
    const form = this.formElement.current;
    if (!form) {
      return;
    }
    const named = form instanceof HTMLFormElement ? form.elements.namedItem(elementId) : null;
    // if not an exact match, try finding a focusable element starting with the element id (like radio buttons or
    // checkboxes); some themes (e.g. shadcn) use button elements instead of native inputs for radio groups
    const found = named ?? form.querySelector(`input[id^="${elementId}"], button[id^="${elementId}"]`);
    const field = found instanceof RadioNodeList ? found.item(0) : found;
    if (field instanceof HTMLElement) {
      field.focus();
    }
  };

  /** Validates the form using the given `formData`. For use on form submission or on programmatic validation.
   * If `onError` is provided, then it will be called with the list of errors.
   *
   * @param formData - The form data to validate
   * @returns - True if the form is valid, false otherwise.
   */
  validateFormWithFormData = (formData?: T): boolean => {
    const { extraErrors, extraErrorsAreWarnings, focusOnFirstError, onError } = this.props;
    const { errors: prevErrors, customErrors } = this.state;
    const schemaValidation = this.validate(formData);
    // Always merge extraErrors/customErrors so they remain visible in state regardless of extraErrorsAreWarnings.
    const { errors, errorSchema } = mergeErrors<T>(schemaValidation, extraErrors, customErrors);
    // extraErrors also block unless extraErrorsAreWarnings is set, in which case they are informational only.
    const hasBlockingExtraErrors = !extraErrorsAreWarnings && !!extraErrors && toErrorList(extraErrors).length > 0;
    // customErrors are raised imperatively by field/widget components (via onChange's errorSchema argument) and,
    // like schema errors, always block regardless of extraErrorsAreWarnings.
    const hasCustomErrors = !!customErrors && toErrorList(customErrors.ErrorSchema).length > 0;
    const hasError = schemaValidation.errors.length > 0 || hasBlockingExtraErrors || hasCustomErrors;
    if (hasError) {
      if (focusOnFirstError) {
        if (typeof focusOnFirstError === 'function') {
          focusOnFirstError(errors[0]);
        } else {
          this.focusOnError(errors[0]);
        }
      }
      this.setSharedState(
        {
          errors,
          errorSchema,
          schemaValidationErrors: schemaValidation.errors,
          schemaValidationErrorSchema: schemaValidation.errorSchema,
        },
        () => {
          if (onError) {
            onError(errors);
          } else {
            // oxlint-disable-next-line no-console
            console.error('Form validation failed', errors);
          }
        },
      );
    } else if (errors.length > 0) {
      // Non-blocking extraErrors are present — update display state without triggering onError.
      this.setSharedState({
        errors,
        errorSchema,
        schemaValidationErrors: [],
        schemaValidationErrorSchema: {},
      });
    } else if (prevErrors.length > 0) {
      this.setSharedState({
        errors: [],
        errorSchema: {},
        schemaValidationErrors: [],
        schemaValidationErrorSchema: {},
      });
    }
    return !hasError;
  };

  /** Programmatically validate the form.  If `omitExtraData` is true, the `formData` will first be filtered to remove
   * any extra data not in a form field. If `onError` is provided, then it will be called with the list of errors the
   * same way as would happen on form submission.
   *
   * @returns - True if the form is valid, false otherwise.
   */
  validateForm = (): boolean => {
    const { omitExtraData } = this.props;
    let { formData: newFormData } = this.state;
    if (omitExtraData === true) {
      newFormData = this.omitFormExtraData(newFormData);
    }
    return this.validateFormWithFormData(newFormData);
  };

  /** Renders the `Form` fields inside the <form> | `tagName`, rendering any errors if needed along with the submit
   * button or any children of the form.
   */
  render() {
    const {
      children,
      id,
      className = '',
      tagName,
      name,
      method,
      target,
      action,
      autoComplete,
      enctype,
      acceptCharset,
      noHtml5Validate = false,
      disabled,
      readonly,
      showErrorList = 'top',
    } = this.props;

    const { schema, uiSchema, formData, errorSchema, registry } = this.state;
    const { SchemaField: SchemaFieldComponent } = registry.fields;
    const { SubmitButton } = registry.templates.ButtonTemplates;
    const FormTag = tagName || 'form';

    let { [SUBMIT_BTN_OPTIONS_KEY]: submitOptions = {} } = getUiOptions<T, S, F>(uiSchema);
    if (disabled) {
      submitOptions = { ...submitOptions, props: { ...submitOptions.props, disabled: true } };
    }
    const submitUiSchema = { [UI_OPTIONS_KEY]: { [SUBMIT_BTN_OPTIONS_KEY]: submitOptions } };

    return (
      <FormTag
        className={className || 'rjsf'}
        id={id}
        name={name}
        method={method}
        target={target}
        action={action}
        autoComplete={autoComplete}
        encType={enctype}
        acceptCharset={acceptCharset}
        noValidate={noHtml5Validate}
        onSubmit={this.onSubmit}
        ref={this.formElement}
      >
        {showErrorList === 'top' && this.renderErrors(registry)}
        <SchemaFieldComponent
          name=''
          schema={schema}
          uiSchema={uiSchema}
          errorSchema={errorSchema}
          fieldPath={ROOT_FIELD_PATH}
          id={registry.globalFormOptions.idPrefix}
          formData={formData}
          onChange={this.onChange}
          onBlur={this.onBlur}
          onFocus={this.onFocus}
          registry={registry}
          disabled={disabled}
          readonly={readonly}
        />

        {children || <SubmitButton uiSchema={submitUiSchema} registry={registry} />}
        {showErrorList === 'bottom' && this.renderErrors(registry)}
      </FormTag>
    );
  }
}
