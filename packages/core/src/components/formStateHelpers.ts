import {
  createSchemaUtils,
  CustomValidator,
  deepEquals,
  ErrorSchema,
  ErrorSchemaBuilder,
  ErrorTransformer,
  ERRORS_KEY,
  Experimental_CustomMergeAllOf,
  Experimental_DefaultFormStateBehavior,
  FieldPathId,
  FieldPathList,
  FormContextType,
  GlobalFormOptions,
  ID_KEY,
  isObject,
  mergeObjects,
  Registry,
  removeOptionalEmptyObjects,
  RJSFSchema,
  RJSFValidationError,
  SchemaUtilsType,
  StrictRJSFSchema,
  toFieldPathId,
  UiSchema,
  UI_DEFINITIONS_KEY,
  UI_GLOBAL_OPTIONS_KEY,
  validationDataMerge,
  ValidationData,
  ValidatorType,
  DEFAULT_ID_PREFIX,
  DEFAULT_ID_SEPARATOR,
} from '@rjsf/utils';
import _cloneDeep from 'lodash/cloneDeep';
import _get from 'lodash/get';
import _isEmpty from 'lodash/isEmpty';
import _pick from 'lodash/pick';
import _set from 'lodash/set';
import _unset from 'lodash/unset';

import { ADDITIONAL_PROPERTY_KEY_REMOVE } from './constants';

import type { FormProps, FormState, IChangeEvent } from './Form';

/** Converts the full `FormState` into the `IChangeEvent` version by picking out the public values.
 *
 * @param state - The state of the form
 * @param status - The status provided by the onSubmit
 * @returns - The `IChangeEvent` for the state
 */
export function toIChangeEvent<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  state: FormState<T, S, F>,
  status?: IChangeEvent['status'],
): IChangeEvent<T, S, F> {
  return {
    ..._pick(state, ['schema', 'uiSchema', 'fieldPathId', 'schemaUtils', 'formData', 'edit', 'errors', 'errorSchema']),
    ...(status !== undefined && { status }),
  };
}

/** Computes the `GlobalFormOptions` from the given `FormProps`, honoring `ui:rootFieldId` as an override of
 * `idPrefix`.
 *
 * @param props - The Form props from which to derive the options
 * @returns - The `GlobalFormOptions` for the form
 */
export function computeGlobalFormOptions<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FormProps<T, S, F>): GlobalFormOptions {
  const {
    uiSchema = {} as UiSchema<T, S, F>,
    experimental_componentUpdateStrategy,
    idSeparator = DEFAULT_ID_SEPARATOR,
    idPrefix = DEFAULT_ID_PREFIX,
    nameGenerator,
    useFallbackUiForUnsupportedType = false,
  } = props;
  const rootFieldId = uiSchema['ui:rootFieldId'];
  return {
    idPrefix: rootFieldId || idPrefix,
    idSeparator,
    useFallbackUiForUnsupportedType,
    ...(experimental_componentUpdateStrategy !== undefined && { experimental_componentUpdateStrategy }),
    ...(nameGenerator !== undefined && { nameGenerator }),
  };
}

/** Builds the full `Registry` by layering form props over the given `defaultRegistry`, injecting the supplied
 * `schemaUtils` and `rootSchema`.
 *
 * @param props - The Form props providing user overrides
 * @param rootSchema - The root schema to store in the registry
 * @param schemaUtils - The `schemaUtils` to store in the registry
 * @param defaultRegistry - The base registry (without `schemaUtils`) returned by `getDefaultRegistry`
 * @returns - The composed `Registry`
 */
export function buildRegistry<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: FormProps<T, S, F>,
  rootSchema: S,
  schemaUtils: SchemaUtilsType<T, S, F>,
  defaultRegistry: Omit<Registry<T, S, F>, 'schemaUtils'>,
): Registry<T, S, F> {
  const { translateString: customTranslateString, uiSchema = {} as UiSchema<T, S, F> } = props;
  const { fields, templates, widgets, formContext, translateString } = defaultRegistry;
  return {
    fields: { ...fields, ...props.fields },
    templates: {
      ...templates,
      ...props.templates,
      ButtonTemplates: {
        ...templates.ButtonTemplates,
        ...props.templates?.ButtonTemplates,
      },
    },
    widgets: { ...widgets, ...props.widgets },
    rootSchema,
    formContext: props.formContext || formContext,
    schemaUtils,
    translateString: customTranslateString || translateString,
    globalUiOptions: uiSchema[UI_GLOBAL_OPTIONS_KEY],
    globalFormOptions: computeGlobalFormOptions(props),
    uiSchemaDefinitions: uiSchema[UI_DEFINITIONS_KEY] ?? {},
  };
}

