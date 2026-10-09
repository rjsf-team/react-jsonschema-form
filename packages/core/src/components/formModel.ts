import type { SubmitEvent } from 'react';
import type {
  ErrorSchema,
  FieldPath,
  FieldPathList,
  FormContextType,
  StrictRJSFSchema,
  RJSFValidationError,
} from '@rjsf/utils';
import {
  callWithDeferredThrow,
  toPath,
  replaceEqualDeep,
  fieldPathFromList,
  fieldPathToId,
  fieldPathToList,
} from '@rjsf/utils';

import type { FormProps, FormState } from './Form.tsx';
import type { FormRef } from './FormRef.ts';
import type { PendingChange } from './formState.ts';
import {
  applyBlur,
  applyChange,
  applyReset,
  applySubmit,
  applyValidation,
  getAt,
  asFieldValue,
  deriveState,
  freezeFormData,
  isBlurValidated,
  isDevelopment,
  isLiveValidated,
  toEventFormData,
  toIChangeEvent,
  validateFormData,
} from './formState.ts';

/** How an operation calls the consumer's callback: directly for a handle method, whose caller catches the throw, or
 * through `callWithDeferredThrow()` for a field, which can report from an Effect inside React's commit phase, where a
 * throw from the consumer's callback would unmount the form. Either way the callback is handed the props of the last
 * committed render as the report is delivered, so a report held while the form was hidden reaches the handlers its
 * parent passes now, not the ones the operation started with.
 */
type Report<Props> = (callback: (latest: Props) => void) => void;

/** The props an operation computes with, read once as it starts. The consumer's callbacks are not among them, so an
 * operation cannot report through the props it started with: a report is handed the props to call, see `Report`.
 */
type OperationProps<T, S extends StrictRJSFSchema, F extends FormContextType> = Omit<
  FormProps<T, S, F>,
  'onChange' | 'onBlur' | 'onFocus' | 'onSubmit' | 'onError' | 'focusOnFirstError'
>;

/** Whether each member of the state is a parent-owned form's own, and so taken from the result of an operation: its
 * errors are, and the validation a blur owes the render that answers its proposal. Everything else is derived from the
 * props before every render, so the data an operation computed is the parent's to accept through `onChange`, and the
 * render context an edit resolved for its proposal would describe data the parent has not accepted. Every member is
 * listed, so the state cannot gain one without it being decided whose it is.
 */
const IS_OWNED_BY_FORM = {
  schema: false,
  uiSchema: false,
  schemaUtils: false,
  formData: false,
  edit: false,
  errors: true,
  errorSchema: true,
  schemaValidationErrors: true,
  schemaValidationErrorSchema: true,
  customErrors: true,
  retrievedSchema: false,
  hasNestedConditionalSchema: false,
  initialDefaultsGenerated: false,
  registry: false,
  isControlled: false,
  isBlurValidationOwed: true,
  validationProps: false,
  defaultsBehavior: false,
} satisfies Record<keyof FormState, boolean>;

/** `base` with the members `picks` marks taken from `from`
 *
 * @param picks - Which members to take
 * @param base - The object the others are kept from
 * @param from - The object the marked members are taken from
 * @returns - A new object
 */
function withMembers<Members extends object>(
  picks: Record<keyof Members, boolean>,
  base: Members,
  from: Members,
): Members {
  const taken = { ...base };
  for (const key in picks) {
    // Compared first, so that taking nothing new does not add a key `base` does not have, which would read as a change
    if (picks[key] && taken[key] !== from[key]) {
      taken[key] = from[key];
    }
  }
  return taken;
}

/** `result` as the form commits it onto `base`: all of it for a self-owned form, and for a parent-owned one only what
 * is its own, see `IS_OWNED_BY_FORM`
 *
 * @param base - The state the result is committed onto
 * @param result - The result of an operation
 * @returns - The state to commit
 */
function withOwned<T, S extends StrictRJSFSchema, F extends FormContextType>(
  base: FormState<T, S, F>,
  result: FormState<T, S, F>,
): FormState<T, S, F> {
  return base.isControlled ? withMembers<FormState<T, S, F>>(IS_OWNED_BY_FORM, base, result) : result;
}

