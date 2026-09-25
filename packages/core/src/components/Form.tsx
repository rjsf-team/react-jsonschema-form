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
  ErrorSchemaBuilder,
  getChangedFields,
  getTemplate,
  getUiOptions,
  hashObject,
  isObject,
  isPlainObject,
  mergeObjects,
  replaceEqualDeep,
  schemaHasNestedConditional,
  SUBMIT_BTN_OPTIONS_KEY,
  toErrorList,
  toErrorSchema,
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
import { ADDITIONAL_PROPERTY_KEY_REMOVE } from './constants.ts';
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
  /** The data of a form whose value you own, like `value` on an `<input>`: the form renders exactly this, proposes
   * each edit through `onChange`, and changes nothing until you pass the new value back. Ownership is decided at
   * mount, so pass it from the first render (`record ?? {}` while loading, or mount once loaded) and seed any schema
   * defaults yourself with `createSchemaUtils(...).getDefaultFormState()`. For an editable form that should own its
   * data, use `initialFormData` instead.
   */
  formData?: T;
  /** The seed of a form that owns its data, like `defaultValue` on an `<input>`: it is filled in with the schema's
   * defaults on the initial render and again when `reset()` is called, and edits are the form's own, reported
   * through `onChange`. Read the current value with `getFormData()`.
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
  /** Whether there is data to live-validate: the `formData` prop is defined for a parent-owned form, `initialFormData`
   * was passed at mount for a self-owned one
   */
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
  /** Whether the parent owns the data (a `formData` prop at mount) or the form does. Decided once, at construction */
  isControlled: boolean;
  /** The props that take part in validation without taking part in resolving the schema, kept in the render context so
   * a derivation can tell they changed by comparing with the committed state, functions by identity
   */
  validationProps: ValidationProps<T, S, F>;
}

/** The validation callbacks, the only validation inputs the schema utilities are not built from */
type ValidationProps<T, S extends StrictRJSFSchema, F extends FormContextType> = Pick<
  FormProps<T, S, F>,
  'customValidate' | 'transformErrors'
>;

/** The validation half of the state */
type ErrorState<T> = Pick<
  FormState<T>,
  'errors' | 'errorSchema' | 'schemaValidationErrors' | 'schemaValidationErrorSchema'