/** Returns the existing `schemaUtils` when it still matches the `validator`, `schema`, and experimental options;
 * otherwise creates and returns a fresh one via `createSchemaUtils`.
 *
 * @param prev - The existing `SchemaUtilsType`, if any
 * @param validator - The validator instance
 * @param schema - The current root schema
 * @param experimental_defaultFormStateBehavior - The experimental default form state behavior
 * @param experimental_customMergeAllOf - The experimental `allOf` merge function
 * @returns - The (possibly new) `SchemaUtilsType`
 */
export function createSchemaUtilsIfChanged<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(
  prev: SchemaUtilsType<T, S, F> | undefined,
  validator: ValidatorType<T, S, F>,
  schema: S,
  experimental_defaultFormStateBehavior?: Experimental_DefaultFormStateBehavior,
  experimental_customMergeAllOf?: Experimental_CustomMergeAllOf<S>,
): SchemaUtilsType<T, S, F> {
  if (
    !prev ||
    prev.doesSchemaUtilsDiffer(validator, schema, experimental_defaultFormStateBehavior, experimental_customMergeAllOf)
  ) {
    return createSchemaUtils<T, S, F>(
      validator,
      schema,
      experimental_defaultFormStateBehavior,
      experimental_customMergeAllOf,
    );
  }
  return prev;
}

/** Returns the existing `fieldPathId` when its prefix still matches the supplied `globalFormOptions.idPrefix`;
 * otherwise builds a new one via `toFieldPathId`.
 *
 * @param existing - The existing `FieldPathId`, if any
 * @param globalFormOptions - The current `GlobalFormOptions`
 * @returns - The `FieldPathId` to use
 */
export function computeFieldPathId(
  existing: FieldPathId | undefined,
  globalFormOptions: GlobalFormOptions,
): FieldPathId {
  if (existing && existing[ID_KEY] === globalFormOptions.idPrefix) {
    return existing;
  }
  return toFieldPathId('', globalFormOptions);
}

/** Returns `prev` when it is deep-equal to `next`, otherwise returns `next`. This preserves the referential identity
 * of the retrieved schema so that downstream caches (e.g. AJV) are not invalidated when the schema has not actually
 * changed.
 *
 * @param next - The freshly retrieved schema
 * @param prev - The previous retrieved schema, if any
 * @returns - `prev` if it is deep-equal to `next`, otherwise `next`
 */
export function reuseRetrievedSchemaIfEqual<S extends StrictRJSFSchema = RJSFSchema>(next: S, prev: S | undefined): S {
  return prev !== undefined && deepEquals(next, prev) ? prev : next;
}

/** Merges any `extraErrors` and `customErrors` into the given `schemaValidation` errors + errorSchema.
 *
 * @param schemaValidation - The base `ValidationData` (typically schema-validation output)
 * @param extraErrors - Extra errors from the Form props, if any
 * @param customErrors - `ErrorSchemaBuilder` with user-provided errors, if any
 * @returns - The merged `ValidationData`
 */
export function mergeErrors<T = any>(
  schemaValidation: ValidationData<T>,
  extraErrors?: ErrorSchema<T>,
  customErrors?: ErrorSchemaBuilder<T>,
): ValidationData<T> {
  let errorSchema: ErrorSchema<T> = schemaValidation.errorSchema;
  let errors: RJSFValidationError[] = schemaValidation.errors;
  if (extraErrors) {
    const merged = validationDataMerge<T>({ errors, errorSchema }, extraErrors);
    errorSchema = merged.errorSchema;
    errors = merged.errors;
  }
  if (customErrors) {
    const merged = validationDataMerge<T>({ errors, errorSchema }, customErrors.ErrorSchema, true);
    errorSchema = merged.errorSchema;
    errors = merged.errors;
  }
  return { errors, errorSchema };
}

/** Validates the given `formData` against the given `schema` using the supplied `schemaUtils`. If `retrievedSchema` is
 * omitted, it is derived from `schema` and `formData`.
 *
 * @param formData - The form data to validate
 * @param schema - The schema used to validate against
 * @param schemaUtils - The `SchemaUtilsType` providing the validator
 * @param retrievedSchema - An optional pre-retrieved schema
 * @param customValidate - Optional custom validator from Form props
 * @param transformErrors - Optional error transformer from Form props
 * @param uiSchema - Optional uiSchema from Form props
 * @returns - The `ValidationData` for this validation run
 */
