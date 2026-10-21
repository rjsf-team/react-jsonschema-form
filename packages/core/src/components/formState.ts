import type {
  ErrorSchema,
  FieldPath,
  FieldPathList,
  FormContextType,
  GenericObjectType,
  StrictRJSFSchema,
  RJSFSchema,
  SchemaContext,
  SchemaUtilsType,
  UiSchema,
  ValidationData,
} from '@rjsf/utils';
import {
  getByPath,
  setByPath,
  propertyToPath,
  toPath,
  unsetByPath,
  createSchemaUtils,
  deepEquals,
  deepEqualsUndefinedAsMissing,
  errorSchemaChild,
  getChangedFields,
  getSchemaType,
  getUiOptions,
  hashObject,
  isObject,
  isPlainObject,
  mergeObjects,
  replaceEqualDeep,
  setOwn,
  toErrorList,
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
import type { FieldTree } from './sanitizeFieldTree.ts';
import sanitizeFieldTree from './sanitizeFieldTree.ts';
import { createUiState, fieldStateOf, isPathPrefix } from './uiState.ts';

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

/** The errors a change leaves: those on display, the validator's, and the fields' own they are built from */
type ChangedErrorState<T> = ErrorState<T> & Pick<FormState<T>, 'customErrors'>;

/** The error members of `state` that a change works on */
function errorStateOf<T, S extends StrictRJSFSchema, F extends FormContextType>({
  errors,
  errorSchema,
  schemaValidationErrors,
  schemaValidationErrorSchema,
  customErrors,
}: FormState<T, S, F>): ChangedErrorState<T> {
  return { errors, errorSchema, schemaValidationErrors, schemaValidationErrorSchema, customErrors };
}

/** The form data as an event hands it back. The overload is the one trust point for `EventFormData`'s promise that an
 * object or array root is never `undefined`.
 */
export function toEventFormData<T>(formData: T | undefined): EventFormData<T>;
export function toEventFormData(formData: unknown): unknown {
  return formData;
}

/** What `getDefaultFormState()` fills the root schema's defaults into, as the form's data. The overload is the one
 * trust point that the defaults of the form's own schema are data of the form's type.
 */
function asFilledFormData<T>(filled: unknown): T;
function asFilledFormData(filled: unknown): unknown {
  return filled;
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

/** A field change, applied by `applyChangeToData()` and `applyChangeToErrorsOf()` */
export interface FieldChange<T> {
  /** The `FieldPath` into the formData/errorSchema at which the `newValue`/`newErrorSchema` will be set */
  fieldPath: FieldPath;
  /** The new value to set into the formData */
  newValue?: T;
  /** The field's own errors at `fieldPath`, if it raises any */
  newErrorSchema?: ErrorSchema<T>;
  /** For a change that moved what the array or object at `fieldPath` holds, where each key went; the errors under a
   * key go with it
   */
  newKeyOf?: KeyMove;
  /** For a change that moved keys, where the fields' own errors under each key went when not where the validator's
   * did; see `AnnouncedMove`
   */
  newOwnKeyOf?: KeyMove;
  /** For a change that moved keys, whether the errors raised at `fieldPath` itself go too; see `AnnouncedMove` */
  dropsOwnErrors?: boolean;
  /** Whether the fields' own errors stay as they are: a change no field made, such as the data a `transformChange`
   * writes over an edit, says nothing of what any field raised
   */
  keepsOwnErrors?: boolean;
  /** For a root write over an edit, such as `transformChange`'s, the path of a field the edit cleared: left without a
   * value in the root write too, it stays cleared whatever defaults the root write merges in, as it did under the edit
   */
  clearedPath?: FieldPathList;
  /** For a root write that stands for an edit, as the data a `transformChange` writes over one does, the path of the
   * field the edit changed: the write is sanitized for a schema its data switches as the edit would be, with the value
   * at that path the user's. Any other root write, such as `setFieldValue('', data)`, is taken as written
   */
  editedPath?: FieldPathList;
}

/** What became of a change that moved keys, see `FormDataAccess.sendMove()`: refused by `transformChange`, which leaves
 * the keys where they were, or stored, with `kept`, what the form stored at the change's path. A change `transformChange`
 * rewrote also has `edited`, what the change alone would have left there, for a field to tell which of the keys it
 * moved still hold what it moved there
 */
export type MoveOutcome =
  | { kind: 'refused' }
  | { kind: 'taken'; kept: unknown }
  | { kind: 'rewritten'; kept: unknown; edited: unknown };

/** Where a change put what an array or object held under `key`: the new key, or `undefined` when it is gone */
export type KeyMove = (key: string) => string | undefined;

/** A change being made to the data: its path, and where it moved the keys of the array or object there, if it moved
 * any
 */
export interface FieldEdit {
  path: FieldPathList;
  newKeyOf?: KeyMove;
}

/** A `KeyMove` with the path of the array or object whose keys it moved */
export interface AnnouncedMove {
  fieldPath: FieldPath;
  /** The value the field sends with the move. A change at `fieldPath` that brings another value, which a custom parent
   * field put in its place, is not the change the move describes, so it moves nothing
   */
  value: unknown;
  /** Where each key went. A change that moves no key, such as a property's removal, leaves it out: it is announced only
   * so the field learns what became of it
   */
  newKeyOf?: KeyMove;
  /** Where the fields' own errors under each key went, when not where the validator's did: an option switch drops
   * what was raised under a key the new option declares too, since another widget renders for it, while the
   * validator's errors there describe a constraint the new option may well share
   */
  newOwnKeyOf?: KeyMove;
  /** Whether the errors raised at `fieldPath` itself go with the move. A reorder or rename leaves the array or object
   * that raised them in place, so they stay; an option switch renders another field at the path, so a raise of the
   * option's widget would be shown by one that never made it
   */
  dropsOwnErrors?: boolean;
}

/** The `KeyMove` of an array whose items went where `newIndexOf` says, `undefined` for one that was removed. A key that
 * names no item stays where it is
 */
export function moveOfItems(newIndexOf: (index: number) => number | undefined): KeyMove {
  return (key) => (/^(0|[1-9]\d*)$/.test(key) ? newIndexOf(Number(key))?.toString() : key);
}

/** The part of the state that rendering derives from the props and the data alone: the schema utilities, the root and
 * resolved schemas, the uiSchema and the registry. Error bookkeeping is the rest of `FormState`.
 */
type RenderContext<T, S extends StrictRJSFSchema, F extends FormContextType> = Pick<
  FormState<T, S, F>,
  | 'schemaUtils'
  | 'schema'
  | 'uiSchema'
  | 'retrievedSchema'
  | 'uiState'
  | 'registry'
  | 'validationProps'
  | 'defaultsBehavior'
>;

/** Keeps the previous `schemaUtils` unless the props it was built from changed */
function resolveSchemaUtils<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  prev: Pick<RenderContext<T, S, F>, 'schemaUtils'> | undefined,
): SchemaUtilsType<T, S, F> {
  const { schema, validator, defaultFormStateBehavior, customMergeAllOf } = props;
  const schemaContext: SchemaContext<S, F> = { validator, defaultFormStateBehavior, customMergeAllOf };
  if (prev && !prev.schemaUtils.doesSchemaUtilsDiffer(schemaContext, schema)) {
    return prev.schemaUtils;
  }
  return createSchemaUtils<T, S, F>(schemaContext, schema);
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
      setOwn(found, key, nested);
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
 * @param schemaUtils - The schema utilities for `props`, already resolved by the caller
 * @returns - The render context for the inputs
 */
function deriveRenderContext<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  retrievedSchema: S,
  prev: RenderContext<T, S, F> | undefined,
  schemaUtils: SchemaUtilsType<T, S, F>,
): RenderContext<T, S, F> {
  // Defaulted the way `doesSchemaUtilsDiffer()` defaults it, so going from no settings to `{}` is not a change either
  const { uiSchema = {}, customValidate, transformErrors, defaultFormStateBehavior = {} } = props;
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
    uiState: prev?.uiState ?? createUiState(),
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
  customErrors?: ErrorSchema<T>,
): ValidationData<T> {
  // With `preventDuplicates`, a message a field already carries is shown on it once and listed once, the raised errors
  // after the validator's and `extraErrors`
  const withExtra = validationDataMerge(schemaValidation, extraErrors, true);
  const { errors, errorSchema } = validationDataMerge(withExtra, customErrors, true);
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
 * @param [editedPath] - The path of the edit `formData` carries, if any, see `fieldStateOf()`
 */
export function validateFormData<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  context: RenderContext<T, S, F>,
  formData: T | undefined,
  retrievedSchema?: S,
  editedPath?: FieldPathList,
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
    fieldStateOf(context.uiState, schemaUtils, editedPath),
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
 * @param [editedPath] - The path of the edit `formData` carries, if any, see `fieldStateOf()`
 * @returns - An object containing `errorSchema`, `errors`, `schemaValidationErrors` and `schemaValidationErrorSchema`
 */
function runLiveValidation<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  context: RenderContext<T, S, F>,
  formData: T | undefined,
  customErrors?: ErrorSchema<T>,
  retrievedSchema?: S,
  editedPath?: FieldPathList,
) {
  const schemaValidation = validateFormData(props, context, formData, retrievedSchema, editedPath);
  const { errors: schemaValidationErrors, errorSchema: schemaValidationErrorSchema } = schemaValidation;
  const mergedErrors = mergeErrors(schemaValidation, props.extraErrors, customErrors);
  return { ...mergedErrors, schemaValidationErrors, schemaValidationErrorSchema };
}

/** A copy of `errorSchema` without the `__errors` of the nodes `isDropped` names, and without the nodes that hold
 * nothing, an empty `__errors` or a `null` or `undefined` child included, which a raise at an ancestor would read as
 * errors still being there. `path` is that of `errorSchema` itself. An array a raise holds for the items of an array
 * field is copied as the object keyed by index that `toErrorSchema()` builds, which is what the paths here and the
 * merges walk
 */
function pruneErrorSchema(
  errorSchema: ErrorSchema,
  isDropped: (path: FieldPathList) => boolean,
  path: FieldPathList = [],
): ErrorSchema {
  const kept: ErrorSchema = {};
  for (const [key, value] of Object.entries(errorSchema)) {
    if (key === ERRORS_KEY) {
      if (Array.isArray(value) && value.length > 0 && !isDropped(path)) {
        // Copied, so the form does not hold on to an array the field that raised it may go on to change
        kept[key] = [...value];
      }
    } else if (value != null) {
      const node = errorSchemaChild(key, value);
      const child = node ? pruneErrorSchema(node, isDropped, [...path, key]) : value;
      if (!isPlainObject(child) || Object.keys(child).length > 0) {
        setOwn(kept, key, child);
      }
    }
  }
  return kept;
}

/** The messages of the error an invalid schema is reported with, if any. It names no field: the validators list it
 * without a `property` and file it under the `$schema` key of the `ErrorSchema`, where the errors of a property named
 * `$schema` are filed too, so it is what sits there that no listed error of that property says. A `transformErrors`
 * may reword all the listed one says, so it is known by those two alone: without a listed error that names no field,
 * `$schema` is the path of a field like any other
 */
function invalidSchemaMessages<T>({ errors, errorSchema }: ValidationData<T>): string[] {
  if (!errors.some((error) => error.property === undefined)) {
    return [];
  }
  const ofProperty = new Set(
    errors.filter((error) => String(propertyToPath(error.property)) === SCHEMA_KEY).map((error) => error.message),
  );
  return getByPath<string[]>(errorSchema, [SCHEMA_KEY, ERRORS_KEY], []).filter((message) => !ofProperty.has(message));
}

/** `validation` without the errors at the paths `isDropped` names, the list and the `ErrorSchema` by one rule. The
 * error an invalid schema is reported with names no field, so it stays in both; see `invalidSchemaMessages()`
 */
function withoutErrors<T>(
  validation: ValidationData<T>,
  isDropped: (path: FieldPathList) => boolean,
): ValidationData<T> {
  const invalidSchema = invalidSchemaMessages(validation);
  const hasInvalidSchema = invalidSchema.length > 0;
  const errorSchema = pruneErrorSchema(validation.errorSchema, isDropped);
  return {
    errors: validation.errors.filter(
      (error) => (hasInvalidSchema && error.property === undefined) || !isDropped(propertyToPath(error.property)),
    ),
    errorSchema:
      hasInvalidSchema && isDropped([SCHEMA_KEY])
        ? { ...errorSchema, [SCHEMA_KEY]: { [ERRORS_KEY]: invalidSchema } }
        : errorSchema,
  };
}

/** `getByPath()` reading an empty path as the root itself. The overload is the one trust point that the value at a
 * path has the type its reader names: the type a field renders for the form's data, an `ErrorSchema` node for an
 * `ErrorSchema`.
 */
export function getAt<V>(data: unknown, segments: FieldPathList): V;
export function getAt(data: unknown, segments: FieldPathList): unknown {
  return segments.length === 0 ? data : getByPath(data, segments);
}

/** A copy of `errorSchema` with the node at `path` replaced by `node`. A `node` that holds nothing is gone, with the
 * ancestors that leaves empty, which a raise at one of them would read as errors still being there
 */
function replaceErrorSchemaNode<T>(
  errorSchema: ErrorSchema<T>,
  path: FieldPathList,
  node: ErrorSchema<T>,
): ErrorSchema<T> {
  if (path.length === 0) {
    return node;
  }
  // An `ErrorSchema` nests plain objects even at numeric segments, so never auto-vivify arrays
  const replaced = setByPath(copyAlongPath(errorSchema, path), path, node, true);
  // Every container along `path` is a copy or newly made, so unsetting in place touches nothing the state holds
  for (let depth = path.length; depth > 0; depth--) {
    const ancestor = path.slice(0, depth);
    if (Object.keys(getByPath<object>(replaced, ancestor, {})).length > 0) {
      break;
    }
    unsetByPath(replaced, ancestor);
  }
  return replaced;
}

/** `errorSchema` after the keys of the array or object at `path` moved: the errors under each key sit under its new
 * one and those under a key that is gone are gone. Its own, such as `minItems`, belong to no key and stay
 */
function moveErrorSchemaKeys<T>(errorSchema: ErrorSchema<T>, path: FieldPathList, newKeyOf: KeyMove): ErrorSchema<T> {
  const moved: ErrorSchema = {};
  for (const [key, node] of Object.entries(getAt<ErrorSchema | undefined>(errorSchema, path) ?? {})) {
    const newKey = key === ERRORS_KEY ? key : newKeyOf(key);
    if (newKey !== undefined) {
      // A rename onto a key that holds errors, such as a declared property the data lacks, keeps both
      setOwn(moved, newKey, Object.hasOwn(moved, newKey) ? mergeObjects(moved[newKey], node, true) : node);
    }
  }
  return replaceErrorSchemaNode(errorSchema, path, moved);
}

/** `validation` after the keys of the array or object at `path` moved, the list by the rule `moveErrorSchemaKeys()`
 * moves the `ErrorSchema` by. A moved error keeps what the validator said of it, under its new `property`
 */
function moveErrorKeys<T>(validation: ValidationData<T>, path: FieldPathList, newKeyOf: KeyMove): ValidationData<T> {
  const errors = validation.errors.flatMap((error) => {
    const pathOfError = propertyToPath(error.property);
    const key = isPathPrefix(path, pathOfError) ? pathOfError[path.length] : undefined;
    const newKey = key === undefined ? key : newKeyOf(key);
    if (newKey === key) {
      return [error];
    }
    if (newKey === undefined) {
      return [];
    }
    const property = `.${[...pathOfError.slice(0, path.length), newKey, ...pathOfError.slice(path.length + 1)].join('.')}`;
    // A stack that names the field by its title instead of its `property` says nothing of the key
    const isStackOfProperty = error.stack === `${error.property} ${error.message}`;
    return [{ ...error, property, stack: isStackOfProperty ? `${property} ${error.message}` : error.stack }];
  });
  return { errors, errorSchema: moveErrorSchemaKeys(validation.errorSchema, path, newKeyOf) };
}

/** What a change says of the field's own errors: its raise, with the removal of a key counting as an empty one, since
 * nothing is left at its path for an error to describe
 */
function raiseOf<T>({ newValue, newErrorSchema }: FieldChange<T>): ErrorSchema<T> | undefined {
  return newErrorSchema ?? (newValue === ADDITIONAL_PROPERTY_KEY_REMOVE ? {} : undefined);
}

/** The fields' own errors of `current` after `change`, by the rules of `applyChangeToErrors()`: the part of what a
 * change does to the errors that needs no validator result, which is all that live validation keeps of it
 *
 * @param current - The state the change applies to
 * @param change - The change
 * @returns - The fields' own errors after the change, `current`'s own when the change left them as they were
 */
function ownErrorsAfterChange<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  change: FieldChange<T>,
): ErrorSchema<T> | undefined {
  const { fieldPath, newKeyOf, newOwnKeyOf, dropsOwnErrors, keepsOwnErrors } = change;
  if (keepsOwnErrors) {
    return current.customErrors;
  }
  const path = fieldPathToList(fieldPath);
  const raised = raiseOf(change);
  let { customErrors } = current;
  const hasOwnErrors = getByPath<string[]>(customErrors, [...path, ERRORS_KEY], []).length > 0;
  if (newKeyOf && customErrors) {
    customErrors = moveErrorSchemaKeys(customErrors, path, newOwnKeyOf ?? newKeyOf);
  }
  if (raised) {
    // A copy without what holds nothing, so the form neither holds an object the field may go on to change, such as
    // the `ErrorSchema` of a builder it keeps, nor walks an empty `__errors` on every later merge
    customErrors = replaceErrorSchemaNode(
      customErrors ?? {},
      path,
      pruneErrorSchema(raised, () => false),
    );
  } else if (customErrors && hasOwnErrors && (!newKeyOf || dropsOwnErrors)) {
    customErrors = pruneErrorSchema(
      customErrors,
      (pathOfError) => pathOfError.length === path.length && isPathPrefix(path, pathOfError),
    );
  }
  // An empty raise leaves none, rather than a `{}` every later merge would walk
  return customErrors && Object.keys(customErrors).length === 0 ? undefined : customErrors;
}