>;

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
  const { schema, uiSchema, schemaUtils, formData, errors, errorSchema } = state;
  return {
    schema,
    uiSchema,
    schemaUtils,
    formData,
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

/** An operation waiting in the `Form` queue */
interface QueuedOperation {
  /** Runs the operation, which calls `advance` once React has committed its result */
  run: (advance: () => void) => void;
  /** Whether the operation is a field change or `setFieldValue()` */
  isChange: boolean;
}

/** Rethrows `error` from a timer: thrown inside React's commit phase, it would unmount the form */
function rethrowOutsideCommit(error: unknown) {
  setTimeout(() => {
    throw error;
  });
}

/** Runs `emit` from a `setState()` callback, then advances the queue even if it threw, so a throwing `onChange` or
 * `onSubmit` can neither stall later operations nor unmount the form
 */
function advanceAfter(advance: () => void, emit: () => void) {
  try {
    emit();
  } catch (error) {
    rethrowOutsideCommit(error);
  } finally {
    advance();
  }
}

/** The part of the state that rendering derives from the props and the data alone: the schema utilities, the root and
 * resolved schemas, the uiSchema and the registry. Error and edit bookkeeping is the rest of `FormState`.
 */
type RenderContext<T, S extends StrictRJSFSchema, F extends FormContextType> = Pick<
  FormState<T, S, F>,
  | 'schemaUtils'
  | 'schema'
  | 'uiSchema'
  | 'retrievedSchema'
  | 'hasNestedConditionalSchema'
  | 'registry'
  | 'validationProps'
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

/** Derives the `RenderContext` for the given `props` and resolved schema. The result is shared against `prev`, so a
 * value the parent rebuilt but did not change keeps the reference the fields already hold, functions included: a
 * changed template, widget or field is not mistaken for the old one, and the validator's compiled-schema cache and
 * the sanitize check, which compare the retrieved schema by reference, see the same object while it is unchanged.
 *
 * @param props - The current props
 * @param retrievedSchema - The schema resolved for the data the context is derived for
 * @param prev - The previous context, or the state holding one, whose references are retained where possible
 * @param resolved - The schema utilities for `props`, already resolved by the caller
 * @returns - The render context for the inputs
 */
function deriveRenderContext<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  retrievedSchema: S,
  prev: RenderContext<T, S, F> | undefined,
  resolved: Pick<RenderContext<T, S, F>, 'schemaUtils' | 'hasNestedConditionalSchema'>,
): RenderContext<T, S, F> {
  const { uiSchema = {}, customValidate, transformErrors } = props;
  const { schemaUtils, hasNestedConditionalSchema } = resolved;
  const rootSchema = schemaUtils.getRootSchema();
  return replaceEqualDeep(prev, {
    schemaUtils,
    schema: rootSchema,
    uiSchema,
    retrievedSchema,
    hasNestedConditionalSchema,
    registry: buildRegistry(props, rootSchema, schemaUtils),
    validationProps: { customValidate, transformErrors },
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
  extraErrors?: ErrorSchema<T>,
  customErrors?: ErrorSchemaBuilder<T>,
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
 * @param context - The render context to validate with: its `schemaUtils` runs the validator and its `schema` is the
 *          constraint set. Its `retrievedSchema` is deliberately NOT used: whether the resolved schema may stand in
 *          for the root is the caller's to decide, which is what the separate parameter below is for.
 * @param formData - The form data to validate
 * @param [retrievedSchema] - An optionally pre-resolved schema to validate against instead of the context's `schema`
 */
function validateFormData<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  context: RenderContext<T, S, F>,
  formData: T | undefined,
  retrievedSchema?: S,
): ValidationData<T> {
  const { schemaUtils, schema } = context;
  const { customValidate, transformErrors, uiSchema, formContext } = props;
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
  // Read off the same props as `uiSchema`, not the context's registry, which lags the props until the form commits
  // them; normalized as `buildRegistry()` does, so a function-form `uiSchema.items` sees what it sees while rendering
  const uiRequiredErrorSchema = schemaUtils.getUiRequiredErrorSchema(
    uiSchema,
    formData,
    undefined,
    uiSchema?.[UI_GLOBAL_OPTIONS_KEY],
    formContext ?? ({} as F),
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
 * @param context - The render context to validate with; see `validateFormData()`
 * @param formData - The form data to validate
 * @param [customErrors] - The customErrors from custom components
 * @param [retrievedSchema] - The schema resolved for the branch `formData` selects, when it still describes it; the
 *          root schema is the full constraint set, so a resolved schema, which has had the root's `if`,
 *          `dependencies` and `$ref`s folded into it, drops the errors those keywords report (`must match "then"
 *          schema`, the `oneOf` miss) and may stand in only while it describes the data. Omitting extra data keeps
 *          that true, since the fields it drops are by definition not in the schema that selects the branch; a prop
 *          change does not, which is why the derivation passes it only when nothing that resolves it changed.
 * @returns - An object containing `errorSchema`, `errors`, `schemaValidationErrors` and `schemaValidationErrorSchema`
 */
function runLiveValidation<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  context: RenderContext<T, S, F>,
  formData: T | undefined,
  customErrors?: ErrorSchemaBuilder<T>,
  retrievedSchema?: S,
) {
  const schemaValidation = validateFormData(props, context, formData, retrievedSchema);
  const { errors: schemaValidationErrors, errorSchema: schemaValidationErrorSchema } = schemaValidation;
  const mergedErrors = mergeErrors(schemaValidation, props.extraErrors, customErrors);
  return { ...mergedErrors, schemaValidationErrors, schemaValidationErrorSchema };
}

/** Whether `prefix` addresses `path` itself or a container holding it, comparing the segments the way `toPath()` spells
 * them, so a numeric array index and its string form are the same segment
 *
 * @param prefix - The path that may lead into `path`
 * @param path - The path being addressed
 * @returns - True when every segment of `prefix` opens `path`
 */
function isPathPrefix(prefix: FieldPathList, path: FieldPathList): boolean {
  return prefix.length <= path.length && prefix.every((segment, i) => String(segment) === String(path[i]));
}

/** The path an `RJSFValidationError` addresses, the same way `toErrorSchema()` splits it */
function errorPath(error: RJSFValidationError): string[] {
  return error.property ? toPath(error.property) : [];
}

/** Counts the messages of `errorSchema` into `counts`, keyed by the property each sits at, or by the message alone when
 * `pooled`: after an array-valued raise, such as an `ArrayField` reorder, remove or copy, an item's errors may sit at
 * an index other than the one they came from, so only the message still says which is which
 *
 * @param errorSchema - The `ErrorSchema` whose messages are counted
 * @param pooled - Whether to key by the message alone
 * @param [counts] - The counts to add to
 * @param [sign] - 1 to add the messages, -1 to take them away
 * @returns - `counts`
 */
function countMessages(errorSchema: unknown, pooled: boolean, counts = new Map<string, number>(), sign = 1) {
  for (const { property, message } of toErrorList(errorSchema as ErrorSchema)) {
    const key = pooled ? `${message}` : `${property} ${message}`;
    counts.set(key, (counts.get(key) ?? 0) + sign);
  }
  return counts;
}

/** `raised` without the messages `supplied` counts, one copy per count. A field may hand back the `errorSchema` it
 * displays, which already carries `extraErrors`/`customErrors`, and those must not enter the stored validator result,
 * or they outlive the props supplying them. Only the message tells them apart, so a field's own error that reads the
 * same as a supplied one at the same place is taken for the supplied one (#5348)
 *
 * @param raised - The `ErrorSchema` a field raised
 * @param supplied - The supplied messages, from `countMessages()`; consumed
 * @param pooled - Whether `supplied` is keyed by the message alone
 * @returns - What is left of `raised`, with no empty `__errors` or branches
 */
function withoutSupplied<T>(raised: ErrorSchema<T>, supplied: Map<string, number>, pooled: boolean): ErrorSchema<T> {
  const kept = toErrorList(raised).filter(({ property, message }) => {
    const key = pooled ? `${message}` : `${property} ${message}`;
    const count = supplied.get(key) ?? 0;
    supplied.set(key, count - 1);
    return count <= 0;
  });
  return toErrorSchema<T>(kept);
}

/** `errors` with the ones at or below `path` replaced by the messages `raised` holds there. A validator error whose
 * message is still raised at its property stays as it was, keeping its place and the `name`, `params` and
 * `schemaPath` that a copy built from the `ErrorSchema` would lose. New messages go where the first error at `path`
 * was, so the list keeps the validator's order
 *
 * @param errors - The validator's errors
 * @param path - The path the raise was made at
 * @param raised - The errors raised at `path`
 * @returns - The errors with the raise applied
 */
function replaceErrorsAt<T>(errors: RJSFValidationError[], path: FieldPathList, raised: ErrorSchema<T>) {
  const incoming = toErrorList(raised, path.map(String));
  const kept: RJSFValidationError[] = [];
  let insertAt = -1;
  for (const error of errors) {
    const pathOfError = errorPath(error);
    if (!isPathPrefix(path, pathOfError)) {
      kept.push(error);
    } else {
      if (insertAt === -1) {
        insertAt = kept.length;
      }
      const found = incoming.findIndex(
        (entry) => entry.message === error.message && String(errorPath(entry)) === String(pathOfError),
      );
      if (found !== -1) {
        incoming.splice(found, 1);
        kept.push(error);
      }
    }
  }
  kept.splice(insertAt === -1 ? kept.length : insertAt, 0, ...incoming);
  return kept;
}

/** The data a derivation pass settles on, with what it took to get there */
interface DerivedData<T, S extends StrictRJSFSchema, F extends FormContextType> {
  /** The data after defaults and, when asked for, sanitization */
  formData: T;
  /** The render context for `formData`, carrying the schema resolved for it and the utilities that resolved it.
   * Every value in it is `current`'s own whenever nothing it is built from changed, so committing it always is
   * free; handing it back rather than the parts is what keeps state from holding a `retrievedSchema` resolved by
   * utilities it does not also hold.
   */
  context: RenderContext<T, S, F>;
  /** `context.schemaUtils` is `current`'s own: nothing the schema is resolved with changed, so the resolved schema in
   * `context` was produced for `formData` by the very utilities the committed state validates with, and may stand in
   * for the root when validating; see `runLiveValidation()`
   */
  areSchemaUtilsReused: boolean;
}

/** The schema resolved for `formData`. Resolving walks the whole root schema, so it is skipped outright when the
 * utilities and the data they resolve for are both the ones `current.retrievedSchema` was resolved from. Otherwise the
 * result is shared against the committed schema, so rebuilt utilities handing back a deep-equal schema still compare
 * equal by identity instead of triggering a sanitize pass.
 *
 * @param current - The state the pass starts from; `undefined` on construction
 * @param schemaUtils - The utilities to resolve with
 * @param formData - The data to resolve the schema for
 * @returns - The resolved schema, shared with `current.retrievedSchema` where possible
 */
function resolveRetrievedSchema<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F> | undefined,
  schemaUtils: SchemaUtilsType<T, S, F>,
  formData: T | undefined,
): S {
  if (current?.schemaUtils === schemaUtils && current.formData === formData) {
    return current.retrievedSchema;
  }
  return replaceEqualDeep(current?.retrievedSchema, schemaUtils.retrieveSchema(schemaUtils.getRootSchema(), formData));
}

/** How one data pass differs from the default, which just fills in the missing defaults */
interface DeriveDataOptions {
  /** Attempt to sanitize the data for a retrieved schema that changed */
  shouldSanitize?: boolean;
  /** This pass originated from `reset()`: it computes defaults the same way an initial render does even though the
   * instance has generated defaults before
   */
  isReset?: boolean;
}

/** Settles the data for `props` and `inputFormData`: any missing required defaults are filled in, then, when asked,
 * the result is sanitized for its resolved schema until the two stop moving. Every caller that needs derived data
 * goes through here, so the resolved schema and the data it describes are always produced together.
 *
 * @param current - The state the pass starts from; `undefined` on construction
 * @param inputFormData - The data to settle; `undefined` computes defaults from nothing
 * @param options - How this pass differs from the default
 * @param props - The current props
 * @returns - The settled data and the render context carrying the schema that was resolved for it
 */
function deriveFormData<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F> | undefined,
  inputFormData: T | undefined,
  options: DeriveDataOptions,
  props: FormProps<T, S, F>,
): DerivedData<T, S, F> {
  const { shouldSanitize = false, isReset = false } = options;
  const { uiSchema = {} } = props;
  const resolved = resolveSchemaUtils(props, current);
  const { schemaUtils, hasNestedConditionalSchema } = resolved;
  // Compared through `schemaUtils` rather than by the identity of `resolved` itself, which holds only because
  // `resolveSchemaUtils()` hands `current` straight back: narrowing it to a copy would silently make this false
  // forever, and with it every reuse below
  const areSchemaUtilsReused = resolved.schemaUtils === current?.schemaUtils;
  const rootSchema = schemaUtils.getRootSchema();

  let defaultsFormData: T | undefined = inputFormData;
  // The data is shared against the committed data when there is some, so an unchanged subtree keeps the reference the
  // fields hold; on construction, against the caller's own value
  const shareBase = current ? current.formData : defaultsFormData;
  // A reset re-runs the same "initial" defaults pass a first render does, so `ui:initialValue` applies again even
  // though this instance has generated defaults before.
  const initialDefaultsGenerated = (current?.initialDefaultsGenerated ?? false) && !isReset;
  let formData: T;
  let retrievedSchema: S;
  let wasSanitized = false;
  const preventInfiniteSanitize: string[] = [];
  do {
    formData = replaceEqualDeep(
      shareBase,
      schemaUtils.getDefaultFormState(rootSchema, defaultsFormData, false, initialDefaultsGenerated, uiSchema) as T,
    );
    // Only hash when sanitizing, wrapping `formData` in an object to deal with a scalar/undefined value
    const formHash = shouldSanitize ? hashObject({ formData }) : '';
    retrievedSchema = resolveRetrievedSchema(current, schemaUtils, formData);
    if (
      shouldSanitize &&
      !preventInfiniteSanitize.includes(formHash) &&
      (hasNestedConditionalSchema || retrievedSchema !== current?.retrievedSchema)
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

  // Always derived, never skipped on the grounds that the schema utilities were reused: the registry is built from
  // `idPrefix`, `widgets`, `templates`, `fields`, `formContext` and `uiSchema` too, none of which the utilities are
  // resolved from. `deriveRenderContext()` shares its result against `current`, so an unchanged context keeps every
  // reference the fields hold.
  const context = deriveRenderContext(props, retrievedSchema, current, resolved);
  return { formData, context, areSchemaUtilsReused };
}

/** What reconciling the errors of a derivation needs to know */
interface ErrorOptions<S> {
  /** The schema changed, so the existing errors describe another schema and are dropped */
  isSchemaChanged?: boolean;
  /** Live validation runs for this pass; otherwise the committed validation results are carried forward */
  mustValidate: boolean;
  /** The schema to validate with in place of the root, when it still describes the data; see `runLiveValidation()` */
  validationSchema?: S;
  /** Returns the path of each `formData` field that changed; called only when live validation does not run, which is
   * when those paths are needed to clear the fields' errors
   */
  getFormDataChangedFields?: () => string[];
}

/** Reconciles the errors for a derivation, either by validating `formData` or by carrying the committed validation
 * results forward, dropping the ones of fields that changed, and merging `extraErrors` and the custom errors onto them.
 *
 * @param current - The state the pass starts from; `undefined` on construction
 * @param props - The current props
 * @param context - The render context derived for `formData`
 * @param formData - The data the errors are for
 * @param options - How this pass reconciles its errors
 * @returns - The errors to display and the validator's own results they were built from
 */
function reconcileErrors<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F> | undefined,
  props: FormProps<T, S, F>,
  context: RenderContext<T, S, F>,
  formData: T | undefined,
  options: ErrorOptions<S>,
): ErrorState<T> {
  const { isSchemaChanged = false, mustValidate, validationSchema, getFormDataChangedFields = () => [] } = options;
  if (mustValidate) {
    return runLiveValidation(props, context, formData, current?.customErrors, validationSchema);
  }
  // If the `props.noValidate` option is set or the schema has changed, we reset the error state. Otherwise the base
  // has to be the validator's own result, since `extraErrors` and `customErrors` are merged in below and
  // `state.errors` already carries them, which would merge each in a second time
  // oxlint-disable-next-line typescript/no-deprecated
  const isErrorStateReset = props.noValidate || isSchemaChanged;
  const validation: ValidationData<T> = isErrorStateReset
    ? { errors: [], errorSchema: {} }
    : {
        errors: current?.schemaValidationErrors || [],
        errorSchema: current?.schemaValidationErrorSchema || {},
      };
  let schemaValidationErrorSchema = validation.errorSchema;
  let schemaValidationErrors = validation.errors;
  const formDataChangedFields = getFormDataChangedFields();
  if (formDataChangedFields.length > 0) {
    // `formDataChangedFields` carries the path of each field that changed, so clearing has to follow that path
    // instead of dropping the whole branch it starts in. The path is split with `toPath()`, the same way
    // `toErrorSchema()` splits a validation error property, so the two address the same entry. Intermediate
    // objects are forced so the numeric segment of an array item stays an object key, which is how an
    // `ErrorSchema` addresses array items.
    const changedPaths = formDataChangedFields.map((path) => toPath(path));
    const newErrorSchema = changedPaths.reduce<GenericObjectType>((acc, pathOfField) => {
      // Every container holding the field changed along with it, so an error of their own, such as the
      // `uniqueItems` of the array the field sits in, is cleared too. Only their own errors go: the other
      // fields they hold did not change and keep theirs.
      for (let i = 1; i < pathOfField.length; i++) {
        setByPath(acc, [...pathOfField.slice(0, i), ERRORS_KEY], undefined, true);
      }
      return setByPath(acc, pathOfField, undefined, true);
    }, {});
    schemaValidationErrorSchema = mergeObjects(
      validation.errorSchema,
      newErrorSchema,
      'preventDuplicates',
    ) as ErrorSchema<T>;
    // The list is what the `ErrorList` and the `onChange` payload carry, so it drops the same errors: the changed
    // field's own and those below it, and the own errors of every container holding it
    schemaValidationErrors = validation.errors.filter((error) => {
      const pathOfError = errorPath(error);
      return (
        pathOfError.length === 0 ||
        !changedPaths.some(
          (pathOfField) => isPathPrefix(pathOfField, pathOfError) || isPathPrefix(pathOfError, pathOfField),
        )
      );
    });
  }
  const merged = mergeErrors(
    { errors: schemaValidationErrors, errorSchema: schemaValidationErrorSchema },
    props.extraErrors,
    current?.customErrors,
  );
  return {
    ...merged,
    schemaValidationErrors,
    schemaValidationErrorSchema,
  };
}

/** Whether a pass validates its data: only under `liveValidate: 'onChange'`, only for data that is there, and only when
 * something the errors depend on changed, so a parent re-render that touches neither the data nor the validation
 * shows no error the user has not earned yet. `'onBlur'` owns its validation pass in `onBlur()`.
 */
function mustLiveValidate<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  edit: boolean,
  isInputChanged: boolean,
): boolean {
  return edit && isLiveValidated(props) && isInputChanged;
}

/** Whether the form validates its data on every change */
function isLiveValidated<T, S extends StrictRJSFSchema, F extends FormContextType>(props: FormProps<T, S, F>) {
  // oxlint-disable-next-line typescript/no-deprecated
  return !props.noValidate && props.liveValidate === 'onChange';
}

/** What changed between the committed state and a context derived from the current props, read off the references
 * the derivation shared: a member is a new object exactly when an input it is built from changed
 */
function detectContextChanges<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F> | undefined,
  context: RenderContext<T, S, F>,
) {
  if (!current) {
    return { isSchemaChanged: false, isValidationPropChanged: false };
  }
  return {
    isSchemaChanged: context.schema !== current.schema,
    // The utilities carry the schema, the validator and the merge settings; the callbacks are the rest
    isValidationPropChanged:
      context.schemaUtils !== current.schemaUtils || context.validationProps !== current.validationProps,
  };
}

