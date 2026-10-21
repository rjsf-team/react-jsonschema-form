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
  ThemePresentation,
  UiSchema,
  ValidatorType,
  DefaultFormStateBehavior,
  CustomMergeAllOf,
  NameGeneratorFunction,
} from '@rjsf/utils';
import { getTemplates, getUiOptions, SUBMIT_BTN_OPTIONS_KEY, ROOT_FIELD_PATH, UI_OPTIONS_KEY } from '@rjsf/utils';

import isDevelopment from '../isDevelopment.ts';
import NamedFieldContext from './fields/NamedFieldContext.ts';
import FormDataContext from './FormDataContext.ts';
import { createFormModel } from './formModel.ts';
import type { FormRef } from './FormRef.ts';
import { deriveState, initialState } from './formState.ts';
import type { IChangeEvent } from './IChangeEvent.ts';
import type { UiState } from './uiState.ts';
import UiStateContext from './UiStateContext.ts';

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
  /** The JSON schema object for the form. It is parsed once per object and treated as immutable, so a change made to it
   * in place is not seen: pass a new object to change it
   */
  schema: S;
  /** An implementation of the `ValidatorType` interface that is needed for form validation to work */
  validator: ValidatorType<S, F>;
  /** The optional children for the form, if provided, it will replace the default `SubmitButton` */
  children?: ReactNode;
  /** The uiSchema for the form */
  uiSchema?: UiSchema<Uninferred<T>, S, F>;
  /** Another name for `initialFormData`, taken over it when both are passed: the seed of the form's data, read when
   * the form mounts and when `reset()` is called. It is only a seed: the form owns its data after that, so passing back
   * what `onChange` reported changes nothing, and passing another value, such as a record that arrives after mount, is
   * ignored, with a warning in development only. To show other data, remount the form with a `key`, or call
   * `setFieldValue('', data)` on its ref.
   *
   * @deprecated Use `initialFormData`, which this is another name for. The form reads it only on mount and on
   * `reset()`, which the name `formData` hides by reading as a controlled value.
   */
  formData?: T;
  /** The seed of the form's data, like `defaultValue` on an `<input>`: read when the form mounts and when `reset()` is
   * called, filled in with the schema's defaults, and ignored otherwise. Edits are reported through `onChange`; read
   * the current value with `getFormData()`.
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
  /** Which parts of a field the registered fields and widgets draw themselves, layered over the theme's declarations,
   * which are layered over `core`'s
   */
  presentation?: ThemePresentation;
  /** The keys of the extensions to `ui:globalOptions` the form's own widgets, fields and templates read, beyond the
   * ones RJSF reads there, added to the ones the theme declares. The registry's `globalUiOptions` hold only those, so
   * every field hands them to its widget and templates along with RJSF's own. A key that is an option name RJSF reads
   * per field, such as `widget`, is not read from `ui:globalOptions`
   */
  globalUiOptionsKeys?: readonly string[];
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
  /** Returns the data an edit leaves the form with, given the data the edit produced and the data before it: `next` to
   * take the edit as it is, `previous`, or a copy of it, to refuse it, or another value, such as `next` with a field
   * trimmed. An edit that leaves the data as it was, such as an option switch whose data fits both options, is refused
   * by `previous` itself alone, since a copy of it is a copy of `next` too. At a root holding a string, number or
   * boolean, such an edit's `next` is `previous` itself, so it can't be refused. It runs for every edit, a field's change and `setFieldValue()` alike, and for those alone: what the form
   * derives on its own, the defaults for a new schema, the live omit a blur runs and a `reset()`, is stored without it,
   * and the last two are reported through `onChange`. It runs before the form stores the result, validates it and
   * reports it.
   * It must be pure, since the form may call it again for the same edit, and must not mutate `next` or `previous`,
   * which are frozen in development; it should return `next`'s unchanged subtrees as they are, so their fields do not
   * render again. `undefined` leaves the form with no data, and what it returns is
   * filled in with the schema's defaults like any data the form holds.
   */
  transformChange?: (next: Uninferred<T> | undefined, previous: Uninferred<T> | undefined) => Uninferred<T> | undefined;
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

/** The state of the `Form`: what its store holds between renders and what each render derives from the props.
 * Internal to `@rjsf/core`; `IChangeEvent` is the public shape of what reaches a consumer.
 */
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
  /** The current data for the form: the data the props last handed it, filled in with the schema's defaults, and the
   * changes made since
   */
  formData?: T;
  /** Whether there is data to live-validate when a prop changes: the props seeded the form with data, rather than
   * leaving it to the schema's defaults, or it has been edited since it mounted or was last reset
   */
  isDataPassed: boolean;
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
  /** The errors fields raised as their own through `onChange`, kept apart from the validator's */
  customErrors?: ErrorSchema<T>;
  /** The result of `schemaUtils.retrieveSchema(schema, formData)` for the state's data, kept so the edit path and
   * live validation do not resolve it again
   */
  retrievedSchema: S;
  /** The form's option selections and cycle expansions, see `createUiState()` */
  uiState: UiState;
  /** Flag indicating whether the initial form defaults have been generated */
  initialDefaultsGenerated: boolean;
  /** The registry (re)computed only when props changed */
  registry: Registry<T, S, F>;
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

