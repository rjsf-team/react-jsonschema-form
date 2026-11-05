import type { ElementType, FormEvent, ReactNode, Ref, RefObject } from 'react';
import { Component, createRef } from 'react';
import type {
  CustomValidator,
  ErrorSchema,
  ErrorTransformer,
  FieldPathId,
  FieldPathList,
  FormContextType,
  GenericObjectType,
  PathSchema,
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
  Experimental_DefaultFormStateBehavior,
  Experimental_CustomMergeAllOf,
  GlobalFormOptions,
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
  shouldRender,
  SUBMIT_BTN_OPTIONS_KEY,
  toErrorList,
  toFieldPathId,
  UI_DEFINITIONS_KEY,
  UI_GLOBAL_OPTIONS_KEY,
  UI_OPTIONS_KEY,
  validationDataMerge,
  DEFAULT_ID_SEPARATOR,
  DEFAULT_ID_PREFIX,
  ERRORS_KEY,
  ID_KEY,
  getUsedFormData,
  getFieldNames,
  schemaHasNestedConditional,
  ANY_OF_KEY,
  ONE_OF_KEY,
} from '@rjsf/utils';

import getDefaultRegistry from '../getDefaultRegistry.ts';
import { ADDITIONAL_PROPERTY_KEY_REMOVE, IS_RESET } from './constants.ts';

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
  // oxlint-disable-next-line typescript/no-deprecated
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
  // oxlint-disable-next-line typescript/no-deprecated
  liveOmit?: 'onChange' | 'onBlur' | DeprecatedBooleanOption;
  /** If set to true, then extra form data values that are not in any form field will be removed whenever `onSubmit` is
   * called. Set to `false` by default.
   */
  omitExtraData?: boolean;
  /** This option no longer does anything as it has been co-opted into `omitExtraData`
   *
   * @deprecated - Will be removed in a future release use `omitExtraData` instead
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
   * Controls the component update strategy used by the Form's `shouldComponentUpdate` lifecycle method.
   *
   * - `'customDeep'`: Uses RJSF's custom deep equality checks via the `deepEquals` utility function,
   *   which treats all functions as equivalent and provides optimized performance for form data comparisons.
   * - `'shallow'`: Uses shallow comparison of props and state (only compares direct properties). This matches React's PureComponent behavior.
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
  ref?: Ref<Form<T, S, F>>;
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
  /** @description result of schemaHasNestedConditional(rootSchema, rootSchema). A memoized value, recomputed only
   * when `schemaUtils` (and thus the root schema) is rebuilt, to avoid re-walking the whole schema on every
   * `getStateFromProps()` call
   */
  hasNestedConditionalSchema: boolean;
  /** Flag indicating whether the initial form defaults have been generated */
  initialDefaultsGenerated: boolean;
  /** The registry (re)computed only when props changed */
  registry: Registry<T, S, F>;
  /** Tracks the previous `extraErrors` prop reference so that `getDerivedStateFromProps` can detect changes */
  prevExtraErrors?: ErrorSchema<T>;
  /** Whether the `errors` predate the `formData`, because a change skipped live validation for a later change of its
   * batch. Kept in the state so that every update applied in between carries it along
   */
  isLiveValidationPending?: boolean;
}

/** The value `getSnapshotBeforeUpdate` hands to `componentDidUpdate` */
type FormSnapshot<T, S extends StrictRJSFSchema, F extends FormContextType> =
  | { nextState: FormState<T, S, F>; shouldUpdate: boolean; isEchoOfState: boolean }
  | { shouldUpdate: false };

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
  const { schema, uiSchema, fieldPathId, schemaUtils, formData, edit, errors, errorSchema } = state;
  return {
    schema,
    uiSchema,
    fieldPathId,
    schemaUtils,
    formData,
    edit,
    errors,
    errorSchema,
    ...(status !== undefined && { status }),
  };
}

/** Rewrites every spelling of an absent value in `data` to a single one, so that two values that differ only in how
 * they say nothing is there compare as equal. A key holding `undefined` is dropped, since a parent that round trips the
 * data through JSON drops it too. At the root, `null` and an empty object also become `undefined`, because a parent
 * replying to an emitted `undefined` commonly coalesces it to `null` or spreads it into an object. Deeper down those
 * two keep their meaning, where asking for an empty object or a `null` is asking for a value rather than repeating that
 * there is none
 *
 * @param data - The value to rewrite
 * @returns - The value with every absent value spelled the same way
 */
function withoutAbsentValues(data: unknown): unknown {
  function normalize(value: unknown, isRoot: boolean): unknown {
    if (isRoot && value === null) {
      return undefined;
    }
    if (Array.isArray(value)) {
      return value.map((item) => normalize(item, false));
    }
    if (isObject(value)) {
      const present = Object.entries(value).reduce((acc: Record<string, unknown>, [key, entry]) => {
        if (entry !== undefined) {
          acc[key] = normalize(entry, false);
        }
        return acc;
      }, {});
      return isRoot && Object.keys(present).length === 0 ? undefined : present;
    }
    return value;
  }
  return normalize(data, true);
}

/** A change made to a field, which an updater queued by the `onChange` handler applies
 */
interface FieldChange<T> {
  /** The path into the formData/errorSchema at which the `newValue`/`newErrorSchema` will be set */
  path: FieldPathList;
  /** The new value to set into the formData */
  newValue?: T;
  /** The new errors to be set into the errorSchema, if any */
  newErrorSchema?: ErrorSchema<T>;
}

/** The `Form` component renders the outer form and all the fields defined in the `schema` */
export default class Form<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> extends Component<FormProps<T, S, F>, FormState<T, S, F>> {
  /** The ref used to hold the `form` element, this needs to be `any` because `tagName` or `_internalFormWrapper` can
   * provide any possible type here
   */
  formElement: RefObject<any>;

  /** Counts the changes `onChange` has queued, so the updater of the latest one knows it is the last of its batch and
   * runs the live validation the earlier ones skip
   */
  private changeCount = 0;

  /** The number of the latest change reported through `onChange`. A change queued in a transition can commit after a
   * later urgent one was already reported, and its own state then lacks that later change
   */
  private lastReportedChange = 0;

  /** The `formData` last handed to `onChange`, wrapped so that never having reported a change is distinguishable from
   * having reported `undefined`. A parent that stores what it receives is holding the form's own data even when it
   * reshaped it on the way in, which `isReportedFormData` recognizes while `awaitingReply` says the parent has yet to
   * pass anything back. It is dropped once the parent supplies data of its own, since from then on the form no longer
   * holds what it reported
   */
  private lastReportedFormData?: { formData: T | undefined; awaitingReply: boolean };

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
      // oxlint-disable-next-line typescript/no-deprecated
      const merged = Form.mergeErrors<T>(baseErrors, props.extraErrors, state.customErrors, props.noValidate);
      return { prevExtraErrors: props.extraErrors, ...merged };
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

