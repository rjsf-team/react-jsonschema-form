import {
  createSchemaUtils,
  CustomValidator,
  deepEquals,
  ErrorSchema,
  ErrorSchemaBuilder,
  ErrorTransformer,
  FieldPathId,
  FormContextType,
  GlobalFormOptions,
  ID_KEY,
  mergeObjects,
  Registry,
  RJSFSchema,
  RJSFValidationError,
  SchemaUtilsType,
  StrictRJSFSchema,
  TemplatesType,
  toFieldPathId,
  UiSchema,
  UI_DEFINITIONS_KEY,
  UI_GLOBAL_OPTIONS_KEY,
  ValidationData,
  validationDataMerge,
  DEFAULT_ID_SEPARATOR,
  DEFAULT_ID_PREFIX,
} from '@rjsf/utils';
import _pick from 'lodash/pick';

import getDefaultRegistry from '../getDefaultRegistry';
import { IS_RESET } from './constants';
import type { FormProps, FormState, IChangeEvent } from './Form';

// ─── IChangeEvent ─────────────────────────────────────────────────────────────

/** Converts the full `FormState` into the `IChangeEvent` version by picking out the public values
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

// ─── Pure helper functions ────────────────────────────────────────────────────

/** Extracts the `GlobalFormOptions` from the given Form `props`.
 *
 * @param props - The form props from which to extract global options
 * @returns - The `GlobalFormOptions` computed from the given props
 */