/** The errors of `current` after `change`, before any validation of the changed data. The fields' own errors are kept
 * apart from the validator's, which the next validation and a parent replacing the data both rewrite, so a field's
 * raise outlives either until the field raises again (#5347).
 *
 * A change that moved the keys of an array or object, an item to another index or a property to another name, moves
 * the errors of both with them, drops those under a key that is gone, and leaves the container's own where they are
 * unless it says they go too, as an option switch does. The validator's errors of the fields whose values the change
 * replaced, `changed`, go the way `reconcileErrors()` drops them for replaced data: they describe values that are
 * gone, and the next validation rewrites them anyway. One that raises errors replaces the field's own at its path,
 * an empty raise included, and takes the validator's off that path until the form validates again: the raise is the
 * field's say over its path. One that removes the key at its path counts as an empty raise. Any other change clears
 * the field's own `__errors` there.
 *
 * @param current - The state the change applies to
 * @param change - The change
 * @param extraErrors - The `extraErrors` prop, which the displayed errors carry
 * @param getDataChange - Returns what the change replaced in the data, see `dataChange()`; called only when there are
 * validator errors to clear
 * @returns - The error members of the state after the change, `current`'s own when the change left them as they were
 */
function applyChangeToErrors<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  change: FieldChange<T>,
  extraErrors: ErrorSchema<T> | undefined,
  getDataChange: () => DataChange,
): ChangedErrorState<T> {
  const { fieldPath, newKeyOf } = change;
  const customErrors = ownErrorsAfterChange(current, change);
  const raised = raiseOf(change);
  // Diffing the data is what a keystroke would otherwise cost every form, so it is skipped when no validator error is
  // there to clear
  const changed = current.schemaValidationErrors.length > 0 ? getDataChange() : UNCHANGED;
  const isDataChanged = changed.isRootReplaced || changed.paths.length > 0;
  if (!newKeyOf && !raised && customErrors === current.customErrors && !isDataChanged) {
    return errorStateOf(current);
  }
  const path = fieldPathToList(fieldPath);
  // The validator's own result is the base `extraErrors` and the fields' own errors are merged onto again, as in
  // `reconcileErrors()`: `errors` and `errorSchema` already carry them, so merging onto those would add each a second
  // time on every change (#5041)
  let validation: ValidationData<T> = {
    errors: current.schemaValidationErrors,
    errorSchema: current.schemaValidationErrorSchema,
  };
  if (newKeyOf) {
    validation = moveErrorKeys(validation, path, newKeyOf);
  }
  validation = withoutErrorsOfChanged(validation, changed);
  if (raised) {
    validation = withoutErrors(validation, (pathOfError) => isPathPrefix(path, pathOfError));
  }
  return {
    ...mergeErrors(validation, extraErrors, customErrors),
    schemaValidationErrors: validation.errors,
    schemaValidationErrorSchema: validation.errorSchema,
    customErrors,
  };
}