export function runValidate<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  formData: T | undefined,
  schema: S,
  schemaUtils: SchemaUtilsType<T, S, F>,
  retrievedSchema?: S,
  customValidate?: CustomValidator<T, S, F>,
  transformErrors?: ErrorTransformer<T, S, F>,
  uiSchema?: UiSchema<T, S, F>,
): ValidationData<T> {
  const resolvedSchema = retrievedSchema ?? schemaUtils.retrieveSchema(schema, formData);
  return schemaUtils
    .getValidator()
    .validateFormData(formData, resolvedSchema, customValidate, transformErrors, uiSchema);
}

/** The additional fields returned from `runLiveValidate` beyond `ValidationData`. */
export interface LiveValidationResult<T = any> extends ValidationData<T> {
  /** The errors from schema validation alone, before merging in `extraErrors` or `customErrors` */
  schemaValidationErrors: RJSFValidationError[];
  /** The `ErrorSchema` from schema validation alone, before merging in `extraErrors` or `customErrors` */
  schemaValidationErrorSchema: ErrorSchema<T>;
}

/** Performs a live-validation pass, optionally merging the result into an `originalErrorSchema`, and merging any
 * `extraErrors` and `customErrors` on top.
 *
 * @param rootSchema - The root schema to validate against
 * @param schemaUtils - The `SchemaUtilsType` providing the validator
 * @param originalErrorSchema - The previous error schema, used when `mergeIntoOriginalErrorSchema` is set
 * @param formData - The form data to validate
 * @param extraErrors - Extra errors from Form props, if any
 * @param customErrors - `ErrorSchemaBuilder` with user-provided errors, if any
 * @param retrievedSchema - An optional pre-retrieved schema
 * @param customValidate - Optional custom validator from Form props
 * @param transformErrors - Optional error transformer from Form props
 * @param uiSchema - Optional uiSchema from Form props
 * @param mergeIntoOriginalErrorSchema - When true, the schema-validation errors are merged on top of
 *   `originalErrorSchema` before `extraErrors`/`customErrors` are applied
 * @returns - A `LiveValidationResult` with the final merged errors as well as the pre-merge schema-validation errors
 */
export function runLiveValidate<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  rootSchema: S,
  schemaUtils: SchemaUtilsType<T, S, F>,
  originalErrorSchema: ErrorSchema<T>,
  formData: T | undefined,
  extraErrors: ErrorSchema<T> | undefined,
  customErrors: ErrorSchemaBuilder<T> | undefined,
  retrievedSchema?: S,
  customValidate?: CustomValidator<T, S, F>,
  transformErrors?: ErrorTransformer<T, S, F>,
  uiSchema?: UiSchema<T, S, F>,
  mergeIntoOriginalErrorSchema = false,
): LiveValidationResult<T> {
  const schemaValidation = runValidate<T, S, F>(
    formData,
    rootSchema,
    schemaUtils,
    retrievedSchema,
    customValidate,
    transformErrors,
    uiSchema,
  );
  const errors = schemaValidation.errors;
  let errorSchema = schemaValidation.errorSchema;
  if (mergeIntoOriginalErrorSchema) {
    errorSchema = mergeObjects(
      originalErrorSchema,
      schemaValidation.errorSchema,
      'preventDuplicates',
    ) as ErrorSchema<T>;
  }
  const schemaValidationErrors = errors;
  const schemaValidationErrorSchema = errorSchema;
  const merged = mergeErrors<T>({ errors, errorSchema }, extraErrors, customErrors);
  return {
    errors: merged.errors,
    errorSchema: merged.errorSchema,
    schemaValidationErrors,
    schemaValidationErrorSchema,
  };
}

/** Options that parameterize `computeStateFromProps`. */
export interface ComputeStateFromPropsOptions<S extends StrictRJSFSchema = RJSFSchema> {
  /** Pre-computed retrieved schema. When omitted, one is derived from the schema and computed formData. */
  retrievedSchema?: S;
  /** True when the schema was detected as changed on this update. Resets any prior error state. */
  isSchemaChanged?: boolean;
  /** The set of top-level formData fields that changed since the last pass; their error subtrees are cleared. */
  formDataChangedFields?: string[];
  /** When true, live validation is skipped even if `liveValidate` is configured. */
  skipLiveValidate?: boolean;
  /** The default registry snapshot used to compose the full registry. Pass the result of `getDefaultRegistry`. */
  defaultRegistry: Omit<Registry<any, S, any>, 'schemaUtils'>;
  /** Sentinel indicating the current render is a `reset()` call. When matched against `inputFormData`, the
   * reset-specific defaulting path is taken.
   */
  resetSentinel: unknown;
}