/** The state of a self-owned form: on construction from its seed, and afterwards from the data it holds whenever the
 * schema or the uiSchema changed, since those are the props whose change transforms the data (a default it did not
 * have before, a branch that no longer applies). No other prop change runs this: an unrelated re-render must not rerun
 * value initialization, so `getDerivedStateFromProps` re-derives the render context alone for those.
 *
 * @param current - The state the pass starts from; `undefined` on construction
 * @param inputFormData - The seed on construction, the held data afterwards
 * @param props - The current props
 * @returns - The new state, sharing every unchanged subtree with `current`
 */
function deriveOwnedState<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F> | undefined,
  inputFormData: T | undefined,
  props: FormProps<T, S, F>,
): FormState<T, S, F> {
  const { formData, context, areSchemaUtilsReused } = deriveFormData(current, inputFormData, {}, props);
  const { isSchemaChanged, isValidationPropChanged } = detectContextChanges(current, context);
  const edit = current ? current.edit : inputFormData !== undefined;
  // Construction validates nothing: the errors of a seed the user has not touched are not shown until they are earned
  const isDataChanged = current !== undefined && formData !== current.formData;
  const errors = reconcileErrors(current, props, context, formData, {
    isSchemaChanged,
    mustValidate: mustLiveValidate(props, edit, isDataChanged || isValidationPropChanged),
    validationSchema: areSchemaUtilsReused ? context.retrievedSchema : undefined,
  });
  return {
    ...(current ?? { isControlled: false }),
    ...context,
    formData,
    edit,
    ...errors,
    initialDefaultsGenerated: true,
  };
}

