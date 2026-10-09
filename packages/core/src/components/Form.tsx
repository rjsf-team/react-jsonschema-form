import type { ElementType, ReactNode, Ref, SubmitEvent } from 'react';
import {
  memo,
  useEffect,
  useImperativeHandle,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import type {
  CustomValidator,
  ErrorSchema,
  ErrorSchemaBuilder,
  ErrorTransformer,
  FormContextType,
  StrictRJSFSchema,
  Registry,
  RegistryFieldsType,
  RegistryWidgetsType,
  RJSFSchema,
  RJSFValidationError,
  SchemaUtilsType,
  TemplatesType,
  UiSchema,
  ValidatorType,
  DefaultFormStateBehavior,
  CustomMergeAllOf,
  NameGeneratorFunction,
} from '@rjsf/utils';
import { getTemplates, getUiOptions, SUBMIT_BTN_OPTIONS_KEY, ROOT_FIELD_PATH, UI_OPTIONS_KEY } from '@rjsf/utils';

import RawFormDataContext from './fields/RawFormDataContext.ts';
import FormDataContext from './FormDataContext.ts';
import { createFormModel } from './formModel.ts';
import type { FormRef } from './FormRef.ts';
import { deriveState, initialState, isDevelopment } from './formState.ts';
import type { IChangeEvent } from './IChangeEvent.ts';

/** `T` itself for any concrete type, but not a position TypeScript infers `T` from. `FormProps` wraps the configuration
 * props and handlers in it, so `T` is inferred from `formData`/`initialFormData` (or a typed `ref`) and an unannotated
 * `UiSchema`, handler or widget next to them cannot widen it to `unknown` or `{}`.
 */
type Uninferred<T> = T extends unknown ? T : never;

/** The properties that are passed to the `Form` */
export interface FormProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
  /** The JSON schema object for the form */
  schema: S;
  /** An implementation of the `ValidatorType` interface that is needed for form validation to work */
  validator: ValidatorType<S, F>;
  /** The optional children for the form, if provided, it will replace the default `SubmitButton` */
  children?: ReactNode;
  /** The uiSchema for the form */
  uiSchema?: UiSchema<Uninferred<T>, S, F>;
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
  fields?: RegistryFieldsType<Uninferred<T>, S, F>;
  /** The dictionary of registered templates in the form; Partial allows a subset to be provided beyond the defaults */
  templates?: Partial<Omit<TemplatesType<Uninferred<T>, S, F>, 'ButtonTemplates'>> & {
    ButtonTemplates?: Partial<TemplatesType<Uninferred<T>, S, F>['ButtonTemplates']>;
  };
  /** The dictionary of registered widgets in the form */
  widgets?: RegistryWidgetsType<Uninferred<T>, S, F>;
  // Callbacks
  /** If you plan on being notified every time the form data are updated, you can pass an `onChange` handler, which will
   * receive the same args as `onSubmit` any time a value is updated in the form. Can also return the `id` of the field
   * that caused the change
   */
  onChange?: (data: IChangeEvent<Uninferred<T>, S, F>, id?: string) => void;
  /** To react when submitted form data are invalid, pass an `onError` handler. It will be passed the list of
   * encountered errors
   */
  onError?: (errors: RJSFValidationError[]) => void;
  /** You can pass a function as the `onSubmit` prop of your `Form` component to listen to when the form is submitted
   * and its data are valid. It will be passed a result object having a `formData` attribute, which is the valid form
   * data you're usually after. The original event will also be passed as a second parameter
   */
  onSubmit?: (data: IChangeEvent<Uninferred<T>, S, F>, event: SubmitEvent<HTMLFormElement>) => void;
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
  customValidate?: CustomValidator<Uninferred<T>, S, F>;
  /** This prop allows passing in custom errors that are augmented with the existing JSON Schema errors on the form; it
   * can be used to implement asynchronous validation. By default, these errors block form submission just like
   * JSON Schema errors do.
   */
  extraErrors?: ErrorSchema<Uninferred<T>>;
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
   * validation is performed for each change. If `onBlur` is provided, then
   * live validation will be performed when a field that was updated is blurred (as a performance optimization).
   */
  liveValidate?: 'onChange' | 'onBlur';
  /** Flag that describes when live omit will be performed. Live omit happens only when `omitExtraData` is also set to
   * to `true` and the form's data is updated by the user.
   *
   * If no value is provided, then live omit will not happen. If `onChange` is provided for the flag, then live omit
   * is performed for each change. If `onBlur` is provided, then live omit
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
  transformErrors?: ErrorTransformer<Uninferred<T>, S, F>;
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
  /** Receives the supported imperative FormRef. */
  ref?: Ref<FormRef<T>>;
}