export function getGlobalFormOptions<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: FormProps<T, S, F>,
): GlobalFormOptions {
  const {
    uiSchema = {},
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

/** Computes the `Registry` for the form by merging the default registry entries with any overrides
 * supplied in `props`.
 *
 * @param props - The form props containing optional `fields`, `widgets`, `templates`, `formContext`, and
 *          `translateString` overrides
 * @param schema - The resolved root JSON Schema that will be set as `rootSchema` on the registry
 * @param schemaUtils - The `SchemaUtilsType` instance to attach to the registry
 * @returns - A fully-merged `Registry` ready for use by fields, widgets, and templates
 */
export function buildRegistry<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: FormProps<T, S, F>,
  schema: S,
  schemaUtils: SchemaUtilsType<T, S, F>,
): Registry<T, S, F> {
  const { translateString: customTranslateString, uiSchema = {} } = props;
  const { fields, templates, widgets, formContext, translateString } = getDefaultRegistry<T, S, F>();
  return {
    fields: { ...fields, ...props.fields },
    templates: {
      ...templates,
      ...props.templates,
      ButtonTemplates: {
        ...templates.ButtonTemplates,
        ...props.templates?.ButtonTemplates,
      },
    } as TemplatesType<T, S, F>,
    widgets: { ...widgets, ...props.widgets },
    rootSchema: schema,
    formContext: props.formContext || formContext,
    schemaUtils,
    translateString: customTranslateString || translateString,
    globalUiOptions: uiSchema[UI_GLOBAL_OPTIONS_KEY],
    globalFormOptions: getGlobalFormOptions(props),
    uiSchemaDefinitions: uiSchema[UI_DEFINITIONS_KEY] ?? {},
  };
}

/** Merges any `extraErrors` or `customErrors` into the given `schemaValidation` object.
 *
 * @param schemaValidation - The base validation result (errors + errorSchema) from JSON Schema validation
 * @param extraErrors - Optional additional errors provided via the `extraErrors` prop; merged with
 *           `validationDataMerge` when present
 * @param customErrors - Optional custom errors accumulated during `onChange` via an `ErrorSchemaBuilder`;
 *           merged with `preventDuplicates` semantics when present
 * @returns - A new `ValidationData` object containing the combined errors and errorSchema
 */
export function mergeErrors<T = any>(
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

/** Validates `formData` against the schema, returning the raw validation result.
 *
 * @param formData - The form data to validate
 * @param schema - The JSON Schema to validate against
 * @param schemaUtils - The `SchemaUtilsType` instance used to retrieve the resolved schema and run the
 *           validator
 * @param customValidate - Optional custom validation function applied after JSON Schema validation
 * @param transformErrors - Optional function to transform or filter the raw validation errors
 * @param uiSchema - Optional UI schema passed through to the validator
 * @param retrievedSchema - Optional pre-resolved schema; when provided, skips the `retrieveSchema`
 *           call to preserve AJV cache hits
 * @returns - The raw `ValidationData` (errors + errorSchema) produced by the validator
 */
export function runValidation<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  formData: T | undefined,
  schema: S,
  schemaUtils: SchemaUtilsType<T, S, F>,
  customValidate?: CustomValidator<T, S, F>,
  transformErrors?: ErrorTransformer<T, S, F>,
  uiSchema?: UiSchema<T, S, F>,
  retrievedSchema?: S,
): ValidationData<T> {
  const resolvedSchema = retrievedSchema ?? schemaUtils.retrieveSchema(schema, formData);
  return schemaUtils
    .getValidator()
    .validateFormData(formData, resolvedSchema, customValidate, transformErrors, uiSchema);
}

/** Performs live validation against the current `formData` and merges in `extraErrors` / `customErrors`.
 *
 * @param rootSchema - The resolved root JSON Schema to validate against
 * @param schemaUtils - The `SchemaUtilsType` instance used to run validation
 * @param originalErrorSchema - The pre-existing `ErrorSchema` on the form; optionally merged into the
 *           result when `mergeIntoOriginalErrorSchema` is true
 * @param formData - The form data to validate
 * @param extraErrors - Optional additional errors from the `extraErrors` prop; merged into the result
 * @param customErrors - Optional custom errors accumulated via `onChange`; merged into the result
 * @param retrievedSchema - Optional pre-resolved schema to avoid redundant `retrieveSchema` calls
 * @param mergeIntoOriginalErrorSchema - When `true`, merges `originalErrorSchema` into the schema
 *           validation result using `preventDuplicates` semantics (used when `retrievedSchema` was
 *           provided, indicating the schema has not changed since the last retrieve)
 * @param customValidate - Optional custom validation function applied after JSON Schema validation
 * @param transformErrors - Optional function to transform or filter the raw validation errors
 * @param uiSchema - Optional UI schema passed through to the validator
 * @returns - An object containing the merged `errors`, `errorSchema`, and the raw
 *           `schemaValidationErrors` / `schemaValidationErrorSchema` before extra/custom error merging
 */
export function performLiveValidate<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  rootSchema: S,
  schemaUtils: SchemaUtilsType<T, S, F>,
  originalErrorSchema: ErrorSchema<S>,
  formData: T | undefined,
  extraErrors: ErrorSchema<T> | undefined,
  customErrors: ErrorSchemaBuilder<T> | undefined,
  retrievedSchema: S | undefined,
  mergeIntoOriginalErrorSchema: boolean,
  customValidate: CustomValidator<T, S, F> | undefined,
  transformErrors: ErrorTransformer<T, S, F> | undefined,
  uiSchema: UiSchema<T, S, F> | undefined,
): {
  errors: RJSFValidationError[];
  errorSchema: ErrorSchema<T>;
  schemaValidationErrors: RJSFValidationError[];
  schemaValidationErrorSchema: ErrorSchema<T>;
} {
  const schemaValidation = runValidation(
    formData,
    rootSchema,
    schemaUtils,
    customValidate,
    transformErrors,
    uiSchema,
    retrievedSchema,
  );
  const { errors } = schemaValidation;
  let { errorSchema } = schemaValidation;
  if (mergeIntoOriginalErrorSchema) {
    errorSchema = mergeObjects(
      originalErrorSchema,
      schemaValidation.errorSchema,
      'preventDuplicates',
    ) as ErrorSchema<T>;
  }
  const schemaValidationErrors = errors;
  const schemaValidationErrorSchema = errorSchema;
  const mergedErrors = mergeErrors({ errorSchema, errors }, extraErrors, customErrors);
  return { ...mergedErrors, schemaValidationErrors, schemaValidationErrorSchema };
}

/** Returns the same `retrievedSchema` reference when its content hasn't changed, preserving AJV cache
 * hits. AJV caches compiled validators by schema reference identity, so reusing the same object
 * avoids redundant recompilation on every render.
 *
 * @param next - The freshly retrieved schema
 * @param current - The previously stored schema reference, or `undefined` on first call
 * @returns - `current` when it is deeply equal to `next`; otherwise `next`
 */
export function stableRetrievedSchema<S>(next: S, current: S | undefined): S {
  return deepEquals(next, current) ? (current as S) : next;
}

