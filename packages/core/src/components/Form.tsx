import {
  ElementType,
  forwardRef,
  FormEvent,
  memo,
  ReactElement,
  ReactNode,
  Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import {
  ComponentUpdateStrategy,
  CustomValidator,
  deepEquals,
  ErrorSchema,
  ErrorSchemaBuilder,
  ErrorTransformer,
  Experimental_CustomMergeAllOf,
  Experimental_DefaultFormStateBehavior,
  FieldPathId,
  FieldPathList,
  FormContextType,
  getChangedFields,
  getTemplate,
  getUiOptions,
  ID_KEY,
  NameGeneratorFunction,
  Registry,
  RegistryFieldsType,
  RegistryWidgetsType,
  removeOptionalEmptyObjects,
  RJSFSchema,
  RJSFValidationError,
  SchemaUtilsType,
  shallowEquals,
  StrictRJSFSchema,
  SUBMIT_BTN_OPTIONS_KEY,
  TemplatesType,
  toErrorList,
  toFieldPathId,
  UiSchema,
  UI_OPTIONS_KEY,
  ValidatorType,
} from '@rjsf/utils';
import _toPath from 'lodash/toPath';

import getDefaultRegistry from '../getDefaultRegistry';
import { IS_RESET } from './constants';
import {
  computeChangeNextState,
  computeStateFromProps,
  mergeErrors,
  runLiveValidate,
  runValidate,
  toIChangeEvent,
} from './formStateHelpers';
import { usePendingChanges } from './hooks/usePendingChanges';

/** Represents a boolean option that is deprecated.
 * @deprecated - In a future major release, this type will be removed
 */
type DeprecatedBooleanOption = boolean;

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
  onSubmit?: (data: IChangeEvent<T, S, F>, event: FormEvent<any>) => void;
  /** Sometimes you may want to trigger events or modify external state when a field has been touched, so you can pass
   * an `onBlur` handler, which will receive the id of the input that was blurred and the field value
   */
  onBlur?: (id: string, data: any) => void;
  /** Sometimes you may want to trigger events or modify external state when a field has been focused, so you can pass
   * an `onFocus` handler, which will receive the id of the input that is focused and the field value
   */
  onFocus?: (id: string, data: any) => void;
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
   * can be used to implement asynchronous validation. By default, these are non-blocking errors, meaning that you can
   * still submit the form when these are the only errors displayed to the user.
   */
  extraErrors?: ErrorSchema<T>;
  /** If set to true, causes the `extraErrors` to become blocking when the form is submitted */
  extraErrorsBlockSubmit?: boolean;
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
   * If no value (or `false`) is provided, then live validation will not happen. If `true` or `onChange` is provided for
   * the flag, then live validation will be performed after processing of all pending changes has completed. If `onBlur`
   * is provided, then live validation will be performed when a field that was updated is blurred (as a performance
   * optimization).
   *
   * NOTE: In a future major release, the `boolean` options for this flag will be removed
   */
  liveValidate?: 'onChange' | 'onBlur' | DeprecatedBooleanOption;
  /** Flag that describes when live omit will be performed. Live omit happens only when `omitExtraData` is also set to
   * to `true` and the form's data is updated by the user.
   *
   * If no value (or `false`) is provided, then live omit will not happen. If `true` or `onChange` is provided for
   * the flag, then live omit will be performed after processing of all pending changes has completed. If `onBlur`
   * is provided, then live omit will be performed when a field that was updated is blurred (as a performance
   * optimization).
   *
   * NOTE: In a future major release, the `boolean` options for this flag will be removed
   */
  liveOmit?: 'onChange' | 'onBlur' | DeprecatedBooleanOption;
  /** If set to true, then extra form data values that are not in any form field will be removed whenever `onSubmit` is
   * called. Set to `false` by default.
   */
  omitExtraData?: boolean;
  /** If set to true, optional object properties whose fields are all empty (undefined, null, or empty string)
   * will be automatically removed from formData. This prevents the scenario where interacting with fields inside
   * an optional object "activates" it permanently, making the form unsubmittable when the optional object has
   * required inner fields. This works independently of `omitExtraData`. Set to `false` by default.
   */
  removeEmptyOptionalObjects?: boolean;
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
  experimental_defaultFormStateBehavior?: Experimental_DefaultFormStateBehavior;
  /**
   * Controls the component update strategy used by the memoized `Form`.
   *
   * - `'customDeep'`: Uses RJSF's custom deep equality checks via the `deepEquals` utility function,
   *   which treats all functions as equivalent and provides optimized performance for form data comparisons.
   * - `'shallow'`: Uses shallow comparison of props (only compares direct properties).
   * - `'always'`: Always rerenders when called.
   *
   * @default 'customDeep'
   */
  experimental_componentUpdateStrategy?: ComponentUpdateStrategy;
  /** Optional function that allows for custom merging of `allOf` schemas
   */
  experimental_customMergeAllOf?: Experimental_CustomMergeAllOf<S>;
  // Private
  /**
   * _internalFormWrapper is currently used by the semantic-ui theme to provide a custom wrapper around `<Form />`
   * that supports the proper rendering of those themes. To use this prop, one must pass a component that takes two
   * props: `children` and `as`. That component, at minimum, should render the `children` inside of a <form /> tag
   * unless `as` is provided, in which case, use the `as` prop in place of `<form />`.
   * i.e.:
   * ```
   * export default function InternalForm({ children, as }) {
   *   const FormTag = as || 'form';
   *   return <FormTag>{children}</FormTag>;
   * }
   * ```
   *
   * Use at your own risk as this prop is private and may change at any time without notice.
   */
  _internalFormWrapper?: ElementType;
  /** Support receiving a React ref to the Form. The ref's shape is `FormRef<T>` — a subset of the legacy class
   * instance exposing only the documented public methods (`submit`, `reset`, `validateForm`, `setFieldValue`,
   * `focusOnError`).
   */
  ref?: Ref<FormRef<T>>;
}

