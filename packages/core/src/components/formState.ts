import type {
  ErrorSchema,
  FieldPath,
  FieldPathList,
  FormContextType,
  GenericObjectType,
  StrictRJSFSchema,
  RJSFSchema,
  RJSFValidationError,
  SchemaContext,
  SchemaUtilsType,
  UiSchema,
  ValidationData,
} from '@rjsf/utils';
import {
  getByPath,
  setByPath,
  toPath,
  unsetByPath,
  createSchemaUtils,
  deepEquals,
  deepEqualsUndefinedAsMissing,
  ErrorSchemaBuilder,
  getChangedFields,
  getDiscriminatorFieldFromSchema,
  getUiOptions,
  getXxxOfKey,
  hashObject,
  isObject,
  isWholeValueSelect,
  isPlainObject,
  replaceEqualDeep,
  schemaHasNestedConditional,
  toErrorList,
  toErrorSchema,
  fieldPathFromList,
  fieldPathToList,
  UI_GLOBAL_OPTIONS_KEY,
  UI_OPTIONS_KEY,
  validationDataMerge,
  ERRORS_KEY,
  SCHEMA_KEY,
  ANY_OF_KEY,
  ONE_OF_KEY,
} from '@rjsf/utils';

import { buildRegistry } from '../Theme.ts';
import { ADDITIONAL_PROPERTY_KEY_REMOVE } from './constants.ts';
import type { FormProps, FormState } from './Form.tsx';
import type { EventFormData, IChangeEvent } from './IChangeEvent.ts';
import stalePathsForNewSchema from './stalePathsForNewSchema.ts';

/* The pure half of `Form`: what its state is derived from, and what each operation makes of it.
 *
 * Internal to `@rjsf/core`: `package.json` excludes `./lib/components/formState.js` from the `./lib/*.js` exports
 * wildcard so it can't be deep-imported, since a reachable subpath would have to keep working until the next major.
 */

/** The validation half of the state */
type ErrorState<T> = Pick<
  FormState<T>,
  'errors' | 'errorSchema' | 'schemaValidationErrors' | 'schemaValidationErrorSchema'
>;

/** The form data as an event hands it back. The overload is the one trust point for `EventFormData`'s promise that an
 * object or array root is never `undefined`.
 */
export function toEventFormData<T>(formData: T | undefined): EventFormData<T>;
export function toEventFormData(formData: unknown): unknown {
  return formData;
}

/** `setFieldValue()`'s value, which its run-time path keeps `unknown`, in the type a field's `onChange` hands over.
 * The overload is the one trust point that the caller passes what the field at that path holds, the promise a field's
 * own `onChange` makes.
 */
export function asFieldValue<V>(value: unknown): V | undefined;
export function asFieldValue(value: unknown): unknown {
  return value;
}

/** Converts the full `FormState` into the `IChangeEvent` version by picking out the public values
 *
 * @param state - The state of the form
 * @param status - The status provided by the onSubmit
 * @returns - The `IChangeEvent` for the state
 */
export function toIChangeEvent<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(state: FormState<T, S, F>, status?: IChangeEvent['status']): IChangeEvent<T, S, F> {
  const { schema, uiSchema, schemaUtils, formData, errors, errorSchema } = state;
  return {
    schema,
    uiSchema,
    schemaUtils,
    formData: toEventFormData(formData),
    errors,
    errorSchema,
    ...(status !== undefined && { status }),
  };
}

/** A field change, applied by `applyChange()` */
export interface PendingChange<T> {
  /** The `FieldPath` into the formData/errorSchema at which the `newValue`/`newErrorSchema` will be set */
  fieldPath: FieldPath;
  /** The new value to set into the formData */
  newValue?: T;
  /** The new errors to be set into the errorSchema, if any */
  newErrorSchema?: ErrorSchema<T>;
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
  | 'defaultsBehavior'
>;

/** Keeps the previous `schemaUtils` unless the props it was built from changed, in which case both it and the
 * nested-conditional flag, a pure function of its root schema, are rebuilt.
 */
function resolveSchemaUtils<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  prev: Pick<RenderContext<T, S, F>, 'schemaUtils' | 'hasNestedConditionalSchema'> | undefined,
): Pick<RenderContext<T, S, F>, 'schemaUtils' | 'hasNestedConditionalSchema'> {
  const { schema, validator, defaultFormStateBehavior, customMergeAllOf } = props;
  const schemaContext: SchemaContext<S, F> = { validator, defaultFormStateBehavior, customMergeAllOf };
  if (prev && !prev.schemaUtils.doesSchemaUtilsDiffer(schemaContext, schema)) {
    return prev;
  }
  const schemaUtils = createSchemaUtils<T, S, F>(schemaContext, schema);
  // A `dependencies`/`if` branch switch nested inside an object property never changes the ROOT retrieved schema (only
  // the schema's own top-level `dependencies`/`if` get resolved into it), so comparing the retrieved schema to the
  // previous one can't detect it (#5250). `hasNestedConditionalSchema` lets sanitization run anyway when that's
  // possible. It's a pure function of the root schema, so it only needs to be recomputed when `schemaUtils` (and thus
  // the root schema) is rebuilt.
  const rootSchema = schemaUtils.getRootSchema();
  return { schemaUtils, hasNestedConditionalSchema: schemaHasNestedConditional(rootSchema, rootSchema) };
}

const UI_EMPTY_VALUE_KEY = 'ui:emptyValue';

/** The `ui:emptyValue`s of `uiSchema`, each where it sits: the one part of a uiSchema the defaults of a re-derive are
 * computed from, since `ui:initialValue` applies on mount and `reset()` only. Anything else it holds, a title or a
 * widget written inline, leaves the data as it is (#5294)
 *
 * @param uiSchema - The uiSchema, or the part of one, to collect from
 * @returns - An object mirroring `uiSchema` down to each `emptyValue`, or undefined when it has none
 */