/** Computes a complete `FormState` from the given `props` and the current state. Used both for the
 * initial state (in the `useReducer` initializer) and whenever relevant props change (in the
 * `componentDidUpdate` equivalent effect).
 *
 * @param props - The current form props
 * @param currentState - A partial snapshot of the existing state; used to preserve `schemaUtils`,
 *           cached errors, and other values that should only change when their inputs change
 * @param inputFormData - The form data to use as the basis for default-filling and validation;
 *           pass `IS_RESET` to clear all data back to schema defaults
 * @param retrievedSchema - Optional pre-resolved schema; when provided, skips `retrieveSchema` and
 *           opts into merging `originalErrorSchema` (since the schema hasn't changed)
 * @param isSchemaChanged - When `true`, existing validation errors are cleared because they no longer
 *           apply to the new schema
 * @param formDataChangedFields - List of top-level field paths that changed; errors for those fields
 *           are cleared when live validation is not active
 * @param skipLiveValidate - When `true`, live validation is skipped even if `liveValidate` is set;
 *           used to avoid a redundant validation pass when the state data hasn't changed
 * @returns - A fully-computed `FormState` ready to be committed via `dispatch`
 */
export function getStateFromProps<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: FormProps<T, S, F>,
  currentState: Partial<FormState<T, S, F>>,
  inputFormData?: T,
  retrievedSchema?: S,
  isSchemaChanged = false,
  formDataChangedFields: string[] = [],
  skipLiveValidate = false,
): FormState<T, S, F> {
  const { schema, validator, uiSchema: rawUiSchema, noValidate, liveValidate, extraErrors } = props;
  const uiSchema: UiSchema<T, S, F> = rawUiSchema || {};
  const isUncontrolled = props.formData === undefined;
  const edit = typeof inputFormData !== 'undefined';
  const mustValidate = edit && !noValidate && liveValidate;

  let schemaUtils: SchemaUtilsType<T, S, F> = currentState.schemaUtils!;
  if (
    !schemaUtils ||
    schemaUtils.doesSchemaUtilsDiffer(
      validator,
      schema,
      props.experimental_defaultFormStateBehavior,
      props.experimental_customMergeAllOf,
    )
  ) {
    schemaUtils = createSchemaUtils<T, S, F>(
      validator,
      schema,
      props.experimental_defaultFormStateBehavior,
      props.experimental_customMergeAllOf,
    );
  }

  const rootSchema = schemaUtils.getRootSchema();

  let defaultsFormData = inputFormData;
  if (inputFormData === IS_RESET) {
    defaultsFormData = undefined;
  } else if (inputFormData === undefined && isUncontrolled) {
    defaultsFormData = currentState.formData;
  }

  const formData: T = schemaUtils.getDefaultFormState(
    rootSchema,
    defaultsFormData,
    false,
    currentState.initialDefaultsGenerated,
  ) as T;

  const rawRetrievedSchema = retrievedSchema ?? schemaUtils.retrieveSchema(rootSchema, formData);
  const _retrievedSchema = stableRetrievedSchema(rawRetrievedSchema, currentState.retrievedSchema);

  const getCurrentErrors = (): ValidationData<T> => {
    if (noValidate || isSchemaChanged) {
      return { errors: [], errorSchema: {} };
    } else if (!liveValidate) {
      return {
        errors: currentState.schemaValidationErrors || [],
        errorSchema: currentState.schemaValidationErrorSchema || {},
      };
    }
    return {
      errors: currentState.errors || [],
      errorSchema: currentState.errorSchema || {},
    };
  };

  let errors: RJSFValidationError[];
  let errorSchema: ErrorSchema<T> | undefined;
  let schemaValidationErrors: RJSFValidationError[] = currentState.schemaValidationErrors || [];
  let schemaValidationErrorSchema: ErrorSchema<T> = currentState.schemaValidationErrorSchema || {};

  if (mustValidate && !skipLiveValidate) {
    const liveValidation = performLiveValidate(
      rootSchema,
      schemaUtils,
      currentState.errorSchema as ErrorSchema<S>,
      formData,
      undefined,
      currentState.customErrors,
      retrievedSchema,
      retrievedSchema !== undefined,
      props.customValidate,
      props.transformErrors,
      uiSchema,
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
    const mergedErrors = mergeErrors({ errorSchema, errors }, extraErrors, currentState.customErrors);
    errors = mergedErrors.errors;
    errorSchema = mergedErrors.errorSchema;
  }

  const newRegistry = buildRegistry(props, rootSchema, schemaUtils);
  const registry = deepEquals(currentState.registry, newRegistry) ? currentState.registry! : newRegistry;

  const fieldPathId: FieldPathId =
    currentState.fieldPathId && currentState.fieldPathId?.[ID_KEY] === registry.globalFormOptions.idPrefix
      ? currentState.fieldPathId
      : toFieldPathId('', registry.globalFormOptions);

  return {
    schemaUtils,
    schema: rootSchema,
    uiSchema,
    fieldPathId,
    formData,
    edit,
    errors,
    errorSchema: errorSchema!,
    schemaValidationErrors,
    schemaValidationErrorSchema,
    retrievedSchema: _retrievedSchema,
    initialDefaultsGenerated: true,
    registry,
  };
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

/** Updates the schema/UI slice: schema, uiSchema, schemaUtils, registry, fieldPathId */
export type SetSchemaAction<T, S extends StrictRJSFSchema, F extends FormContextType> = {
  type: 'SET_SCHEMA';
  payload: Partial<Pick<FormState<T, S, F>, 'schema' | 'uiSchema' | 'schemaUtils' | 'registry' | 'fieldPathId'>>;
};

/** Updates the form-data slice: formData, edit, retrievedSchema, initialDefaultsGenerated */
export type SetFormDataAction<T, S extends StrictRJSFSchema, F extends FormContextType> = {
  type: 'SET_FORM_DATA';
  payload: Partial<Pick<FormState<T, S, F>, 'formData' | 'edit' | 'retrievedSchema' | 'initialDefaultsGenerated'>>;
};

/** Updates the errors slice: errors, errorSchema, schemaValidation*, customErrors, _prevExtraErrors */
export type SetErrorsAction<T, S extends StrictRJSFSchema, F extends FormContextType> = {
  type: 'SET_ERRORS';
  payload: Partial<
    Pick<
      FormState<T, S, F>,
      | 'errors'
      | 'errorSchema'
      | 'schemaValidationErrors'
      | 'schemaValidationErrorSchema'
      | 'customErrors'
      | '_prevExtraErrors'
    >
  >;
};

/** Catch-all for cross-group updates (full-state replacements, complex mixed updates) */
export type SetStateAction<T, S extends StrictRJSFSchema, F extends FormContextType> = {
  type: 'SET_STATE';
  payload: Partial<FormState<T, S, F>>;
};

export type FormAction<T, S extends StrictRJSFSchema, F extends FormContextType> =
  | SetSchemaAction<T, S, F>
  | SetFormDataAction<T, S, F>
  | SetErrorsAction<T, S, F>
  | SetStateAction<T, S, F>;

/** Pure reducer for the form's `useReducer` hook. Spreads the action's `payload` over the current
 * state; the action type exists solely for call-site clarity and has no effect on the merge logic.
 *
 * @param state - The current `FormState`
 * @param action - A discriminated union action whose `payload` is a partial `FormState` slice
 * @returns A new `FormState` with the payload merged in
 */
export function formReducer<T, S extends StrictRJSFSchema, F extends FormContextType>(
  state: FormState<T, S, F>,
  action: FormAction<T, S, F>,
): FormState<T, S, F> {
  return { ...state, ...action.payload };
}

// ─── Memo comparison ─────────────────────────────────────────────────────────

/** Memo comparison function passed to `React.memo` that respects the
 * `experimental_componentUpdateStrategy` prop.
 *
 * - `'always'` — always returns `false` (component always re-renders)
 * - `'shallow'` — returns `true` only when every prop is `Object.is`-equal (same as `PureComponent`)
 * - `'customDeep'` (default) — uses `deepEquals`, which treats all functions as equivalent,
 *   preventing unnecessary re-renders when callback props are re-created on each parent render
 *
 * @param prev - The previous render's props
 * @param next - The next render's props
 * @returns - `true` when the component should skip re-rendering; `false` when it should re-render
 */
export function propsAreEqual<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  prev: Readonly<Omit<FormProps<T, S, F>, 'ref'>>,
  next: Readonly<Omit<FormProps<T, S, F>, 'ref'>>,
): boolean {
  const strategy = next.experimental_componentUpdateStrategy ?? 'customDeep';
  if (strategy === 'always') {
    return false;
  }
  if (strategy === 'shallow') {
    const keys = [...new Set([...Object.keys(prev), ...Object.keys(next)])] as Array<keyof typeof prev>;
    return keys.every((k) => Object.is(prev[k], next[k]));
  }
  // 'customDeep' — treats functions as equivalent
  return deepEquals(prev, next);
}