/** The state of a parent-owned form: the render context for the `formData` prop, and the errors for it. The data is
 * the parent's exactly as passed, shared against the previous value only so an unchanged subtree keeps the reference
 * the fields hold; no default is generated and nothing is sanitized, on mount or on any later prop change, because the
 * parent owns the value and the value includes its defaults.
 *
 * @param current - The state the pass starts from; `undefined` on construction
 * @param props - The current props
 * @returns - The new state, sharing every unchanged subtree with `current`
 */
function deriveControlledState<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F> | undefined,
  props: FormProps<T, S, F>,
): FormState<T, S, F> {
  const resolved = resolveSchemaUtils(props, current);
  const { schemaUtils } = resolved;
  const areSchemaUtilsReused = schemaUtils === current?.schemaUtils;
  const formData = current ? replaceEqualDeep(current.formData, props.formData) : props.formData;
  const isDataChanged = current !== undefined && formData !== current.formData;
  const retrievedSchema = resolveRetrievedSchema(current, schemaUtils, formData);
  const context = deriveRenderContext(props, retrievedSchema, current, resolved);
  const { isSchemaChanged, isValidationPropChanged } = detectContextChanges(current, context);
  const edit = props.formData !== undefined;
  // Validated the way an edit is, with the schema resolved for this very data, whenever the utilities that resolve it
  // are unchanged; a parent handing a proposal back therefore shows the errors the event carried
  const errors = reconcileErrors(current, props, context, formData, {
    isSchemaChanged,
    mustValidate: current !== undefined && mustLiveValidate(props, edit, isDataChanged || isValidationPropChanged),
    validationSchema: areSchemaUtilsReused ? retrievedSchema : undefined,
    // The committed data is the previous prop, shared, so unchanged subtrees are skipped by identity
    // The clearing stands in for the validation pass a live-validated form does not get, so it is for the other modes
    // only: when the pass is merely skipped, the committed errors already describe this data and stay as they are.
    // Construction has no committed errors to clear, and walking against nothing would list every key of the data
    getFormDataChangedFields:
      current === undefined || (edit && isLiveValidated(props))
        ? undefined
        : () => getChangedFields(formData, current.formData, true),
  });
  return {
    ...(current ?? { isControlled: true, initialDefaultsGenerated: true }),
    ...context,
    formData,
    edit,
    ...errors,
  };
}

/** Freezes plain objects and arrays in `data`, and nothing else: a `File`, a `Date` or a class instance is left
 * alone. Development only, and only ever applied to form data: the form data a consumer receives shares subtrees with
 * the value the change was applied to, which for a parent-owned form is the parent's own object, so a mutation of it
 * corrupts the parent's state silently. Frozen, it throws where the mutation happens instead.
 *
 * @param data - The form data to freeze
 */
function freezeFormData(data: unknown) {
  if ((!Array.isArray(data) && !isPlainObject(data)) || Object.isFrozen(data)) {
    return;
  }
  Object.freeze(data);
  for (const value of Object.values(data)) {
    freezeFormData(value);
  }
}

/** What a parent-owned form commits: its errors, which are its own. Everything else is derived from the props before
 * every render, so the data an operation computed is the parent's to accept through `onChange`, and the render context
 * an edit resolved for its proposal would describe data the parent has not accepted
 */
const PARENT_OWNED_COMMIT_KEYS = [
  'customErrors',
  'errors',
  'errorSchema',
  'schemaValidationErrors',
  'schemaValidationErrorSchema',
] as const satisfies readonly (keyof FormState)[];

declare const process: { env: Record<string, string | undefined> };
/** Whether the development diagnostics run. Vite and esbuild replace `process.env.NODE_ENV` but not `typeof process`,
 * and a browser has no `process`, so only the replaced expression is read; the `catch` covers an environment that
 * neither replaces nor defines it. Because the check is hoisted into a `const`, a minifier cannot fold it, so the
 * diagnostics ship in production bundles too and only skip at run time.
 */
const isDevelopment = (() => {
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
})();

/** Returns `data` with every container along `path` shallow-copied, leaving the copies ready for a write at that
 * path that must not touch the original. Subtrees off the path keep the reference the fields already hold, so
 * nothing has to walk the data afterwards to restore the sharing a deep clone would have destroyed. Stops where
 * the path runs off the end of what is actually there, since `setByPath()` creates the rest itself; the copies made
 * up to that point are what keeps it from creating them inside a container the committed state still holds.
 *
 * @param data - The data to copy along `path`
 * @param path - The path whose containers are copied
 * @returns - The copied data, or `data` itself when it holds no containers to copy
 */
function copyAlongPath<T>(data: T, path: FieldPathList): T {
  if (!isObject(data) && !Array.isArray(data)) {
    return data;
  }
  const copyOf = (container: object) => (Array.isArray(container) ? [...container] : { ...container });
  const root = copyOf(data as object) as Record<PropertyKey, unknown>;
  let container = root;
  for (const segment of path.slice(0, -1)) {
    const child = container[segment];
    if (!isObject(child) && !Array.isArray(child)) {
      break;
    }
    const copy = copyOf(child as object) as Record<PropertyKey, unknown>;
    container[segment] = copy;
    container = copy;
  }
  return root as T;
}