function emptyValuesOf(uiSchema: unknown): unknown {
  // ponytail: a function-form `items` is skipped, so an `emptyValue` it returns never triggers a re-derive
  if (!isPlainObject(uiSchema) && !Array.isArray(uiSchema)) {
    return undefined;
  }
  const found: GenericObjectType = {};
  // Read the way `getDefaultFormState()` reads it, so the two cannot disagree about where an `emptyValue` is
  const { emptyValue } = Array.isArray(uiSchema) ? {} : getUiOptions(uiSchema as UiSchema);
  if (emptyValue !== undefined) {
    found[UI_EMPTY_VALUE_KEY] = emptyValue;
  }
  Object.entries(uiSchema).forEach(([key, value]) => {
    if (key === UI_EMPTY_VALUE_KEY || key === UI_OPTIONS_KEY) {
      return;
    }
    const nested = emptyValuesOf(value);
    if (nested !== undefined) {
      found[key] = nested;
    }
  });
  return Object.keys(found).length > 0 ? found : undefined;
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
  // Defaulted the way `doesSchemaUtilsDiffer()` defaults it, so going from no settings to `{}` is not a change either
  const { uiSchema = {}, customValidate, transformErrors, defaultFormStateBehavior = {} } = props;
  const { schemaUtils, hasNestedConditionalSchema } = resolved;
  const rootSchema = schemaUtils.getRootSchema();
  // Shared before `replaceEqualDeep()` sees it, which compares a function by identity: an `arrayMinItems`
  // `computeSkipPopulate` written inline would then make every render look like a change of the settings. Settings
  // that spell a key out as `undefined` are the settings that leave it out
  const defaultsBehavior =
    prev && deepEqualsUndefinedAsMissing(prev.defaultsBehavior, defaultFormStateBehavior)
      ? prev.defaultsBehavior
      : defaultFormStateBehavior;
  return replaceEqualDeep(prev, {
    schemaUtils,
    schema: rootSchema,
    uiSchema,
    retrievedSchema,
    hasNestedConditionalSchema,
    registry: buildRegistry(props, rootSchema, schemaUtils),
    validationProps: { customValidate, transformErrors },
    defaultsBehavior,
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
export function validateFormData<T, S extends StrictRJSFSchema, F extends FormContextType>(
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
  // Falsy root values (`false`, `0`, `''`) are valid data, so only `undefined` skips the round trip (#5404).
  const serializedFormData = JSON.stringify(formData);
  const validationFormData = serializedFormData === undefined ? undefined : JSON.parse(serializedFormData);

  // The data handed to `customValidate` carries defaults computed here rather than inside the validator, so they honor
  // the `customMergeAllOf` and `defaultFormStateBehavior` this form was given, which a validator has no way to know.
  // They are the schema's defaults rather than this form's current ones: `initialDefaultsGenerated` is deliberately
  // left unset, as it was in v6, so `ui:initialValue` is applied again and a field the user has cleared reaches
  // `customValidate` holding its initial value. Passed as a function so the work happens only if the validator uses
  // it, and so defaults that come out `undefined` are still an answer rather than looking like no answer at all
  const getCustomValidateFormData = customValidate
    ? () => schemaUtils.getDefaultFormState(validationSchema, validationFormData, true, undefined, uiSchema) as T
    : undefined;
  const schemaValidation = schemaUtils
    .getValidator()
    .validateFormData(
      validationFormData,
      validationSchema,
      customValidate,
      transformErrors,
      uiSchema,
      getCustomValidateFormData,
    );
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

/** `errorSchema` without the `__errors` of the nodes `isDropped` names, and without the nodes that leaves empty, which
 * a raise at an ancestor would read as errors still being there. `path` is that of `errorSchema` itself
 */
function pruneErrorSchema(
  errorSchema: ErrorSchema,
  isDropped: (path: FieldPathList) => boolean,
  path: FieldPathList = [],
): ErrorSchema {
  const kept: ErrorSchema = {};
  for (const [key, value] of Object.entries(errorSchema)) {
    if (key === ERRORS_KEY) {
      if (!isDropped(path)) {
        kept[key] = value;
      }
    } else {
      const child = isPlainObject(value) ? pruneErrorSchema(value, isDropped, [...path, key]) : value;
      if (!isPlainObject(child) || Object.keys(child).length > 0) {
        kept[key] = child;
      }
    }
  }
  return kept;
}

/** `validation` without the errors at the paths `isDropped` names, the list and the `ErrorSchema` by one rule. The
 * error an invalid schema is reported with names no field, so it stays in both: the validators list it without a
 * `property` and file it under the `$schema` key of the `ErrorSchema`. A `transformErrors` may reword all the listed
 * one says, so it is known by those two alone
 */
function withoutErrors<T>(
  validation: ValidationData<T>,
  isDropped: (path: FieldPathList) => boolean,
): ValidationData<T> {
  const hasSchemaErrors = getByPath<string[]>(validation.errorSchema, [SCHEMA_KEY, ERRORS_KEY], []).length > 0;
  const isOfInvalidSchema = (error: RJSFValidationError) => hasSchemaErrors && error.property === undefined;
  // Without that error in the list, `$schema` is the path of a field like any other
  const keepsSchemaEntry = validation.errors.some(isOfInvalidSchema);
  return {
    errors: validation.errors.filter((error) => isOfInvalidSchema(error) || !isDropped(errorPath(error))),
    errorSchema: pruneErrorSchema(
      validation.errorSchema,
      (path) => !(keepsSchemaEntry && path.length === 1 && path[0] === SCHEMA_KEY) && isDropped(path),
    ),
  };
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

/** A value the stale-default search has dropped: where it was, what was there, and the schema that described the key
 * when that value was recorded, which is what a later iteration judges the fill's replacement against
 */
type DroppedValue<S> = [path: FieldPathList, value: unknown, schema: S | undefined];

/** How one data pass differs from the default, which just fills in the missing defaults */
interface DeriveDataOptions<T, S extends StrictRJSFSchema, F extends FormContextType> {
  /** Attempt to sanitize the data for a retrieved schema that changed. A function decides it only once the retrieved
   * schema is known to have changed, so a check it makes costs nothing on the passes that never sanitize
   */
  shouldSanitize?: boolean | ((schemaUtils: SchemaUtilsType<T, S, F>, retrievedSchema: S, formData: T) => boolean);
  /** This pass originated from `reset()`: it computes defaults the same way an initial render does even though the
   * instance has generated defaults before
   */
  isReset?: boolean;
  /** The path of the field whose change started this pass. Only a change has one, and `stalePathsForNewSchema()` is
   * its only reader: the value at that path is the user's rather than any branch's default, and a pass with no path
   * has no change to have swapped a subschema
   */
  changedPath?: FieldPathList;
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
  options: DeriveDataOptions<T, S, F>,
  props: FormProps<T, S, F>,
): DerivedData<T, S, F> {
  const { shouldSanitize = false, isReset = false, changedPath } = options;
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
  let sanitize = shouldSanitize;
  // Each value dropped as a swapped-away branch's default, keyed by its path: the keys let a repeat search skip a path
  // it has already reported, the paths let a later iteration judge the refill the fill has since written there, the
  // values let the pass put back one the fill never wrote, and the schemas say what the key held its value under
  const droppedStaleValues = new Map<FieldPath, DroppedValue<S>>();
  // The dropped paths that hold a value again, whether a fill wrote one or the restore below put the recorded one
  // back for a fill to read, so each one buys exactly one further iteration and the restores leave it alone from then
  // on: once the key holds something, the value the drop recorded is no longer the answer to it being empty — the
  // loop rejecting what is there is, and that value is a schema movement or more out of date
  const settledRefills = new Set<FieldPath>();
  do {
    formData = replaceEqualDeep(
      shareBase,
      schemaUtils.getDefaultFormState(rootSchema, defaultsFormData, false, initialDefaultsGenerated, uiSchema) as T,
    );
    // A dropped path the fill above declined to write goes back before anything else in this iteration reads its
    // absence. The drop has to be visible to that fill — deleting the key is what lets it write the newly selected
    // branch's default — but nothing past it may see the key-absent state: the schema is resolved for this data
    // next, and a key missing from it selects branches the real data never selects, which prunes a sibling the
    // resolved-with-the-key schema declares and commits a `retrievedSchema` that omits the key, so live validation
    // stops seeing it too
    let hasNewRefill = false;
    for (const [pathKey, [stalePath, droppedValue]] of droppedStaleValues) {
      if (getByPath(formData, stalePath) !== undefined) {
        if (!settledRefills.has(pathKey)) {
          settledRefills.add(pathKey);
          hasNewRefill = true;
        }
      } else if (!settledRefills.has(pathKey)) {
        formData = putBackAt(formData, stalePath, droppedValue, (held) => held === undefined, current?.formData);
      }
    }
    retrievedSchema = resolveRetrievedSchema(current, schemaUtils, formData);
    const mayNeedSanitizing = hasNestedConditionalSchema || retrievedSchema !== current?.retrievedSchema;
    if (mayNeedSanitizing && typeof sanitize === 'function') {
      // Asked once, since it decides about the change rather than about the data each pass settles
      sanitize = sanitize(schemaUtils, retrievedSchema, formData);
    }
    const isSanitizing = mayNeedSanitizing && sanitize === true;
    // Only hash when sanitizing, wrapping `formData` in an object to deal with a scalar/undefined value
    const formHash = isSanitizing ? hashObject({ formData }) : '';
    if (isSanitizing) {
      // Sanitizing itself is skipped for data already processed, but the stale-default search below is not: the
      // iteration that makes a second swap visible is often one whose data the fill left untouched, so its hash is
      // already here and the sanitize it would repeat is the only part worth skipping
      const isFormDataSanitized = preventInfiniteSanitize.includes(formHash);
      // Sanitize the form data if shouldSanitize is true, we haven't already processed this same formData AND
      // either the retrieved schema changed or the schema has a nested conditional that the check above can't see
      let sanitizedFormData = isFormDataSanitized
        ? formData
        : replaceEqualDeep(
            formData,
            schemaUtils.sanitizeDataForNewSchema(retrievedSchema, current?.retrievedSchema, formData),
          );
      // A path dropped on an earlier iteration has been refilled above with the newly selected branch's own default,
      // and the sanitize above is not the judge of it. It compares against `current.retrievedSchema` on every
      // iteration, never against what the previous one settled, so wherever the swap changed a type it reads the
      // refill as data the old branch could not hold and clears it — and the fill leaves an explicit `undefined`
      // alone, so what it cleared would end the loop empty. That is the #5349 symptom for precisely the property
      // this is meant to fix, hence judging the refills apart rather than widening what sanitize compares against.
      //
      // Each refill is judged at its own key, by the schema that describes it now against the one it was written
      // under, which is what the drop recorded and every later iteration replaces. The root pair cannot answer for
      // it: `retrieveSchema()` resolves the conditionals of the schema it is handed, so a swap decided inside a
      // property leaves the root schema the same object, and a refill one level down would never be judged at all.
      let withRefills = sanitizedFormData;
      for (const [pathKey, [stalePath, droppedValue, writtenUnder]] of droppedStaleValues) {
        const held = getByPath(formData, stalePath);
        // Resolved level by level for this iteration's data, then shared, so a key whose schema did not move is the
        // same object and costs nothing further. Only a key holding something is asked about: an empty one has
        // nothing to judge, and its record is what the next fill's replacement will be judged against
        const resolvedNow =
          held === undefined ? undefined : resolveSchemaAt<T, S, F>(schemaUtils, retrievedSchema, stalePath, formData);
        const keySchema = resolvedNow === undefined ? writtenUnder : replaceEqualDeep(writtenUnder, resolvedNow);
        const isRejected =
          writtenUnder !== undefined &&
          keySchema !== undefined &&
          keySchema !== writtenUnder &&
          isRefillRejected<T, S, F>(schemaUtils, stalePath, keySchema, writtenUnder, held);
        // A rejection takes the recorded value with it. The schema that now describes the key has moved off what was
        // there, and the value the drop recorded is the one the swap moved away from, so neither restore below has
        // anything left to put back: the key is the next fill's to answer, and if no fill answers it the data the
        // loop settles holds nothing there rather than something its own schema rejects
        droppedStaleValues.set(pathKey, [stalePath, isRejected ? undefined : droppedValue, keySchema]);
        if (isRejected) {
          // The schema this iteration settled rejects what is there, so the key goes rather than being reinstated
          // under a schema that no longer describes it — replacing one dropped key can select a branch that retypes
          // another. Deleted rather than left as the `undefined` sanitize wrote it, since an absent key is what the
          // fill at the top of the next iteration answers
          withRefills = copyAlongPath(withRefills, stalePath);
          unsetByPath(withRefills, stalePath);
        } else {
          // Reinstated whole wherever sanitize altered it: a retyped leaf *inside* a refill is cleared by the same
          // reasoning as a retyped key, and leaving that behind settles the key on a value neither branch declares.
          // What is there is either what the fill wrote for the newly selected branch, which the schema the data
          // arrived under has nothing to be right about, or the value the restore above put back for a drop no fill
          // has answered, which is reinstated on the restore's own terms: this pass has nothing better to offer
          withRefills = putBackAt(withRefills, stalePath, held, (value) => !deepEquals(value, held), current?.formData);
        }
      }
      if (withRefills !== sanitizedFormData) {
        // Shared again, so an iteration whose only change was undone here compares equal and ends the loop
        sanitizedFormData = replaceEqualDeep(formData, withRefills);
      }
      // Sanitizing leaves a value the branch just swapped away declared as its `default` in place, so the newly
      // selected branch's own `default` never reaches the key (#5349). Dropping each such key lets the fill at the
      // top of the next pass write the new one, which is why this runs here rather than after the loop.
      //
      // Searched on every sanitizing iteration, not just the first: the old side it compares against does not move
      // between them, but the new side does, since replacing one key's default can select a different branch for
      // another key one iteration later. What a repeat search must not do is report a path already dropped and drop
      // the value the fill has since written there — and since the data is committed below before the hashes are
      // consulted, that iteration could be the one whose hash ends the loop, leaving the key with no value at all.
      // The recorded paths are what rules that out, so they go in as the search's own skip list, where a dropped key
      // costs neither its two resolutions nor its two defaults computations rather than being reported for this loop
      // to discard
      if (areSchemaUtilsReused && changedPath !== undefined && current !== undefined) {
        const committedFormData = current.formData;
        const stalePaths = stalePathsForNewSchema(
          schemaUtils,
          retrievedSchema,
          current.retrievedSchema,
          formData,
          committedFormData,
          {
            changedPath,
            droppedPaths: droppedStaleValues,
            initialDefaultsGenerated,
            uiSchema,
          },
        );
        for (const stalePath of stalePaths) {
          const sanitizedValue = getByPath(sanitizedFormData, stalePath);
          // Sanitize compares a key's two declared defaults itself wherever the key holds a scalar — the branch whose
          // absence for a container is this whole fix's reason to exist — so a scalar it has already moved off what
          // the data arrived holding is its to own. Dropping it again would cost two defaults computations and a
          // refill to write the value that is there, and would record the new default rather than what the data
          // arrived holding as the value to put back. A container it merely edited, by clearing a retyped leaf
          // inside it, is not the same thing and is still this search's to report
          const isSanitizeOwned =
            sanitizedValue !== undefined &&
            !isObject(sanitizedValue) &&
            !Array.isArray(sanitizedValue) &&
            !deepEquals(sanitizedValue, getByPath(committedFormData, stalePath));
          if (!isSanitizeOwned) {
            // Recorded with the schema that describes the key while it still holds this value, which is what the
            // refill the next fill writes is judged against
            droppedStaleValues.set(fieldPathFromList(stalePath), [
              stalePath,
              sanitizedValue,
              resolveSchemaAt<T, S, F>(schemaUtils, retrievedSchema, stalePath, formData),
            ]);
            sanitizedFormData = copyAlongPath(sanitizedFormData, stalePath);
            unsetByPath(sanitizedFormData, stalePath);
          }
        }
      }
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
      if (!isFormDataSanitized) {
        preventInfiniteSanitize.push(formHash);
      }
    } else {
      wasSanitized = false;
    }
    // A drop's key holds a value for the first time — the fill's replacement, or the one the restore above put back —
    // so the loop goes round once more. Neither was seen by a fill that had the key: the fill ran with it deleted, so
    // it resolved that key's own conditionals against no value, and an `if` on the key's schema is vacuously true for
    // an absent key, which selects a `then` the value never selects and leaves whatever its `else` declares — a
    // `required` property among it — unwritten. Only a pass starting from the value sees what the key's own
    // conditionals declare for what is really there. Bounded, since each dropped path is counted once and the hash
    // guard still ends the loop on data it has already settled
    if (hasNewRefill) {
      defaultsFormData = formData;
      wasSanitized = true;
    }
  } while (wasSanitized);

  // A value is dropped on the strength of the newly selected branch's defaults holding something for its key, which
  // is what the fill normally writes there. It does not always get the chance: dropping the key can flip the very
  // branch that would have declared its replacement, a stale default can sit under a key whose presence in the
  // retrieved schema depended on the data holding it, and a nested level's defaults are computed as a root, where
  // the real fill knows whether its parent was required. The restore at the top of each iteration answers all of
  // those, since a drop is followed by a fill — except on the iteration that ends the loop. A drop makes the data
  // differ, so the loop is ended there by its hash alone, and `hashObject()` drops an `undefined` entry, so a key
  // sanitize cleared on an earlier iteration and the search has now dropped hashes to a pass already seen. That
  // iteration never reaches a fill, which is what this last restore is for. No input in the suite reaches it: the
  // restore at the top of each iteration answers every case the tests produce, so treat this one as a net rather
  // than as an exercised path.
  //
  // Restored only where no fill ever answered the drop. A path a fill did answer is left as the loop left it: what
  // emptied it is either the judge above rejecting the replacement, or a sanitize the replacement's own schema
  // movement called for, and the value the drop recorded answers neither — it is the value the swap moved away from,
  // a schema movement or more out of date, and writing it back would settle the key on data its schema rejects.
  // `retrievedSchema` is deliberately not resolved again for the restored data — the loop above has settled, and a
  // key the schema no longer describes is what the plain-object test on the parent guards against.
  for (const [pathKey, [stalePath, droppedValue]] of droppedStaleValues) {
    if (!settledRefills.has(pathKey)) {
      formData = putBackAt(formData, stalePath, droppedValue, (held) => held === undefined, current?.formData);
    }
  }

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
  /** Returns what changed in the `formData`; called only when live validation does not run, which is when it is needed
   * to clear the changed fields' errors
   */
  getDataChange?: () => DataChange;
}

/** What differs between two values of the form's data */
interface DataChange {
  /** The difference cannot be narrowed below the root: a primitive, an array of another length, or a change of type */
  isRootReplaced: boolean;
  /** The path of each field that differs, split the way `toErrorSchema()` splits an error's property, so the two
   * address the same entry. A key that splits to no segment at all, such as `''`, has its errors filed at the root, so
   * its path is the empty one
   */
  paths: FieldPathList[];
}

const UNCHANGED: DataChange = { isRootReplaced: false, paths: [] };

function dataChange(formData: unknown, previous: unknown): DataChange {
  if (Object.is(formData, previous)) {
    return UNCHANGED;
  }
  // The wrapper below would name the same paths for an object root, after a deep comparison of the whole root that
  // comparing its fields one by one makes a second time; the data of a parent-owned form is compared on every render
  // that hands it new data, so an object root is spared that
  if (isPlainObject(formData) && isPlainObject(previous)) {
    return { isRootReplaced: false, paths: getChangedFields(formData, previous, true).map((field) => toPath(field)) };
  }
  // Any other root is compared as the one property of a wrapper, so a root array is narrowed to its items the way an
  // array under a property is, and a difference that can't be narrowed comes back as the wrapper's own key:
  // `getChangedFields()` names the fields of an object, so it has no name for a replaced root
  const root = 'root';
  const fields = getChangedFields({ [root]: formData }, { [root]: previous }, true);
  return {
    isRootReplaced: fields.includes(root),
    paths: fields.map((field) => toPath(field).slice(1)),
  };
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
  const { isSchemaChanged = false, mustValidate, validationSchema, getDataChange = () => UNCHANGED } = options;
  if (mustValidate) {
    return runLiveValidation(props, context, formData, current?.customErrors, validationSchema);
  }
  // oxlint-disable-next-line typescript/no-deprecated
  const isErrorStateDropped = props.noValidate || isSchemaChanged;
  // If the `props.noValidate` option is set or the schema has changed, we reset the error state. Otherwise the base has
  // to be the validator's own result, since `extraErrors` and `customErrors` are merged in below and `state.errors`
  // already carries them, which would merge each in a second time
  let validation: ValidationData<T> = isErrorStateDropped
    ? { errors: [], errorSchema: {} }
    : {
        errors: current?.schemaValidationErrors ?? [],
        errorSchema: current?.schemaValidationErrorSchema ?? {},
      };
  const { isRootReplaced, paths } = isErrorStateDropped ? UNCHANGED : getDataChange();
  if (isRootReplaced) {
    // Every error the validator reported on a field describes the value that was replaced
    validation = withoutErrors(validation, () => true);
  } else if (paths.length > 0) {
    // A changed field's errors go, with those of everything below it. Every container holding the field changed along
    // with it, the root included, so an error of their own, such as the `uniqueItems` of the array the field sits in,
    // goes too. Only their own: the other fields they hold did not change and keep theirs
    validation = withoutErrors(validation, (pathOfError) =>
      paths.some(
        (pathOfField) =>
          isPathPrefix(pathOfError, pathOfField) || (pathOfField.length > 0 && isPathPrefix(pathOfField, pathOfError)),
      ),
    );
  }
  return {
    ...mergeErrors(validation, props.extraErrors, current?.customErrors),
    schemaValidationErrors: validation.errors,
    schemaValidationErrorSchema: validation.errorSchema,
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
export function isLiveValidated<T, S extends StrictRJSFSchema, F extends FormContextType>(props: FormProps<T, S, F>) {
  // oxlint-disable-next-line typescript/no-deprecated
  return !props.noValidate && props.liveValidate === 'onChange';
}

/** Whether the form validates its data when a field is blurred */
export function isBlurValidated<T, S extends StrictRJSFSchema, F extends FormContextType>(props: FormProps<T, S, F>) {
  // oxlint-disable-next-line typescript/no-deprecated
  return !props.noValidate && props.liveValidate === 'onBlur';
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
 * schema, a `ui:emptyValue` or `defaultFormStateBehavior` changed, since those are the props whose change transforms
 * the data (a default it did not have before, a branch that no longer applies). No other prop change runs this: an
 * unrelated re-render must not rerun value initialization, so `deriveState()` re-derives the render context alone for
 * those.
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
    mustValidate:
      current?.isBlurValidationOwed === true || mustLiveValidate(props, edit, isDataChanged || isValidationPropChanged),
    validationSchema: areSchemaUtilsReused ? retrievedSchema : undefined,
    // The committed data is the previous prop, shared, so unchanged subtrees are skipped by identity
    // The clearing stands in for the validation pass a live-validated form does not get, so it is for the other modes
    // only: when the pass is merely skipped, the committed errors already describe this data and stay as they are.
    // Construction has no committed errors to clear
    getDataChange:
      current === undefined || (edit && isLiveValidated(props))
        ? undefined
        : () => dataChange(formData, current.formData),
  });
  return {
    ...(current ?? { isControlled: true, initialDefaultsGenerated: true }),
    ...context,
    formData,
    edit,
    ...errors,
    isBlurValidationOwed: false,
  };
}

/** Freezes plain objects and arrays in `data`, and nothing else: a `File`, a `Date` or a class instance is left
 * alone. Development only, and only ever applied to form data: the form data a consumer receives shares subtrees with
 * the value the change was applied to, which for a parent-owned form is the parent's own object, so a mutation of it
 * corrupts the parent's state silently. Frozen, it throws where the mutation happens instead.
 *
 * @param data - The form data to freeze
 */
export function freezeFormData(data: unknown) {
  if ((!Array.isArray(data) && !isPlainObject(data)) || Object.isFrozen(data)) {
    return;
  }
  Object.freeze(data);
  for (const value of Object.values(data)) {
    freezeFormData(value);
  }
}

declare const process: { env: Record<string, string | undefined> };
/** Whether the development diagnostics run. Vite and esbuild replace `process.env.NODE_ENV` but not `typeof process`,
 * and a browser has no `process`, so only the replaced expression is read; the `catch` covers an environment that
 * neither replaces nor defines it. Because the check is hoisted into a `const`, a minifier cannot fold it, so the
 * diagnostics ship in production bundles too and only skip at run time.
 */
export const isDevelopment = (() => {
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

/** Returns `data` with `value` written back at `path`, or `data` unchanged where it must not be or need not be.
 *
 * Three callers put a dropped value back: the restore at the top of each sanitizing iteration and the one after the
 * loop, both undoing a drop no fill answered, and the reinstatement in between, which keeps the refill the fill has
 * since written. Nothing is written where there is no value to write, where `data` already holds it, or where the
 * container the path addresses is no longer an object. That last condition is what keeps the write honest:
 * `setByPath()` creates whatever the path is missing, so a sanitize that pruned or retyped an ancestor would
 * otherwise be answered by rebuilding a level the schema no longer describes.
 *
 * What differs between them is what counts as the value already being there, which is why the caller decides it: the
 * reinstatement writes its refill back wherever sanitize altered it at all, while the two restores only fill a gap
 * and must never overwrite what the fill chose to put there.
 *
 * `orderedLike` is where a re-added key's position among its siblings comes from, and only that key's: the object
 * keeps the order the fill gave it. Every object the fill produces carries its keys in the order the schema declares
 * them, whatever order they arrived in, so a `setByPath()` that appended would leave a value this fix means to leave
 * alone reported under a key order nothing else in `Form` produces — a change in its own right to a consumer that
 * serializes or diffs the data. Rebuilding in `orderedLike`'s order instead would move every sibling to make the one
 * key right.
 *
 * @param data - The data to write into
 * @param path - The path to write at
 * @param value - The value to write, where one is needed
 * @param isMissing - Reports, from the value `path` currently holds, whether `value` needs writing
 * @param orderedLike - The data to take the key order of a re-added key's object from
 * @returns - The data with `value` at `path`, or `data` itself when nothing was written
 */
function putBackAt<T>(
  data: T,
  path: FieldPathList,
  value: unknown,
  isMissing: (held: unknown) => boolean,
  orderedLike: unknown,
): T {
  if (value === undefined) {
    return data;
  }
  const parentPath = path.slice(0, -1);
  const parent = parentPath.length ? getByPath(data, parentPath) : data;
  if (!isPlainObject(parent)) {
    return data;
  }
  const key = path[path.length - 1];
  // Off the parent just walked rather than from the root, and by identity before the caller's test: an untouched
  // value is the same reference, which is the common case and the one `deepEquals()` allocates a cycle cache to answer
  const held = getByPath(parent, key);
  if (held === value || !isMissing(held)) {
    return data;
  }
  const template = parentPath.length ? getByPath(orderedLike, parentPath) : orderedLike;
  const arrivedOrder = isPlainObject(template) ? Object.keys(template) : [];
  const arrivedAt = arrivedOrder.indexOf(String(key));
  // A key the object still carries is written in place, which keeps its position, and is the common case: sanitize
  // clears a value it rejects rather than removing the key. Where nothing records where the key sat, appending is all
  // there is to do
  if (Object.hasOwn(parent, key) || arrivedAt < 0) {
    return setByPath(copyAlongPath(data, path), path, value);
  }
  // Ahead of the first sibling that followed the key in the data it arrived in, so the siblings keep the order the
  // fill gave them and only the key moves. A sibling the arrived data did not carry cannot say which side it belongs
  // on, so the key goes after it
  const ordered: GenericObjectType = {};
  let isWritten = false;
  Object.keys(parent).forEach((name) => {
    if (!isWritten && arrivedOrder.indexOf(name) > arrivedAt) {
      ordered[key] = value;
      isWritten = true;
    }
    ordered[name] = parent[name];
  });
  if (!isWritten) {
    ordered[key] = value;
  }
  return parentPath.length ? setByPath(copyAlongPath(data, parentPath), parentPath, ordered) : (ordered as T);
}

/** Returns the schema of the `property` of an object `schema` as it is rendered: the schema's own, or else that of the
 * `oneOf`/`anyOf` option `MultiSchemaField` renders for `formData`, which it picks as the closest match to it, looked up
 * the same way
 *
 * @param schemaUtils - The schema utilities to retrieve the options and pick among them with
 * @param schema - The object schema, retrieved for `formData`
 * @param property - The name of the property
 * @param formData - The object's data
 * @returns - The property's schema, or undefined when neither the schema nor any option it renders declares it
 */
function getPropertySchemaAt<T, S extends StrictRJSFSchema, F extends FormContextType>(
  schemaUtils: SchemaUtilsType<T, S, F>,
  schema: S,
  property: string,
  formData: T,
): S | undefined {
  const ownSchema = schema.properties?.[property];
  const xxxOfKey = getXxxOfKey<S>(schema);
  if (ownSchema !== undefined || !xxxOfKey) {
    return ownSchema as S | undefined;
  }
  const options = schema[xxxOfKey]!.map((option) => schemaUtils.retrieveSchema(option as S, formData));
  const discriminator = getDiscriminatorFieldFromSchema<S>(schema);
  const option = options[schemaUtils.getClosestMatchingOption(formData, options, 0, discriminator)];
  // The option is rendered by a `SchemaField` of its own, which renders the option's own `oneOf`/`anyOf` in turn
  return option && getPropertySchemaAt<T, S, F>(schemaUtils, option, property, formData);
}

/** Returns the schema of the field at `path` as it is rendered. The schema is retrieved at every step of the path, so
 * a field an `allOf`, a condition or a `oneOf`/`anyOf` option declares is found as it is rendered, and an array index
 * is followed through `items`. Resolving per level is the only way to see a conditional declared below the root:
 * `retrieveSchema()` resolves the ones on the schema it is handed, so the root's own resolution says nothing about
 * what a property's conditionals select for the data under it.
 *
 * @param schemaUtils - The schema utilities to retrieve and search the schema with
 * @param schema - The root schema, retrieved for `formData`
 * @param path - The path of the field
 * @param formData - The data the schema was retrieved for, which holds the field's value
 * @returns - The field's resolved schema, or undefined where the path leads somewhere the schema does not describe
 */
function resolveSchemaAt<T, S extends StrictRJSFSchema, F extends FormContextType>(
  schemaUtils: SchemaUtilsType<T, S, F>,
  schema: S,
  path: FieldPathList,
  formData: T,
): S | undefined {
  let fieldSchema = schema;
  let fieldData: unknown = formData;
  for (const segment of path) {
    let childSchema: S | undefined;
    if (typeof segment === 'number') {
      const { items, additionalItems } = fieldSchema;
      childSchema = (Array.isArray(items) ? (items[segment] ?? additionalItems) : items) as S | undefined;
    } else {
      childSchema = getPropertySchemaAt<T, S, F>(schemaUtils, fieldSchema, segment, fieldData as T);
    }
    if (!isObject(childSchema)) {
      return undefined;
    }
    fieldData = getByPath(fieldData, segment);
    fieldSchema = schemaUtils.retrieveSchema(childSchema, fieldData as T);
  }
  return fieldSchema;
}

/** Whether the schema that now describes a refilled key rejects what is there. The value was written by a fill
 * running under `oldSchema`, so that is what it has to be judged against, and `sanitizeDataForNewSchema()` is the one
 * judge of what a schema movement does to a value — the same judge the pass applies to the data as a whole, asked
 * about one key. Both sides are wrapped as that key's declaration so it is asked as the per-key question it is: asked
 * about a bare scalar schema it would answer that a schema with no `properties` clears everything.
 *
 * @param schemaUtils - The schema utilities to sanitize with
 * @param path - The path of the refilled key
 * @param newSchema - The schema that describes the key now
 * @param oldSchema - The schema the value there was written under
 * @param value - The value the key holds
 * @returns - True when sanitizing for the new schema does not leave the value as it is
 */
function isRefillRejected<T, S extends StrictRJSFSchema, F extends FormContextType>(
  schemaUtils: SchemaUtilsType<T, S, F>,
  path: FieldPathList,
  newSchema: S,
  oldSchema: S,
  value: unknown,
): boolean {
  const key = String(path[path.length - 1]);
  const judged = schemaUtils.sanitizeDataForNewSchema(
    { properties: { [key]: newSchema } } as unknown as S,
    { properties: { [key]: oldSchema } } as unknown as S,
    { [key]: value },
  );
  return !deepEquals(getByPath(judged, key), value);
}

/** Whether the field at `path` is a select over object or array constants. Changing one sets a single value, the way
 * changing a leaf does, rather than writing a container of values whose own fields raise their changes.
 *
 * @param schemaUtils - The schema utilities to retrieve and search the schema with
 * @param schema - The root schema, retrieved for `formData`
 * @param path - The path of the changed field
 * @param formData - The data the schema was retrieved for, which holds the field's new value
 * @returns - True when the field is such a select
 */
function isWholeValueSelectAt<T, S extends StrictRJSFSchema, F extends FormContextType>(
  schemaUtils: SchemaUtilsType<T, S, F>,
  schema: S,
  path: FieldPathList,
  formData: T,
): boolean {
  const fieldSchema = resolveSchemaAt<T, S, F>(schemaUtils, schema, path, formData);
  return fieldSchema !== undefined && isWholeValueSelect<S>(fieldSchema);
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
 * @returns - The next state, sharing every unchanged subtree with `current`
 */
export function applyChange<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  change: PendingChange<T>,
  props: FormProps<T, S, F>,
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
    isObject(formData) && Object.keys(formData).length > 0 && Object.values(formData).every((v) => v === undefined);
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
      !disabled &&
      !readonly &&
      // An object or array is otherwise written by a container, whose own fields raise the changes to its values
      (isObject(newValue) || Array.isArray(newValue)
        ? (schemaUtils: SchemaUtilsType<T, S, F>, retrievedSchema: S, changedData: T) =>
            isWholeValueSelectAt<T, S, F>(schemaUtils, retrievedSchema, path, changedData)
        : true);
    // Only the data and its context are derived here; the errors are reconciled below
    const derived = deriveFormData(current, inputForDefaults, { shouldSanitize, changedPath: path }, props);
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
  if (mustValidate) {
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
export function applyReset<T, S extends StrictRJSFSchema, F extends FormContextType>(
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
export function applyBlur<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  props: FormProps<T, S, F>,
): FormState<T, S, F> {
  const { omitExtraData, liveOmit } = props;
  const { schema, schemaUtils, customErrors, retrievedSchema } = current;
  const formData =
    omitExtraData === true && liveOmit === 'onBlur'
      ? schemaUtils.omitExtraData(schema, current.formData)
      : current.formData;
  const validation = isBlurValidated(props)
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
export function applyValidation<T, S extends StrictRJSFSchema, F extends FormContextType>(
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
  // Unlike the other `apply*` functions this one shares here rather than leaving it to `commit()`, because the caller
  // decides whether to commit at all by comparing the result to the state it started from
  return { hasError, next: replaceEqualDeep(current, next) };
}

/** The state after a valid submission: the submitted data, with `extraErrors` as the only errors on display
 *
 * @param current - The state at the submission
 * @param props - The current props
 * @param formData - The submitted data
 * @returns - The next state, sharing every unchanged subtree with `current`
 */
export function applySubmit<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  props: FormProps<T, S, F>,
  formData: T | undefined,
): FormState<T, S, F> {
  const { extraErrors } = props;
  return {
    ...current,
    formData,
    errors: extraErrors ? toErrorList(extraErrors) : [],
    errorSchema: extraErrors ?? {},
    schemaValidationErrors: [],
    schemaValidationErrorSchema: {},
  };
}

export function initialState<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
): FormState<T, S, F> {
  if (!props.validator) {
    throw new Error('A validator is required for Form functionality to work');
  }
  const { formData, initialFormData } = props;
  return formData !== undefined
    ? deriveControlledState(undefined, props)
    : deriveOwnedState(undefined, initialFormData, props);
}

/** Derives the state to render from the props and the committed `state`, so a parent's value is rendered the moment it
 * arrives, with no stale commit in between. Nothing is remembered about the previous props: every derived member is
 * shared against the committed state, so an unchanged input hands back the reference the fields already hold and a
 * changed one is recognized by the new reference; when nothing changed, `state` itself is handed back. A parent-owned
 * form derives its render context and errors for the `formData` prop; a self-owned form derives its render context,
 * transforming the data it holds only for a schema, `ui:emptyValue` or `defaultFormStateBehavior` change, since an
 * unrelated re-render must not rerun value initialization.
 *
 * @param props - The current props
 * @param state - The committed state
 * @returns - The state to render, `state` itself when nothing changed
 */
export function deriveState<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  state: FormState<T, S, F>,
): FormState<T, S, F> {
  if (state.isControlled) {
    return replaceEqualDeep(state, deriveControlledState(state, props));
  }
  const context = deriveRenderContext(props, state.retrievedSchema, state, resolveSchemaUtils(props, state));
  const { isSchemaChanged, isValidationPropChanged } = detectContextChanges(state, context);
  // Rebuilt schema utilities are not on their own a reason to rerun value initialization: they are rebuilt for a
  // recreated `validator` or `customMergeAllOf` as well, which parents commonly write inline, and re-deriving there
  // replaces data the user cleared or switched away from with the very default it came from (#5294). Only the props
  // that decide what the data should be do: the schema, the uiSchema's `ui:emptyValue`s, and the settings that decide
  // how the defaults are computed
  const isEmptyValueChanged =
    context.uiSchema !== state.uiSchema && !deepEquals(emptyValuesOf(context.uiSchema), emptyValuesOf(state.uiSchema));
  if (isSchemaChanged || isEmptyValueChanged || context.defaultsBehavior !== state.defaultsBehavior) {
    return replaceEqualDeep(state, deriveOwnedState(state, state.formData, props));
  }
  // Resolved only once it is known the data is not re-derived, which resolves it itself
  const resolvedContext = {
    ...context,
    retrievedSchema: resolveRetrievedSchema(state, context.schemaUtils, state.formData),
  };
  const errors = reconcileErrors(state, props, resolvedContext, state.formData, {
    mustValidate: mustLiveValidate(props, state.edit, isValidationPropChanged),
    validationSchema: context.schemaUtils === state.schemaUtils ? resolvedContext.retrievedSchema : undefined,
  });
  return replaceEqualDeep(state, { ...state, ...resolvedContext, ...errors });
}