/** The data a derivation pass settles on, with what it took to get there */
interface DerivedData<T, S extends StrictRJSFSchema, F extends FormContextType> {
  /** The data after defaults and, when asked for, sanitization */
  formData: T | undefined;
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
 * equal by identity.
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
  /** Sanitize the data against the field tree of the state before this pass, see `sanitizeFieldTree()` */
  isSanitized?: boolean;
  /** The change this pass is for, if any: the value at its path is the user's */
  edit?: FieldEdit;
  /** This pass originated from `reset()`: it computes defaults the same way an initial render does even though the
   * instance has generated defaults before
   */
  isReset?: boolean;
}

/** Settles the data for `props` and `inputFormData`: any missing required defaults are filled in, then, when asked,
 * the result is sanitized for the field tree it builds against the tree before the change, and filled again, until the
 * two stop moving. Each round diffs against the tree of the data the round before sanitized, so a value the loop
 * wrote is judged against the schema it was written for. Every caller that needs derived data goes through here, so
 * the resolved schema and the data it describes are always produced together.
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
  const { isSanitized = false, edit, isReset = false } = options;
  const { uiSchema = {} } = props;
  const schemaUtils = resolveSchemaUtils(props, current);
  const areSchemaUtilsReused = schemaUtils === current?.schemaUtils;
  const rootSchema = schemaUtils.getRootSchema();
  // The data is shared against the committed data when there is some, so an unchanged subtree keeps the reference the
  // fields hold; on construction, against the caller's own value
  const shareBase = current ? current.formData : inputFormData;
  // A reset re-runs the same "initial" defaults pass a first render does, so `ui:initialValue` applies again even
  // though this instance has generated defaults before.
  const initialDefaultsGenerated = (current?.initialDefaultsGenerated ?? false) && !isReset;
  const fill = (data: T | undefined) =>
    replaceEqualDeep(
      shareBase,
      asFilledFormData<T>(schemaUtils.getDefaultFormState(rootSchema, data, false, initialDefaultsGenerated, uiSchema)),
    );
  let formData = fill(inputFormData);
  const treeOf = (data: T | undefined): FieldTree<T, S, F> => ({
    schemaUtils,
    formData: data,
    retrievedSchema: resolveRetrievedSchema(current, schemaUtils, data),
  });
  let tree = treeOf(formData);
  if (isSanitized && current) {
    const seen: string[] = [];
    let previous: FieldTree<T, S, F> = current;
    let roundEdit = edit;
    for (;;) {
      const sanitized = replaceEqualDeep(formData, sanitizeFieldTree(previous, tree, current.uiState, roundEdit));
      // Wrapped in an object to deal with a scalar or `undefined` value. Data a round has already produced would only
      // produce it again, which ends a loop of conditions that flip each other. It ends filled, as every other pass
      // does, so a default the round dropped is there again
      if (sanitized === formData) {
        break;
      }
      const hash = hashObject({ formData: sanitized });
      if (seen.includes(hash)) {
        formData = fill(sanitized);
        break;
      }
      seen.push(hash);
      previous = tree;
      // Only the first round diffs against the data before the move: every later one diffs against data already moved
      roundEdit = edit && { path: edit.path };
      formData = fill(sanitized);
      tree = treeOf(formData);
    }
  }
  const { retrievedSchema } = tree.formData === formData ? tree : treeOf(formData);
  // Always derived, never skipped on the grounds that the schema utilities were reused: the registry is built from
  // `idPrefix`, `widgets`, `templates`, `fields`, `formContext` and `uiSchema` too, none of which the utilities are
  // resolved from. `deriveRenderContext()` shares its result against `current`, so an unchanged context keeps every
  // reference the fields hold.
  const context = deriveRenderContext(props, retrievedSchema, current, schemaUtils);
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
  // comparing its fields one by one makes a second time, so an object root is spared that
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

/** `validation` without the errors of the fields `changed` names: a changed field's errors go, with those of
 * everything below it. Every container holding the field changed along with it, the root included, so an error of
 * their own, such as the `uniqueItems` of the array the field sits in, goes too. Only their own: the other fields they
 * hold did not change and keep theirs. A replaced root takes every error the validator reported on a field with it.
 */
