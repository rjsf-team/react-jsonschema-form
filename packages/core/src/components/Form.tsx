import {
  ElementType,
  FormEvent,
  ForwardedRef,
  ReactElement,
  ReactNode,
  Ref,
  RefObject,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import {
  deepEquals,
  ErrorSchema,
  ErrorSchemaBuilder,
  FieldPathId,
  FieldPathList,
  FormContextType,
  getChangedFields,
  getFieldNames,
  getTemplate,
  getUiOptions,
  getUsedFormData,
  isObject,
  PathSchema,
  StrictRJSFSchema,
  Registry,
  RegistryFieldsType,
  RegistryWidgetsType,
  RJSFSchema,
  RJSFValidationError,
  removeOptionalEmptyObjects,
  SchemaUtilsType,
  SUBMIT_BTN_OPTIONS_KEY,
  TemplatesType,
  toErrorList,
  toFieldPathId,
  UiSchema,
  UI_OPTIONS_KEY,
  ValidatorType,
  Experimental_DefaultFormStateBehavior,
  Experimental_CustomMergeAllOf,
  ERRORS_KEY,
  ID_KEY,
  NameGeneratorFunction,
  CustomValidator,
  ErrorTransformer,
  ValidationData,
  validationDataMerge,
} from '@rjsf/utils';
import _cloneDeep from 'lodash/cloneDeep';
import _get from 'lodash/get';
import _isEmpty from 'lodash/isEmpty';
import _set from 'lodash/set';
import _toPath from 'lodash/toPath';
import _unset from 'lodash/unset';

import { ADDITIONAL_PROPERTY_KEY_REMOVE, IS_RESET } from './constants';
import {
  FormAction,
  formReducer,
  getStateFromProps,
  mergeErrors,
  performLiveValidate,
  propsAreEqual,
  runValidation,
  toIChangeEvent,
} from './formUtils';

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
   * Controls the component update strategy.
   *
   * - `'customDeep'`: Uses RJSF's custom deep equality checks via the `deepEquals` utility function,
   *   which treats all functions as equivalent and provides optimized performance for form data comparisons.
   * - `'shallow'`: Uses shallow comparison of props (only compares direct properties). This matches React's PureComponent behavior.
   * - `'always'`: Always rerenders when called. This matches React's Component behavior.
   *
   * @default 'customDeep'
   */
  experimental_componentUpdateStrategy?: 'customDeep' | 'shallow' | 'always';
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
  /** Support receiving a React ref to the Form
   */
  ref?: Ref<FormRef<T, S, F>>;
}

/** The data that is contained within the state for the `Form` */
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
  /** @description result of schemaUtils.retrieveSchema(schema, formData). This a memoized value to avoid re calculate at internal functions (getStateFromProps, onChange) */
  retrievedSchema: S;
  /** Flag indicating whether the initial form defaults have been generated */
  initialDefaultsGenerated: boolean;
  /** The registry (re)computed only when props changed */
  registry: Registry<T, S, F>;
  /** Tracks the previous `extraErrors` prop reference so that the derived-state logic can detect changes */
  _prevExtraErrors?: ErrorSchema<T>;
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

/** The public handle exposed on the Form ref */
export interface FormRef<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any> {
  /** Programmatically submits the form */
  submit(): void;
  /** Resets the form to its initial state */
  reset(): void;
  /** Programmatically validates the form; returns true if valid */
  validateForm(): boolean;
  /** Validates the form with specific formData; returns true if valid */
  validateFormWithFormData(formData?: T): boolean;
  /** Sets a field value at the given path */
  setFieldValue(fieldPath: string | FieldPathList, newValue?: T): void;
  /** @deprecated - use SchemaUtils.omitExtraData instead */
  omitExtraData(formData?: T): T | undefined;
  /** @deprecated */
  getUsedFormData(formData: T | undefined, fields: string[]): T | undefined;
  /** @deprecated */
  getFieldNames(pathSchema: PathSchema<T>, formData?: T): string[][];
  /** Ref to the underlying form DOM element */
  formElement: RefObject<any>;
  /** The current form state */
  readonly state: FormState<T, S, F>;
}