/** The data that is contained within the state for the `Form` */
export interface FormState<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
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
  /** The root schema the committed `formData` last settled under: it was sanitized against that root, or it has
   * only ever lived under it. Undefined while a schema swap or an unsanitized change has left the data unchecked
   * against the current root; the previous-data filter chain in `sanitizeDataForNewSchema()` is only fed data
   * whose marker matches, since both sides of that chain resolve `$ref`s against the one new root
   */
  formDataSchema?: S;
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
  /** Set by a parent-owned form's blur that validated a proposal the parent had not answered: the render that answers
   * it validates the data the parent rendered instead, whether that is the proposal, a transformed value or the old one
   */
  isBlurValidationOwed?: boolean;
  /** The props that take part in validation without taking part in resolving the schema, kept in the render context so
   * a derivation can tell they changed by comparing with the committed state, functions by identity
   */
  validationProps: ValidationProps<T, S, F>;
  /** `defaultFormStateBehavior` as the derivation saw it, kept in the render context so a later one can tell the
   * settings that decide the defaults changed. Compared deeply, functions included, and with an `undefined` setting
   * counting as unset, so a rebuilt object holding the same settings is not read as a change
   */
  defaultsBehavior?: DefaultFormStateBehavior;
}

/** The validation callbacks, the only validation inputs the schema utilities are not built from */
type ValidationProps<T, S extends StrictRJSFSchema, F extends FormContextType> = Pick<
  FormProps<T, S, F>,
  'customValidate' | 'transformErrors'
>;

/** What is wrong with how the form's data is owned, if anything: the first thing, since mending it may mend the rest
 *
 * @param state - The state the form renders
 * @param props - The props it was rendered with
 * @returns - The warning, or false
 */
function ownershipWarning<T, S extends StrictRJSFSchema, F extends FormContextType>(
  state: FormState<T, S, F>,
  props: FormProps<T, S, F>,
): string | false {
  if (!state.isControlled) {
    return (
      props.formData !== undefined &&
      'Form: `formData` was set on a form that mounted without it. Ownership is decided at mount, so the form keeps its own data and ignores this value. To show data that arrives later, either mount the form only once the data is there (`key` it by the record to switch records), or mount it with a complete fallback such as `formData={record ?? {}}` and an `onChange` that stores each proposal.'
    );
  }
  if (props.initialFormData !== undefined) {
    return 'Form: both `formData` and `initialFormData` are set; `initialFormData` is ignored. Pass `formData` for a form whose value you own and update from `onChange`, or `initialFormData` for one the form owns.';
  }
  return (
    !props.onChange &&
    !props.readonly &&
    !props.disabled &&
    'Form: `formData` is set without an `onChange` handler, so the form will render this value and ignore every edit. Pass `initialFormData` to let the form own an editable value, `onChange` to accept its proposals into `formData`, or `readonly` for a fixed presentation.'
  );
}

/** Logs `warning` each time there comes to be one. From an Effect, because a warning is a side effect, which a render
 * must not have: React may render without committing, and such a render has nothing to warn about.
 *
 * @param warning - The warning, or false when there is nothing to warn about
 */
function useDevWarning(warning: string | false) {
  useEffect(() => {
    if (warning) {
      // oxlint-disable-next-line no-console
      console.warn(warning);
    }
  }, [warning]);
}