/** Computes the next `FormState` from the given `props` and previous state. This mirrors the logic of the class
 * component's `getStateFromProps` method, but takes `prevState` as an argument so the function is pure.
 *
 * @param props - The current Form props
 * @param prevState - The previous state, or an empty object on initial mount
 * @param inputFormData - The data to use as the starting point before defaults are applied. Pass the `resetSentinel`
 *   to force the "reset" defaulting path.
 * @param options - Additional options (see `ComputeStateFromPropsOptions`)
 * @returns - The next `FormState`
 */
export function computeStateFromProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(
  props: FormProps<T, S, F>,
  prevState: Partial<FormState<T, S, F>>,
  inputFormData: T | undefined,
  options: ComputeStateFromPropsOptions<S>,
): FormState<T, S, F> {
  const {
    retrievedSchema,
    isSchemaChanged = false,
    formDataChangedFields = [],
    skipLiveValidate = false,
    defaultRegistry,
    resetSentinel,
  } = options;
  const {
    schema,
    validator,
    uiSchema = {} as UiSchema<T, S, F>,
    liveValidate,
    noValidate,
    experimental_defaultFormStateBehavior,
    experimental_customMergeAllOf,
    customValidate,
    transformErrors,
    extraErrors,
  } = props;
  const isUncontrolled = props.formData === undefined;
  const edit = typeof inputFormData !== 'undefined';
  const mustValidate = edit && !noValidate && !!liveValidate;
  const schemaUtils: SchemaUtilsType<T, S, F> = createSchemaUtilsIfChanged<T, S, F>(
    prevState.schemaUtils,
    validator,
    schema,
    experimental_defaultFormStateBehavior,
    experimental_customMergeAllOf,
  );

  const rootSchema = schemaUtils.getRootSchema();

  // Compute the formData for getDefaultFormState() based on the inputFormData, isUncontrolled, and previous state
  let defaultsFormData: T | undefined = inputFormData;
  if ((inputFormData as unknown) === resetSentinel) {
    defaultsFormData = undefined;
  } else if (inputFormData === undefined && isUncontrolled) {
    defaultsFormData = prevState.formData;
  }
  const formData: T = schemaUtils.getDefaultFormState(
    rootSchema,
    defaultsFormData,
    false,
    prevState.initialDefaultsGenerated,
  ) as T;
  const _retrievedSchema = reuseRetrievedSchemaIfEqual<S>(
    retrievedSchema ?? schemaUtils.retrieveSchema(rootSchema, formData),
    prevState.retrievedSchema,
  );

  const getCurrentErrors = (): ValidationData<T> => {
    if (noValidate || isSchemaChanged) {
      return { errors: [], errorSchema: {} };
    } else if (!liveValidate) {
      return {
        errors: prevState.schemaValidationErrors || [],
        errorSchema: prevState.schemaValidationErrorSchema || ({} as ErrorSchema<T>),
      };
    }
    return {
      errors: prevState.errors || [],
      errorSchema: prevState.errorSchema || ({} as ErrorSchema<T>),
    };
  };

  let errors: RJSFValidationError[];
  let errorSchema: ErrorSchema<T>;
  let schemaValidationErrors: RJSFValidationError[] = prevState.schemaValidationErrors as RJSFValidationError[];
  let schemaValidationErrorSchema: ErrorSchema<T> = prevState.schemaValidationErrorSchema as ErrorSchema<T>;
  if (mustValidate && !skipLiveValidate) {
    const liveValidation = runLiveValidate<T, S, F>(
      rootSchema,
      schemaUtils,
      prevState.errorSchema as ErrorSchema<T>,
      formData,
      undefined,
      prevState.customErrors,
      retrievedSchema,
      customValidate,
      transformErrors,
      uiSchema,
      // If retrievedSchema is undefined which means the schema or formData has changed, we do not merge state.
      retrievedSchema !== undefined,
    );
    errors = liveValidation.errors;
    errorSchema = liveValidation.errorSchema;
    schemaValidationErrors = liveValidation.schemaValidationErrors;
    schemaValidationErrorSchema = liveValidation.schemaValidationErrorSchema;
  } else {
    const currentErrors = getCurrentErrors();
    errors = currentErrors.errors;
    errorSchema = currentErrors.errorSchema;
    if (formDataChangedFields.length > 0 && !mustValidate) {
      const clearedFields = formDataChangedFields.reduce(
        (acc, key) => {
          acc[key] = undefined;
          return acc;
        },
        {} as Record<string, undefined>,
      );
      errorSchema = schemaValidationErrorSchema = mergeObjects(
        currentErrors.errorSchema,
        clearedFields,
        'preventDuplicates',
      ) as ErrorSchema<T>;
    }
    const mergedErrors = mergeErrors<T>({ errorSchema, errors }, extraErrors, prevState.customErrors);
    errors = mergedErrors.errors;
    errorSchema = mergedErrors.errorSchema;
  }

  const newRegistry = buildRegistry<T, S, F>(props, rootSchema, schemaUtils, defaultRegistry);
  const registry = deepEquals(prevState.registry, newRegistry)
    ? (prevState.registry as Registry<T, S, F>)
    : newRegistry;

  const fieldPathId = computeFieldPathId(prevState.fieldPathId, registry.globalFormOptions);
  return {
    schemaUtils,
    schema: rootSchema,
    uiSchema,
    fieldPathId,
    formData,
    edit,
    errors,
    errorSchema,
    schemaValidationErrors,
    schemaValidationErrorSchema,
    retrievedSchema: _retrievedSchema,
    initialDefaultsGenerated: true,
    registry,
  };
}