    const { formData: propsFormData, initialFormData } = props;
    const formData = propsFormData ?? initialFormData;
    this.state = {
      ...this.getStateFromProps(props, formData, undefined, undefined, undefined, true),
      prevExtraErrors: props.extraErrors,
    };
    if (!deepEquals(this.state.formData, formData)) {
      this.reportChange(toIChangeEvent(this.state));
    }
    this.formElement = createRef();
  }

  /**
   * Determines whether `formData` handed back by the parent is the data the form last reported through `onChange`.
   * Parents routinely reshape what they receive before storing it, by spreading it into a new object, keeping
   * `undefined` as `null` or round-tripping it through JSON, all of which only change how an absent value is spelled,
   * so until the reply arrives the two are compared with every spelling of absence normalized away. Once it has
   * arrived, `lastReportedFormData` holds the spelling the parent chose, and only that exact data is still the form's
   * own: a later prop change that merely resembles the report is the parent asking for something else, such as
   * dropping a key so its `default` comes back
   *
   * @param formData - The `formData` the parent is currently passing
   * @returns - True when `formData` is the data the form reported, in the parent's spelling of it
   */
  private isReportedFormData(formData: T | undefined | null) {
    if (!this.lastReportedFormData) {
      return false;
    }
    const { formData: reportedFormData, awaitingReply } = this.lastReportedFormData;
    if (!awaitingReply) {
      return deepEquals(formData, reportedFormData);
    }
    return deepEquals(withoutAbsentValues(formData), withoutAbsentValues(reportedFormData));
  }

  /**
   * Hands `changeEvent` to the `onChange` callback, remembering the data reported so that a parent passing it back as
   * `formData` is recognized by `isReportedFormData`. Every report goes through here, since the form's data is just as
   * much its own when it came from a reset, a blur or the defaults it derived as when the user edited a field
   *
   * @param changeEvent - The change event to report
   * @param [id] - The id of the field the change came from, when it came from one
   */
  private reportChange(changeEvent: IChangeEvent<T, S, F>, ...id: [id?: string]) {
    const { onChange } = this.props;
    if (onChange) {
      this.lastReportedFormData = { formData: changeEvent.formData, awaitingReply: true };
      // Spread, so that a report with no field behind it still calls `onChange` with the one argument it has always
      // been called with
      onChange(changeEvent, ...id);
    }
  }

  /**
   * `getSnapshotBeforeUpdate` is a React lifecycle method that is invoked right before the most recently rendered
   * output is committed to the DOM. It enables your component to capture current values (e.g., scroll position) before
   * they are potentially changed.
   *
   * In this case, it checks if the props have changed since the last render. If they have, it computes the next state
   * of the component using `getStateFromProps` method and returns it along with a `shouldUpdate` flag set to `true` IF
   * the `nextState` and `prevState` are different, otherwise `false`. This ensures that we have the most up-to-date
   * state ready to be applied in `componentDidUpdate`.
   *
   * If `formData` hasn't changed, it simply returns an object with `shouldUpdate` set to `false`, indicating that a
   * state update is not necessary.
   *
   * @param prevProps - The previous set of props before the update.
   * @param prevState - The previous state before the update.
   * @returns Either an object containing the next state and a flag indicating that an update should occur, or an object
   *        with a flag indicating that an update is not necessary.
   */
  getSnapshotBeforeUpdate(prevProps: FormProps<T, S, F>, prevState: FormState<T, S, F>): FormSnapshot<T, S, F> {
    if (!deepEquals(this.props, prevProps)) {
      // Compare the previous props formData against the current props formData
      const formDataChangedFields = getChangedFields(this.props.formData, prevProps.formData);
      // Compare the current props formData against the current state's formData to determine if the new props were the
      // result of the onChange from the existing state formData
      const stateDataChangedFields = getChangedFields(this.props.formData, this.state.formData);
      const isSchemaChanged = !deepEquals(prevProps.schema, this.props.schema);
      // A live validated change applied in the same batch as the new schema has already moved the state to it and
      // validated against it, so its errors are kept. Any other errors are of the old schema and are reset. The state's
      // own schemas are compared, since `SchemaUtils` rewrites the `$ref`s of a schema with an `$id`, so the state's
      // never equals the prop's
      const resetErrorsForSchema =
        isSchemaChanged &&
        (deepEquals(this.state.schema, prevState.schema) || !Form.isLiveValidatedOnChange(this.props));
      // When formData is not an object, getChangedFields returns an empty array.
      // In this case, deepEquals is most needed to check again.
      const isFormDataChanged =
        formDataChangedFields.length > 0 || !deepEquals(prevProps.formData, this.props.formData);
      const isStateDataChanged =
        stateDataChangedFields.length > 0 || !deepEquals(this.state.formData, this.props.formData);
      const nextState = this.getStateFromProps(
        this.props,
        this.props.formData,
        // If the `schema` has changed, we need to update the retrieved schema.
        // Or if the `formData` changes, for example in the case of a schema with dependencies that need to
        //  match one of the subSchemas, the retrieved schema must be updated.
        isSchemaChanged || isFormDataChanged ? undefined : this.state.retrievedSchema,
        resetErrorsForSchema,
        // Only the error clearing needs the path of each changed field, and it runs only when live validation does
        // not, so the walk that produces them is left for `getStateFromProps` to ask for
        () => getChangedFields(this.props.formData, prevProps.formData, true),
        // Skip live validation for this request if no form data has changed from the last state
        !isStateDataChanged,
      );
      const shouldUpdate = !deepEquals(nextState, prevState);
      // `getStateFromProps` re-derives an uncontrolled form from its own state, and a parent storing what `onChange`
      // emitted is holding the form's own data however it reshaped it, so both count as the form's own data
      const isOwnFormData =
        !isStateDataChanged || this.props.formData === undefined || this.isReportedFormData(this.props.formData);
      // The parent handing back the form's own data with nothing that feeds the defaults changed. `validator` and
      // `experimental_customMergeAllOf` are left out because they are compared by reference, and parents commonly
      // create them inline on every render
      const isEchoOfState =
        isOwnFormData &&
        !isSchemaChanged &&
        deepEquals(prevProps.experimental_defaultFormStateBehavior, this.props.experimental_defaultFormStateBehavior);
      return { nextState, shouldUpdate, isEchoOfState };
    }
    return { shouldUpdate: false };
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
  componentDidUpdate(_: FormProps<T, S, F>, prevState: FormState<T, S, F>, snapshot: FormSnapshot<T, S, F>) {
    if (snapshot.shouldUpdate) {
      const { nextState, isEchoOfState } = snapshot;
      const nextStateDiffersFromProps = !deepEquals(nextState.formData, this.props.formData);

      // A parent passing `formData` has had its say, whether that is its reply to the report or data that replaces it,
      // while one that passes none has not replied at all and may still be about to. The two are told apart by the
      // presence of the prop rather than its value, since a parent storing an emitted `undefined` passes it back as
      // `undefined`, and reading that as silence would leave the reshape tolerance open for good. A controlled parent
      // spelling `formData={undefined}` on a render before it stores its reply looks exactly the same from here, so it
      // is taken at its word too and its reply arrives as data the form never reported. A reply is remembered in the
      // spelling the parent gave it, so that it keeps counting as the form's own data however it was reshaped, while
      // everything else leaves the form holding data it never reported
      if (this.lastReportedFormData && 'formData' in this.props) {
        this.lastReportedFormData = isEchoOfState ? { formData: this.props.formData, awaitingReply: false } : undefined;
      }
      if (isEchoOfState && nextStateDiffersFromProps) {
        // Re-deriving defaults from echoed data can undo what `processChange` resolved, such as a switch to a
        // oneOf/anyOf option whose data the root `default` would otherwise replace, so that data is kept while the
        // rest of the recomputed state (`uiSchema`, `registry`, `schemaUtils`) is still applied. It comes from
        // `this.state` rather than `prevState` so a state update batched into this render, like `setFieldValue()`, is
        // not undone. When `nextState` may have live validated the re-derived data, the errors of the kept data come
        // along too, otherwise `nextState` holds the current errors adjusted for `noValidate` and `extraErrors`
        const { formData, retrievedSchema, errors, errorSchema, schemaValidationErrors, schemaValidationErrorSchema } =
          this.state;
        // oxlint-disable-next-line typescript/no-deprecated
        const mayHaveLiveValidated = this.props.liveValidate && !this.props.noValidate;
        // oxlint-disable-next-line react/no-did-update-set-state -- guarded to prevent infinite loop
        this.setState({
          ...nextState,
          formData,
          retrievedSchema,
          ...(mayHaveLiveValidated && { errors, errorSchema, schemaValidationErrors, schemaValidationErrorSchema }),
        });
        return;
      }

      if (nextStateDiffersFromProps && !deepEquals(nextState.formData, prevState.formData)) {
        this.reportChange(toIChangeEvent(nextState));
      }
      // oxlint-disable-next-line react/no-did-update-set-state -- guarded to prevent infinite loop
      this.setState(nextState);
    }
  }

  /** Extracts the updated state from the given `props` and `inputFormData`. As part of this process, the
   * `inputFormData` is first processed to add any missing required defaults. After that, the data is run through the
   * validation process IF required by the `props`.
   *
   * @param props - The props passed to the `Form`
   * @param inputFormData - The new or current data for the `Form`
   * @param retrievedSchema - An expanded schema, if not provided, it will be retrieved from the `schema` and `formData`.
   * @param [resetErrorsForSchema=false] - Whether the errors are reset because the schema changed under them
   * @param [getFormDataChangedFields=() => []] - Optional function returning the path of each `formData` field that
   *          changed, only called when those paths are needed, which is when live validation is not going to run
   * @param [skipLiveValidate=false] - Optional flag, if true, means that we are not running live validation
   * @param [shouldSanitize=false] - Optional flag, if true, means that we should attempt to sanitize formData
   * @param [prevState=this.state] - The state the new one is derived from, which a `setState` updater passes since
   *          `this.state` does not yet hold the updates queued before it
   * @param [fallbackProps=this.props] - The props read where `props` lacks one, which a `setState` updater sets to the
   *          props it was handed, since `this.props` are those of the render before
   * @returns - The new state for the `Form`
   */
  getStateFromProps(
    props: FormProps<T, S, F>,
    inputFormData?: T,
    retrievedSchema?: S,
    resetErrorsForSchema = false,
    getFormDataChangedFields: () => string[] = () => [],
    skipLiveValidate = false,
    shouldSanitize = false,
    prevState: FormState<T, S, F> | undefined = this.state,
    fallbackProps: FormProps<T, S, F> = this.props,
  ): FormState<T, S, F> {
    const state: FormState<T, S, F> = prevState || {};
    const schema = 'schema' in props ? props.schema : fallbackProps.schema;
    const validator = 'validator' in props ? props.validator : fallbackProps.validator;
    const uiSchema: UiSchema<T, S, F> = ('uiSchema' in props ? props.uiSchema! : fallbackProps.uiSchema!) || {};
    const isUncontrolled = props.formData === undefined && fallbackProps.formData === undefined;
    const edit = typeof inputFormData !== 'undefined';
    const liveValidate = 'liveValidate' in props ? props.liveValidate : fallbackProps.liveValidate;
    // oxlint-disable-next-line typescript/no-deprecated
    const mustValidate = edit && !props.noValidate && liveValidate;
    const experimental_defaultFormStateBehavior =
      'experimental_defaultFormStateBehavior' in props
        ? props.experimental_defaultFormStateBehavior
        : fallbackProps.experimental_defaultFormStateBehavior;
    const experimental_customMergeAllOf =
      'experimental_customMergeAllOf' in props
        ? props.experimental_customMergeAllOf
        : fallbackProps.experimental_customMergeAllOf;
    let { schemaUtils, hasNestedConditionalSchema } = state;
    if (
      !schemaUtils ||
      schemaUtils.doesSchemaUtilsDiffer(
        validator,
        schema,
        experimental_defaultFormStateBehavior,
        experimental_customMergeAllOf,
      )
    ) {
      schemaUtils = createSchemaUtils<T, S, F>(
        validator,
        schema,
        experimental_defaultFormStateBehavior,
        experimental_customMergeAllOf,
      );
      // A `dependencies`/`if` branch switch nested inside an object property never changes the ROOT retrieved
      // schema (only the schema's own top-level `dependencies`/`if` get resolved into it), so comparing
      // `computedRetrievedSchema` to `state.retrievedSchema` below can't detect it (#5250). `hasNestedConditionalSchema`
      // lets sanitization run anyway when that's possible. It's a pure function of the root schema, so it only needs
      // to be recomputed when `schemaUtils` (and thus the root schema) is rebuilt, not on every call here.
      hasNestedConditionalSchema = schemaHasNestedConditional(schemaUtils.getRootSchema(), schemaUtils.getRootSchema());
    }

    const rootSchema = schemaUtils.getRootSchema();
    // A schema the parent changed in the same batch differs from the retrieved schema for reasons other than this
    // change, so sanitizing for that difference would drop data the change never touched. A dependency the change
    // switches in that same batch is left unsanitized too, since the two differences cannot be told apart here. Both
    // sides have been through `SchemaUtils`, which rewrites the `$ref`s of a schema with an `$id`
    const canSanitize = shouldSanitize && deepEquals(rootSchema, state.schema);

    // Compute the formData for getDefaultFormState() function based on the inputFormData, isUncontrolled and state
    let defaultsFormData = inputFormData;
    if (inputFormData === IS_RESET) {
      defaultsFormData = undefined;
    } else if (inputFormData === undefined && isUncontrolled) {
      defaultsFormData = state.formData;
    }
    let formData: T;
    let computedRetrievedSchema: S;
    let wasSanitized = false;
    const preventInfiniteSanitize: string[] = [];
    do {
      formData = schemaUtils.getDefaultFormState(
        rootSchema,
        defaultsFormData,
        false,
        state.initialDefaultsGenerated,
      ) as T;
      // Only hash when sanitizing, wrapping `formData` in an object to deal with a scalar/undefined value
      const formHash = canSanitize ? hashObject({ formData }) : '';
      computedRetrievedSchema = Form.updateRetrievedSchema(
        retrievedSchema ?? schemaUtils.retrieveSchema(rootSchema, formData),
        state.retrievedSchema,
      );
      if (
        canSanitize &&
        !preventInfiniteSanitize.includes(formHash) &&
        (hasNestedConditionalSchema || !deepEquals(computedRetrievedSchema, state.retrievedSchema))
      ) {
        // Sanitize the form data if canSanitize is true, we haven't already processed this same formData AND
        // either the retrieved schema changed or the schema has a nested conditional that the check above can't see
        const sanitizedFormData = schemaUtils.sanitizeDataForNewSchema(
          computedRetrievedSchema,
          state.retrievedSchema,
          formData,
        );
        wasSanitized = !deepEquals(sanitizedFormData, formData);
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
      // If the `props.noValidate` option is set or the schema changed under the errors, we reset the error state.
      // oxlint-disable-next-line typescript/no-deprecated
      if (props.noValidate || resetErrorsForSchema) {
        return { errors: [], errorSchema: {} };
      }
      // The schema validation errors rather than the shown ones, which already hold the `extraErrors` and custom
      // errors merged in below, so they are added exactly once
      return {
        errors: state.schemaValidationErrors || [],
        errorSchema: state.schemaValidationErrorSchema || {},
      };
    };

    let errors: RJSFValidationError[];
    let errorSchema: ErrorSchema<T> | undefined;
    let { schemaValidationErrors, schemaValidationErrorSchema } = state;
    // If we are skipping live validate, it means that the state has already been updated with live validation errors
    if (mustValidate && !skipLiveValidate) {
      const liveValidation = this.liveValidate(
        rootSchema,
        schemaUtils,
        state.errorSchema,
        formData,
        undefined,
        state.customErrors,
        retrievedSchema,
        // If retrievedSchema is undefined which means the schema or formData has changed, we do not merge state.
        // Else in the case where it hasn't changed,
        retrievedSchema !== undefined,
        props,
      );
      errors = liveValidation.errors;
      errorSchema = liveValidation.errorSchema;
      schemaValidationErrors = liveValidation.schemaValidationErrors;
      schemaValidationErrorSchema = liveValidation.schemaValidationErrorSchema;
    } else {
      const currentErrors = getCurrentErrors();
      errors = currentErrors.errors;
      errorSchema = currentErrors.errorSchema;
      // The next update builds on the schema validation errors, so the reset ones must go too or they would come back.
      // Without live validation nothing would validate again when `noValidate` is turned off, so those are kept for then
      // oxlint-disable-next-line typescript/no-deprecated
      if (resetErrorsForSchema || (props.liveValidate && props.noValidate)) {
        schemaValidationErrors = [];
        schemaValidationErrorSchema = {};
      }
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
      const mergedErrors = Form.mergeErrors<T>(
        { errorSchema, errors },
        props.extraErrors,
        state.customErrors,
        // oxlint-disable-next-line typescript/no-deprecated
        props.noValidate,
      );
      errors = mergedErrors.errors;
      errorSchema = mergedErrors.errorSchema;
    }

    // Only store a new registry when the props cause a different one to be created
    const newRegistry = Form.getRegistry(props, rootSchema, schemaUtils);
    const registry = deepEquals(state.registry, newRegistry) ? state.registry : newRegistry;

    // Only compute a new `fieldPathId` when the `idPrefix` is different than the existing fieldPathId's ID_KEY
    const fieldPathId =
      state.fieldPathId && state.fieldPathId?.[ID_KEY] === registry.globalFormOptions.idPrefix
        ? state.fieldPathId
        : toFieldPathId('', registry.globalFormOptions);
    const nextState: FormState<T, S, F> = {
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
      retrievedSchema: computedRetrievedSchema,
      hasNestedConditionalSchema,
      initialDefaultsGenerated: true,
      registry,
    };
    return nextState;
  }

  /** React lifecycle method that is used to determine whether component should be updated.
   *
   * @param nextProps - The next version of the props
   * @param nextState - The next version of the state
   * @returns - True if the component should be updated, false otherwise
   */
  shouldComponentUpdate(nextProps: FormProps<T, S, F>, nextState: FormState<T, S, F>): boolean {
    const { experimental_componentUpdateStrategy = 'customDeep' } = this.props;
    return shouldRender(this, nextProps, nextState, experimental_componentUpdateStrategy);
  }

  /** Validates the `formData` against the `schema` using the `altSchemaUtils` (if provided otherwise it uses the
   * `schemaUtils` in the state), returning the results.
   *
   * @param formData - The new form data to validate
   * @param schema - The schema used to validate against
   * @param [altSchemaUtils] - The alternate schemaUtils to use for validation
   * @param [retrievedSchema] - An optionally retrieved schema for per
   * @param [props=this.props] - The props supplying `customValidate`, `transformErrors` and `uiSchema`
   */
  validate(
    formData: T | undefined,
    schema = this.state.schema,
    altSchemaUtils?: SchemaUtilsType<T, S, F>,
    retrievedSchema?: S,
    props: FormProps<T, S, F> = this.props,
  ): ValidationData<T> {
    const schemaUtils = altSchemaUtils || this.state.schemaUtils;
    const { customValidate, transformErrors, uiSchema } = props;
    // When a pre-resolved schema is provided (e.g., from live validation), use it directly.
    // Otherwise validate against the original schema so AJV sees the full constraint set.
    const validationSchema = retrievedSchema ?? schema;

    // JSON.stringify drops keys with `undefined` values; JSON.parse on the result gives AJV a clean
    // object that avoids spurious type errors for `type: "string"` fields that were cleared (#4518).
    // Falsy root values (`false`, `0`, `''`) are valid data, so only `undefined` skips the round trip (#5404).
    const serializedFormData = JSON.stringify(formData);
    const validationFormData = serializedFormData === undefined ? undefined : JSON.parse(serializedFormData);

    return schemaUtils
      .getValidator()
      .validateFormData(validationFormData, validationSchema, customValidate, transformErrors, uiSchema);
  }

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

  /** Merges any `extraErrors` or `customErrors` into the given `schemaValidation` object, returning the result. Custom
   * errors are left out under `noValidate`; they stay in the state so they show again once validation is turned on.
   *
   * @param schemaValidation - The `ValidationData` object into which additional errors are merged
   * @param [extraErrors] - The extra errors from the props
   * @param [customErrors] - The customErrors from custom components
   * @param [noValidate] - The `noValidate` prop
   * @return - The `extraErrors` and `customErrors` merged into the `schemaValidation`
   * @private
   */
  private static mergeErrors<T = any>(
    schemaValidation: ValidationData<T>,
    extraErrors?: FormProps['extraErrors'],
    customErrors?: ErrorSchemaBuilder,
    noValidate?: boolean,
  ): ValidationData<T> {
    let { errorSchema, errors } = schemaValidation;
    if (extraErrors) {
      const merged = validationDataMerge(schemaValidation, extraErrors);
      errorSchema = merged.errorSchema;
      errors = merged.errors;
    }
    if (customErrors && !noValidate) {
      const merged = validationDataMerge({ errors, errorSchema }, customErrors.ErrorSchema, true);
      errorSchema = merged.errorSchema;
      errors = merged.errors;
    }
    return { errors, errorSchema };
  }

  /** Performs live validation and then updates and returns the errors and error schemas by potentially merging in
   * `extraErrors` and `customErrors`.
   *
   * @param rootSchema - The `rootSchema` from the state
   * @param schemaUtils - The `SchemaUtilsType` from the state
   * @param originalErrorSchema - The original `ErrorSchema` from the state
   * @param [formData] - The new form data to validate
   * @param [extraErrors] - The extra errors from the props
   * @param [customErrors] - The customErrors from custom components
   * @param [retrievedSchema] - An expanded schema, if not provided, it will be retrieved from the `schema` and `formData`
   * @param [mergeIntoOriginalErrorSchema=false] - Optional flag indicating whether we merge into original schema
   * @param [props=this.props] - The props supplying `customValidate`, `transformErrors` and `uiSchema`
   * @returns - An object containing `errorSchema`, `errors`, `schemaValidationErrors` and `schemaValidationErrorSchema`
   * @private
   */
  private liveValidate(
    rootSchema: S,
    schemaUtils: SchemaUtilsType<T, S, F>,
    originalErrorSchema: ErrorSchema<S>,
    formData?: T,
    extraErrors?: FormProps['extraErrors'],
    customErrors?: ErrorSchemaBuilder<T>,
    retrievedSchema?: S,
    mergeIntoOriginalErrorSchema = false,
    props: FormProps<T, S, F> = this.props,
  ) {
    const schemaValidation = this.validate(formData, rootSchema, schemaUtils, retrievedSchema, props);
    const { errors } = schemaValidation;
    let { errorSchema } = schemaValidation;
    // We merge 'originalErrorSchema' with 'schemaValidation.errorSchema.'; This done to display the raised field error.
    if (mergeIntoOriginalErrorSchema) {
      errorSchema = mergeObjects(
        originalErrorSchema,
        schemaValidation.errorSchema,
        'preventDuplicates',
      ) as ErrorSchema<T>;
    }
    const schemaValidationErrors = errors;
    const schemaValidationErrorSchema = errorSchema;
    // oxlint-disable-next-line typescript/no-deprecated
    const mergedErrors = Form.mergeErrors<T>({ errorSchema, errors }, extraErrors, customErrors, props.noValidate);
    return { ...mergedErrors, schemaValidationErrors, schemaValidationErrorSchema };
  }

  /** Returns the `formData` with only the elements specified in the `fields` list
   *
   * @param formData - The data for the `Form`
   * @param fields - The fields to keep while filtering
   * @deprecated - To be removed as an exported `Form` function in a future release; there isn't a planned replacement
   */
  // oxlint-disable-next-line class-methods-use-this, typescript/no-deprecated
  getUsedFormData = (formData: T | undefined, fields: string[]): T | undefined => getUsedFormData(formData, fields);

  /** Returns the list of field names from inspecting the `pathSchema` as well as using the `formData`
   *
   * @param pathSchema - The `PathSchema` object for the form
   * @param [formData] - The form data to use while checking for empty objects/arrays
   * @deprecated - To be removed as an exported `Form` function in a future release; there isn't a planned replacement
   */
  // oxlint-disable-next-line class-methods-use-this, typescript/no-deprecated
  getFieldNames = (pathSchema: PathSchema<T>, formData?: T): string[][] => getFieldNames(pathSchema, formData);

  /** Returns the `formData` after filtering to remove any extra data not in a form field
   *
   * @param formData - The data for the `Form`
   * @returns The `formData` after omitting extra data
   * @deprecated - To be removed as an exported `Form` function in a future release, use `SchemaUtils.omitExtraData`
   *               instead.
   */
  omitExtraData = (formData?: T): T | undefined => {
    const { schema, schemaUtils } = this.state;
    return schemaUtils.omitExtraData(schema, formData);
  };

  /** Allows a user to set a value for the provided `fieldPath`, which must be either a dotted path to the field OR a
   * `FieldPathList`. To set the root element, used either `''` or `[]` for the path. Passing undefined will clear the
   * value in the field.
   *
   * @param fieldPath - Either a dotted path to the field or the `FieldPathList` to the field
   * @param [newValue] - The new value for the field
   */
  setFieldValue = (fieldPath: string | FieldPathList, newValue?: T) => {
    const { registry } = this.state;
    const path = Array.isArray(fieldPath) ? fieldPath : fieldPath.split('.');
    const fieldPathId = toFieldPathId('', registry.globalFormOptions, path);
    this.onChange(newValue, path, undefined, fieldPathId[ID_KEY]);
  };

  /** Queues the change as a `setState` updater, then reports it through `onChange` once committed. React applies a
   * batch's updaters in order, each to the result of the one before, so changes made close together do not overwrite
   * one another, and they commit together, so any number of them is one update rather than one nested in the commit of
   * the last. A change that throws, from `customValidate` or `transformErrors` say, leaves the state as it was and is
   * rethrown from a timeout, since the updater runs while React renders, where a throw would unmount the form. Live
   * validation runs once per batch, for its last change, so a change in a later lane, such as one in a transition,
   * defers the validation of the changes before it until that lane commits. When React rebases an urgent change onto a
   * transition it reruns the change without its callback, so a throw in that rerun is rethrown but drops the change
   * unreported, and a transition change that commits after a later urgent one was reported reports the whole committed
   * state under its own id, later changes in that lane included. Only changes are tracked for this, so a transition
   * change that commits under an urgent update of another kind, such as a `reset()`, reports its own data although the
   * reset replaced it.
   *
   * @param newValue - The new form data from a change to a field
   * @param path - The path to the change into which to set the formData
   * @param [newErrorSchema] - The new `ErrorSchema` based on the field change
   * @param [id] - The id of the field that caused the change
   */
  onChange = (newValue: T | undefined, path: FieldPathList, newErrorSchema?: ErrorSchema<T>, id?: string) => {
    this.changeCount += 1;
    const changeNumber = this.changeCount;
    this.queueUpdate<{ state: Partial<FormState<T, S, F>> | null }, boolean>(
      (prevState, props, isLast) => ({
        state: this.processChange({ newValue, path, newErrorSchema }, isLast, prevState, props),
      }),
      ({ state }, prevState, props, isThrown) => {
        if (!state) {
          return;
        }
        // A change that threw reports the validation of the changes before it, without its own id, since the data
        // does not hold it
        const reportedId: [id?: string] = isThrown ? [] : [id];
        if (changeNumber < this.lastReportedChange) {
          // React rebased the later changes already reported onto this one, so only the committed state holds both
          this.reportChange(toIChangeEvent(this.state), ...reportedId);
        } else {
          this.lastReportedChange = changeNumber;
          // React applies `getDerivedStateFromProps` after the batch's updaters, so what it adds, such as new
          // `extraErrors`, is applied here too, while later changes of the batch stay out of this one's event
          const changed = { ...prevState, ...state } as FormState<T, S, F>;
          this.reportChange(
            toIChangeEvent({ ...changed, ...Form.getDerivedStateFromProps(props, changed) }),
            ...reportedId,
          );
        }
      },
      {
        // Whether no later change has been queued, which decides whether this one live validates
        getKey: () => changeNumber === this.changeCount,
        // The changes before a throwing last change skipped live validation for it, so they are validated in its place
        recover: (prevState, props, isLast) => ({
          state: (isLast && prevState.isLiveValidationPending && this.validateBeforeThrow(prevState, props)) || null,
        }),
      },
    );
  };

  /** Rethrows `error` from a timeout, since a throw from an updater, which runs while React renders, would unmount the
   * form
   *
   * @param error - The error to rethrow
   */
  private static rethrowLater(error: unknown) {
    setTimeout(() => {
      throw error;
    });
  }

  /** Whether the `props` live validate each change made to a field
   *
   * @param props - The props to check
   */
  private static isLiveValidatedOnChange<T, S extends StrictRJSFSchema, F extends FormContextType>(
    props: FormProps<T, S, F>,
  ) {
    // oxlint-disable-next-line typescript/no-deprecated
    const { noValidate, liveValidate } = props;
    return !noValidate && (liveValidate === true || liveValidate === 'onChange');
  }

  /** Live validates `prevState` for a last change of a batch that threw. The changes before it skipped live validation
   * for it to run, so without this they would be committed with the errors from before the batch. A validation that
   * throws too is dropped, since the change's own error is rethrown. Nothing is returned when the errors already match.
   *
   * @param prevState - The state the throwing updater was handed, holding the changes before it
   * @param props - The props the throwing updater was handed
   * @returns - The live validation to commit, or undefined
   */
  private validateBeforeThrow(prevState: FormState<T, S, F>, props: FormProps<T, S, F>) {
    if (!Form.isLiveValidatedOnChange(props)) {
      return undefined;
    }
    const { schema, schemaUtils, schemaValidationErrorSchema, formData, customErrors, retrievedSchema } = prevState;
    try {
      const validation = this.liveValidate(
        schema,
        schemaUtils,
        schemaValidationErrorSchema,
        formData,
        props.extraErrors,
        customErrors,
        retrievedSchema,
        false,
        props,
      );
      return deepEquals(validation.errors, prevState.errors)
        ? undefined
        : { ...validation, isLiveValidationPending: false };
    } catch {
      return undefined;
    }
  }

  /** Applies a change made to a field to the state an updater queued by `onChange` was handed, returning the partial
   * state the change makes. The `newValue` is set into the `formData` at `path`, along with a new, optional
   * `ErrorSchema` for that same `path`. It will first update the `formData` with any missing default fields and then,
   * if `omitExtraData` and `liveOmit` are turned on, the `formData` will be filtered to remove any extra data not in a
   * form field. Then, the resulting `formData` will be validated if required, which only the last change of a batch
   * does.
   *
   * @param change - The change to apply
   * @param isLast - Whether no later change has been queued, so live validation runs
   * @param prevState - The state the updater was handed, which holds every change queued before this one
   * @param props - The props the updater was handed, which are those of the render applying the change
   */
  private processChange(
    change: FieldChange<T>,
    isLast: boolean,
    prevState: FormState<T, S, F>,
    props: FormProps<T, S, F>,
  ): Partial<FormState<T, S, F>> {
    const { newValue, path, newErrorSchema } = change;
    // oxlint-disable-next-line typescript/no-deprecated
    const { extraErrors, omitExtraData, liveOmit, noValidate, disabled, readonly } = props;
    const { formData: oldFormData, fieldPathId, schemaValidationErrorSchema } = prevState;
    let { customErrors, retrievedSchema, schemaUtils, schema } = prevState;
    let schemaState: Partial<FormState<T, S, F>> = {};
    // Use the un-merged AJV-only schema as the base for re-merging extraErrors. Mirrors the
    // pattern in getStateFromProps/getDerivedStateFromProps and avoids the duplication that
    // happened when state.errorSchema (already containing merged extraErrors) was passed in.
    let mergeBaseErrorSchema: ErrorSchema<T> = schemaValidationErrorSchema;
    const rootPathId = fieldPathId.path[0] || '';

    const isRootPath = !path || path.length === 0 || (path.length === 1 && path[0] === rootPathId);
    let formData = isRootPath ? newValue : structuredClone(oldFormData);

    // When switching from null to an object option in oneOf, MultiSchemaField sends
    // an object with property names but undefined values (e.g., {types: undefined, content: undefined}).
    // In this case, pass undefined to getStateFromProps to trigger fresh default computation.
    // Only do this when the previous formData was null/undefined (switching FROM null).
    const hasOnlyUndefinedValues =
      isObject(formData) &&
      Object.keys(formData as object).length > 0 &&
      Object.values(formData as object).every((v) => v === undefined);
    const wasPreviouslyNull = oldFormData === null || oldFormData === undefined;
    const inputForDefaults = hasOnlyUndefinedValues && wasPreviouslyNull ? undefined : formData;

    if (isObject(formData) || Array.isArray(formData)) {
      // Tracks if the user cleared a plain (non-oneOf/anyOf) leaf field.
      // The key is removed twice: once before getStateFromProps so inputForDefaults
      // reflects an empty field for conditional schema resolution, and once after so
      // the user's clear overrides any schema default getStateFromProps re-applied (#5125)
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
            valueForPath = null as unknown as T;
          } else {
            const { field } = schemaUtils.findFieldInSchema(schema, path, oldFormData);
            const leaf = field as RJSFSchema | undefined;
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
        retrievedSchema && !isRootPath && !isObject(newValue) && !Array.isArray(newValue) && !disabled && !readonly;
      // Skip live validation here; it runs later in this function.
      const newState = this.getStateFromProps(
        props,
        inputForDefaults,
        undefined,
        undefined,
        undefined,
        true,
        shouldSanitize,
        prevState,
        props,
      );
      formData = newState.formData;
      retrievedSchema = newState.retrievedSchema;
      if (newState.schemaUtils !== schemaUtils && !deepEquals(newState.schema, schema)) {
        // The parent changed what the schema utils are built from in the same batch, so the rest of the change, and the
        // state it reports, use the schema the defaults just came from
        ({ schemaUtils, schema } = newState);
        const { registry, hasNestedConditionalSchema, uiSchema } = newState;
        schemaState = {
          schemaUtils,
          schema,
          registry,
          hasNestedConditionalSchema,
          uiSchema,
          fieldPathId: newState.fieldPathId,
        };
      }

      // Re-set to undefined after merging defaults so the user's clear is preserved in
      // state (#5125 regression: without this, clearing a second field re-applies the
      // default to previously-cleared fields). The undefined key is stripped from the
      // formData copy passed to AJV via JSON.parse(JSON.stringify(...)) so the validator never
      // sees { [key]: undefined } for type:"string" or patternProperties fields (#4518).
      if (plainLeafWasCleared && formData) {
        setByPath(formData, path, undefined);
      }
    }

    const mustValidate = Form.isLiveValidatedOnChange(props);
    let state: Partial<FormState<T, S, F>> = { ...schemaState, formData, retrievedSchema };
    let newFormData = formData;

    if (omitExtraData === true && (liveOmit === true || liveOmit === 'onChange')) {
      newFormData = schemaUtils.omitExtraData(schema, formData);
      state = { ...state, formData: newFormData };
    }

    if (newErrorSchema) {
      // First check to see if there is an existing validation error on this path...
      const oldValidationError = !isRootPath
        ? getByPath(schemaValidationErrorSchema, path)
        : schemaValidationErrorSchema;
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
        // A copy, since the builder in `prevState` is the state's own, which a change that throws must leave as it was
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
    } else if (customErrors && getByPath<unknown[]>(customErrors.ErrorSchema, [...path, ERRORS_KEY])?.length) {
      // If we have custom errors and the path has an error, then we need to clear it, on a copy as above
      customErrors = new ErrorSchemaBuilder<T>(customErrors.ErrorSchema);
      customErrors.clearErrors(path);
      if (!noValidate && !(mustValidate && isLast)) {
        // Only the cleared path is rebuilt, from the AJV and extra errors at it, rather than every field from the
        // AJV-only errors, which do not hold what other widgets replaced
        const errorsPath = [...path, ERRORS_KEY];
        const extraAtPath = getByPath<string[]>(extraErrors, errorsPath) ?? [];
        const errorSchema = structuredClone(prevState.errorSchema || {});
        const ajvAtPath = getByPath<string[]>(schemaValidationErrorSchema, errorsPath) ?? [];
        const rebuiltAtPath = [...ajvAtPath, ...extraAtPath];
        if (rebuiltAtPath.length > 0) {
          setByPath(errorSchema, errorsPath, rebuiltAtPath, true);
        } else {
          unsetByPath(errorSchema, errorsPath);
          // The nodes it empties are dropped too, since a validation builds none where there are no errors
          for (let depth = path.length; depth > 0; depth -= 1) {
            const node = getByPath(errorSchema, path.slice(0, depth));
            if (!isObject(node) || Object.keys(node).length > 0) {
              break;
            }
            unsetByPath(errorSchema, path.slice(0, depth));
          }
        }
        const property = `.${path.join('.')}`;
        const shownErrors = prevState.errors || [];
        const rebuiltErrors = [
          ...(prevState.schemaValidationErrors || []).filter((error) => error.property === property),
          ...toErrorList<T>({ [ERRORS_KEY]: extraAtPath } as ErrorSchema<T>, path.map(String)),
        ];
        // The rebuilt errors take the place of the first one shown at the path, so the list keeps its order
        const firstAtPath = shownErrors.findIndex((error) => error.property === property);
        const insertAt = firstAtPath === -1 ? shownErrors.length : firstAtPath;
        const keptErrors = shownErrors.filter((error) => error.property !== property);
        const errors = [...keptErrors.slice(0, insertAt), ...rebuiltErrors, ...keptErrors.slice(insertAt)];
        state = { ...state, errorSchema, errors };
      }
    }
    if (customErrors !== prevState.customErrors) {
      // Kept even when not validating, so the errors are merged back in once validation is turned on
      state = { ...state, customErrors };
    }
    if (mustValidate) {
      state = { ...state, isLiveValidationPending: !isLast };
    }
    if (mustValidate && isLast) {
      const liveValidation = this.liveValidate(
        schema,
        schemaUtils,
        mergeBaseErrorSchema,
        newFormData,
        extraErrors,
        customErrors,
        retrievedSchema,
        false,
        props,
      );
      state = { ...state, ...liveValidation };
    } else if (!noValidate && newErrorSchema) {
      // The errors this change raised, merged onto the AJV-only errors, which hold none of them
      const mergedErrors = Form.mergeErrors<T>(
        { errorSchema: mergeBaseErrorSchema, errors: prevState.schemaValidationErrors || [] },
        extraErrors,
        customErrors,
      );
      state = { ...state, ...mergedErrors };
    }

    return state;
  }

  /**
   * If the retrievedSchema has changed the new retrievedSchema is returned.
   * Otherwise, the old retrievedSchema is returned to persist reference.
   * -  This ensures that AJV retrieves the schema from the cache when it has not changed,
   *    avoiding the performance cost of recompiling the schema.
   *
   * @param retrievedSchema The new retrieved schema.
   * @param [prevRetrievedSchema] The retrieved schema of the state the new one replaces.
   * @returns The new retrieved schema if it has changed, else the old retrieved schema.
   */
  private static updateRetrievedSchema<S>(retrievedSchema: S, prevRetrievedSchema?: S) {
    const isTheSame = deepEquals(retrievedSchema, prevRetrievedSchema);
    return isTheSame ? prevRetrievedSchema! : retrievedSchema;
  }

  /**
   * Callback function to handle reset form data.
   * - Reset all fields with default values.
   * - Reset validations and errors
   *
   */
  reset = () => {
    // Cast the IS_RESET symbol to T to avoid type issues, we use this symbol to detect reset mode
    const { formData: propsFormData, initialFormData = IS_RESET as T } = this.props;
    const newState = this.getStateFromProps(
      this.props,
      propsFormData ?? initialFormData,
      undefined,
      undefined,
      undefined,
      true,
    );
    const newFormData = newState.formData;
    const state = {
      formData: newFormData,
      errorSchema: {},
      errors: [] as unknown,
      schemaValidationErrors: [] as unknown,
      schemaValidationErrorSchema: {},
      initialDefaultsGenerated: false,
      customErrors: undefined,
      isLiveValidationPending: false,
    } as FormState<T, S, F>;

    this.setState(state, () => this.reportChange(toIChangeEvent({ ...this.state, ...state })));
  };

  /** Callback function to handle when a field on the form is blurred. Calls the `onBlur` callback for the `Form` if it
   * was provided. Also runs any live validation and/or live omit operations if the flags indicate they should happen
   * during `onBlur`.
   *
   * A blur has a higher priority than a change made in a transition, so React reruns it on top of that change once the
   * transition commits, without reporting what the rerun did. The change's own `onChange` event then lacks the blur's
   * omit and validation.
   *
   * @param id - The unique `id` of the field that was blurred
   * @param data - The data associated with the field that was blurred
   */
  onBlur = (id: string, data: any) => {
    const { onBlur } = this.props;
    if (onBlur) {
      onBlur(id, data);
    }
    // An updater, as for a change, so a change queued in the same event is blurred with the schema and props it was
    // applied with rather than replaced by the data from before it
    this.queueUpdate(
      (prevState, props) => {
        const { omitExtraData, liveOmit, liveValidate } = props;
        const isOmitted = omitExtraData === true && liveOmit === 'onBlur';
        const isValidated = liveValidate === 'onBlur';
        if (!isOmitted && !isValidated) {
          return { state: null, hasChanges: false };
        }
        const { formData, schema, schemaUtils, errorSchema, customErrors, retrievedSchema } = prevState;
        const newFormData = isOmitted ? schemaUtils.omitExtraData(schema, formData) : formData;
        let state: Partial<FormState<T, S, F>> = { formData: newFormData };
        if (isValidated) {
          const liveValidation = this.liveValidate(
            schema,
            schemaUtils,
            errorSchema,
            newFormData,
            props.extraErrors,
            customErrors,
            retrievedSchema,
            false,
            props,
          );
          state = { ...state, ...liveValidation, isLiveValidationPending: false };
        }
        const hasChanges = (['formData', 'errors', 'errorSchema'] as const).some(
          (key) => key in state && !deepEquals(prevState[key], state[key]),
        );
        return { state, hasChanges };
      },
      ({ state, hasChanges }) => {
        if (hasChanges) {
          this.reportChange(toIChangeEvent({ ...this.state, ...state }), id);
        }
      },
    );
  };

  /** Queues `compute` as a `setState` updater, committing the `state` it returns, and hands its result to `onCommit`
   * once committed. React reruns an updater with the same arguments, under `StrictMode` say, and commits the first
   * result, so a rerun returns that result rather than computing objects that were not committed. A throw is rethrown
   * from a timeout, since the updater runs while React renders, where a throw would unmount the form, and commits what
   * `recover` returns, or leaves the state as it was without one. A throw in a rerun React makes when it rebases the
   * update, which does not call `onCommit`, is rethrown too
   *
   * @param compute - Computes the state to commit, and whatever else `onCommit` needs, from the updater's arguments
   * @param onCommit - Called once the state is committed, with the result, the arguments it was computed from and
   *          whether `compute` threw
   * @param [options] - `getKey` returns a value a rerun must also match, which is handed to `compute`, and `recover`
   *          computes the result to commit in place of a `compute` that threw
   */
  private queueUpdate<R extends { state: Partial<FormState<T, S, F>> | null }, K = undefined>(
    compute: (prevState: FormState<T, S, F>, props: FormProps<T, S, F>, key: K) => R,
    onCommit: (result: R, prevState: FormState<T, S, F>, props: FormProps<T, S, F>, isThrown: boolean) => void,
    options: {
      getKey?: () => K;
      recover?: (prevState: FormState<T, S, F>, props: FormProps<T, S, F>, key: K) => R;
    } = {},
  ) {
    const { getKey, recover } = options;
    interface Outcome {
      prevState: FormState<T, S, F>;
      props: FormProps<T, S, F>;
      key: K;
      result?: R;
      thrown?: { error: unknown };
    }
    let outcome: Outcome | undefined;
    let isCommitted = false;
    this.setState(
      (prevState, props) => {
        const key = getKey?.() as K;
        let current = outcome;
        if (current?.prevState !== prevState || current.props !== props || current.key !== key) {
          try {
            current = { prevState, props, key, result: compute(prevState, props, key) };
          } catch (error) {
            current = { prevState, props, key, result: recover?.(prevState, props, key), thrown: { error } };
            // A rerun after the commit is React rebasing this update, which never calls the callback again
            if (isCommitted) {
              Form.rethrowLater(error);
            }
          }
          outcome = current;
        }
        return (current.result?.state ?? null) as FormState<T, S, F> | null;
      },
      () => {
        isCommitted = true;
        const committed = outcome;
        outcome = undefined;
        if (!committed) {
          return;
        }
        if (committed.thrown) {
          // Scheduled first, so a throw from `onCommit`, such as from a parent's `onChange`, does not lose this one
          Form.rethrowLater(committed.thrown.error);
        }
        if (committed.result) {
          onCommit(committed.result, committed.prevState, committed.props, committed.thrown !== undefined);
        }
      },
    );
  }

  /** Callback function to handle when a field on the form is focused. Calls the `onFocus` callback for the `Form` if it
   * was provided.
   *
   * @param id - The unique `id` of the field that was focused
   * @param data - The data associated with the field that was focused
   */
  onFocus = (id: string, data: any) => {
    const { onFocus } = this.props;
    if (onFocus) {
      onFocus(id, data);
    }
  };

  /** Callback function to handle when the form is submitted. First, it prevents the default event behavior. Nothing
   * happens if the target and currentTarget of the event are not the same. It will omit any extra data in the
   * `formData`, including the changes queued in the same event, if `omitExtraData` is true. It will validate the
   * resulting `formData`, reporting errors via the `onError()` callback unless validation is disabled. Finally, it will
   * add in any `extraErrors` and then call back the `onSubmit` callback if it was provided.
   *
   * With `createRoot`, a submit event has a higher priority than a change made outside a React event, such as after an
   * `await`, or in a transition, so it is validated and reported without that change. React then reruns it with the
   * change applied and commits that state, without calling `onSubmit` or `onError` for it.
   *
   * @param event - The submit HTML form event
   */
  onSubmit = (event: FormEvent<any>) => {
    event.preventDefault();
    if (event.target !== event.currentTarget) {
      return;
    }

    event.persist();
    // An updater, so a change queued in the same event is part of what is validated and submitted, along with the
    // schema and props it was applied with
    this.queueUpdate(
      (prevState, props) => this.validateSubmission(prevState, props),
      ({ state, errors, hasError }, prevState, props) => {
        if (hasError) {
          // Rethrown from a timeout, since a throw from a commit callback would unmount the form
          try {
            this.focusFirstError(errors, props);
          } catch (error) {
            Form.rethrowLater(error);
          }
          Form.reportErrors(errors, props);
        } else if (props.onSubmit) {
          const submitted = { ...prevState, ...state } as FormState<T, S, F>;
          props.onSubmit(
            toIChangeEvent({ ...submitted, ...Form.getDerivedStateFromProps(props, submitted) }, 'submitted'),
            event,
          );
        }
      },
    );
  };

  /** Omits extra data from the `formData` of `prevState`, if `omitExtraData` is set, and validates it for a submit,
   * unless `noValidate` is set
   *
   * @param prevState - The state the submit updater was handed, holding every change queued before it
   * @param props - The props the submit updater was handed
   * @returns - The state to commit, the errors that were found, and whether they block the submit
   */
  private validateSubmission(prevState: FormState<T, S, F>, props: FormProps<T, S, F>) {
    // oxlint-disable-next-line typescript/no-deprecated
    const { omitExtraData, extraErrors, noValidate } = props;
    const { schema, schemaUtils } = prevState;
    const formData =
      omitExtraData === true ? schemaUtils.omitExtraData(schema, prevState.formData) : prevState.formData;
    let errors: RJSFValidationError[] = [];
    if (!noValidate) {
      const validation = this.validateWithExtraErrors(formData, schema, schemaUtils, props);
      if (validation.hasError) {
        const failedState: Partial<FormState<T, S, F>> = {
          errors: validation.errors,
          errorSchema: validation.errorSchema,
          schemaValidationErrors: validation.schemaValidation.errors,
          schemaValidationErrorSchema: validation.schemaValidation.errorSchema,
          isLiveValidationPending: false,
        };
        return { state: failedState, errors: validation.errors, hasError: true };
      }
      ({ errors } = validation);
    }
    const submittedState: Partial<FormState<T, S, F>> = {
      formData,
      errors: extraErrors ? toErrorList(extraErrors) : [],
      errorSchema: extraErrors || {},
      schemaValidationErrors: [],
      schemaValidationErrorSchema: {},
      isLiveValidationPending: false,
    };
    return { state: submittedState, errors, hasError: false };
  }

  /** Validates `formData` as a submit does, merging in the `extraErrors`, which block it only when
   * `extraErrorsBlockSubmit` is set
   *
   * @param formData - The form data to validate
   * @param schema - The schema to validate against
   * @param schemaUtils - The schema utils to validate with
   * @param props - The props supplying the `extraErrors` and the validation callbacks
   * @returns - The schema validation, the errors merged with the `extraErrors`, and whether they block the submit
   */
  private validateWithExtraErrors(
    formData: T | undefined,
    schema: S,
    schemaUtils: SchemaUtilsType<T, S, F>,
    props: FormProps<T, S, F>,
  ) {
    const { extraErrors, extraErrorsBlockSubmit } = props;
    const schemaValidation = this.validate(formData, schema, schemaUtils, undefined, props);
    // Always merge extraErrors so they remain visible in state regardless of extraErrorsBlockSubmit.
    const { errors, errorSchema } = extraErrors ? Form.mergeErrors<T>(schemaValidation, extraErrors) : schemaValidation;
    // Schema errors always block, while extraErrors only block when extraErrorsBlockSubmit is set (non-breaking
    // default: extraErrors are informational only)
    const hasError = schemaValidation.errors.length > 0 || Boolean(extraErrors && extraErrorsBlockSubmit);
    return { schemaValidation, errors, errorSchema, hasError };
  }

  /** Focuses the first of the `errors`, if `focusOnFirstError` is set in the `props`
   *
   * @param errors - The errors a validation found
   * @param props - The props supplying `focusOnFirstError`
   */
  private focusFirstError(errors: RJSFValidationError[], props: FormProps<T, S, F>) {
    const { focusOnFirstError } = props;
    if (typeof focusOnFirstError === 'function') {
      focusOnFirstError(errors[0]);
    } else if (focusOnFirstError) {
      this.focusOnError(errors[0]);
    }
  }

  /** Calls `onError` with the `errors` a validation found, or logs them when it is not provided
   *
   * @param errors - The errors a validation found
   * @param props - The props supplying `onError`
   */
  private static reportErrors<T, S extends StrictRJSFSchema, F extends FormContextType>(
    errors: RJSFValidationError[],
    props: FormProps<T, S, F>,
  ) {
    if (props.onError) {
      props.onError(errors);
    } else {
      // oxlint-disable-next-line no-console
      console.error('Form validation failed', errors);
    }
  }

  /** Extracts the `GlobalFormOptions` from the given Form `props`
   *
   * @param props - The form props to extract the global form options from
   * @returns - The `GlobalFormOptions` from the props
   * @private
   */
  private static getGlobalFormOptions<
    T = any,
    S extends StrictRJSFSchema = RJSFSchema,
    F extends FormContextType = any,
  >(props: FormProps<T, S, F>): GlobalFormOptions {
    const {
      uiSchema = {},
      experimental_componentUpdateStrategy,
      idSeparator = DEFAULT_ID_SEPARATOR,
      idPrefix = DEFAULT_ID_PREFIX,
      nameGenerator,
      useFallbackUiForUnsupportedType = false,
    } = props;
    // oxlint-disable-next-line typescript/no-deprecated
    const rootFieldId = uiSchema['ui:rootFieldId'];
    // Omit any options that are undefined or null
    return {
      idPrefix: rootFieldId || idPrefix,
      idSeparator,
      useFallbackUiForUnsupportedType,
      ...(experimental_componentUpdateStrategy !== undefined && { experimental_componentUpdateStrategy }),
      ...(nameGenerator !== undefined && { nameGenerator }),
    };
  }

  /** Computed the registry for the form using the given `props`, `schema` and `schemaUtils` */
  static getRegistry<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
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
      },
      widgets: { ...widgets, ...props.widgets },
      rootSchema: schema,
      formContext: props.formContext || formContext,
      schemaUtils,
      translateString: customTranslateString || translateString,
      globalUiOptions: uiSchema[UI_GLOBAL_OPTIONS_KEY],
      globalFormOptions: Form.getGlobalFormOptions(props),
      uiSchemaDefinitions: uiSchema[UI_DEFINITIONS_KEY] ?? {},
    };
  }

  /** Provides a function that can be used to programmatically submit the `Form` */
  submit = () => {
    if (this.formElement.current) {
      const submitCustomEvent = new CustomEvent('submit', {
        cancelable: true,
      });
      submitCustomEvent.preventDefault();
      this.formElement.current.dispatchEvent(submitCustomEvent);
      this.formElement.current.requestSubmit();
    }
  };

  /** Attempts to focus on the field associated with the `error`. Uses the `property` field to compute path of the error
   * field, then, using the `idPrefix` and `idSeparator` converts that path into an id. Then the input element with that
   * id is attempted to be found using the `formElement` ref. If it is located, then it is focused.
   *
   * @param error - The error on which to focus
   */
  focusOnError(error: RJSFValidationError) {
    const { idPrefix = 'root', idSeparator = '_' } = this.props;
    const { property } = error;
    const path = toPath(property ?? '');
    // The id of the root element is the idPrefix, so prepend it to the path
    path.unshift(idPrefix);

    const elementId = path.join(idSeparator);
    let field = this.formElement.current.elements[elementId];
    if (!field) {
      // if not an exact match, try finding a focusable element starting with the element id (like radio buttons or checkboxes)
      // some themes (e.g. shadcn) use button elements instead of native inputs for radio groups
      field = this.formElement.current.querySelector(`input[id^="${elementId}"], button[id^="${elementId}"]`);
    }
    if (field?.length) {
      // If we got a list with length > 0
      // oxlint-disable-next-line prefer-destructuring
      field = field[0];
    }
    if (field) {
      field.focus();
    }
  }

  /** Validates the form using the given `formData`. For programmatic validation; a submit does not call this.
   * If `onError` is provided, then it will be called with the list of errors.
   *
   * @param formData - The form data to validate
   * @returns - True if the form is valid, false otherwise.
   */
  validateFormWithFormData = (formData?: T): boolean => {
    const { errors: prevErrors, formData: validatedFormData, schema, schemaUtils } = this.state;
    const { schemaValidation, errors, errorSchema, hasError } = this.validateWithExtraErrors(
      formData,
      schema,
      schemaUtils,
      this.props,
    );
    // A live validated change queued in the same event is applied before these errors, which are of the data from
    // before it, so they are written only where they would not replace that change's own. The data is compared by value,
    // since a prop change queues an equal copy of it that is no change of the user's
    const setValidationState = (
      validationState: Pick<
        FormState<T, S, F>,
        'errors' | 'errorSchema' | 'schemaValidationErrors' | 'schemaValidationErrorSchema'
      >,
      callback?: () => void,
    ) =>
      this.setState(
        (prevState, props) =>
          !deepEquals(prevState.formData, validatedFormData) && Form.isLiveValidatedOnChange(props)
            ? null
            : validationState,
        callback,
      );
    if (hasError) {
      this.focusFirstError(errors, this.props);
      const { props } = this;
      setValidationState(
        {
          errors,
          errorSchema,
          schemaValidationErrors: schemaValidation.errors,
          schemaValidationErrorSchema: schemaValidation.errorSchema,
        },
        () => Form.reportErrors(errors, props),
      );
    } else if (errors.length > 0) {
      // Non-blocking extraErrors are present — update display state without triggering onError.
      setValidationState({
        errors,
        errorSchema,
        schemaValidationErrors: [],
        schemaValidationErrorSchema: {},
      });
    } else if (prevErrors.length > 0) {
      setValidationState({
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
   * It validates the committed `formData`, since it returns its result at once, so a change queued in the same event,
   * such as by `setFieldValue()`, is not part of it. A submit in the same event does include that change.
   *
   * @returns - True if the form is valid, false otherwise.
   */
  validateForm() {
    const { omitExtraData } = this.props;
    const { formData, schema, schemaUtils } = this.state;
    return this.validateFormWithFormData(
      omitExtraData === true ? schemaUtils.omitExtraData(schema, formData) : formData,
    );
  }

  /** Renders the `Form` fields inside the <form> | `tagName` or `_internalFormWrapper`, rendering any errors if
   * needed along with the submit button or any children of the form.
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
      _internalFormWrapper,
    } = this.props;

    const { schema, uiSchema, formData, errorSchema, fieldPathId, registry } = this.state;
    const { SchemaField: SchemaFieldComponent } = registry.fields;
    const { SubmitButton } = registry.templates.ButtonTemplates;
    // The `semantic-ui` and `material-ui` themes have `_internalFormWrapper`s that take an `as` prop that is the
    // PropTypes.elementType to use for the inner tag, so we'll need to pass `tagName` along if it is provided.
    // NOTE, the `as` prop is native to `semantic-ui` and is emulated in the `material-ui` theme
    const as = _internalFormWrapper ? tagName : undefined;
    const FormTag = _internalFormWrapper || tagName || 'form';

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
        as={as}
        ref={this.formElement}
      >
        {showErrorList === 'top' && this.renderErrors(registry)}
        <SchemaFieldComponent
          name=''
          schema={schema}
          uiSchema={uiSchema}
          errorSchema={errorSchema}
          fieldPathId={fieldPathId}
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
