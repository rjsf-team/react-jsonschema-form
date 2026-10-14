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
  deepEquals,
  propertyToPath,
  ROOT_FIELD_PATH,
  replaceEqualDeep,
  fieldPathFromList,
  fieldPathToId,
  fieldPathToList,
} from '@rjsf/utils';

import type { FormProps, FormState } from './Form.tsx';
import type { FormRef } from './FormRef.ts';
import type { AnnouncedMove } from './formState.ts';
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
  toEventFormData,
  toIChangeEvent,
  validateFormData,
} from './formState.ts';

/** How a report reaches the consumer's callback: a handle method calls it directly, so a throw reaches the method's
 * caller, while a field, which may report from an Effect inside React's commit phase, where a throw from the
 * consumer's callback would unmount the form, has it made through `callWithDeferredThrow()`
 */
type Deliver = (report: () => void) => void;
const deliverToCaller: Deliver = (report) => report();

/** The model holds the form's state between renders and performs every operation on it. An operation starts from the
 * current state and reads the props once, as it starts, so that everything it computes and reports belongs to one
 * moment.
 *
 * Internal to `@rjsf/core`: `package.json` excludes `./lib/components/formModel.js` from the `./lib/*.js` exports
 * wildcard so it can't be deep-imported, since a reachable subpath would have to keep working until the next major.
 */