/** Reports to the consumer for the model, and knows whether the form is attached. Its layout Effects are disconnected
 * while an `<Activity>` hides it as well as once it has unmounted, and have yet to connect when it is first rendered,
 * which inside a hidden `<Activity>` they do only once it is shown. Operations still apply then, but what they would
 * tell the consumer waits until the Effects connect, as React asks of a hidden component; an unmounted form never
 * reconnects, so what it would report is dropped instead: held, each report would keep the state it describes alive
 * for as long as the consumer keeps the handle.
 */
function createReporter<Props>(getLatestProps: () => Props) {
  let detached = true;
  let unmounted = false;
  let held: ((latest: Props) => void)[] = [];
  /** A report that is held while the form is detached, and otherwise made through `call` */
  const whenAttached =
    (call: (deliver: () => void) => void): Report<Props> =>
    (callback) => {
      if (!detached) {
        call(() => callback(getLatestProps()));
      } else if (!unmounted) {
        held.push(callback);
      }
    };
  /** For a report whose caller already holds the answer, which is dropped rather than held while detached */
  const reportIfAttached: Report<Props> = (callback) => {
    if (!detached) {
      callback(getLatestProps());
    }
  };
  return {
    isDetached: () => detached,
    /** Calls back directly, so a throw reaches the caller of the handle method that reports */
    reportToCaller: whenAttached((deliver) => deliver()),
    reportIfAttached,
    /** For a field, which may be reporting from inside React's commit phase, see `Report` */
    reportFromField: whenAttached(callWithDeferredThrow),
    /** Reports what was held, from a layout Effect: the handle call that made each report has long returned */
    attach: () => {
      detached = false;
      const reports = held;
      held = [];
      reports.forEach((callback) => callWithDeferredThrow(() => callback(getLatestProps())));
    },
    detach: () => {
      detached = true;
    },
    /** The setup of an insertion Effect, which, unlike a layout Effect, React leaves connected while an `<Activity>`
     * hides the form. Its cleanup is therefore the form unmounting, which releases what was held for a show that
     * will not come.
     */
    mount: () => {
      unmounted = false;
      return () => {
        unmounted = true;
        held = [];
      };
    },
  };
}

/** The model holds the form's state between renders and performs every operation on it. An operation starts from the
 * current state, which for a parent-owned form carries the data the last commit rendered, or from a proposal made since
 * React last rendered the form (see `pending`), which it builds on as if the parent had accepted it. It reads the props
 * and the state once, as it starts, so that everything it computes belongs to one moment. The consumer's callbacks
 * are not its to read: a report is handed the props to call, see `Report`.
 *
 * Internal to `@rjsf/core`: `package.json` excludes `./lib/components/formModel.js` from the `./lib/*.js` exports
 * wildcard so it can't be deep-imported, since a reachable subpath would have to keep working until the next major.
 */