/** The model holds the state; rendering derives from it and the props what to show, and each commit hands that back */
function Form<T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  props: FormProps<T, S, F>,
) {
  const { ref } = props;
  // The model is created once and kept in the render cache, so it lives exactly as long as the mounted form
  const [cache, setCache] = useState(() => {
    const state = initialState(props);
    const created = createFormModel(props, state);
    return { model: created, snapshot: created.getSnapshot(), props, state };
  });
  const { model } = cache;
  const { setFormElement } = model;
  // Renders the form after each operation that changed its state, and after each proposal, whatever the parent does
  // with it, so the commit settles the proposal. The server snapshot is the store's own: the render that reads it is
  // the one that created the model, so nothing has been committed to it yet
  const snapshot = useSyncExternalStore(model.subscribe, model.getSnapshot, model.getSnapshot);
  // With no operation since the cached derivation, that derivation is the latest state, committed to the model or not
  const base = snapshot.operations === cache.snapshot.operations ? cache.state : snapshot.state;
  // `deriveState()` is pure, so the re-render that `setCache` triggers reuses its result instead of deriving the same
  // state again
  const state = props === cache.props && base === cache.state ? cache.state : deriveState(props, base);
  if (state !== cache.state) {
    setCache({ model, snapshot, props, state });
  }
  useDevWarning(isDevelopment && ownershipWarning(state, props));
  // Hands every commit to the model in the phase in which React switches its own event handlers to the new props:
  // before the setup of any layout Effect, a callback ref being attached or a passive Effect can issue a command, and
  // while an `<Activity>` hides the form too. What React does in that phase before it reaches the form runs earlier:
  // the cleanup of a layout Effect, a ref being detached and a `componentWillUnmount`, in the form's subtree, in an
  // earlier sibling's, and in anything removed from under an ancestor.
  useInsertionEffect(() => {
    model.committed(props, state, snapshot);
  });
  // Kept for the life of the form, which an `<Activity>` hiding it does not end: the cleanup is the unmount
  useInsertionEffect(() => model.mount(), [model]);
  // Installed before the form attaches, so a callback the model calls as it does finds the handle on the consumer's ref
  useImperativeHandle(ref, () => model.handle, [model]);
  useLayoutEffect(() => {
    model.attach();
    return model.detach;
  }, [model]);
  // After every commit of a shown form, which may be the one a queued `submit()` waits for
  useLayoutEffect(() => {
    model.submitWhenRendered();
  });

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
  } = props;

  const { schema, uiSchema, formData, errors, errorSchema, registry } = state;
  const { SchemaField: SchemaFieldComponent } = registry.fields;
  const { SubmitButton } = registry.templates.ButtonTemplates;
  const FormTag = tagName || 'form';

  // Memoized so the submit button, which is not a field, keeps its props across renders that changed nothing of its own
  const submitUiSchema = useMemo(() => {
    const submitOptions = getUiOptions<T, S, F>(uiSchema)[SUBMIT_BTN_OPTIONS_KEY] ?? {};
    return {
      [UI_OPTIONS_KEY]: {
        [SUBMIT_BTN_OPTIONS_KEY]: disabled
          ? { ...submitOptions, props: { ...submitOptions.props, disabled: true } }
          : submitOptions,
      },
    };
  }, [uiSchema, disabled]);

  /** The errors in the `ErrorList`, unless disabled by `showErrorList` */
  const renderErrors = () => {
    const options = getUiOptions<T, S, F>(uiSchema);
    const { ErrorListTemplate } = getTemplates<T, S, F>(registry, options);
    if (errors.length === 0) {
      return null;
    }
    return (
      <ErrorListTemplate
        errors={errors}
        errorSchema={errorSchema}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      />
    );
  };

  return (
    <FormDataContext value={model}>
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
        onSubmit={model.handleSubmit}
        ref={setFormElement}
      >
        {showErrorList === 'top' && renderErrors()}
        <RawFormDataContext value={SchemaFieldComponent}>
          <SchemaFieldComponent
            name=''
            schema={schema}
            uiSchema={uiSchema}
            errorSchema={errorSchema}
            fieldPath={ROOT_FIELD_PATH}
            id={registry.globalFormOptions.idPrefix}
            formData={formData}
            onChange={model.handleChange}
            onBlur={model.handleBlur}
            onFocus={model.handleFocus}
            registry={registry}
            disabled={disabled}
            readonly={readonly}
          />
        </RawFormDataContext>

        {children || <SubmitButton uiSchema={submitUiSchema} registry={registry} />}
        {showErrorList === 'bottom' && renderErrors()}
      </FormTag>
    </FormDataContext>
  );
}

/** `Form` compares its props shallowly, as `SchemaField` does, so a parent's re-render with the same props stops here.
 * `memo()` drops `Form`'s type parameters, so the overload is the one trust point that the memoized component takes
 * the props `Form` does.
 */
function memoizeForm(form: typeof Form): typeof Form;
function memoizeForm(form: typeof Form): unknown {
  return memo(form);
}
const MemoizedForm = memoizeForm(Form);
export default MemoizedForm;