/** Applies one `change` to `current`, returning the next state. The `newValue` is set at the change's path in the
 * data, which is then run through `deriveFormData()` for any missing defaults and, when the resolved schema changed,
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
  const { formData: oldFormData, schemaValidationErrorSchema, schemaValidationErrors } = current;
  let { customErrors } = current;
  // The derivation below hands back the context for the data it settled on, resolved schema included, so committing
  // whatever it returns is what keeps state's resolved schema and the utilities that resolved it in step.
  let context: RenderContext<T, S, F> = current;
  // Use the un-merged AJV-only schema as the base for re-merging extraErrors, as `reconcileErrors()` does:
  // state.errorSchema already carries them, so merging onto it would add each a second time.
  let mergeBaseErrorSchema: ErrorSchema<T> = schemaValidationErrorSchema;
  // `state.errors` is the matching list and needs the same treatment; see the merge below.
  let mergeBaseErrors = schemaValidationErrors;
  // The stored validator result, when a raise made part of it stale
  let storedValidation: Partial<Pick<FormState<T, S, F>, 'schemaValidationErrors' | 'schemaValidationErrorSchema'>> =
    {};
  const isRootPath = path.length === 0;
  let formData: T | undefined;
  if (isRootPath) {
    formData = newValue;
  } else if (isObject(oldFormData) || Array.isArray(oldFormData)) {
    formData = structuredClone(oldFormData);
  } else {
    // A field edit under an empty root, which a parent-owned form can hold as `null` or `undefined`, creates the
    // container the field lives in instead of being dropped
    formData = (typeof path[0] === 'number' ? [] : {}) as T;
  }

  // When switching from null to an object option in oneOf, MultiSchemaField sends
  // an object with property names but undefined values (e.g., {types: undefined, content: undefined}).
  // In this case, pass undefined to deriveFormData to trigger fresh default computation.
  // Only do this when the previous formData was null/undefined (switching FROM null).
  const hasOnlyUndefinedValues =
    isObject(formData) &&
    Object.keys(formData as object).length > 0 &&
    Object.values(formData as object).every((v) => v === undefined);
  const wasPreviouslyNull = oldFormData === null || oldFormData === undefined;
  const inputForDefaults = hasOnlyUndefinedValues && wasPreviouslyNull ? undefined : formData;

  if (isObject(formData) || Array.isArray(formData)) {
    // Tracks if the user cleared a plain (non-oneOf/anyOf) leaf field.
    // The key is removed twice: once before deriveFormData so inputForDefaults
    // reflects an empty field for conditional schema resolution, and once after so
    // the user's clear overrides any schema default deriveFormData re-applied (#5125)
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
          const { field: leaf } = current.schemaUtils.findFieldInSchema(current.schema, path, oldFormData);
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
      current.retrievedSchema !== undefined &&
      !isRootPath &&
      !isObject(newValue) &&
      !Array.isArray(newValue) &&
      !disabled &&
      !readonly;
    // Only the data and its context are derived here; the errors are reconciled below
    const derived = deriveFormData(current, inputForDefaults, { shouldSanitize }, props);
    formData = derived.formData;
    context = derived.context;

    // Re-set to undefined after merging defaults so the user's clear is preserved in
    // state (#5125 regression: without this, clearing a second field re-applies the
    // default to previously-cleared fields). The undefined key is stripped from the
    // formData copy passed to AJV via JSON.parse(JSON.stringify(...)) so the validator never
    // sees { [key]: undefined } for type:"string" or patternProperties fields (#4518).
    if (plainLeafWasCleared && formData) {
      // `replaceEqualDeep()` may have handed back subtrees of the committed data, and `setByPath()` writes through
      // every container along the path, so the clear lands on copies of just those containers
      formData = setByPath(copyAlongPath(formData, path), path, undefined);
    }
  }

  const mustValidate = !noValidate && liveValidate === 'onChange';
  let newFormData = formData;

  if (omitExtraData === true && liveOmit === 'onChange') {
    newFormData = context.schemaUtils.omitExtraData(context.schema, formData);
  }

  if (newErrorSchema) {
    // First check to see if there is an existing validation error on this path...
    const oldValidationError = !isRootPath ? getByPath(schemaValidationErrorSchema, path) : schemaValidationErrorSchema;
    // True for any array-valued raise, not only an `ArrayField` reorder, remove or copy that moved item errors to new
    // indexes: the errors a custom tags or multi-select field raises are matched by message alone too
    const isArrayRaise = Array.isArray(newValue);
    // If there is an old validation error for this path, assume we are updating it directly
    if (oldValidationError && Object.keys(oldValidationError).length > 0) {
      // What the field displays beyond the validator's own errors is supplied by `extraErrors`/`customErrors`; the
      // rest of the raise is the field's own say over the validator's errors at this path, an empty rest included
      const supplied = countMessages(
        isRootPath ? current.errorSchema : getByPath(current.errorSchema, path),
        isArrayRaise,
      );
      const raisedErrorSchema = withoutSupplied(
        newErrorSchema,
        countMessages(oldValidationError, isArrayRaise, supplied, -1),
        isArrayRaise,
      );
      if (isRootPath) {
        mergeBaseErrorSchema = raisedErrorSchema;
      } else {
        // Applied to a clone of the AJV-only base, so the committed state is not mutated
        mergeBaseErrorSchema = structuredClone(schemaValidationErrorSchema);
        if (Object.keys(raisedErrorSchema).length > 0) {
          // An `ErrorSchema` nests plain objects even at numeric segments, so never auto-vivify arrays
          setByPath(mergeBaseErrorSchema, path, raisedErrorSchema, true);
        } else {
          // Not an empty node, which an ancestor's raise would read as a validator error still being there
          unsetByPath(mergeBaseErrorSchema, path);
        }
      }
      mergeBaseErrors = replaceErrorsAt(schemaValidationErrors, path, raisedErrorSchema);
      // Stored, so in an uncontrolled form the next derivation rebuilds from a base that carries the raise instead of
      // losing it; a controlled parent's echo counts the raised path as changed and clears it (#5347). Remapped item
      // errors describe the reordered data, which only an uncontrolled form keeps: a controlled parent either echoes
      // it, which clears the changed items' errors, or snaps back to its own order, which the old indexes describe
      if (!isArrayRaise || !current.isControlled) {
        storedValidation = {
          schemaValidationErrors: mergeBaseErrors,
          schemaValidationErrorSchema: mergeBaseErrorSchema,
        };
      }
    } else {
      // Only `extraErrors` is left out: the raise replaces the node, so leaving out what `customErrors` holds
      // there would drop an error a field re-raises
      const raisedErrorSchema = withoutSupplied(
        newErrorSchema,
        countMessages(isRootPath ? extraErrors : getByPath(extraErrors, path), isArrayRaise),
        isArrayRaise,
      );
      // The committed builder is left as it is; the edit lands on a copy, which the constructor clones. A root raise
      // replaces everything, as a raise at any other path replaces its node
      customErrors = new ErrorSchemaBuilder<T>(isRootPath ? raisedErrorSchema : customErrors?.ErrorSchema);
      if (!isRootPath) {
        if (Object.keys(raisedErrorSchema).length > 0) {
          // An `ErrorSchema` nests plain objects even at numeric segments, so never auto-vivify arrays
          setByPath(customErrors.ErrorSchema, path, raisedErrorSchema, true);
        } else {
          unsetByPath(customErrors.ErrorSchema, path);
        }
      }
    }
  }
  let clearedCustomError = false;
  // `clearErrors()` leaves an empty `__errors` behind, which is still a truthy read, so the length is what says
  // whether there is anything left to clear; without it every later change at this path would clone the builder
  // and rebuild the displayed errors again
  if (
    !newErrorSchema &&
    customErrors &&
    getByPath<string[]>(customErrors.ErrorSchema, [...path, ERRORS_KEY], []).length > 0
  ) {
    customErrors = new ErrorSchemaBuilder<T>(customErrors.ErrorSchema).clearErrors(path);
    clearedCustomError = true;
  }
  let next: Partial<FormState<T, S, F>> = { formData: newFormData, customErrors };
  if (mustValidate && !deferLiveValidate) {
    const liveValidation = runLiveValidation(props, context, newFormData, customErrors, context.retrievedSchema);
    next = { ...next, ...liveValidation };
  } else if ((!noValidate && newErrorSchema) || clearedCustomError) {
    // Rebuild the display from the validator's own result: `current.errors` already carries `extraErrors` and
    // `customErrors`, so merging them onto it appends each a second time on every change (#5041). That base is also
    // what makes a cleared custom error leave the error list and not just the field. `mergeBaseErrorSchema` is
    // `schemaValidationErrorSchema` unless a `newErrorSchema` above replaced an existing validation error at its path.
    const mergedErrors = mergeErrors(
      { errorSchema: mergeBaseErrorSchema, errors: mergeBaseErrors },
      extraErrors,
      customErrors,
    );
    next = { ...next, ...mergedErrors, ...storedValidation };
  }
  return { ...current, ...context, ...next };
}

/** The state after `reset()` of a self-owned form: the data is re-derived from `initialFormData` the way an initial
 * render does it, and every error, including the custom ones fields raised, is cleared, and the render context the
 * derivation resolved with is committed alongside the data.
 *
 * @param current - The state being reset
 * @param props - The current props
 * @returns - The reset state, sharing every unchanged subtree with `current`
 */