/** The data that is contained within the state for the `Form`. Retained as an exported type for backwards
 * compatibility and for use inside `IChangeEvent`.
 */
export interface FormState<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any> {
  /** The JSON schema object for the form */
  schema: S;
  /** The uiSchema for the form */
  uiSchema: UiSchema<T, S, F>;
  /** The `FieldPathId` for the form, computed from the `schema`, the `rootFieldId`, the `idPrefix` and
   * `idSeparator` props.
   */
  fieldPathId: FieldPathId;
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
  /** The retrieved schema — `schemaUtils.retrieveSchema(schema, formData)` — memoized to avoid recomputation. */
  retrievedSchema: S;
  /** Flag indicating whether the initial form defaults have been generated */
  initialDefaultsGenerated: boolean;
  /** The registry (re)computed only when props changed */
  registry: Registry<T, S, F>;
}

/** The event data passed when changes have been made to the form, includes everything from the `FormState` except
 * the schema validation errors. An additional `status` is added when returned from `onSubmit`
 */
export interface IChangeEvent<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> extends Pick<
  FormState<T, S, F>,
  'schema' | 'uiSchema' | 'fieldPathId' | 'schemaUtils' | 'formData' | 'edit' | 'errors' | 'errorSchema'
> {
  /** The status of the form when submitted */
  status?: 'submitted';
}

/** The public imperative API exposed by `Form` via its `ref` prop. This is a deliberate subset of the legacy class
 * component's instance surface — only the documented public methods remain.
 */
export interface FormRef<T = any> {
  /** Programmatically submits the form (dispatches a cancelable `submit` event and calls `requestSubmit`). */
  submit: () => void;
  /** Resets the form back to its initial defaults (or `initialFormData` when provided). */
  reset: () => void;
  /** Validates the current form data and returns `true` when the form is valid. */
  validateForm: () => boolean;
  /** Imperatively sets the value at the given path. Equivalent to a user edit at that path. */
  setFieldValue: (fieldPath: string | FieldPathList, newValue?: T) => void;
  /** Attempts to focus on the field associated with the given `error` (using `error.property`). */
  focusOnError: (error: RJSFValidationError) => void;
}

/** The set of actions that the `Form` reducer responds to. */
type FormAction<T, S extends StrictRJSFSchema, F extends FormContextType> =
  | { type: 'REPLACE'; nextState: FormState<T, S, F> }
  | { type: 'APPLY_PARTIAL'; partial: Partial<FormState<T, S, F>> };

/** Pure reducer for `Form`. All state transitions flow through this function. */
function formReducer<T, S extends StrictRJSFSchema, F extends FormContextType>(
  state: FormState<T, S, F>,
  action: FormAction<T, S, F>,
): FormState<T, S, F> {
  switch (action.type) {
    case 'REPLACE':
      return action.nextState;
    case 'APPLY_PARTIAL':
      return { ...state, ...action.partial };
    default:
      return state;
  }
}