function withoutErrorsOfChanged<T>(validation: ValidationData<T>, changed: DataChange): ValidationData<T> {
  const { isRootReplaced, paths } = changed;
  if (isRootReplaced) {
    return withoutErrors(validation, () => true);
  }
  if (paths.length === 0) {
    return validation;
  }
  return withoutErrors(validation, (pathOfError) =>
    paths.some(
      (pathOfField) =>
        isPathPrefix(pathOfError, pathOfField) || (pathOfField.length > 0 && isPathPrefix(pathOfField, pathOfError)),
    ),
  );
}

/** `data` with what the array or object at `path` holds where `newKeyOf` put it: diffed against `changed`, a moved
 * value is no change, so the errors that moved with a key are kept and those of a value that is gone are not. An array
 * also holds the items `changed` added, so an add or a copy is no change either: no error sits under an index that
 * held nothing, and the array's own errors stay for the next validation as they do through a remove or a reorder,
 * whether or not the new item has a value. A property an object gained is a change, since the validator may have
 * reported it missing.
 */
function withKeysMoved(data: unknown, changed: unknown, path: FieldPathList, newKeyOf: KeyMove): unknown {
  const held = getAt<unknown>(data, path);
  const newHeld = getAt<unknown>(changed, path);
  let moved: unknown;
  if (Array.isArray(held) && Array.isArray(newHeld)) {
    const items: unknown[] = [...newHeld];
    held.forEach((item, index) => {
      // A removed item has no new key
      const newKey = newKeyOf(String(index));
      if (newKey !== undefined && Number(newKey) < items.length) {
        items[Number(newKey)] = item;
      }
    });
    moved = items;
  } else if (isPlainObject(held) && isPlainObject(newHeld)) {
    const properties: GenericObjectType = {};
    for (const [key, value] of Object.entries(held)) {
      const newKey = newKeyOf(key);
      if (newKey !== undefined) {
        setOwn(properties, newKey, value);
      }
    }
    moved = properties;
  } else {
    return data;
  }
  return path.length === 0 ? moved : setByPath(copyAlongPath(data, path), path, moved);
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
  const validation: ValidationData<T> = isErrorStateDropped
    ? { errors: [], errorSchema: {} }
    : withoutErrorsOfChanged(
        { errors: current?.schemaValidationErrors ?? [], errorSchema: current?.schemaValidationErrorSchema ?? {} },
        getDataChange(),
      );
  return {
    ...mergeErrors(validation, props.extraErrors, current?.customErrors),
    schemaValidationErrors: validation.errors,
    schemaValidationErrorSchema: validation.errorSchema,
  };
}