export function createFormModel<T, S extends StrictRJSFSchema, F extends FormContextType>(
  initialProps: FormProps<T, S, F>,
  initial: FormState<T, S, F>,
) {
  let formElement: HTMLElement | null = null;
  // The props of the last committed render
  let committedProps = initialProps;
  // The form's one current state: what the last commit derived from the props, or what an operation has made of it
  // since. React subscribes to `published`, the state as of the last operation. A commit hands over the state its
  // render derived (a new registry, live validation of replaced data) without publishing it: that state is already on
  // screen, and a new snapshot would make `useSyncExternalStore` render and commit a second time.
  let state = initial;
  let published = initial;
  const listeners = new Set<() => void>();
  const notify = () => {
    published = state;
    listeners.forEach((listener) => listener());
  };
  // The key move of the change a field is sending, see `FormDataAccess.sendMove()`
  let announced: AnnouncedMove | undefined;
  // A change that reaches a form after it unmounted is dropped: a draft a widget flushes from an Effect cleanup, a
  // timer or a file read that finishes late, or a call through a handle kept past the unmount. Reported through the
  // `onChange` of the last render, it would be stored as the data of whichever form replaced this one
  let isUnmounted = false;
  // Development only, for the warning about a `formData` passed after mount, which the form ignores: the prop as the
  // last commit passed it, and every object the form's data has been, since a parent that stores what `onChange`
  // reported passes those back, later ones as well as the latest
  let lastFormDataProp = initialProps.formData;
  const heldData = new WeakSet<object>();
  let isIgnoredFormDataWarned = false;
  const hold = (data: unknown) => {
    if (isDevelopment && typeof data === 'object' && data !== null) {
      heldData.add(data);
    }
  };
  hold(initial.formData);

  /** Stores the result of an operation, shared against the current state so an unchanged member keeps the reference
   * the fields hold, and publishes it when it changed. Returns what was stored.
   */
  const commit = (next: FormState<T, S, F>) => {
    const committed = replaceEqualDeep(state, next);
    if (isDevelopment) {
      freezeFormData(committed.formData);
    }
    if (committed !== state) {
      state = committed;
      hold(state.formData);
      notify();
    }
    return committed;
  };

  /** Runs `apply` on the current state and returns its result. A function of the consumer's that `apply` calls, such as
   * `customValidate`, may issue an operation of its own, which commits before `apply` returns; `apply` then runs once
   * more on top of that, so the result does not put back the data from before the nested operation.
   */
  const settled = <R>(apply: (base: FormState<T, S, F>) => R): R => {
    const start = state;
    const result = apply(start);
    return state === start ? result : apply(state);
  };

  /** The form's data without the fields the schema does not describe, when `omitExtraData` asks for it: what a submit
   * and `validateForm()` act on
   */
  const withExtraDataOmitted = (props: FormProps<T, S, F>) =>
    props.omitExtraData === true ? state.schemaUtils.omitExtraData(state.schema, state.formData) : state.formData;

  /** The window of the form element, whose classes the element and what it holds are instances of: a form rendered
   * into another document, such as an iframe's, is no instance of this window's `HTMLFormElement`
   */
  const formWindow = () => formElement?.ownerDocument.defaultView;

  /** Attempts to focus on the field associated with the `error`. Uses the `property` field to compute path of the error
   * field, then, using the `idPrefix` and `idSeparator` converts that path into an id. Then the input element with that
   * id is attempted to be found in the form element. If it is located, then it is focused.
   *
   * @param error - The error on which to focus
   */
  const focusOnError = (error: RJSFValidationError) => {
    const { idPrefix = 'root', idSeparator = '_' } = committedProps;
    const { property } = error;
    const path = propertyToPath(property);
    // The id of the root element is the idPrefix, so prepend it to the path
    path.unshift(idPrefix);

    const elementId = path.join(idSeparator);
    const view = formWindow();
    if (!formElement || !view) {
      return;
    }
    const named = formElement instanceof view.HTMLFormElement ? formElement.elements.namedItem(elementId) : null;
    // if not an exact match, try finding a focusable element starting with the element id (like radio buttons or
    // checkboxes); some themes (e.g. shadcn) use button elements instead of native inputs for radio groups
    const found = named ?? formElement.querySelector(`input[id^="${elementId}"], button[id^="${elementId}"]`);
    const field = found instanceof view.RadioNodeList ? found.item(0) : found;
    if (field instanceof view.HTMLElement) {
      field.focus();
    }
  };

  /** Validates the data `readFormData` returns for a submission or a programmatic validation, committing the errors it
   * reports and calling `onError` with them, or focusing the first one when `focusOnFirstError` asks for it. The data
   * itself is never installed. A form that has unmounted only answers: the errors have no form to show them, and
   * `onError` would be the last render's, as a change's `onChange` would be.
   *
   * @param props - The props the operation started with
   * @param readFormData - Returns the form data to validate; read again when the validation runs again, see `settled()`
   * @returns - True if the form is valid, false otherwise.
   */
  const runValidation = (props: FormProps<T, S, F>, readFormData: () => T | undefined): boolean => {
    const { hasError, next } = settled((base) => applyValidation(base, props, readFormData()));
    if (isUnmounted) {
      return !hasError;
    }
    const { errors } = commit(next);
    if (!hasError) {
      return true;
    }
    const { focusOnFirstError, onError } = props;
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
    return false;
  };

  /** `change` applied to `base`, then, when the consumer's `transformChange` returns other data than the change left,
   * that data written over the whole form with no key move, so its errors, live validation and row pairing describe
   * the data the form keeps. Pure, as `settled()` asks: it may run again on a newer base.
   */
  const applyEdit = (
    base: FormState<T, S, F>,
    change: Parameters<typeof applyChange<T, S, F>>[1],
    props: FormProps<T, S, F>,
  ) => {
    const next = applyChange(base, change, props);
    const { transformChange } = props;
    if (!transformChange) {
      return next;
    }
    const transformed = transformChange(next.formData, base.formData);
    return Object.is(transformed, next.formData)
      ? next
      : applyChange(next, { newValue: transformed, fieldPath: ROOT_FIELD_PATH }, props);
  };

  /** Applies a change to the field at `fieldPath` with `applyChange()`, commits the result and reports it through
   * `onChange`, which is called before this returns, the way `deliver` says.
   *
   * @param newValue - The new value at `fieldPath`
   * @param fieldPath - The `FieldPath` of the change at which to set the formData
   * @param [newErrorSchema] - The new `ErrorSchema` based on the field change
   * @param [id] - The id of the field that caused the change
   * @param [deliver] - How `onChange` is called
   */
  const change = (
    newValue: T | undefined,
    fieldPath: FieldPath,
    newErrorSchema?: ErrorSchema<T>,
    id?: string,
    deliver: Deliver = deliverToCaller,
  ) => {
    if (isUnmounted) {
      return;
    }
    const props = committedProps;
    // Taken by the change it was announced for, so a second change at the path moves nothing again
    const move = announced?.fieldPath === fieldPath ? announced : undefined;
    if (move) {
      announced = undefined;
    }
    const committed = commit(
      settled((base) =>
        applyEdit(
          base,
          {
            newValue,
            fieldPath,
            newErrorSchema,
            newKeyOf: move?.newKeyOf,
            newOwnKeyOf: move?.newOwnKeyOf,
            dropsOwnErrors: move?.dropsOwnErrors,
          },
          props,
        ),
      ),
    );
    deliver(() => props.onChange?.(toIChangeEvent(committed), id));
  };

  /** What a blurred field does to the form, after the `Form`'s `onBlur`: any live validation and live omit that the
   * flags ask for on blur, reported through `onChange` when they changed what an `IChangeEvent` carries.
   *
   * @param id - The unique `id` of the field that was blurred
   */
  const blur = (id: string) => {
    const props = committedProps;
    const { omitExtraData, liveOmit } = props;
    if (isUnmounted || !((omitExtraData === true && liveOmit === 'onBlur') || isBlurValidated(props))) {
      return;
    }
    const start = state;
    const committed = commit(settled((base) => applyBlur(base, props)));
    // Only the `IChangeEvent` members count; the validator's own results are not among them
    if ((['formData', 'errors', 'errorSchema'] as const).some((key) => start[key] !== committed[key])) {
      callWithDeferredThrow(() => props.onChange?.(toIChangeEvent(committed), id));
    }
  };

  /** Validates and submits the form's data, with extra data omitted when `omitExtraData` asks for it */
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (event.target !== event.currentTarget) {
      return;
    }
    const props = committedProps;
    // oxlint-disable-next-line typescript/no-deprecated
    const { noValidate } = props;
    if (!noValidate && !runValidation(props, () => withExtraDataOmitted(props))) {
      return;
    }
    // There are no errors generated through schema validation, so only the user-provided ones are shown
    const committed = commit(settled((base) => applySubmit(base, props, withExtraDataOmitted(props))));
    props.onSubmit?.(toIChangeEvent(committed, 'submitted'), event);
  };

  const handle: FormRef<T> = {
    getFormData: () => toEventFormData(state.formData),

    /** Submits through the form element, see `FormRef.submit()`: native constraint validation reads the inputs, and
     * the submit event it dispatches reaches `handleSubmit()`, which submits the data the form holds
     */
    submit: () => {
      const view = formWindow();
      if (view && formElement instanceof view.HTMLFormElement) {
        formElement.requestSubmit();
      }
    },

    /** Resets the form, see `FormRef.reset()`: re-derives its data from the props the way an initial render does,
     * clears every error and tells `onChange`. `extraErrors` are the props' and stay.
     */
    reset: () => {
      if (isUnmounted) {
        return;
      }
      const props = committedProps;
      const committed = commit(settled((base) => applyReset(base, props)));
      props.onChange?.(toIChangeEvent(committed));
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

    validateForm: () => {
      const props = committedProps;
      return runValidation(props, () => withExtraDataOmitted(props));
    },

    validateFormWithFormData: (formData?: T) => runValidation(committedProps, () => formData),

    validate: (formData: T | undefined) => validateFormData(committedProps, state, formData),

    focusOnError,
  };

  return {
    /** The callback ref of the form element. React detaches it, with `null`, while an `<Activity>` hides the form as
     * well as when the form unmounts; the element lives on through the former, so it is kept until the next one
     * replaces it. A `requestSubmit()` on an element that has left the document does nothing, so a `submit()` through
     * a handle kept past the unmount is harmless.
     */
    setFormElement: (element: HTMLElement | null) => {
      if (element) {
        formElement = element;
      }
    },
    sendMove: (move: AnnouncedMove, send: () => void) => {
      announced = move;
      try {
        send();
      } finally {
        if (announced === move) {
          announced = undefined;
        }
      }
    },
    /** The latest value at `path`: an edit made since the form last rendered included */
    readField: <D>(path: FieldPath) => getAt<D>(state.formData, fieldPathToList(path)),
    getSnapshot: () => published,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    /** The setup of the insertion Effect that tells the model the form is mounted; what it returns is the cleanup.
     * React runs that cleanup when the form unmounts and not when an `<Activity>` hides it, which destroys layout and
     * passive Effects only, so a hidden form goes on taking changes. It runs before the cleanup of any Effect below
     * the form, so a change a field makes as it unmounts with the form is already one made after the unmount.
     */
    mounted: () => {
      isUnmounted = false;
      return () => {
        isUnmounted = true;
      };
    },
    /** Called from an insertion Effect of every commit of the form, with what React rendered. React runs those before
     * the setup of any layout Effect, so an Effect of the same commit that issues a command finds the props and the
     * state of this commit.
     */
    committed: (nextProps: FormProps<T, S, F>, derived: FormState<T, S, F>, renderedPublished: FormState<T, S, F>) => {
      committedProps = nextProps;
      if (published === renderedPublished) {
        state = derived;
        hold(state.formData);
        return;
      }
      // An operation that committed after this render began is not in `derived`. A render for it is already
      // scheduled; until it runs, operations start from its commit derived under the new props
      state = replaceEqualDeep(derived, deriveState(nextProps, state));
      hold(state.formData);
    },
    /** Warns, once, that the `formData` prop changed after mount to a value the form ignores: neither data it has held
     * nor a copy of the data it holds. Called after the commit that passed it, in development only
     */
    warnIfFormDataIgnored: (formData: T | undefined) => {
      if (Object.is(formData, lastFormDataProp)) {
        return;
      }
      lastFormDataProp = formData;
      const isHeld = typeof formData === 'object' && formData !== null && heldData.has(formData);
      if (isIgnoredFormDataWarned || formData === undefined || isHeld || deepEquals(formData, state.formData)) {
        return;
      }
      isIgnoredFormDataWarned = true;
      // oxlint-disable-next-line no-console
      console.warn(
        "Form: `formData` changed after the form mounted and was ignored. Like `initialFormData`, it seeds the form on mount and on `reset()` only, and the form owns its data after that. To show other data, remount the form with a `key`, or call `setFieldValue('', data)` on its ref.",
      );
    },
    handle,
    handleSubmit,
    handleChange: (value: T | undefined, path: FieldPath, errors?: ErrorSchema<T>, id?: string) =>
      change(value, path, errors, id, callWithDeferredThrow),
    handleBlur: (id: string, data: unknown) => {
      const props = committedProps;
      // Before the blur reads the state, so it validates an edit `onBlur` makes instead of reverting it
      callWithDeferredThrow(() => props.onBlur?.(id, data));
      blur(id);
    },
    handleFocus: (id: string, data: unknown) => {
      const props = committedProps;
      callWithDeferredThrow(() => props.onFocus?.(id, data));
    },
  };
}