/** Lazy initializer for the reducer: builds the initial `FormState` from the given `props`. */
function initFormState<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
): FormState<T, S, F> {
  if (!props.validator) {
    throw new Error('A validator is required for Form functionality to work');
  }
  const inputFormData = props.formData ?? props.initialFormData;
  return computeStateFromProps<T, S, F>(props, {}, inputFormData, {
    skipLiveValidate: true,
    defaultRegistry: getDefaultRegistry<T, S, F>(),
    resetSentinel: IS_RESET,
  });
}

/** The `Form` component renders the outer form and all the fields defined in the `schema`. */
function FormInner<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: FormProps<T, S, F>,
  ref: Ref<FormRef<T>>,
) {
  const [reducerState, dispatch] = useReducer(
    formReducer as (state: FormState<T, S, F>, action: FormAction<T, S, F>) => FormState<T, S, F>,
    props,
    initFormState<T, S, F>,
  );

  // A stable default registry reference. Only the referential identity matters for the inner equality shortcuts.
  const defaultRegistry = useMemo(() => getDefaultRegistry<T, S, F>(), []);

  // --- Props-derived state ---
  // When any input prop changes, recompute the base state from props. We detect the prop change in render and
  // dispatch synchronously; React re-runs the render with the new state before committing, with no intermediate
  // flash (the "setState during render" pattern from the React docs).
  const prevPropsRef = useRef(props);
  // Collects an `onChange` notification to fire after render commits, when prop-driven defaulting changed formData.
  // Calling `onChange` during render itself is unsafe — parents may setState in response, triggering cascades.
  const pendingOnChangeRef = useRef<FormState<T, S, F> | null>(null);
  // Set when we process a user-initiated change via the pending-changes drain. Cleared on the next render after
  // props change. This prevents the props-derivation block below from reverting a user's choice (most visibly,
  // oneOf/anyOf option switches) when the parent echoes our own `onChange` back to us as a new `formData` prop
  // that would, if re-defaulted, snap back to a different option.
  const userChangeAppliedRef = useRef(false);
  let state = reducerState;
  if (prevPropsRef.current !== props && !deepEquals(prevPropsRef.current, props)) {
    const wasUserChange = userChangeAppliedRef.current;
    userChangeAppliedRef.current = false;
    const prevProps = prevPropsRef.current;
    const isSchemaChanged = !deepEquals(prevProps.schema, props.schema);
    const formDataChangedFields = getChangedFields(props.formData, prevProps.formData);
    const isFormDataChanged = formDataChangedFields.length > 0 || !deepEquals(prevProps.formData, props.formData);
    const isStateDataChanged =
      getChangedFields(props.formData, reducerState.formData).length > 0 ||
      !deepEquals(reducerState.formData, props.formData);
    const nextState = computeStateFromProps<T, S, F>(props, reducerState, props.formData, {
      retrievedSchema: isSchemaChanged || isFormDataChanged ? undefined : reducerState.retrievedSchema,
      isSchemaChanged,
      formDataChangedFields,
      skipLiveValidate: !isStateDataChanged,
      defaultRegistry,
      resetSentinel: IS_RESET,
    });
    // Only bail out when a user change was just applied AND the re-derived state would snap away from props.formData
    // (i.e. defaulting would overwrite the user's choice, like a oneOf/null-option switch). When the computed state
    // matches props.formData, the class's original bail-out wouldn't have fired either — fall through so controlled
    // parents' prop echoes actually take effect.
    const nextStateDiffersFromProps = !deepEquals(nextState.formData, props.formData);
    const shouldBailOut = wasUserChange && nextStateDiffersFromProps;
    if (!shouldBailOut && !deepEquals(nextState, reducerState)) {
      state = nextState;
      dispatch({ type: 'REPLACE', nextState });
      // Mirror the class component's `componentDidUpdate` onChange semantics: notify the parent when the derived
      // `formData` differs both from the raw `formData` prop AND from the prior state — i.e. props-driven
      // defaulting changed the data the parent can observe.
      if (nextStateDiffersFromProps && !deepEquals(nextState.formData, reducerState.formData)) {
        pendingOnChangeRef.current = nextState;
      }
    }
    prevPropsRef.current = props;
  }

  // --- extraErrors prop-change re-merge ---
  // When the `extraErrors` prop changes by reference, re-merge the schema-validation errors with the new
  // `extraErrors` (and any user-supplied `customErrors`) and write the merged result back into state via a
  // synchronous dispatch. Mirrors the class component's `getDerivedStateFromProps`.
  const prevExtraErrorsRef = useRef(props.extraErrors);
  if (prevExtraErrorsRef.current !== props.extraErrors) {
    prevExtraErrorsRef.current = props.extraErrors;
    const merged = mergeErrors<T>(
      {
        errors: state.schemaValidationErrors || [],
        errorSchema: (state.schemaValidationErrorSchema || {}) as ErrorSchema<T>,
      },
      props.extraErrors,
      state.customErrors,
    );
    if (!deepEquals(merged.errors, state.errors) || !deepEquals(merged.errorSchema, state.errorSchema)) {
      state = { ...state, errors: merged.errors, errorSchema: merged.errorSchema };
      dispatch({ type: 'APPLY_PARTIAL', partial: { errors: merged.errors, errorSchema: merged.errorSchema } });
    }
  }

  // Mirror state into a ref for synchronous access from handler loops (pending-change drain, etc.).
  const stateRef = useRef(state);
  stateRef.current = state;

  // Mirror props into a ref for the same reason.
  const propsRef = useRef(props);
  propsRef.current = props;

  // On the very first render, if the initial default-filling pass modified the formData (e.g. schema defaults were
  // injected), notify the parent via `onChange`. Mirrors the legacy class component's constructor-time `onChange`
  // call, which runs *before* any children render or mount — important for tests (and consumers) that expect the
  // initial defaults notification to arrive before child-triggered `onChange` calls. Guarded by a ref so it fires
  // only once.
  const didInitialOnChangeRef = useRef(false);
  if (!didInitialOnChangeRef.current) {
    didInitialOnChangeRef.current = true;
    const rawFormData = props.formData ?? props.initialFormData;
    if (props.onChange && !deepEquals(state.formData, rawFormData)) {
      props.onChange(toIChangeEvent(state));
    }
  }

  // Fires the deferred `onChange` notification queued by the props-derivation block above, once per commit.
  useEffect(() => {
    if (pendingOnChangeRef.current && propsRef.current.onChange) {
      propsRef.current.onChange(toIChangeEvent(pendingOnChangeRef.current));
    }
    pendingOnChangeRef.current = null;
  });

  // Drives the pending-change queue. The hook manages queue state internally and invokes this callback for each
  // change as it is drained. `isLastInQueue` gates whether live validation runs on this iteration.
  const { enqueue } = usePendingChanges<T>((change, isLastInQueue) => {
    const currentProps = propsRef.current;
    const currentState = stateRef.current;
    const { partial } = computeChangeNextState<T, S, F>(currentProps, currentState, change, {
      isLastInQueue,
      defaultRegistry,
      resetSentinel: IS_RESET,
    });
    const nextState: FormState<T, S, F> = { ...currentState, ...partial };
    stateRef.current = nextState;
    // Flag that a user-initiated change has just been applied. The props-derivation block above uses this to skip
    // the next prop-echo that would otherwise re-default away from the user's choice.
    userChangeAppliedRef.current = true;
    dispatch({ type: 'APPLY_PARTIAL', partial });
    if (currentProps.onChange) {
      currentProps.onChange(toIChangeEvent(nextState), change.id);
    }
  });

  const onChange = useCallback(
    (newValue: T | undefined, path: FieldPathList, newErrorSchema?: ErrorSchema<T>, id?: string) => {
      enqueue({ newValue, path, newErrorSchema, id });
    },
    [enqueue],
  );

  const onBlur = useCallback((id: string, data: any) => {
    const currentProps = propsRef.current;
    const currentState = stateRef.current;
    const {
      onBlur: onBlurProp,
      omitExtraData,
      liveOmit,
      liveValidate,
      removeEmptyOptionalObjects: removeEmptyOpt,
      extraErrors,
      onChange: onChangeProp,
      customValidate,
      transformErrors,
      uiSchema,
    } = currentProps;
    if (onBlurProp) {
      onBlurProp(id, data);
    }
    const shouldLiveOmit = omitExtraData === true && liveOmit === 'onBlur';
    const shouldLiveValidate = liveValidate === 'onBlur';
    if (!shouldLiveOmit && !shouldLiveValidate && !removeEmptyOpt) {
      return;
    }
    const { formData, schemaUtils, schema, errorSchema, customErrors, retrievedSchema } = currentState;
    let newFormData: T | undefined = formData;
    let partial: Partial<FormState<T, S, F>> = { formData: newFormData };
    if (shouldLiveOmit) {
      newFormData = schemaUtils.omitExtraData(schema, newFormData);
      partial = { formData: newFormData };
    }
    if (removeEmptyOpt) {
      newFormData = removeOptionalEmptyObjects(
        schemaUtils.getValidator(),
        schema,
        schemaUtils.getRootSchema(),
        newFormData,
      ) as T;
      partial = { ...partial, formData: newFormData };
    }
    if (shouldLiveValidate) {
      const liveValidation = runLiveValidate<T, S, F>(
        schema,
        schemaUtils,
        errorSchema,
        newFormData,
        extraErrors,
        customErrors,
        retrievedSchema,
        customValidate,
        transformErrors,
        uiSchema,
      );
      partial = { formData: newFormData, ...liveValidation, customErrors };
    }
    const nextState: FormState<T, S, F> = { ...currentState, ...partial };
    const hasChanges = Object.keys(partial)
      .filter((key) => !key.startsWith('schemaValidation'))
      .some((key) => {
        const oldData = (currentState as any)[key];
        const newData = (partial as any)[key];
        return !deepEquals(oldData, newData);
      });
    stateRef.current = nextState;
    dispatch({ type: 'APPLY_PARTIAL', partial });
    if (onChangeProp && hasChanges) {
      onChangeProp(toIChangeEvent(nextState), id);
    }
  }, []);

  const onFocus = useCallback((id: string, data: any) => {
    const { onFocus: onFocusProp } = propsRef.current;
    if (onFocusProp) {
      onFocusProp(id, data);
    }
  }, []);

  // The form element ref is used by submit() and focusOnError.
  const formElement = useRef<any>(null);

  /** Attempts to focus on the field associated with the given `error`. */
  const focusOnErrorImpl = useCallback((error: RJSFValidationError) => {
    if (!formElement.current) {
      return;
    }
    const { idPrefix = 'root', idSeparator = '_' } = propsRef.current;
    const { property } = error;
    const path = _toPath(property) as string[];
    if (path[0] === '') {
      path[0] = idPrefix;
    } else {
      path.unshift(idPrefix);
    }
    const elementId = path.join(idSeparator);
    let field = formElement.current.elements[elementId];
    if (!field) {
      field = formElement.current.querySelector(`input[id^="${elementId}"], button[id^="${elementId}"]`);
    }
    if (field && field.length) {
      field = field[0];
    }
    if (field) {
      field.focus();
    }
  }, []);

  /** Validate the given `formData` and update state accordingly. Returns `true` when the form is valid. */
  const validateFormWithFormData = useCallback(
    (formDataArg?: T): boolean => {
      const currentProps = propsRef.current;
      const currentState = stateRef.current;
      const {
        extraErrors,
        extraErrorsBlockSubmit,
        focusOnFirstError,
        onError,
        customValidate,
        transformErrors,
        uiSchema,
      } = currentProps;
      const { errors: prevErrors, schema, schemaUtils } = currentState;
      const schemaValidation = runValidate<T, S, F>(
        formDataArg,
        schema,
        schemaUtils,
        undefined,
        customValidate,
        transformErrors,
        uiSchema,
      );
      const { errors, errorSchema } = extraErrors ? mergeErrors<T>(schemaValidation, extraErrors) : schemaValidation;
      const hasError = schemaValidation.errors.length > 0 || (!!extraErrors && !!extraErrorsBlockSubmit);
      if (hasError) {
        if (focusOnFirstError) {
          if (typeof focusOnFirstError === 'function') {
            focusOnFirstError(errors[0]);
          } else {
            focusOnErrorImpl(errors[0]);
          }
        }
        const partial: Partial<FormState<T, S, F>> = {
          errors,
          errorSchema,
          schemaValidationErrors: schemaValidation.errors,
          schemaValidationErrorSchema: schemaValidation.errorSchema,
        };
        stateRef.current = { ...currentState, ...partial };
        dispatch({ type: 'APPLY_PARTIAL', partial });
        if (onError) {
          onError(errors);
        } else {
          // eslint-disable-next-line no-console
          console.error('Form validation failed', errors);
        }
      } else if (errors.length > 0) {
        const partial: Partial<FormState<T, S, F>> = {
          errors,
          errorSchema,
          schemaValidationErrors: [],
          schemaValidationErrorSchema: {},
        };
        stateRef.current = { ...currentState, ...partial };
        dispatch({ type: 'APPLY_PARTIAL', partial });
      } else if (prevErrors.length > 0) {
        const partial: Partial<FormState<T, S, F>> = {
          errors: [],
          errorSchema: {},
          schemaValidationErrors: [],
          schemaValidationErrorSchema: {},
        };
        stateRef.current = { ...currentState, ...partial };
        dispatch({ type: 'APPLY_PARTIAL', partial });
      }
      return !hasError;
    },
    [focusOnErrorImpl],
  );

  const onSubmit = useCallback(
    (event: FormEvent<any>) => {
      event.preventDefault();
      if (event.target !== event.currentTarget) {
        return;
      }
      event.persist();
      const currentProps = propsRef.current;
      const currentState = stateRef.current;
      const {
        omitExtraData,
        extraErrors,
        noValidate,
        onSubmit: onSubmitProp,
        removeEmptyOptionalObjects: rmOpt,
      } = currentProps;
      const { schema, schemaUtils } = currentState;
      let newFormData: T | undefined = currentState.formData;
      if (omitExtraData === true) {
        newFormData = schemaUtils.omitExtraData(schema, newFormData);
      }
      if (rmOpt) {
        newFormData = removeOptionalEmptyObjects(
          schemaUtils.getValidator(),
          schema,
          schemaUtils.getRootSchema(),
          newFormData,
        ) as T;
      }
      if (noValidate || validateFormWithFormData(newFormData)) {
        const errorSchema = extraErrors || {};
        const errors = extraErrors ? toErrorList(extraErrors) : [];
        const partial: Partial<FormState<T, S, F>> = {
          formData: newFormData,
          errors,
          errorSchema,
          schemaValidationErrors: [],
          schemaValidationErrorSchema: {},
        };
        const nextState: FormState<T, S, F> = { ...stateRef.current, ...partial };
        stateRef.current = nextState;
        dispatch({ type: 'APPLY_PARTIAL', partial });
        if (onSubmitProp) {
          onSubmitProp(toIChangeEvent({ ...nextState, formData: newFormData }, 'submitted'), event);
        }
      }
    },
    [validateFormWithFormData],
  );

  /** Reset the form back to its initial defaults (or `initialFormData`). */
  const reset = useCallback(() => {
    const currentProps = propsRef.current;
    const { formData: propsFormData, initialFormData = IS_RESET as T, onChange: onChangeProp } = currentProps;
    const newState = computeStateFromProps<T, S, F>(currentProps, stateRef.current, propsFormData ?? initialFormData, {
      skipLiveValidate: true,
      defaultRegistry,
      resetSentinel: IS_RESET,
    });
    const partial: Partial<FormState<T, S, F>> = {
      formData: newState.formData,
      errorSchema: {},
      errors: [],
      schemaValidationErrors: [],
      schemaValidationErrorSchema: {},
      initialDefaultsGenerated: false,
      customErrors: undefined,
    };
    const nextState: FormState<T, S, F> = { ...stateRef.current, ...partial };
    stateRef.current = nextState;
    dispatch({ type: 'APPLY_PARTIAL', partial });
    if (onChangeProp) {
      onChangeProp(toIChangeEvent(nextState));
    }
  }, [defaultRegistry]);

  /** Imperatively set a value at the given path, equivalent to a user edit at that path. */
  const setFieldValue = useCallback(
    (fieldPath: string | FieldPathList, newValue?: T) => {
      const { registry } = stateRef.current;
      const path = Array.isArray(fieldPath) ? fieldPath : fieldPath.split('.');
      const fid = toFieldPathId('', registry.globalFormOptions, path);
      onChange(newValue, path, undefined, fid[ID_KEY]);
    },
    [onChange],
  );

  /** Programmatically submit the form (dispatches a cancelable submit event and calls `requestSubmit`). */
  const submit = useCallback(() => {
    if (formElement.current) {
      const submitCustomEvent = new CustomEvent('submit', { cancelable: true });
      submitCustomEvent.preventDefault();
      formElement.current.dispatchEvent(submitCustomEvent);
      formElement.current.requestSubmit();
    }
  }, []);

  /** Programmatically validate the form. */
  const validateForm = useCallback(() => {
    const currentProps = propsRef.current;
    const { omitExtraData, removeEmptyOptionalObjects: rmOpt } = currentProps;
    const { schema, schemaUtils } = stateRef.current;
    let newFormData: T | undefined = stateRef.current.formData;
    if (omitExtraData === true) {
      newFormData = schemaUtils.omitExtraData(schema, newFormData);
    }
    if (rmOpt) {
      newFormData = removeOptionalEmptyObjects(
        schemaUtils.getValidator(),
        schema,
        schemaUtils.getRootSchema(),
        newFormData,
      ) as T;
    }
    return validateFormWithFormData(newFormData);
  }, [validateFormWithFormData]);

  // Expose the 5 documented public methods via the ref prop.
  useImperativeHandle(
    ref,
    () => ({
      submit,
      reset,
      validateForm,
      setFieldValue,
      focusOnError: focusOnErrorImpl,
    }),
    [submit, reset, validateForm, setFieldValue, focusOnErrorImpl],
  );

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
    _internalFormWrapper,
  } = props;

  const { schema, uiSchema, formData, errorSchema, fieldPathId, registry, errors } = state;
  const { SchemaField: _SchemaField } = registry.fields;
  const { SubmitButton } = registry.templates.ButtonTemplates;

  const as = _internalFormWrapper ? tagName : undefined;
  const FormTag = _internalFormWrapper || tagName || 'form';

  let { [SUBMIT_BTN_OPTIONS_KEY]: submitOptions = {} } = getUiOptions<T, S, F>(uiSchema);
  if (disabled) {
    submitOptions = { ...submitOptions, props: { ...submitOptions.props, disabled: true } };
  }
  const submitUiSchema = { [UI_OPTIONS_KEY]: { [SUBMIT_BTN_OPTIONS_KEY]: submitOptions } };

  const renderErrors = () => {
    if (errors && errors.length) {
      const options = getUiOptions<T, S, F>(uiSchema);
      const ErrorListTemplate = getTemplate<'ErrorListTemplate', T, S, F>('ErrorListTemplate', registry, options);
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
  };

  return (
    <FormTag
      className={className ? className : 'rjsf'}
      id={id}
      name={name}
      method={method}
      target={target}
      action={action}
      autoComplete={autoComplete}
      encType={enctype}
      acceptCharset={acceptCharset}
      noValidate={noHtml5Validate}
      onSubmit={onSubmit}
      as={as}
      ref={formElement}
    >
      {showErrorList === 'top' && renderErrors()}
      <_SchemaField
        name=''
        schema={schema}
        uiSchema={uiSchema}
        errorSchema={errorSchema}
        fieldPathId={fieldPathId}
        formData={formData}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        registry={registry}
        disabled={disabled}
        readonly={readonly}
      />
      {children ? children : <SubmitButton uiSchema={submitUiSchema} registry={registry} />}
      {showErrorList === 'bottom' && renderErrors()}
    </FormTag>
  );
}