/** Whether a pass validates its data: only under `liveValidate: 'onChange'`, only for data that is there, and only when
 * something the errors depend on changed, so a parent re-render that touches neither the data nor the validation
 * shows no error the user has not earned yet. `'onBlur'` owns its validation pass in `applyBlur()`.
 */
function mustLiveValidate<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  isDataPassed: boolean,
  isInputChanged: boolean,
): boolean {
  return isDataPassed && isLiveValidated(props) && isInputChanged;
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

/** The state derived from data: on construction from the seed the props hand the form, and from the data the form
 * holds whenever the schema, a `ui:emptyValue` or `defaultFormStateBehavior` changed, since those are the props whose
 * change transforms the data (a default it did not have before, a branch that no longer applies). No other prop change
 * runs this: an unrelated re-render must not rerun value initialization, so `deriveState()` re-derives the render
 * context alone for those.
 *
 * @param current - The state the pass starts from; `undefined` on construction
 * @param inputFormData - The data to derive from
 * @param props - The current props
 * @returns - The new state, sharing every unchanged subtree with `current`
 */
function deriveDataState<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F> | undefined,
  inputFormData: T | undefined,
  props: FormProps<T, S, F>,
): FormState<T, S, F> {
  // A schema change sanitizes the data for the new schema's tree, as an edit does for the tree it leads to, and leaves
  // the data of a disabled or read-only form as it is, as an edit there does
  const { formData, context, areSchemaUtilsReused } = deriveFormData(
    current,
    inputFormData,
    { isSanitized: !props.disabled && !props.readonly },
    props,
  );
  const { isSchemaChanged, isValidationPropChanged } = detectContextChanges(current, context);
  // Construction validates nothing: the errors of a seed the user has not touched are not shown until they are earned
  const isDataChanged = current !== undefined && formData !== current.formData;
  const isDataPassed = current ? current.isDataPassed : inputFormData !== undefined;
  const errors = reconcileErrors(current, props, context, formData, {
    isSchemaChanged,
    mustValidate: mustLiveValidate(props, isDataPassed, isDataChanged || isValidationPropChanged),
    validationSchema: areSchemaUtilsReused ? context.retrievedSchema : undefined,
    // Without a validation pass, the errors of the fields the data changed at describe values that are gone. The
    // data is shared against the committed data, so unchanged subtrees are skipped by identity
    getDataChange: current && (() => dataChange(formData, current.formData)),
  });
  return {
    ...current,
    ...context,
    formData,
    isDataPassed,
    ...errors,
    initialDefaultsGenerated: true,
  };
}

