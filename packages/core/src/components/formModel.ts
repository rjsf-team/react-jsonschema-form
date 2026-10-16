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
import type { AnnouncedMove, FieldChange, MoveOutcome } from './formState.ts';
import {
  applyBlur,
  applyChangeToData,
  applyChangeToErrorsOf,
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

/** How an operation that calls the consumer's functions runs: a handle method runs it directly, so a throw reaches the
 * method's caller, while a field, which may report from an Effect inside React's commit phase, where a throw from the
 * consumer's `transformChange`, validation callbacks or `onChange` would unmount the form, runs it through
 * `callWithDeferredThrow()`
 */
type Deliver = (operation: () => void) => void;
const deliverToCaller: Deliver = (operation) => operation();

/** `value` as a quoted CSS string, for an attribute selector. An id is built from property names, which can hold a
 * quote, a backslash or a line break, such as an additional property's the user typed, any of which would otherwise
 * end the string or make the selector invalid
 */
function asCssString(value: string) {
  const escaped = value
    .replace(/["\\]/g, '\\$&')
    .replace(/[\n\r\f]/g, (character) => `\\${character.charCodeAt(0).toString(16)} `);
  return `"${escaped}"`;
}

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
  // What operations have made of the form: the store React subscribes to. A render derives what it shows from it and
  // the props, see `deriveState()`, and nothing a render derives is written back
  let published = initial;
  const listeners = new Set<() => void>();
  // What the last commit rendered: its props, the state it showed, and the store's state that state was derived from.
  // Recorded after the commit, so an operation can start from what is on screen
  let committedProps = initialProps;
  let rendered = initial;
  let renderedFrom = initial;
  // The props the store's state was derived under, by the operation that made it
  let publishedProps = initialProps;
  // The state an operation starts from, for the store's and the committed props' present values
  let derivedCache: { props: FormProps<T, S, F>; from: FormState<T, S, F>; state: FormState<T, S, F> } | undefined;
  // The key move of the change a field is sending, see `FormDataAccess.sendMove()`, and what became of the last change
  // that carried one
  let announced: AnnouncedMove | undefined;
  let moved: { move: AnnouncedMove; outcome: MoveOutcome } | undefined;
  // A form an `<Activity>` hides is detached as an unmounted one is, the way React asks of hidden content, and drops
  // what reaches it then: a draft a widget flushes from an Effect cleanup, a timer or a file read that finishes late,
  // or a call through a handle kept past the unmount. Reported through the `onChange` of the last render, it would be
  // stored as the data of whichever form replaced this one, or of a form the user cannot see
  let isDetached = false;
  // Development only, for the warning about a `formData` passed after mount, which the form ignores: the prop as the
  // last commit passed it, and every object the form's data has been, since a parent that stores what `onChange`
  // reported passes those back, later ones as well as the latest
  // oxlint-disable-next-line typescript/no-deprecated -- the form still reads the deprecated alias
  let lastFormDataProp = initialProps.formData;
  const heldData = new WeakSet<object>();
  let isIgnoredFormDataWarned = false;
  const hold = (data: unknown) => {
    if (isDevelopment && typeof data === 'object' && data !== null) {
      heldData.add(data);
    }
  };
  hold(initial.formData);
  // Development only, once per form: a handle call the form dropped because it was detached. A field's change, blur or
  // focus is dropped silently, since a widget flushing a draft from its Effect cleanup is expected to arrive then
  let isDroppedCallWarned = false;
  const warnDroppedCall = (method: string) => {
    if (!isDevelopment || isDroppedCallWarned) {
      return;
    }
    isDroppedCallWarned = true;
    // oxlint-disable-next-line no-console
    console.warn(
      `Form: \`${method}()\` was called on a form that is hidden by \`<Activity>\` or has unmounted, and was dropped. React asks that hidden content be treated as unmounted, so the form takes calls again once it is shown. See https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#a-form-inside-a-hidden-activity`,
    );
  };

  /** The form's current state, the one an operation starts from: the store's, under the props of the last commit, and
   * the state that commit rendered when the store has not changed since. Derived again only for an operation made
   * since that commit, and shared against what is on screen, so an unchanged member keeps the reference the fields
   * hold.
   */
  const current = (): FormState<T, S, F> => {
    if (published === renderedFrom) {
      return rendered;
    }
    // An operation's result is derived already, under the props it started from
    if (publishedProps === committedProps) {
      return published;
    }
    if (derivedCache?.props !== committedProps || derivedCache.from !== published) {
      const derived = deriveState(committedProps, published);
      derivedCache = {
        props: committedProps,
        from: published,
        state: derived === published ? published : replaceEqualDeep(rendered, derived),
      };
    }
    return derivedCache.state;
  };

  /** Stores the result of an operation, shared against the current state so an unchanged member keeps the reference
   * the fields hold, and publishes it when it changed. Returns what was stored.
   */
  const commit = (next: FormState<T, S, F>) => {
    const start = current();
    const committed = replaceEqualDeep(start, next);
    if (isDevelopment) {
      freezeFormData(committed.formData);
    }
    if (committed !== start) {
      published = committed;
      publishedProps = committedProps;
      hold(committed.formData);
      listeners.forEach((listener) => listener());
    }
    return committed;
  };

  /** Runs `apply` on the current state and returns its result. A function of the consumer's that `apply` calls, such as
   * `customValidate`, may issue an operation of its own, which commits before `apply` returns; `apply` then runs once
   * more on top of that, so the result does not put back the data from before the nested operation.
   */
  const settled = <R>(apply: (base: FormState<T, S, F>) => R): R => {
    const before = published;
    const result = apply(current());
    return published === before ? result : apply(current());
  };

  /** The form's data without the fields the schema does not describe, when `omitExtraData` asks for it: what a submit
   * and `validateForm()` act on
   */
  const withExtraDataOmitted = (props: FormProps<T, S, F>) =>
    props.omitExtraData === true
      ? current().schemaUtils.omitExtraData(current().schema, current().formData)
      : current().formData;

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
    const quotedId = asCssString(elementId);
    const found = named ?? formElement.querySelector(`input[id^=${quotedId}], button[id^=${quotedId}]`);
    const field = found instanceof view.RadioNodeList ? found.item(0) : found;
    if (field instanceof view.HTMLElement) {
      field.focus();
    }
  };

  /** Validates the data `readFormData` returns for a submission or a programmatic validation, committing the errors it
   * reports and calling `onError` with them, or focusing the first one when `focusOnFirstError` asks for it. The data
   * itself is never installed. A detached form only answers: the errors have no form to show them, and
   * `onError` would be the last render's, as a change's `onChange` would be.
   *
   * @param props - The props the operation started with
   * @param readFormData - Returns the form data to validate; read again when the validation runs again, see `settled()`
   * @returns - True if the form is valid, false otherwise.
   */
  const runValidation = (props: FormProps<T, S, F>, readFormData: () => T | undefined): boolean => {
    const { hasError, next } = settled((base) => applyValidation(base, props, readFormData()));
    if (isDetached) {
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

  /** `change` applied to `base`, with the data the consumer's `transformChange` decides on: the change's own, `base`
   * itself for a refused one, or other data, written over the whole form with no key move after the change's own
   * error moves. The data is decided before anything validates it, so live validation, `customValidate` and
   * `transformErrors` run once, on the data the form keeps. Pure, as `settled()` asks: it may run again on a newer base.
   *
   * @returns - The next state, and for a rewritten change the state the change alone would have left
   */
  const applyEdit = (
    base: FormState<T, S, F>,
    change: FieldChange<T>,
    props: FormProps<T, S, F>,
  ): { next: FormState<T, S, F>; edited?: FormState<T, S, F> } => {
    const isValidated = isLiveValidated(props);
    const edited = applyChangeToData(base, change, props);
    const returned = props.transformChange ? props.transformChange(edited.formData, base.formData) : edited.formData;
    if (Object.is(returned, edited.formData)) {
      return { next: applyChangeToErrorsOf(edited, base.formData, change, props, isValidated) };
    }
    if (Object.is(returned, base.formData)) {
      return { next: base };
    }
    // A copy of the data before the edit refuses it as that data itself does: shared against it, a copy comes back as
    // it, and the refusal is what undoes the key moves the edit announced. Anything else is shared against the edit's
    // data first, so a copy that changes nothing of the edit, as `{ ...next }` with a field already upper-cased is,
    // takes it in one walk rather than deriving the whole form's data a second time. Only a key move whose data equals
    // the data before it, such as two equal items swapped, needs the second walk to tell a refusal from a copy
    const transformed = replaceEqualDeep(edited.formData, returned);
    const isCopyOfEdit = Object.is(transformed, edited.formData);
    if ((!isCopyOfEdit || change.newKeyOf) && Object.is(replaceEqualDeep(base.formData, transformed), base.formData)) {
      return { next: base };
    }
    if (isCopyOfEdit) {
      return { next: applyChangeToErrorsOf(edited, base.formData, change, props, isValidated) };
    }
    // No field made the rewrite, so the errors the fields raised, the root's included, are carried through it as the
    // edit left them
    const path = fieldPathToList(change.fieldPath);
    const rewrite: FieldChange<T> = {
      newValue: transformed,
      fieldPath: ROOT_FIELD_PATH,
      keepsOwnErrors: true,
      // The edit's clear of a field outlives the defaults the rewrite merges in, as it outlives those the edit does (#5125)
      clearedPath: change.newValue === undefined && path.length > 0 ? path : undefined,
    };
    // Unvalidated, the change still moves its errors with the keys it moved and settles the fields' own errors, which
    // the rewrite then carries through its one validation
    const withEditErrors = applyChangeToErrorsOf(edited, base.formData, change, props, false);
    const rewritten = applyChangeToData(withEditErrors, rewrite, props);
    return { next: applyChangeToErrorsOf(rewritten, edited.formData, rewrite, props, isValidated), edited };
  };

  /** Applies a change to the field at `fieldPath` with `applyEdit()`, commits the result and reports it through
   * `onChange`, all run the way `deliver` says. A change that throws, from `transformChange` or a validation callback,
   * commits nothing, so the key move it carried is refused.
   *
   * @param newValue - The new value at `fieldPath`
   * @param fieldPath - The `FieldPath` of the change at which to set the formData
   * @param [newErrorSchema] - The new `ErrorSchema` based on the field change
   * @param [id] - The id of the field that caused the change
   * @param [deliver] - How the change runs
   */
  const change = (
    newValue: T | undefined,
    fieldPath: FieldPath,
    newErrorSchema?: ErrorSchema<T>,
    id?: string,
    deliver: Deliver = deliverToCaller,
  ) => {
    if (isDetached) {
      return;
    }
    const props = committedProps;
    // Taken by the change it was announced for, so a second change at the path moves nothing again
    const move = announced?.fieldPath === fieldPath ? announced : undefined;
    if (move) {
      announced = undefined;
      moved = { move, outcome: { kind: 'refused' } };
    }
    const path = fieldPathToList(fieldPath);
    deliver(() => {
      let edit: { isRefused: boolean; edited?: FormState<T, S, F> } = { isRefused: false };
      const committed = commit(
        settled((base) => {
          const { next, edited } = applyEdit(
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
          );
          // `applyEdit()` hands `base` itself back only for an edit `transformChange` refused
          edit = { isRefused: next === base, edited };
          return next;
        }),
      );
      if (move) {
        const kept = getAt<unknown>(committed.formData, path);
        let outcome: MoveOutcome = { kind: 'taken', kept };
        if (edit.isRefused) {
          outcome = { kind: 'refused' };
        } else if (edit.edited) {
          outcome = { kind: 'rewritten', kept, edited: getAt<unknown>(edit.edited.formData, path) };
        }
        moved = { move, outcome };
      }
      props.onChange?.(toIChangeEvent(committed), id);
    });
  };

  /** What a blurred field does to the form, after the `Form`'s `onBlur`: any live validation and live omit that the
   * flags ask for on blur, reported through `onChange` when they changed what an `IChangeEvent` carries.
   *
   * @param id - The unique `id` of the field that was blurred
   */
  const blur = (id: string) => {
    const props = committedProps;
    const { omitExtraData, liveOmit } = props;
    if (isDetached || !((omitExtraData === true && liveOmit === 'onBlur') || isBlurValidated(props))) {
      return;
    }
    const start = current();
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
    getFormData: () => toEventFormData(current().formData),

    /** Submits through the form element, see `FormRef.submit()`, whose submit event reaches `handleSubmit()`, which
     * submits the data the form holds. While the inputs show that data, the browser's constraint validation checks them
     * first, as for a submit button. While they have yet to show an edit, they describe data the form no longer holds,
     * so the submit event is dispatched without it, and schema validation alone checks the data
     */
    submit: () => {
      if (isDetached) {
        warnDroppedCall('submit');
        return;
      }
      const view = formWindow();
      if (!view || !(formElement instanceof view.HTMLElement)) {
        return;
      }
      // Only a `<form>` has `requestSubmit()`, and only inputs that show the stored data describe it, so an element
      // another `tagName` renders, or a form with an edit React has yet to show, gets a submit event dispatched to it
      // instead, which `handleSubmit()` takes without the browser's constraint validation
      if (formElement instanceof view.HTMLFormElement && current().formData === rendered.formData) {
        formElement.requestSubmit();
      } else {
        formElement.dispatchEvent(new view.SubmitEvent('submit', { bubbles: true, cancelable: true }));
      }
    },

    /** Resets the form, see `FormRef.reset()`: re-derives its data from the props the way an initial render does,
     * clears every error and tells `onChange`. `extraErrors` are the props' and stay.
     */
    reset: () => {
      if (isDetached) {
        warnDroppedCall('reset');
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
      if (isDetached) {
        warnDroppedCall('setFieldValue');
        return;
      }
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
        fieldPathToId(targetFieldPath, current().registry.globalFormOptions),
      );
    },

    validateForm: () => {
      const props = committedProps;
      return runValidation(props, () => withExtraDataOmitted(props));
    },

    validateFormWithFormData: (formData?: T) => runValidation(committedProps, () => formData),

    validate: (formData: T | undefined) => validateFormData(committedProps, current(), formData),

    focusOnError,
  };

  return {
    /** The callback ref of the form element. React detaches it, with `null`, while an `<Activity>` hides the form as
     * well as when the form unmounts, and attaches it again when the form is shown, so a handle kept past the unmount
     * does not hold the form's DOM
     */
    setFormElement: (element: HTMLElement | null) => {
      formElement = element;
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
      // `undefined` for a change that never reached the form at the move's path, which a custom parent field kept
      const outcome = moved?.move === move ? moved.outcome : undefined;
      moved = undefined;
      return outcome;
    },
    /** The latest value at `path`: an edit made since the form last rendered included */
    readField: <D>(path: FieldPath) => getAt<D>(current().formData, fieldPathToList(path)),
    getSnapshot: () => published,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    /** The setup of the layout Effect that attaches the form; what it returns is the cleanup. React runs that cleanup
     * when the form unmounts and when an `<Activity>` hides it, and React asks that hidden content be treated as
     * unmounted, so a hidden form drops what reaches it as an unmounted one does, until it is shown again.
     */
    attached: () => {
      isDetached = false;
      return () => {
        isDetached = true;
      };
    },
    /** Called from an insertion Effect of every commit of the form with what it rendered: its props, the state it
     * showed and the store's state that was derived from. React runs every insertion Effect of a commit before any of
     * its layout Effects, so a command from a layout Effect anywhere in the tree, an earlier sibling's or a widget's,
     * starts from that commit's props; a layout Effect would run after those and leave them the previous commit's.
     * Only recorded, for the operations that start from it; nothing is published, since the render already shows it.
     */
    committed: (nextProps: FormProps<T, S, F>, derived: FormState<T, S, F>, from: FormState<T, S, F>) => {
      committedProps = nextProps;
      rendered = derived;
      renderedFrom = from;
      derivedCache = undefined;
      hold(derived.formData);
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
      if (isIgnoredFormDataWarned || formData === undefined || isHeld || deepEquals(formData, current().formData)) {
        return;
      }
      isIgnoredFormDataWarned = true;
      // oxlint-disable-next-line no-console
      console.warn(
        "Form: `formData` changed after the form mounted and was ignored. Like `initialFormData`, it seeds the form on mount and on `reset()` only, and the form owns its data after that. To show other data, remount the form with a `key`, or call `setFieldValue('', data)` on its ref. See https://rjsf-team.github.io/react-jsonschema-form/docs/migration-guides/v7.x%20upgrade%20guide#show-other-data-after-mount",
      );
    },
    handle,
    handleSubmit,
    handleChange: (value: T | undefined, path: FieldPath, errors?: ErrorSchema<T>, id?: string) =>
      change(value, path, errors, id, callWithDeferredThrow),
    // A detached form drops a blur or a focus as it drops a change: its handlers are those of the last render
    handleBlur: (id: string, data: unknown) => {
      if (isDetached) {
        return;
      }
      const props = committedProps;
      // Before the blur reads the state, so it validates an edit `onBlur` makes instead of reverting it
      callWithDeferredThrow(() => props.onBlur?.(id, data));
      blur(id);
    },
    handleFocus: (id: string, data: unknown) => {
      if (isDetached) {
        return;
      }
      const props = committedProps;
      callWithDeferredThrow(() => props.onFocus?.(id, data));
    },
  };
}