/** Props-level comparator that honors `experimental_componentUpdateStrategy`. Replaces the legacy class component's
 * `shouldComponentUpdate` bail-out at the render-gate level. Note: this only compares props — state-level bail-outs
 * from the class's `shouldRender` are implicitly handled by only dispatching when state actually changes.
 */
function arePropsEqual<T, S extends StrictRJSFSchema, F extends FormContextType>(
  prev: FormProps<T, S, F>,
  next: FormProps<T, S, F>,
): boolean {
  const strategy: ComponentUpdateStrategy = next.experimental_componentUpdateStrategy ?? 'customDeep';
  if (strategy === 'always') {
    return false;
  }
  if (strategy === 'shallow') {
    return shallowEquals(prev, next);
  }
  return deepEquals(prev, next);
}

// Wrap with `forwardRef` so the `ref` prop is delivered as a second argument, then with `React.memo` to honor the
// `experimental_componentUpdateStrategy` prop. The outer cast preserves the generic type parameters (both
// `forwardRef` and `memo` drop generics otherwise — a known TypeScript/React limitation).
const Form = memo(forwardRef(FormInner as any), arePropsEqual as any) as <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(
  props: FormProps<T, S, F> & { ref?: Ref<FormRef<T>> },
) => ReactElement | null;

export default Form;