/** Freezes plain objects and arrays in `data`, and nothing else: a `File`, a `Date` or a class instance is left
 * alone. Development only, and only ever applied to form data: the form data a consumer receives shares subtrees with
 * the value the change was applied to, the `formData` the consumer passed included, so a mutation of it corrupts the
 * consumer's state silently. Frozen, it throws where the mutation happens instead.
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
export function copyAlongPath<T>(data: T, path: FieldPathList): T {
  if (!isObject(data) && !Array.isArray(data)) {
    return data;
  }
  const copyOf = (container: object) => (Array.isArray(container) ? [...container] : { ...container });
  const root = copyOf(data as object) as Record<PropertyKey, unknown>;
  let container = root;
  for (const segment of path.slice(0, -1)) {
    // Own keys only, as `setByPath()` reads them: a `__proto__` the data does not hold as its own key reads the
    // prototype, and writing a copy of that back would re-point the root copy's prototype instead of adding a key
    const child = Object.hasOwn(container, segment) ? container[segment] : undefined;
    if (!isObject(child) && !Array.isArray(child)) {
      break;
    }
    const copy = copyOf(child as object) as Record<PropertyKey, unknown>;
    container[segment] = copy;
    container = copy;
  }
  return root as T;
}

/** Applies the data of one `change` to `current`, returning the next state with `current`'s errors. The `newValue` is
 * set at the change's path in the data, which is then run through `deriveFormData()` for any missing defaults and,
 * when the resolved schema changed, sanitization. If `omitExtraData` and `liveOmit` are turned on, the data is filtered
 * to remove any extra data not in a form field. The errors are `applyChangeToErrorsOf()`'s, kept apart so an edit's
 * data can be decided on before anything validates it. Reads nothing but its arguments and performs no callbacks:
 * committing the result and notifying are the caller's.
 *
 * @param current - The state the change applies to
 * @param change - The change to apply
 * @param props - The current props
 * @returns - The next state, sharing every unchanged subtree with `current`
 */