/** The definition of a pending change that will be processed by `computeChangeNextState`. */
export interface PendingChange<T> {
  /** The path into the formData/errorSchema at which the `newValue`/`newErrorSchema` will be set */
  path: FieldPathList;
  /** The new value to set into the formData */
  newValue?: T;
  /** The new errors to be set into the errorSchema, if any */
  newErrorSchema?: ErrorSchema<T>;
  /** The optional id of the field for which the change is being made */
  id?: string;
}

/** Options that parameterize `computeChangeNextState`. */
export interface ComputeChangeNextStateOptions<T = any, S extends StrictRJSFSchema = RJSFSchema> {
  /** True when this change is the final one in the pending-change queue; gates live validation. */
  isLastInQueue: boolean;
  /** Default registry snapshot passed through to `computeStateFromProps` for inner default filling. */
  defaultRegistry: Omit<Registry<any, S, any>, 'schemaUtils'>;
  /** Sentinel for reset calls (forwarded to `computeStateFromProps` during inner default filling). */
  resetSentinel: unknown;
  /** Optional override for the `omitExtraData` call used when `omitExtraData` + `liveOmit` are active. Defaults to
   * `schemaUtils.omitExtraData(schema, formData)`. The class component supplies a thunk that routes through its
   * (deprecated) instance method so user-supplied overrides via ref still take effect.
   */
  omitExtraDataFn?: (formData: T | undefined) => T | undefined;
}

/** The data returned from `computeChangeNextState`: the partial state patch to apply and the next `customErrors`
 * builder (which may have been mutated or newly created).
 */
export interface ChangeNextStateResult<T, S extends StrictRJSFSchema, F extends FormContextType> {
  /** The partial state patch to apply via the reducer. */
  partial: Partial<FormState<T, S, F>>;
  /** The (possibly updated or newly created) `customErrors` builder. */
  customErrors?: ErrorSchemaBuilder<T>;
}

/** Computes the partial state patch to apply in response to a single pending change. Mirrors the body of the class
 * component's `processPendingChange` between the enqueue and the `setState` call.
 *
 * @param props - The current Form props
 * @param prevState - The current state (before this change is applied)
 * @param change - The pending change to process
 * @param options - Additional options (see `ComputeChangeNextStateOptions`)
 * @returns - A `ChangeNextStateResult` with the partial state patch and the (possibly updated) `customErrors`
 */