/** Backward-compatible type alias for `FormRef`. Consumers who previously used the class-based
 * `Form` as a ref type (e.g. `createRef<Form>()`) can continue to do so via this alias.
 */
export type { FormRef as Form };

/** The definition of a pending change that will be processed in the `onChange` handler
 */
interface PendingChange<T> {
  /** The path into the formData/errorSchema at which the `newValue`/`newErrorSchema` will be set */
  path: FieldPathList;
  /** The new value to set into the formData */
  newValue?: T;
  /** The new errors to be set into the errorSchema, if any */
  newErrorSchema?: ErrorSchema<T>;
  /** The optional id of the field for which the change is being made */
  id?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

function FormComponent<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: Omit<FormProps<T, S, F>, 'ref'>,
  forwardedRef: ForwardedRef<FormRef<T, S, F>>,
) {
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
    validator,
    formData: propsFormData,
    initialFormData,
  } = props;

  if (!validator) {
    throw new Error('A validator is required for Form functionality to work');
  }

  // ── Refs ──────────────────────────────────────────────────────────────────
  const formElement = useRef<any>(null);
  const pendingChangesRef = useRef<PendingChange<T>[]>([]);
  const isProcessingUserChangeRef = useRef(false);
  const handleRef = useRef<FormRef<T, S, F> | null>(null);
  /** Always holds the latest props so callbacks/effects don't stale-close over old values */
  const propsRef = useRef(props);
  propsRef.current = props;

  // ── State ─────────────────────────────────────────────────────────────────
  const [state, dispatch] = useReducer(
    formReducer as (s: FormState<T, S, F>, a: FormAction<T, S, F>) => FormState<T, S, F>,
    null as unknown as FormState<T, S, F>,
    (): FormState<T, S, F> => {
      const initFormData = propsFormData ?? initialFormData;
      const initialState = getStateFromProps<T, S, F>(props, {}, initFormData, undefined, undefined, [], true);
      return { ...initialState, _prevExtraErrors: props.extraErrors };
    },
  );

  /** Always holds the latest committed state for use inside callbacks */
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── Initial onChange call (constructor equivalent) ────────────────────────
  const didFireInitialOnChangeRef = useRef(false);
  // useLayoutEffect fires before children's useEffect, ensuring the initial onChange
  // (with id=undefined) is emitted before any child widget effects emit their own changes.
  useLayoutEffect(() => {
    if (didFireInitialOnChangeRef.current) {
      return;
    }
    didFireInitialOnChangeRef.current = true;
    const initFormData = propsRef.current.formData ?? propsRef.current.initialFormData;
    if (propsRef.current.onChange && !deepEquals(stateRef.current.formData, initFormData)) {
      propsRef.current.onChange(toIChangeEvent(stateRef.current));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── getDerivedStateFromProps equivalent ───────────────────────────────────
  // Re-merges schemaValidationErrors + extraErrors + customErrors whenever
  // the `extraErrors` prop reference changes.
  const prevExtraErrorsRef = useRef(props.extraErrors);
  useEffect(() => {
    if (props.extraErrors === prevExtraErrorsRef.current) {
      return;
    }
    prevExtraErrorsRef.current = props.extraErrors;
    const s = stateRef.current;
    const base: ValidationData<T> = {
      errors: s.schemaValidationErrors || [],
      errorSchema: (s.schemaValidationErrorSchema || {}) as ErrorSchema<T>,
    };
    let { errors, errorSchema } = base;
    if (props.extraErrors) {
      ({ errors, errorSchema } = validationDataMerge<T>(base, props.extraErrors));
    }
    if (s.customErrors) {
      ({ errors, errorSchema } = validationDataMerge<T>({ errors, errorSchema }, s.customErrors.ErrorSchema, true));
    }
    dispatch({ type: 'SET_ERRORS', payload: { _prevExtraErrors: props.extraErrors, errors, errorSchema } });
  }, [props.extraErrors]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── getSnapshotBeforeUpdate + componentDidUpdate equivalent ───────────────
  // Runs after every render; acts only when props have genuinely changed.
  const prevPropsRef = useRef<Omit<FormProps<T, S, F>, 'ref'>>(props);
  useEffect(() => {
    const prevProps = prevPropsRef.current;
    prevPropsRef.current = props;
    if (deepEquals(props, prevProps)) {
      return;
    }

    const currentState = stateRef.current;
    const formDataChangedFields = getChangedFields(props.formData, prevProps.formData);
    const stateDataChangedFields = getChangedFields(props.formData, currentState.formData);
    const isSchemaChanged = !deepEquals(prevProps.schema, props.schema);
    const isFormDataChanged = formDataChangedFields.length > 0 || !deepEquals(prevProps.formData, props.formData);
    const isStateDataChanged = stateDataChangedFields.length > 0 || !deepEquals(currentState.formData, props.formData);

    const nextState = getStateFromProps<T, S, F>(
      props,
      currentState,
      props.formData,
      isSchemaChanged || isFormDataChanged ? undefined : currentState.retrievedSchema,
      isSchemaChanged,
      formDataChangedFields,
      !isStateDataChanged,
    );

    if (!deepEquals(nextState, currentState)) {
      const nextStateDiffersFromProps = !deepEquals(nextState.formData, props.formData);
      const wasProcessingUserChange = isProcessingUserChangeRef.current;
      isProcessingUserChangeRef.current = false;

      if (wasProcessingUserChange && nextStateDiffersFromProps) {
        // Skip — the user's oneOf/anyOf option switch is already applied via processPendingChange
        return;
      }
      if (nextStateDiffersFromProps && !deepEquals(nextState.formData, currentState.formData)) {
        propsRef.current.onChange?.(toIChangeEvent(nextState));
      }
      // Eagerly update stateRef so that parent useEffect hooks (e.g. calling validateForm())
      // see the updated state before the dispatch triggers a re-render.
      stateRef.current = nextState;
      dispatch({ type: 'SET_STATE', payload: nextState });
    }
  }); // no dep array — compares against prevPropsRef manually

  // ── Imperative helpers ────────────────────────────────────────────────────

  const omitExtraDataFn = useCallback((formData?: T): T | undefined => {
    const { schema: s, schemaUtils } = stateRef.current;
    return schemaUtils.omitExtraData(s, formData);
  }, []);

  const focusOnError = useCallback((error: RJSFValidationError) => {
    const { idPrefix = 'root', idSeparator = '_' } = propsRef.current;
    const path = _toPath(error.property);
    if (path[0] === '') {
      path[0] = idPrefix;
    } else {
      path.unshift(idPrefix);
    }
    const elementId = path.join(idSeparator);
    let field = formElement.current?.elements[elementId];
    if (!field) {
      field = formElement.current?.querySelector(`input[id^="${elementId}"], button[id^="${elementId}"]`);
    }
    if (field && field.length) {
      field = field[0];
    }
    field?.focus();
  }, []);

  const validateFormWithFormData = useCallback(
    (formData?: T): boolean => {
      const { extraErrors, extraErrorsBlockSubmit, focusOnFirstError, onError, customValidate, transformErrors } =
        propsRef.current;
      const { errors: prevErrors, schema: s, schemaUtils, uiSchema, retrievedSchema } = stateRef.current;

      const schemaValidation = runValidation(
        formData,
        s,
        schemaUtils,
        customValidate,
        transformErrors,
        uiSchema,
        retrievedSchema,
      );
      const { errors, errorSchema } = extraErrors ? mergeErrors(schemaValidation, extraErrors) : schemaValidation;
      const hasError = schemaValidation.errors.length > 0 || (extraErrors && extraErrorsBlockSubmit);

      if (hasError) {
        if (focusOnFirstError) {
          if (typeof focusOnFirstError === 'function') {
            focusOnFirstError(errors[0]);
          } else {
            focusOnError(errors[0]);
          }
        }
        dispatch({
          type: 'SET_ERRORS',
          payload: {
            errors,
            errorSchema,
            schemaValidationErrors: schemaValidation.errors,
            schemaValidationErrorSchema: schemaValidation.errorSchema,
          },
        });
        if (onError) {
          onError(errors);
        } else {
          console.error('Form validation failed', errors);
        }
      } else if (errors.length > 0) {
        dispatch({
          type: 'SET_ERRORS',
          payload: { errors, errorSchema, schemaValidationErrors: [], schemaValidationErrorSchema: {} },
        });
      } else if (prevErrors.length > 0) {
        dispatch({
          type: 'SET_ERRORS',
          payload: { errors: [], errorSchema: {}, schemaValidationErrors: [], schemaValidationErrorSchema: {} },
        });
      }
      return !hasError;
    },
    [focusOnError],
  );

  // ── processPendingChange ──────────────────────────────────────────────────
  // Stored in a ref so the function body can reference itself recursively
  // without stale closure issues, while still seeing the latest propsRef/stateRef.
  const processPendingChangeRef = useRef<(currentFormState: FormState<T, S, F>) => void>(null!);
  processPendingChangeRef.current = (currentFormState: FormState<T, S, F>) => {
    if (pendingChangesRef.current.length === 0) {
      return;
    }
    isProcessingUserChangeRef.current = true;

    const { newValue, path, id, newErrorSchema } = pendingChangesRef.current[0];
    const {
      extraErrors,
      omitExtraData: omitExtraDataProp,
      liveOmit,
      noValidate,
      liveValidate,
      onChange,
      removeEmptyOptionalObjects,
      customValidate,
      transformErrors,
    } = propsRef.current;

    const {
      formData: oldFormData,
      schemaUtils,
      schema,
      fieldPathId,
      schemaValidationErrorSchema,
      errors,
      uiSchema,
    } = currentFormState;
    let { customErrors, errorSchema: originalErrorSchema } = currentFormState;

    const rootPathId = fieldPathId.path[0] || '';
    const isRootPath = !path || path.length === 0 || (path.length === 1 && path[0] === rootPathId);
    let retrievedSchema = currentFormState.retrievedSchema;
    let formData = isRootPath ? newValue : _cloneDeep(oldFormData);

    // When switching from null to an object option in oneOf, pass undefined to
    // getStateFromProps to trigger fresh default computation.
    const hasOnlyUndefinedValues =
      isObject(formData) &&
      Object.keys(formData as object).length > 0 &&
      Object.values(formData as object).every((v) => v === undefined);
    const wasPreviouslyNull = oldFormData === null || oldFormData === undefined;
    const inputForDefaults = hasOnlyUndefinedValues && wasPreviouslyNull ? undefined : formData;

    if (isObject(formData) || Array.isArray(formData)) {
      if (newValue === ADDITIONAL_PROPERTY_KEY_REMOVE) {
        _unset(formData, path);
      } else if (!isRootPath) {
        _set(formData, path, newValue);
      }
      const newState = getStateFromProps<T, S, F>(
        propsRef.current,
        currentFormState,
        inputForDefaults,
        undefined,
        undefined,
        [],
        true,
      );
      formData = newState.formData;
      retrievedSchema = newState.retrievedSchema;
    }

    const mustValidate = !noValidate && (liveValidate === true || liveValidate === 'onChange');
    let partialState: Partial<FormState<T, S, F>> = { formData, schema };
    let newFormData = formData;

    if (omitExtraDataProp === true && (liveOmit === true || liveOmit === 'onChange')) {
      newFormData = handleRef.current!.omitExtraData(formData);
      partialState = { formData: newFormData };
    }

    if (removeEmptyOptionalObjects) {
      newFormData = removeOptionalEmptyObjects(
        schemaUtils.getValidator(),
        schema,
        schemaUtils.getRootSchema(),
        newFormData,
      ) as T;
      partialState = { ...partialState, formData: newFormData };
    }

    if (newErrorSchema) {
      // @ts-expect-error TS2590
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
          const errs = _get(newErrorSchema, ERRORS_KEY);
          if (errs) {
            customErrors.setErrors(errs);
          }
        } else {
          _set(customErrors.ErrorSchema, path, newErrorSchema);
        }
      }
    } else if (customErrors && _get(customErrors.ErrorSchema, [...path, ERRORS_KEY])) {
      customErrors.clearErrors(path);
    }

    if (mustValidate && pendingChangesRef.current.length === 1) {
      const liveValidation = performLiveValidate(
        schema,
        schemaUtils,
        originalErrorSchema as ErrorSchema<S>,
        newFormData,
        extraErrors,
        customErrors,
        retrievedSchema,
        false,
        customValidate,
        transformErrors,
        uiSchema,
      );
      partialState = { formData: newFormData, ...liveValidation, customErrors };
    } else if (!noValidate && newErrorSchema) {
      const mergedErrs = mergeErrors({ errorSchema: originalErrorSchema, errors }, extraErrors, customErrors);
      partialState = { formData: newFormData, ...mergedErrs, customErrors };
    }

    const mergedFormState: FormState<T, S, F> = { ...currentFormState, ...partialState };
    // Update stateRef eagerly so that sibling effects firing before React commits this
    // dispatch (e.g. two widgets changing in the same render batch) see the correct
    // post-processing base state rather than the stale committed state.
    stateRef.current = mergedFormState;
    dispatch({ type: 'SET_STATE', payload: partialState });
    onChange?.(toIChangeEvent(mergedFormState), id);
    pendingChangesRef.current.shift();
    processPendingChangeRef.current(mergedFormState);
  };

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const handleChange = useCallback(
    (newValue: T | undefined, path: FieldPathList, newErrorSchema?: ErrorSchema<T>, id?: string) => {
      pendingChangesRef.current.push({ newValue, path, newErrorSchema, id });
      if (pendingChangesRef.current.length === 1) {
        processPendingChangeRef.current(stateRef.current);
      }
    },
    [],
  );

  const handleBlur = useCallback((id: string, data: any) => {
    const {
      onBlur,
      omitExtraData: omitExtraDataProp,
      liveOmit,
      liveValidate,
      removeEmptyOptionalObjects,
      onChange,
      extraErrors,
      customValidate,
      transformErrors,
    } = propsRef.current;
    onBlur?.(id, data);

    if ((omitExtraDataProp === true && liveOmit === 'onBlur') || liveValidate === 'onBlur') {
      const currentState = stateRef.current;
      const { formData, schemaUtils, schema, errorSchema, customErrors, retrievedSchema, uiSchema } = currentState;
      let newFormData: T | undefined = formData;
      let partialState: Partial<FormState<T, S, F>> = { formData: newFormData };

      if (omitExtraDataProp === true && liveOmit === 'onBlur') {
        newFormData = schemaUtils.omitExtraData(schema, formData);
        partialState = { formData: newFormData };
      }
      if (removeEmptyOptionalObjects) {
        newFormData = removeOptionalEmptyObjects(
          schemaUtils.getValidator(),
          schema,
          schemaUtils.getRootSchema(),
          newFormData,
        ) as T;
        partialState = { ...partialState, formData: newFormData };
      }
      if (liveValidate === 'onBlur') {
        const liveValidation = performLiveValidate(
          schema,
          schemaUtils,
          errorSchema as ErrorSchema<S>,
          newFormData,
          extraErrors,
          customErrors,
          retrievedSchema,
          false,
          customValidate,
          transformErrors,
          uiSchema,
        );
        partialState = { formData: newFormData, ...liveValidation, customErrors };
      }

      const hasChanges = Object.keys(partialState)
        .filter((key) => !key.startsWith('schemaValidation'))
        .some((key) => !deepEquals(_get(currentState, key), _get(partialState, key)));

      dispatch({ type: 'SET_STATE', payload: partialState });
      if (onChange && hasChanges) {
        onChange(toIChangeEvent({ ...currentState, ...partialState }), id);
      }
    }
  }, []);

  const handleFocus = useCallback((id: string, data: any) => {
    propsRef.current.onFocus?.(id, data);
  }, []);

  const handleSubmit = useCallback((event: FormEvent<any>) => {
    event.preventDefault();
    if (event.target !== event.currentTarget) {
      return;
    }
    event.persist();

    const {
      omitExtraData: omitExtraDataProp,
      extraErrors,
      noValidate,
      onSubmit,
      removeEmptyOptionalObjects,
    } = propsRef.current;
    const currentState = stateRef.current;
    const { schemaUtils, schema } = currentState;
    let { formData: newFormData } = currentState;

    if (omitExtraDataProp === true) {
      newFormData = handleRef.current!.omitExtraData(newFormData);
    }
    if (removeEmptyOptionalObjects) {
      newFormData = removeOptionalEmptyObjects(
        schemaUtils.getValidator(),
        schema,
        schemaUtils.getRootSchema(),
        newFormData,
      ) as T;
    }

    if (noValidate || handleRef.current!.validateFormWithFormData(newFormData)) {
      const errorSchema = (extraErrors || {}) as ErrorSchema<T>;
      const errors = extraErrors ? toErrorList(extraErrors) : [];
      dispatch({ type: 'SET_FORM_DATA', payload: { formData: newFormData } });
      dispatch({
        type: 'SET_ERRORS',
        payload: { errors, errorSchema, schemaValidationErrors: [], schemaValidationErrorSchema: {} },
      });
      onSubmit?.(
        toIChangeEvent(
          {
            ...currentState,
            formData: newFormData,
            errors,
            errorSchema,
            schemaValidationErrors: [],
            schemaValidationErrorSchema: {},
          },
          'submitted',
        ),
        event,
      );
    }
  }, []);

  const reset = useCallback(() => {
    const { formData: pFormData, initialFormData: initData = IS_RESET as T, onChange } = propsRef.current;
    const newState = getStateFromProps<T, S, F>(
      propsRef.current,
      stateRef.current,
      pFormData ?? initData,
      undefined,
      undefined,
      [],
      true,
    );
    dispatch({ type: 'SET_FORM_DATA', payload: { formData: newState.formData, initialDefaultsGenerated: false } });
    dispatch({
      type: 'SET_ERRORS',
      payload: {
        errors: [] as RJSFValidationError[],
        errorSchema: {} as ErrorSchema<T>,
        schemaValidationErrors: [] as RJSFValidationError[],
        schemaValidationErrorSchema: {} as ErrorSchema<T>,
        customErrors: undefined,
      },
    });
    onChange?.(
      toIChangeEvent({
        ...stateRef.current,
        formData: newState.formData,
        initialDefaultsGenerated: false,
        errors: [],
        errorSchema: {},
        schemaValidationErrors: [],
        schemaValidationErrorSchema: {},
      }),
    );
  }, []);

  const submit = useCallback(() => {
    if (formElement.current) {
      const submitEvent = new CustomEvent('submit', { cancelable: true });
      submitEvent.preventDefault();
      formElement.current.dispatchEvent(submitEvent);
      formElement.current.requestSubmit();
    }
  }, []);

  const validateForm = useCallback((): boolean => {
    const { omitExtraData: omitExtraDataProp, removeEmptyOptionalObjects } = propsRef.current;
    const { schema: s, schemaUtils } = stateRef.current;
    let { formData: newFormData } = stateRef.current;
    if (omitExtraDataProp === true) {
      newFormData = schemaUtils.omitExtraData(s, newFormData);
    }
    if (removeEmptyOptionalObjects) {
      newFormData = removeOptionalEmptyObjects(
        schemaUtils.getValidator(),
        s,
        schemaUtils.getRootSchema(),
        newFormData,
      ) as T;
    }
    return handleRef.current!.validateFormWithFormData(newFormData);
  }, []);

  const setFieldValue = useCallback(
    (fieldPath: string | FieldPathList, newValue?: T) => {
      const { registry } = stateRef.current;
      const path = Array.isArray(fieldPath) ? fieldPath : fieldPath.split('.');
      const fpId = toFieldPathId('', registry.globalFormOptions, path);
      handleChange(newValue, path, undefined, fpId[ID_KEY]);
    },
    [handleChange],
  );

  // ── useImperativeHandle ───────────────────────────────────────────────────
  // Initialize the handle once so that jest.spyOn on the ref's methods isn't
  // overwritten by re-renders. All methods delegate to stable useCallback refs.
  if (!handleRef.current) {
    handleRef.current = {
      submit,
      reset,
      validateForm,
      validateFormWithFormData,
      setFieldValue,
      omitExtraData: omitExtraDataFn,
      getUsedFormData: (formData: T | undefined, fields: string[]) => getUsedFormData(formData, fields),
      getFieldNames: (pathSchema: PathSchema<T>, formData?: T) => getFieldNames(pathSchema, formData),
      formElement,
      get state() {
        return stateRef.current;
      },
    };
  }
  // Empty deps: never recreate the handle so spy installations on ref.current survive re-renders.
  useImperativeHandle(forwardedRef, () => handleRef.current!, []);

  // ── Render ────────────────────────────────────────────────────────────────
  const {
    schema: stSchema,
    uiSchema: stUiSchema,
    formData: stFormData,
    errorSchema: stErrorSchema,
    fieldPathId: stFieldPathId,
    registry,
  } = state;
  const { SchemaField: _SchemaField } = registry.fields;
  const { SubmitButton } = registry.templates.ButtonTemplates;

  const as = _internalFormWrapper ? tagName : undefined;
  const FormTag = _internalFormWrapper || tagName || 'form';

  let { [SUBMIT_BTN_OPTIONS_KEY]: submitOptions = {} } = getUiOptions<T, S, F>(stUiSchema);
  if (disabled) {
    submitOptions = { ...submitOptions, props: { ...submitOptions.props, disabled: true } };
  }
  const submitUiSchema = useMemo(
    () => ({ [UI_OPTIONS_KEY]: { [SUBMIT_BTN_OPTIONS_KEY]: submitOptions } }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(submitOptions)],
  );

  const errorList = useMemo(() => {
    if (!state.errors?.length) {
      return null;
    }
    const options = getUiOptions<T, S, F>(stUiSchema);
    const ErrorListTemplate = getTemplate<'ErrorListTemplate', T, S, F>('ErrorListTemplate', registry, options);
    return (
      <ErrorListTemplate
        errors={state.errors}
        errorSchema={stErrorSchema || {}}
        schema={stSchema}
        uiSchema={stUiSchema}
        registry={registry}
      />
    );
  }, [state.errors, stErrorSchema, stSchema, stUiSchema, registry]);

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
      onSubmit={handleSubmit}
      as={as}
      ref={formElement}
    >
      {showErrorList === 'top' && errorList}
      <_SchemaField
        name=''
        schema={stSchema}
        uiSchema={stUiSchema}
        errorSchema={stErrorSchema}
        fieldPathId={stFieldPathId}
        formData={stFormData}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        registry={registry}
        disabled={disabled}
        readonly={readonly}
      />
      {children ?? <SubmitButton uiSchema={submitUiSchema} registry={registry} />}
      {showErrorList === 'bottom' && errorList}
    </FormTag>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

const FormWithRef = forwardRef(FormComponent) as <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(
  props: FormProps<T, S, F>,
) => ReactElement | null;

const FormMemo = memo(FormWithRef, propsAreEqual) as typeof FormWithRef;

export default FormMemo;