function applyReset<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  props: FormProps<T, S, F>,
): FormState<T, S, F> {
  const { formData, context } = deriveFormData(current, props.initialFormData, { isReset: true }, props);
  return {
    ...current,
    ...context,
    formData,
    errorSchema: {},
    errors: [],
    schemaValidationErrors: [],
    schemaValidationErrorSchema: {},
    // The reset pass has generated the initial defaults, so the next unrelated recompute is not an initial pass and
    // will not resurrect a `ui:initialValue` the user has since cleared
    initialDefaultsGenerated: true,
    customErrors: undefined,
  };
}

/** The state after a field is blurred: the data with extra data omitted when `liveOmit` is `'onBlur'`, validated when
 * `liveValidate` is. `current` itself when neither applies.
 *
 * @param current - The state at the blur
 * @param props - The current props
 * @returns - The next state, sharing every unchanged subtree with `current`
 */
function applyBlur<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  props: FormProps<T, S, F>,
): FormState<T, S, F> {
  // oxlint-disable-next-line typescript/no-deprecated
  const { omitExtraData, liveOmit, liveValidate, noValidate } = props;
  const { schema, schemaUtils, customErrors, retrievedSchema } = current;
  const formData =
    omitExtraData === true && liveOmit === 'onBlur'
      ? schemaUtils.omitExtraData(schema, current.formData)
      : current.formData;
  const validation =
    liveValidate === 'onBlur' && !noValidate
      ? runLiveValidation(props, current, formData, customErrors, retrievedSchema)
      : undefined;
  return { ...current, formData, ...validation };
}

/** Validates `formData` for a submission or `validateForm()`: whether the errors block, the merged errors to report,
 * and the state that displays them, which is `current` itself when the displayed errors do not change.
 *
 * @param current - The state being validated
 * @param props - The current props
 * @param formData - The data to validate
 * @returns - The blocking flag and the next state, which carries the errors to report
 */
function applyValidation<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  props: FormProps<T, S, F>,
  formData: T | undefined,
): { hasError: boolean; next: FormState<T, S, F> } {
  const { extraErrors, extraErrorsAreWarnings } = props;
  const { errors: prevErrors, customErrors } = current;
  const schemaValidation = validateFormData(props, current, formData);
  // Always merge extraErrors/customErrors so they remain visible in state regardless of extraErrorsAreWarnings.
  const { errors, errorSchema } = mergeErrors(schemaValidation, extraErrors, customErrors);
  // extraErrors also block unless extraErrorsAreWarnings is set, in which case they are informational only.
  const hasBlockingExtraErrors = !extraErrorsAreWarnings && !!extraErrors && toErrorList(extraErrors).length > 0;
  // customErrors are raised imperatively by field/widget components (via onChange's errorSchema argument) and,
  // like schema errors, always block regardless of extraErrorsAreWarnings.
  const hasCustomErrors = !!customErrors && toErrorList(customErrors.ErrorSchema).length > 0;
  const hasError = schemaValidation.errors.length > 0 || hasBlockingExtraErrors || hasCustomErrors;
  let next = current;
  if (hasError) {
    next = {
      ...current,
      errors,
      errorSchema,
      schemaValidationErrors: schemaValidation.errors,
      schemaValidationErrorSchema: schemaValidation.errorSchema,
    };
  } else if (errors.length > 0 || prevErrors.length > 0) {
    // Either non-blocking `extraErrors` are on display without `onError` firing, or the errors that were on display
    // are gone; the validator's own results are empty for both
    next = { ...current, errors, errorSchema, schemaValidationErrors: [], schemaValidationErrorSchema: {} };
  }
  // Unlike the other `apply*` functions this one shares here rather than leaving it to `setSharedState()`, because
  // the caller decides whether to commit at all by comparing the result to the state it started from
  return { hasError, next: replaceEqualDeep(current, next) };
}

/** The state after a valid submission: the submitted data, with `extraErrors` as the only errors on display
 *
 * @param current - The state at the submission
 * @param props - The current props
 * @param formData - The submitted data
 * @returns - The next state, sharing every unchanged subtree with `current`
 */
function applySubmit<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  props: FormProps<T, S, F>,
  formData: T | undefined,
): FormState<T, S, F> {
  const { extraErrors } = props;
  return {
    ...current,
    formData,
    errors: extraErrors ? toErrorList(extraErrors) : [],
    errorSchema: extraErrors || {},
    schemaValidationErrors: [],
    schemaValidationErrorSchema: {},
  };
}