export function createFormModel<T, S extends StrictRJSFSchema, F extends FormContextType>(
  initialProps: FormProps<T, S, F>,
  initial: FormState<T, S, F>,
) {
  let formElement: HTMLElement | null = null;
  // The props of the last committed render, and the state it showed
  let committedProps = initialProps;
  let shown = initial;
  // The form's one current state: `shown`, or what an operation has made of it since. React subscribes to `snapshot`,
  // a record of the state that is made anew whenever an operation changes the state or proposes. A commit stores the
  // state its render derived (a new registry, live validation of a controlled value) without a new record: that state
  // is already on screen, and a new one would make `useSyncExternalStore` render and commit a second time.
  // `operations` counts the commits that changed the state, so that a record made for a proposal alone, which has the
  // form render but changes nothing, is not taken for one that carries a newer state.
  let state = initial;
  let operations = 0;
  let snapshot = { state, operations };
  const listeners = new Set<() => void>();
  const notify = () => {
    snapshot = { state, operations };
    listeners.forEach((listener) => listener());
  };
  const { isDetached, reportToCaller, reportIfAttached, reportFromField, attach, detach, mount } = createReporter(
    () => committedProps,
  );
  // A parent-owned form's last proposal, until React commits a render of the form made with the consumer told of it
  // (see `committed()`). Edits made before then (two fields setting a value from mount Effects, several
  // `setFieldValue()` calls in one event) build on it, as they would if the parent had already accepted it; that commit
  // returns to the value the parent chose. Every proposal makes a new `snapshot`, so a parent that refuses one, and does
  // not render, still has the form render and drop it. `epoch` counts those returns, so a field's own record of a
  // proposal it made is dropped with it.
  let pending: FormState<T, S, F> | undefined;
  let epoch = 0;
  const propose = (next: FormState<T, S, F>) => {
    // `commit()` freezes self-owned data; a proposal never reaches it
    if (isDevelopment) {
      freezeFormData(next.formData);
    }
    pending = next;
    notify();
  };
  // A `submit()` waiting for the commit that lets it through, see `submitWhenRendered()`
  let isSubmitQueued = false;
  /** Performs a queued `submit()` through the DOM, see `FormRef.submit()`, once the form is shown and its inputs show
   * the data it submits: a form hidden by an `<Activity>` has no element to submit through, and native constraint
   * validation reads the inputs. Until then the submit stays queued for the next commit.
   */
  const submitWhenRendered = () => {
    if (!isSubmitQueued || isDetached() || state.formData !== shown.formData) {
      return;
    }
    isSubmitQueued = false;
    if (formElement) {
      const event = new CustomEvent('submit', { cancelable: true });
      event.preventDefault();
      formElement.dispatchEvent(event);
      if (formElement instanceof HTMLFormElement) {
        formElement.requestSubmit();
      }
    }
  };

  /** Stores the result of an operation that started from `start`, and returns what was stored. A reentrant operation
   * may have committed since the operation started; `reapply` then applies it again on top of that.
   */
  const commit = (
    start: FormState<T, S, F>,
    next: FormState<T, S, F>,
    reapply: (base: FormState<T, S, F>) => FormState<T, S, F>,
  ) => {
    const base = state;
    const committed = replaceEqualDeep(base, withOwned(base, base === start ? next : reapply(base)));
    if (isDevelopment && !committed.isControlled) {
      freezeFormData(committed.formData);
    }
    if (committed !== base) {
      state = committed;
      operations += 1;
      // An unanswered proposal carries the form's own members too, and a later edit in the tick builds on it, so it
      // would otherwise commit the proposal's older copy back over this one
      if (pending) {
        pending = withOwned(pending, committed);
      }
      notify();
    }
    return committed;
  };

  /** Proposes `next` with a validation owed: the render that answers the proposal validates whatever data the parent
   * renders (see `isBlurValidationOwed`). The state carries the debt for that render to read, the proposal for a later
   * edit in the tick, which builds on it, to keep.
   */
  const proposeOwingValidation = (start: FormState<T, S, F>, next: FormState<T, S, F>) => {
    const owe = (base: FormState<T, S, F>): FormState<T, S, F> => ({ ...base, isBlurValidationOwed: true });
    commit(start, owe(start), owe);
    propose(owe(next));
  };

  /** `formData` without the fields the schema does not describe, when `omitExtraData` asks for it: what a submit and
   * `validateForm()` act on
   */
  const withExtraDataOmitted = (props: OperationProps<T, S, F>, start: FormState<T, S, F>, formData: T | undefined) =>
    props.omitExtraData === true ? start.schemaUtils.omitExtraData(start.schema, formData) : formData;

  /** Attempts to focus on the field associated with the `error`. Uses the `property` field to compute path of the error
   * field, then, using the `idPrefix` and `idSeparator` converts that path into an id. Then the input element with that
   * id is attempted to be found in the form element. If it is located, then it is focused.
   *
   * @param error - The error on which to focus
   */
  const focusOnError = (error: RJSFValidationError) => {
    const { idPrefix = 'root', idSeparator = '_' } = committedProps;
    const { property } = error;
    const path = toPath(property ?? '');
    // The id of the root element is the idPrefix, so prepend it to the path
    path.unshift(idPrefix);

    const elementId = path.join(idSeparator);
    if (!formElement) {
      return;
    }
    const named = formElement instanceof HTMLFormElement ? formElement.elements.namedItem(elementId) : null;
    // if not an exact match, try finding a focusable element starting with the element id (like radio buttons or
    // checkboxes); some themes (e.g. shadcn) use button elements instead of native inputs for radio groups
    const found = named ?? formElement.querySelector(`input[id^="${elementId}"], button[id^="${elementId}"]`);
    const field = found instanceof RadioNodeList ? found.item(0) : found;
    if (field instanceof HTMLElement) {
      field.focus();
    }
  };

  /** Validates `formData` for a submission or a programmatic validation, committing the errors it reports and calling
   * `onError` with them, or focusing the first one when `focusOnFirstError` asks for it. The data itself is never
   * installed.
   *
   * @param props - The props the operation started with
   * @param start - The state the operation started from
   * @param formData - The form data to validate
   * @param report - How the errors are reported; the caller knows whether anything else tells the consumer
   * @returns - True if the form is valid, false otherwise.
   */
  const runValidation = (
    props: OperationProps<T, S, F>,
    start: FormState<T, S, F>,
    formData: T | undefined,
    report: Report<FormProps<T, S, F>>,
  ): boolean => {
    const { hasError, next } = applyValidation(start, props, formData);
    const { errors } = next;
    if (next !== start) {
      commit(start, next, (base) => applyValidation(base, props, formData).next);
    }
    if (!hasError) {
      return true;
    }
    report((latest) => {
      const { focusOnFirstError, onError } = latest;
      if (focusOnFirstError) {
        if (typeof focusOnFirstError === 'function') {
          focusOnFirstError(errors[0]);
        } else {
          focusOnError(errors[0]);
        }
      }
      if (onError) {
        onError(errors);
      } else {
        // oxlint-disable-next-line no-console
        console.error('Form validation failed', errors);
      }
    });
    return false;
  };

  /** Applies a change to the field at `fieldPath` with `applyChange()`, and does with the result the one thing that
   * differs between the two owners. A self-owned form commits it and reports it through `onChange`. A parent-owned form
   * calls `onChange` with the result as a proposal and commits only what it owns itself: the custom errors and the
   * errors that go with them. Either way `onChange` is called before this returns, through `report`.
   *
   * @param newValue - The new value at `fieldPath`
   * @param fieldPath - The `FieldPath` of the change at which to set the formData
   * @param [newErrorSchema] - The new `ErrorSchema` based on the field change
   * @param [id] - The id of the field that caused the change
   * @param [report] - How `onChange` is called
   */
  const change = (
    newValue: T | undefined,
    fieldPath: FieldPath,
    newErrorSchema?: ErrorSchema<T>,
    id?: string,
    report = reportToCaller,
  ) => {
    const props: OperationProps<T, S, F> = committedProps;
    const start = state;
    const edit: PendingChange<T> = { newValue, fieldPath, newErrorSchema };
    const next = applyChange(pending ?? start, edit, props);
    if (!start.isControlled) {
      // A reentrant operation may have committed while this one was being calculated, so report what was committed
      const committed = commit(start, next, (base) => applyChange(base, edit, props));
      report((latest) => latest.onChange?.(toIChangeEvent(committed), id));
      return;
    }
    // Validated errors describe the proposal, which the parent may yet refuse, so they wait for the parent's answer
    // in `deriveState()`; without live validation they describe the committed data plus the custom errors, which
    // are the form's own
    const owned = (result: FormState<T, S, F>, base: FormState<T, S, F>) =>
      isLiveValidated(props) ? { ...base, customErrors: result.customErrors } : result;
    // Committed before the parent is told, so a throwing handler cannot lose the errors the form owns
    commit(start, owned(next, start), (base) => owned(applyChange(base, edit, props), base));
    propose(next);
    report((latest) => latest.onChange?.(toIChangeEvent(next), id));
  };

  /** What a blurred field does to the form, after the `Form`'s `onBlur`: any live validation and live omit that the
   * flags ask for on blur, on current model data for a self-owned form, or for a parent-owned form on the committed
   * props or a proposal made earlier in the same tick. For a parent-owned form an omission is a proposal like any
   * other: it goes to `onChange` and is not rendered until the parent hands it back. The errors the blur found are the
   * form's own and are committed, with one exception: errors found for a proposal the parent has not answered describe
   * data that may never be rendered, so they are not committed, and the form owes the render that answers the proposal
   * a validation instead.
   *
   * @param id - The unique `id` of the field that was blurred
   */
  const blur = (id: string) => {
    const props: OperationProps<T, S, F> = committedProps;
    const start = state;
    const { omitExtraData, liveOmit } = props;
    if (!((omitExtraData === true && liveOmit === 'onBlur') || isBlurValidated(props))) {
      return;
    }
    const editBase = pending ?? start;
    // Shared so an unchanged error list keeps its reference and does not count as a change below
    const applyTo = (base: FormState<T, S, F>) => replaceEqualDeep(base, applyBlur(base, props));
    const next = applyTo(editBase);
    // Only the `IChangeEvent` members count; the validator's own results are not among them
    const hasChanges = (['formData', 'errors', 'errorSchema'] as const).some((key) => editBase[key] !== next[key]);
    if (!start.isControlled) {
      const committed = commit(start, next, applyTo);
      if (hasChanges) {
        reportFromField((latest) => latest.onChange?.(toIChangeEvent(committed), id));
      }
      return;
    }
    if (pending && isBlurValidated(props)) {
      // The proposal goes on with the blur's data, without the errors found for it
      proposeOwingValidation(start, { ...pending, formData: next.formData });
    } else {
      // A blur that only omitted extra data from an unanswered proposal has no errors of its own to commit
      if (!pending) {
        commit(start, next, applyTo);
      }
      if (hasChanges) {
        propose(next);
      }
    }
    if (hasChanges) {
      reportFromField((latest) => latest.onChange?.(toIChangeEvent(next), id));
    }
  };

  /** Validates and submits the owner's data, keeping omitted data for a self-owned form. Parent-owned submissions do
   * not install data the parent has not accepted.
   */
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (event.target !== event.currentTarget) {
      return;
    }
    const props: OperationProps<T, S, F> = committedProps;
    const start = state;
    // oxlint-disable-next-line typescript/no-deprecated
    const { noValidate } = props;
    const formData = withExtraDataOmitted(props, start, start.formData);
    // The errors are all a submit has to say, so they are held while the form is hidden, as `onChange` is
    if (!noValidate && !runValidation(props, start, formData, reportToCaller)) {
      return;
    }
    // There are no errors generated through schema validation, so only the user-provided ones are shown
    const next = applySubmit(start, props, formData);
    commit(start, next, (base) => applySubmit(base, props, withExtraDataOmitted(props, start, base.formData)));
    reportToCaller((latest) => latest.onSubmit?.(toIChangeEvent(next, 'submitted'), event));
  };

  const handle: FormRef<T> = {
    getFormData: () => toEventFormData(state.formData),

    submit: () => {
      isSubmitQueued = true;
      submitWhenRendered();
    },

    /** Resets the form, see `FormRef.reset()`. A self-owned form re-derives its data from `initialFormData` and the
     * schema the way an initial render does, clears every error and tells `onChange`. A parent-owned form clears its
     * own errors only: the data is the parent's to reset, by passing a new `formData`, so nothing is proposed and
     * `onChange` is not called. `extraErrors` are the parent's too and stay.
     */
    reset: () => {
      const props: OperationProps<T, S, F> = committedProps;
      const start = state;
      if (start.isControlled) {
        // `deriveState()` merges `extraErrors` back onto the cleared errors before the render
        const clear = (base: FormState<T, S, F>): FormState<T, S, F> => ({
          ...base,
          errors: [],
          errorSchema: {},
          schemaValidationErrors: [],
          schemaValidationErrorSchema: {},
          customErrors: undefined,
          isBlurValidationOwed: false,
        });
        commit(start, clear(start), clear);
        return;
      }
      const committed = commit(start, applyReset(start, props), (base) => applyReset(base, props));
      // A reset replaces whatever a parent holds with the reset data
      reportToCaller((latest) => latest.onChange?.(toIChangeEvent(committed)));
    },

    /** Sets the value of the field at `fieldPath`, see `FormRef.setFieldValue()`. The dotted form splits on `.`
     * only, so it cannot express an array index as a number or a property name containing a dot. Pass a
     * `FieldPathList` for either: an item of an array wants the numeric index, since that is what makes a cleared item
     * resolve to `null` rather than `undefined`.
     */
    setFieldValue: (fieldPath: string | FieldPathList, newValue?: unknown) => {
      let path = fieldPath;
      if (typeof path === 'string') {
        // `''` is the documented spelling of the root; splitting it would name a property called `''` instead
        path = path === '' ? [] : path.split('.');
      }
      const targetFieldPath = fieldPathFromList(path);
      change(
        asFieldValue<T>(newValue),
        targetFieldPath,
        undefined,
        fieldPathToId(targetFieldPath, state.registry.globalFormOptions),
      );
    },

    // The two validations hand their answer back, so on a detached form they drop the errors instead of holding them
    // until the form is shown, when they could describe data that has changed since
    validateForm: () => {
      const props: OperationProps<T, S, F> = committedProps;
      const start = state;
      return runValidation(props, start, withExtraDataOmitted(props, start, start.formData), reportIfAttached);
    },

    validateFormWithFormData: (formData?: T) => runValidation(committedProps, state, formData, reportIfAttached),

    validate: (formData: T | undefined) => validateFormData(committedProps, state, formData),

    focusOnError,
  };

  /** The latest value at `path`: a self-owned edit or a pending proposal, else the rendered data */
  const readLatest = <V>(key: 'formData' | 'errorSchema', path: FieldPath) =>
    getAt<V>((pending ?? state)[key], fieldPathToList(path));
  return {
    setFormElement: (element: HTMLElement | null) => {
      formElement = element;
    },
    epoch: () => epoch,
    /** Has the form render for a field's record of a proposal, see `FormDataAccess.proposing()`, unless sending the
     * proposal had the form render already: one that reached the form, as an operation or as a proposal of its own,
     * made a new `snapshot`
     */
    proposing: () => {
      const before = snapshot;
      return () => {
        if (snapshot === before) {
          notify();
        }
      };
    },
    readField: <D>(path: FieldPath) => readLatest<D>('formData', path),
    readErrors: <E>(path: FieldPath) => readLatest<E>('errorSchema', path),
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    /** Called from an insertion Effect of every commit of the form, with what React rendered. React runs those before
     * the setup of any layout Effect, and whether or not an `<Activity>` hides the form, so an Effect of the same commit
     * that issues a command, and a handle retained from a hidden form, find the props and the state of this commit.
     */
    committed: (nextProps: FormProps<T, S, F>, derived: FormState<T, S, F>, renderedSnapshot: typeof snapshot) => {
      committedProps = nextProps;
      shown = derived;
      // An operation that committed after this render began is not in `derived`. A render for it is already scheduled;
      // until it runs, operations start from that commit derived under the new props
      state =
        snapshot.operations === renderedSnapshot.operations
          ? derived
          : replaceEqualDeep(derived, deriveState(nextProps, state));
      // The commit answers the proposal the consumer was told of, unless its render is not the latest: a field React
      // removes or cleans up in this commit does so before this runs, and a proposal it makes then is one no render
      // has answered, so it waits for the render it scheduled. A detached form has yet to tell the consumer of any
      if (!isDetached() && snapshot === renderedSnapshot) {
        pending = undefined;
        epoch += 1;
      }
    },
    /** The setup of a layout Effect, which React runs when the form mounts and when an `<Activity>` shows it again:
     * reports what was held meanwhile.
     */
    attach: () => {
      const isProposalHeld = pending !== undefined;
      attach();
      // The consumer has only now heard of the proposal, so it takes another render to answer it
      if (isProposalHeld) {
        notify();
      }
    },
    /** The cleanup of that Effect, which React runs when an `<Activity>` hides the form as well as when it unmounts */
    detach,
    mount,
    submitWhenRendered,
    handle,
    handleSubmit,
    handleChange: (value: T | undefined, path: FieldPath, errors?: ErrorSchema<T>, id?: string) =>
      change(value, path, errors, id, reportFromField),
    handleBlur: (id: string, data: unknown) => {
      // Before the blur reads the state, so it validates an edit `onBlur` makes instead of reverting it
      reportFromField((latest) => latest.onBlur?.(id, data));
      blur(id);
    },
    handleFocus: (id: string, data: unknown) => reportFromField((latest) => latest.onFocus?.(id, data)),
  };
}