export function applyChangeToData<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  change: FieldChange<T>,
  props: FormProps<T, S, F>,
): FormState<T, S, F> {
  const { newValue, fieldPath } = change;
  // The single place where a `FieldPath` is parsed back into segments for writing into the formData
  const path = fieldPathToList(fieldPath);
  const { omitExtraData, liveOmit, disabled, readonly } = props;
  const { formData: oldFormData } = current;
  // The derivation below hands back the context for the data it settled on, resolved schema included, so committing
  // whatever it returns is what keeps state's resolved schema and the utilities that resolved it in step.
  let context: RenderContext<T, S, F> = current;
  const isRootPath = path.length === 0;
  let formData: T | undefined;
  if (isRootPath) {
    formData = newValue;
  } else if (isObject(oldFormData) || Array.isArray(oldFormData)) {
    // The write below lands on copies of the containers along the path; everything off it keeps the reference the
    // fields hold, and nothing has to be walked afterwards to restore that sharing
    formData = copyAlongPath(oldFormData, path);
  } else {
    // A field edit under an empty root, a `null` seed or a cleared scalar, creates the container the field lives in
    // instead of being dropped
    formData = (typeof path[0] === 'number' ? [] : {}) as T;
  }

  if (isObject(formData) || Array.isArray(formData)) {
    // Tracks if the user cleared a plain (non-oneOf/anyOf) leaf field.
    // The key is removed twice: once before deriveFormData so the data it derives from
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
          // Plain resolved leaves use plainLeafWasCleared instead (see below). A `null` field has nothing to clear:
          // `null` is the one value it holds, which the defaults fill back in
          if (!isOneOfOrAnyOfLeaf && leaf !== undefined && getSchemaType(leaf) !== 'null') {
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
    // Only the data and its context are derived here; the errors are reconciled below. A root write is sanitized only
    // where it stands for an edit, as the data a `transformChange` writes over one does
    const editedPath = change.editedPath ?? (isRootPath ? undefined : path);
    const derived = deriveFormData(
      current,
      formData,
      {
        isSanitized: editedPath !== undefined && !disabled && !readonly,
        edit: editedPath && { path: editedPath, newKeyOf: change.editedPath ? undefined : change.newKeyOf },
      },
      props,
    );
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
    const { clearedPath } = change;
    if (
      isRootPath &&
      clearedPath &&
      getAt<unknown>(newValue, clearedPath) === undefined &&
      getAt<unknown>(formData, clearedPath) !== undefined
    ) {
      formData = setByPath(copyAlongPath(formData, clearedPath), clearedPath, undefined);
    }
  }

  let newFormData = formData;

  if (omitExtraData === true && liveOmit === 'onChange') {
    newFormData = context.schemaUtils.omitExtraData(
      context.schema,
      formData,
      fieldStateOf(context.uiState, context.schemaUtils, change.editedPath ?? path),
    );
  }

  return {
    ...current,
    ...context,
    formData: newFormData,
    // An edit is data the user made, whose errors they have earned, so a prop change live-validates it from now on
    isDataPassed: true,
  };
}

/** The errors after one `change`, for `changed`, the state `applyChangeToData()` made of it, which still carries the
 * errors from before the change. With `isValidated`, the data is validated and only the fields' own errors are
 * carried through; otherwise they are changed as `applyChangeToErrors()` describes.
 *
 * @param changed - The state the change's data left, with the errors from before it
 * @param previousFormData - The data before the change
 * @param change - The change
 * @param props - The current props
 * @param isValidated - Whether the change's data is validated
 * @returns - `changed` with the errors after the change
 */
export function applyChangeToErrorsOf<T, S extends StrictRJSFSchema, F extends FormContextType>(
  changed: FormState<T, S, F>,
  previousFormData: T | undefined,
  change: FieldChange<T>,
  props: FormProps<T, S, F>,
  isValidated: boolean,
): FormState<T, S, F> {
  const { formData } = changed;
  if (isValidated) {
    // The validation replaces the validator's result whole, so only the fields' own errors are carried through
    const customErrors = ownErrorsAfterChange(changed, change);
    return {
      ...changed,
      ...runLiveValidation(
        props,
        changed,
        formData,
        customErrors,
        changed.retrievedSchema,
        change.editedPath ?? fieldPathToList(change.fieldPath),
      ),
      customErrors,
    };
  }
  // No validation rewrites the validator's errors here, so those of the replaced values are cleared instead. What a
  // key move leaves is diffed with the keys where the move put them, so the errors that moved with them stay
  const { newKeyOf } = change;
  const getDataChange = () =>
    dataChange(
      formData,
      newKeyOf
        ? withKeysMoved(previousFormData, formData, fieldPathToList(change.fieldPath), newKeyOf)
        : previousFormData,
    );
  return { ...changed, ...applyChangeToErrors(changed, change, props.extraErrors, getDataChange) };
}

/** The error members of a state with `extraErrors` as the only errors on display, as a reset or a valid submission
 * leaves it
 */
function extraErrorsAlone<T>(extraErrors: ErrorSchema<T> | undefined): ErrorState<T> {
  // Merged into nothing rather than listed as they are, so an array `extraErrors` holds for the items of an array
  // field is keyed by index, as every `ErrorSchema` the form hands out is
  const { errors, errorSchema } = mergeErrors<T>({ errors: [], errorSchema: {} }, extraErrors);
  return { errors, errorSchema, schemaValidationErrors: [], schemaValidationErrorSchema: {} };
}

/** The state after `reset()`: the data is re-derived from the props' seed the way an initial render does it, every
 * error the form holds, including the custom ones fields raised, is cleared, which leaves `extraErrors` as the only
 * errors on display, and the render context the derivation resolved with is committed alongside the data.
 *
 * @param current - The state being reset
 * @param props - The current props
 * @returns - The reset state, sharing every unchanged subtree with `current`
 */
export function applyReset<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  props: FormProps<T, S, F>,
): FormState<T, S, F> {
  const seed = seedOf(props);
  const { formData, context } = deriveFormData(current, seed, { isReset: true }, props);
  return {
    ...current,
    ...context,
    formData,
    isDataPassed: seed !== undefined,
    ...extraErrorsAlone(props.extraErrors),
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
      ? schemaUtils.omitExtraData(schema, current.formData, fieldStateOf(current.uiState, schemaUtils))
      : current.formData;
  const validation = isBlurValidated(props)
    ? runLiveValidation(props, current, formData, customErrors, retrievedSchema)
    : undefined;
  return { ...current, formData, ...validation };
}

/** Validates `formData` for a submission or `validateForm()`: whether the errors block, the merged errors to report,
 * and the state that displays them.
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
  const hasCustomErrors = !!customErrors && toErrorList(customErrors).length > 0;
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
  return { hasError, next };
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
  return {
    ...current,
    formData,
    ...extraErrorsAlone(props.extraErrors),
  };
}

/** The data the props seed the form with on mount and on `reset()`: `formData`, which is kept as another name for the
 * seed, or else `initialFormData`. Only `undefined` leaves a prop unpassed, so a `null` `formData` is the seed, and
 * seeds the same defaults an `undefined` does.
 *
 * @param props - The current props
 * @returns - The seed, or `undefined` when the props pass none
 */
function seedOf<T, S extends StrictRJSFSchema, F extends FormContextType>(props: FormProps<T, S, F>): T | undefined {
  // oxlint-disable-next-line typescript/no-deprecated -- the form still reads the deprecated alias
  const { formData } = props;
  if (formData === undefined) {
    return props.initialFormData;
  }
  return formData;
}

export function initialState<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
): FormState<T, S, F> {
  if (!props.validator) {
    throw new Error('A validator is required for Form functionality to work');
  }
  return deriveDataState(undefined, seedOf(props), props);
}