/** Hands each commit's props and state to the model, see `committed()`, from an insertion Effect rendered first inside
 * the form element. React runs every insertion Effect of a commit before any layout Effect in it, so a command from a
 * layout Effect, a widget's or an earlier sibling's, starts from the props of the commit that runs it. It walks the tree
 * in order as it does, and runs the layout cleanups of what the commit removes on the way, so being first inside the
 * form element also has this run before the cleanup of any field the commit removes, which flushes a draft from it
 * under the new props too. Only a removed child of an element the walk reaches after this one: React runs the
 * cleanups of an element's removed children before it walks the children that stay, so everything the form renders
 * besides this and the `Attachment` sits in a fragment after them, which adds nothing to the DOM. Hidden content
 * renders, and runs its insertion Effects, so the model keeps up while an `<Activity>` hides the form
 */
function Handoff({ handOff }: { handOff: () => void }) {
  useInsertionEffect(handOff);
  return null;
}

/** Attaches the form to its model for as long as it is shown, from the first layout Effect in the form's subtree: React
 * runs a subtree's layout Effects children first and siblings in order, so this setup runs before any field's,
 * including when an `<Activity>` shows the form again or StrictMode replays the Effects, and an edit a widget makes
 * from a layout Effect then is taken. React runs the cleanups in the same order when the form unmounts or is hidden,
 * so a field's layout cleanup finds the form detached and a draft it flushes is dropped, as the contract says
 */
function Attachment({ attach }: { attach: () => () => void }) {
  useLayoutEffect(() => attach(), [attach]);
  return null;
}

/** The model holds the state; rendering derives from it and the props what to show, and each commit hands that back */
function Form<T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  props: FormProps<T, S, F>,
) {
  const { ref } = props;
  // The model is created once and kept in the render cache, so the form has the one model for as long as it is mounted.
  // The cache also holds what the last render derived, which React documents as storing information from previous
  // renders: a render with the same props and no operation since reuses it rather than deriving it again
  const [cache, setCache] = useState(() => {
    const state = initialState(props);
    return { model: createFormModel(props, state), published: state, props, state };
  });
  const { model } = cache;
  const { setFormElement } = model;
  // Renders the form after each operation that changed its state. The server snapshot is the store's own: the render
  // that reads it is the one that created the model, so nothing has been committed to it yet
  const published = useSyncExternalStore(model.subscribe, model.getSnapshot, model.getSnapshot);
  // With no operation since the cached derivation, that derivation is the latest state
  const base = published === cache.published ? cache.state : published;
  const state = props === cache.props && base === cache.state ? cache.state : deriveState(props, base);
  if (state !== cache.state) {
    setCache({ model, published, props, state });
  }
  // Each commit tells the model the props and the state it rendered, which operations start from, through the
  // `Handoff` rendered below; the attachment is the `Attachment` after it
  const handOff = () => model.committed(props, state, published);
  // oxlint-disable-next-line typescript/no-deprecated -- the form still reads the deprecated alias
  const { formData: formDataProp, initialFormData } = props;
  useEffect(() => {
    if (isDevelopment) {
      model.warnIfFormDataIgnored(formDataProp);
      model.warnIfBothSeedsPassed(formDataProp, initialFormData);
    }
  }, [model, formDataProp, initialFormData]);
  useImperativeHandle(ref, () => model.handle, [model]);

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
  // The element too: a theme's `SubmitButton` may not be memoized, so an element that is kept is what skips it for a keystroke.
  // `children` replace the button, so there is none to build then
  const hasChildren = !!children;
  const submitButton = useMemo(
    () => (hasChildren ? null : <SubmitButton uiSchema={submitUiSchema} registry={registry} />),
    [hasChildren, SubmitButton, submitUiSchema, registry],
  );

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
        <Handoff handOff={handOff} />
        <Attachment attach={model.attached} />
        <>
          {showErrorList === 'top' && renderErrors()}
          <NamedFieldContext value={undefined}>
            <UiStateContext value={model.uiState}>
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
            </UiStateContext>
          </NamedFieldContext>

          {children || submitButton}
          {showErrorList === 'bottom' && renderErrors()}
        </>
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