export function computeChangeNextState<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(
  props: FormProps<T, S, F>,
  prevState: FormState<T, S, F>,
  change: PendingChange<T>,
  options: ComputeChangeNextStateOptions<T, S>,
): ChangeNextStateResult<T, S, F> {
  const { newValue, path, newErrorSchema } = change;
  const { extraErrors, omitExtraData, liveOmit, noValidate, liveValidate, removeEmptyOptionalObjects } = props;
  const { formData: oldFormData, schemaUtils, schema, fieldPathId, schemaValidationErrorSchema, errors } = prevState;
  let { customErrors, errorSchema: originalErrorSchema } = prevState;
  const rootPathId = fieldPathId.path[0] || '';

  const isRootPath = !path || path.length === 0 || (path.length === 1 && path[0] === rootPathId);
  let retrievedSchema = prevState.retrievedSchema;
  let formData: T | undefined = isRootPath ? newValue : (_cloneDeep(oldFormData) as T);

  // When switching from null to an object option in oneOf, MultiSchemaField sends
  // an object with property names but undefined values. In that case pass `undefined` to `computeStateFromProps`
  // to trigger fresh default computation — but only when the previous formData was null/undefined.
  const hasOnlyUndefinedValues =
    isObject(formData) &&
    Object.keys(formData as object).length > 0 &&
    Object.values(formData as object).every((v) => v === undefined);
  const wasPreviouslyNull = oldFormData === null || oldFormData === undefined;
  const inputForDefaults = hasOnlyUndefinedValues && wasPreviouslyNull ? undefined : formData;

  if (isObject(formData) || Array.isArray(formData)) {
    if ((newValue as unknown) === ADDITIONAL_PROPERTY_KEY_REMOVE) {
      _unset(formData, path);
    } else if (!isRootPath) {
      _set(formData as object, path, newValue);
    }
    // Skip live validation inside the inner default-filling pass; we handle it below.
    const inner = computeStateFromProps<T, S, F>(props, prevState, inputForDefaults, {
      skipLiveValidate: true,
      defaultRegistry: options.defaultRegistry,
      resetSentinel: options.resetSentinel,
    });
    formData = inner.formData;
    retrievedSchema = inner.retrievedSchema;
  }

  const mustValidate = !noValidate && (liveValidate === true || liveValidate === 'onChange');
  let partial: Partial<FormState<T, S, F>> = { formData, schema };
  let newFormData: T | undefined = formData;

  if (omitExtraData === true && (liveOmit === true || liveOmit === 'onChange')) {
    newFormData = options.omitExtraDataFn
      ? options.omitExtraDataFn(newFormData)
      : schemaUtils.omitExtraData(schema, newFormData);
    partial = { formData: newFormData };
  }

  if (removeEmptyOptionalObjects) {
    newFormData = removeOptionalEmptyObjects(
      schemaUtils.getValidator(),
      schema,
      schemaUtils.getRootSchema(),
      newFormData,
    ) as T;
    partial = { ...partial, formData: newFormData };
  }

  if (newErrorSchema) {
    // If there is an existing schema-validation error on this path, update originalErrorSchema in place (or
    // replace it at the root); otherwise route the new errors into customErrors.
    // @ts-expect-error TS2590, because getting from the error schema is confusing TS
    const oldValidationError = !isRootPath ? _get(schemaValidationErrorSchema, path) : schemaValidationErrorSchema;
    if (!_isEmpty(oldValidationError)) {
      if (!isRootPath) {
        _set(originalErrorSchema, path, newErrorSchema);
      } else {
        originalErrorSchema = newErrorSchema;
      }
    } else {
      if (!customErrors) {
        customErrors = new ErrorSchemaBuilder<T>();
      }
      if (isRootPath) {
        const rootErrors = _get(newErrorSchema, ERRORS_KEY);
        if (rootErrors) {
          customErrors.setErrors(rootErrors);
        }
      } else {
        _set(customErrors.ErrorSchema, path, newErrorSchema);
      }
    }
  } else if (customErrors && _get(customErrors.ErrorSchema, [...path, ERRORS_KEY])) {
    customErrors.clearErrors(path);
  }

  if (mustValidate && options.isLastInQueue) {
    const { customValidate, transformErrors, uiSchema } = props;
    const liveValidation = runLiveValidate<T, S, F>(
      schema,
      schemaUtils,
      originalErrorSchema,
      newFormData,
      extraErrors,
      customErrors,
      retrievedSchema,
      customValidate,
      transformErrors,
      uiSchema,
    );
    partial = { formData: newFormData, ...liveValidation, customErrors };
  } else if (!noValidate && newErrorSchema) {
    const mergedErrors = mergeErrors<T>({ errorSchema: originalErrorSchema, errors }, extraErrors, customErrors);
    partial = { formData: newFormData, ...mergedErrors, customErrors };
  }

  return { partial, customErrors };
}