/** The `Form` component renders the outer form and all the fields defined in the `schema` */
export default class Form<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>
  extends PureComponent<FormProps<T, S, F>, FormState<T, S, F>>
  implements FormHandle<T>
{
  /** The ref used to hold the rendered form element. `tagName` can swap `<form>` for another element, so the
   * form-only members are reached behind an `instanceof` narrowing rather than assumed present.
   */
  formElement: RefObject<HTMLElement | null>;

  /** The operations waiting to run, in order: field changes, `setFieldValue()` calls, blurs, submits and resets. The
   * first one is running; each advances the queue once React has committed its result, so the next one reads props that already
   * hold a parent's response to it.
   */
  private queue: QueuedOperation[] = [];

  /** `setState` sharing every unchanged subtree of `state` with the current state, so fields' memo boundaries hold
   * across the update. The updater form keeps it correct under batching. A parent-owned form commits its errors and
   * nothing else, see `PARENT_OWNED_COMMIT_KEYS`.
   */
  private setSharedState(from: FormState<T, S, F>, next: FormState<T, S, F>, callback?: () => void) {
    // React merges the partial itself; its `Pick` typing has no name for a key set decided at run time
    const changed = {} as FormState<T, S, F>;
    for (const key of Object.keys(next) as (keyof FormState<T, S, F>)[]) {
      if (next[key] !== from[key]) {
        Object.assign(changed, { [key]: next[key] });
      }
    }
    this.setState((prevState) => {
      if (prevState.isControlled) {
        const owned = {} as FormState<T, S, F>;
        for (const key of PARENT_OWNED_COMMIT_KEYS) {
          if (key in changed) {
            Object.assign(owned, { [key]: changed[key] });
          }
        }
        return replaceEqualDeep(prevState, owned);
      }
      if (isDevelopment && 'formData' in changed) {
        freezeFormData(changed.formData);
      }
      return replaceEqualDeep(prevState, changed);
    }, callback);
  }

  /** Derives the state before every render, so a parent's value is rendered the moment it arrives, with no stale
   * commit in between. Nothing is remembered about the previous props: every derived member is shared against the
   * committed state, so an unchanged input hands back the reference the fields already hold and a changed one is
   * recognized by the new reference. A parent-owned form derives its render context and errors for the `formData`
   * prop; a self-owned form derives its render context, transforming the data it holds only for a schema or uiSchema
   * change, since an unrelated re-render must not rerun value initialization.
   *
   * @param props - The current props
   * @param state - The current state
   * @returns The state to merge
   */
  static getDerivedStateFromProps<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
    props: FormProps<T, S, F>,
    state: FormState<T, S, F>,
  ): Partial<FormState<T, S, F>> {
    if (state.isControlled) {
      return replaceEqualDeep(state, deriveControlledState(state, props));
    }
    const context = deriveRenderContext(props, state.retrievedSchema, state, resolveSchemaUtils(props, state));
    if (context.schemaUtils !== state.schemaUtils || context.uiSchema !== state.uiSchema) {
      return replaceEqualDeep(state, deriveOwnedState(state, state.formData, props));
    }
    const errors = reconcileErrors(state, props, context, state.formData, {
      mustValidate: mustLiveValidate(props, state.edit, context.validationProps !== state.validationProps),
      validationSchema: state.retrievedSchema,
    });
    return replaceEqualDeep(state, { ...context, ...errors });
  }

  /** Constructs the `Form` from the `props`, deciding once who owns the data: the parent when `formData` is defined,
   * as for an `<input value>`, the form otherwise. A parent-owned form renders the prop as passed. A self-owned form
   * is seeded from `initialFormData` and the schema's defaults; `getFormData()` reads the result.
   *
   * @param props - The initial props for the `Form`
   */
  constructor(props: FormProps<T, S, F>) {
    super(props);

    if (!props.validator) {
      throw new Error('A validator is required for Form functionality to work');
    }

    const { formData, initialFormData, onChange, readonly, disabled } = props;
    const isControlled = formData !== undefined;
    if (isDevelopment && isControlled) {
      if (initialFormData !== undefined) {
        // oxlint-disable-next-line no-console
        console.warn(
          'Form: both `formData` and `initialFormData` are set; `initialFormData` is ignored. Pass `formData` for a form whose value you own and update from `onChange`, or `initialFormData` for one the form owns.',
        );
      }
      if (!onChange && !readonly && !disabled) {
        // oxlint-disable-next-line no-console
        console.warn(
          'Form: `formData` is set without an `onChange` handler, so the form will render this value and ignore every edit. Pass `initialFormData` to let the form own an editable value, `onChange` to accept its proposals into `formData`, or `readonly` for a fixed presentation.',
        );
      }
    }
    this.state = isControlled
      ? deriveControlledState(undefined, props)
      : deriveOwnedState(undefined, initialFormData, props);
    this.formElement = createRef();
  }

  /** In development, warns a self-owned form that is being handed `formData` it will ignore. `onChange` is never
   * called from here: it reports edits, and a prop change is not one. A parent that wants the defaults a self-owned
   * form added to its seed, or the data a schema change re-defaulted, reads `getFormData()`.
   *
   * @param prevProps - The previous props
   */
  componentDidUpdate(prevProps: FormProps<T, S, F>) {
    const { isControlled } = this.state;
    if (isDevelopment && !isControlled && prevProps.formData === undefined && this.props.formData !== undefined) {
      // oxlint-disable-next-line no-console
      console.warn(
        'Form: `formData` was set on a form that mounted without it. Ownership is decided at mount, so the form keeps its own data and ignores this value. To show data that arrives later, either mount the form only once the data is there (`key` it by the record to switch records), or mount it with a complete fallback such as `formData={record ?? {}}` and an `onChange` that stores each proposal.',
      );
    }
  }

  /** Drops the operations still queued: none of them has a form to commit to any more */
  componentWillUnmount() {
    this.queue.length = 0;
  }

  /** Validates the `formData` against the form's schema, returning the results.
   *
   * @param formData - The new form data to validate
   */
  validate = (formData: T | undefined): ValidationData<T> => validateFormData(this.props, this.state, formData);

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

  /** Queues an operation, running it at once when nothing else is running. The queue is also the reentrancy guard:
   * an operation a consumer's callback starts is queued behind the one that called it, so it never runs against
   * props the parent is still updating.
   *
   * @param run - The operation to queue; it must call the `advance` it is given once React has committed its result
   * @param [isChange=false] - Whether the operation is a change, whose live validation covers any change queued before it
   */
  private enqueue(run: QueuedOperation['run'], isChange = false) {
    this.queue.push({ run, isChange });
    if (this.queue.length === 1) {
      this.runQueueHead();
    }
  }

  /** Runs the operation at the head of the queue. An operation that throws before its commit is dropped so the queue
   * keeps moving; `advance` only acts for the operation still at the head, so a commit it scheduled before throwing
   * cannot advance a later one.
   *
   * @param [fromCommit=false] - Whether a `setState()` callback of the previous operation is running this one
   */
  private runQueueHead(fromCommit = false) {
    const head = this.queue[0];
    if (!head) {
      return;
    }
    const advance = () => {
      if (this.queue[0] === head) {
        this.queue.shift();
        this.runQueueHead(true);
      }
    };
    try {
      head.run(advance);
    } catch (error) {
      advance();
      if (!fromCommit) {
        throw error;
      }
      rethrowOutsideCommit(error);
    }
  }

  /** Queues a change to the field at `fieldPath`, see `processChange()`
   *
   * @param newValue - The new form data from a change to a field
   * @param fieldPath - The `FieldPath` of the change at which to set the formData
   * @param [newErrorSchema] - The new `ErrorSchema` based on the field change
   * @param [id] - The id of the field that caused the change
   */
  onChange = (newValue: T | undefined, fieldPath: FieldPath, newErrorSchema?: ErrorSchema<T>, id?: string) => {
    this.enqueue((advance) => this.processChange({ newValue, fieldPath, newErrorSchema, id }, advance), true);
  };

  /** Applies one `change` with `applyChange()` and does with the result the one thing that differs between the two
   * owners. A self-owned form commits it and then, once React has, calls `onChange` with what it committed. A
   * parent-owned form calls `onChange` with the result as a proposal and commits only what it owns itself: the custom
   * errors and the errors that go with them. Either way the queue advances once React
   * has committed, so the next change reads the parent's response to this one.
   *
   * @param change - The change to apply
   * @param advance - Advances the queue past this change
   */
  private processChange(change: PendingChange<T>, advance: () => void) {
    const { onChange } = this.props;
    const current = this.state;
    // If a later change is queued, skip live validation since it will happen with the last change
    const deferLiveValidate = this.queue.some((operation, index) => index > 0 && operation.isChange);
    const next = applyChange(current, change, this.props, deferLiveValidate);
    if (!current.isControlled) {
      this.setSharedState(current, next, () =>
        advanceAfter(advance, () => onChange?.(toIChangeEvent(this.state), change.id)),
      );
      return;
    }
    const isValidated = !deferLiveValidate && isLiveValidated(this.props);
    if (isDevelopment) {
      freezeFormData(next.formData);
    }
    try {
      onChange?.(toIChangeEvent(next), change.id);
    } finally {
      // Validated errors describe the proposal, which the parent may yet refuse, so they wait for the parent's
      // answer in `getDerivedStateFromProps`; without live validation they describe the committed data plus the
      // custom errors, which are the form's own. Committing is also what gives the queue a commit to wait for
      this.setSharedState(current, isValidated ? { ...current, customErrors: next.customErrors } : next, advance);
    }
  }

  /** Returns the form data currently rendered, see `FormHandle.getFormData()`: the `formData` prop of a parent-owned
   * form, the committed data of a self-owned one.
   */
  getFormData = (): T | undefined => this.state.formData;

  /** Resets the form, queued behind any change in flight. A self-owned form re-derives its data from
   * `initialFormData` and the schema the way an initial render does, clears every error and tells `onChange`. A
   * parent-owned form clears its own errors only: the data is the parent's to reset, by passing a new `formData`, so
   * nothing is proposed and `onChange` is not called. `extraErrors` are the parent's too and stay.
   */
  reset = () => {
    this.enqueue((advance) => {
      if (this.state.isControlled) {
        // `getDerivedStateFromProps` merges `extraErrors` back onto the cleared errors before the render
        const cleared: FormState<T, S, F> = {
          ...this.state,
          errors: [],
          errorSchema: {},
          schemaValidationErrors: [],
          schemaValidationErrorSchema: {},
          customErrors: undefined,
        };
        this.setSharedState(this.state, cleared, advance);
        return;
      }
      this.setSharedState(this.state, applyReset(this.state, this.props), () =>
        advanceAfter(advance, () => this.props.onChange?.(toIChangeEvent(this.state))),
      );
    });
  };

  /** Callback function to handle when a field on the form is blurred. Calls the `onBlur` callback for the `Form` if it
   * was provided. Also runs any live validation and/or live omit operations if the flags indicate they should happen
   * during `onBlur`. For a parent-owned form an omission is a proposal like any other: it goes to `onChange` and is
   * not rendered until the parent hands it back.
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
      // Queued like a change: a blur in the same tick as an edit must validate or omit the data that edit produced,
      // not the data from before it
      this.enqueue((advance) => this.processBlur(id, advance));
    }
  };

  /** Applies a blur's validation and omission with `applyBlur()`. A self-owned form commits the result and reports it;
   * a parent-owned form proposes the data and commits the errors, which the blur's validation owns.
   *
   * @param id - The unique `id` of the field that was blurred
   * @param advance - Advances the queue past this blur
   */
  private processBlur(id: string, advance: () => void) {
    const { onChange } = this.props;
    const committed = this.state;
    // Shared here so an unchanged error list keeps its reference and does not count as a change below
    const next = replaceEqualDeep(committed, applyBlur(committed, this.props));
    // Only the `IChangeEvent` members count; the validator's own results are not among them
    const hasChanges = (['formData', 'errors', 'errorSchema'] as const).some((key) => committed[key] !== next[key]);
    if (committed.isControlled) {
      if (isDevelopment) {
        freezeFormData(next.formData);
      }
      try {
        if (onChange && hasChanges) {
          onChange(toIChangeEvent(next), id);
        }
      } finally {
        this.setSharedState(committed, next, advance);
      }
      return;
    }
    this.setSharedState(committed, next, () =>
      advanceAfter(advance, () => {
        if (onChange && hasChanges) {
          onChange(toIChangeEvent(this.state), id);
        }
      }),
    );
  }

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
   * `formData` if `omitExtraData` is true. It will validate the resulting `formData`, reporting errors via the
   * `onError()` callback unless validation is disabled. Finally, it will add in any `extraErrors` and then call back
   * the `onSubmit` callback if it was provided. A self-owned form keeps the omitted data as its own; a parent-owned
   * form submits it without rendering it, since only the parent can change what it renders.
   *
   * @param event - The submit HTML form event
   */
  onSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (event.target !== event.currentTarget) {
      return;
    }

    event.persist();
    // Queued like a change: a submit in the same tick as an edit submits the data that edit produced
    this.enqueue((advance) => this.processSubmit(event, advance));
  };

  /** Validates and submits the data the form renders, see `onSubmit()`
   *
   * @param event - The submit HTML form event
   * @param advance - Advances the queue past this submit
   */
  private processSubmit(event: SubmitEvent<HTMLFormElement>, advance: () => void) {
    // oxlint-disable-next-line typescript/no-deprecated
    const { omitExtraData, noValidate, onSubmit } = this.props;
    let { formData: newFormData } = this.state;

    if (omitExtraData === true) {
      newFormData = this.state.schemaUtils.omitExtraData(this.state.schema, newFormData);
    }

    if (!noValidate && !this.validateFormWithFormData(newFormData)) {
      // The validation has committed its errors; the queue waits for that commit like any operation's
      this.setState((state) => state, advance);
      return;
    }
    // There are no errors generated through schema validation, so only the user-provided ones are shown
    this.setSharedState(this.state, applySubmit(this.state, this.props, newFormData), () =>
      advanceAfter(advance, () =>
        onSubmit?.(toIChangeEvent({ ...this.state, formData: newFormData }, 'submitted'), event),
      ),
    );
  }

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
    const { focusOnFirstError, onError } = this.props;
    const { hasError, next } = applyValidation(this.state, this.props, formData);
    const { errors } = next;
    if (hasError) {
      if (focusOnFirstError) {
        if (typeof focusOnFirstError === 'function') {
          focusOnFirstError(errors[0]);
        } else {
          this.focusOnError(errors[0]);
        }
      }
      this.setSharedState(this.state, next, () => {
        if (onError) {
          try {
            onError(errors);
          } catch (error) {
            rethrowOutsideCommit(error);
          }
        } else {
          // oxlint-disable-next-line no-console
          console.error('Form validation failed', errors);
        }
      });
    } else if (next !== this.state) {
      this.setSharedState(this.state, next);
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
      newFormData = this.state.schemaUtils.omitExtraData(this.state.schema, newFormData);
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