/** Derives the state to render from the props and the committed `state`. Nothing is remembered about the previous
 * props: every derived member is shared against the committed state, so an unchanged input hands back the reference
 * the fields already hold and a changed one is recognized by the new reference; when nothing changed, `state` itself
 * is handed back. The data is the form's own after mount, so a `formData` or `initialFormData` passed later changes
 * nothing; it is re-derived only for a schema, `ui:emptyValue` or `defaultFormStateBehavior` change, and any other
 * prop change re-derives the render context alone, since an unrelated re-render must not rerun value initialization.
 *
 * @param props - The current props
 * @param state - The committed state
 * @returns - The state to render, `state` itself when nothing changed
 */
export function deriveState<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  state: FormState<T, S, F>,
): FormState<T, S, F> {
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
    return replaceEqualDeep(state, deriveDataState(state, state.formData, props));
  }
  // Resolved only once it is known the data is not re-derived, which resolves it itself
  const resolvedContext = {
    ...context,
    retrievedSchema: resolveRetrievedSchema(state, context.schemaUtils, state.formData),
  };
  const errors = reconcileErrors(state, props, resolvedContext, state.formData, {
    mustValidate: mustLiveValidate(props, state.isDataPassed, isValidationPropChanged),
    validationSchema: context.schemaUtils === state.schemaUtils ? resolvedContext.retrievedSchema : undefined,
  });
  return replaceEqualDeep(state, { ...state, ...resolvedContext, ...errors });
}
