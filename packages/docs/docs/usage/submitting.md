# Submitting

When the form is submitted and its data are valid, `Form` calls your [`onSubmit`](../api-reference/form-props.md#onsubmit) with the validated data.
This page covers what happens while that submission is in flight, how `Form` fits React's form APIs, `useActionState` and `useFormStatus`, and how to tell whether the form holds changes that haven't been saved.

## A pending submission

When `onSubmit` returns a promise, the form ignores another submit until that promise settles, whether it comes from a submit button, from Enter pressed in a field or from `FormRef.submit()`. That is what TanStack Form's documented `disabled={!canSubmit}` submit button does in your app, built into the form; react-hook-form doesn't block a second submit. Meanwhile the submit button gets the `pending` prop, and the form sets `aria-disabled`, and an `onClick` that cancels the click, after calling one you set there, in the props `ui:submitButtonOptions` give the button, so the submit button of `@rjsf/core`, of every theme and a custom one that spreads those props tells assistive technology it is unavailable, and a click on it, or Enter pressed in a field, which clicks it, starts no submit. The browser's constraint validation doesn't run for it either, which would show its message and move focus to an input it rejects, nor for a `FormRef.submit()`, which returns without submitting. Enter in a field reaches the form through that button: with `ui:submitButtonOptions.norender` and no other submit button, the browser submits the form itself and runs its constraint validation before the form ignores the submit. The button isn't `disabled`: the browser moves focus away from a focused button that becomes disabled, so a keyboard user who submitted with it would lose their place. In `@rjsf/fluentui-rc`, Fluent's `Button` also stops a click on it from propagating while it is `aria-disabled`, so a click listener on an element around the button, such as one that closes a dialog, doesn't get that click while the form is pending.

```tsx
import { useState } from 'react';
import Form, { IChangeEvent } from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } } };

function PersonForm() {
  const [error, setError] = useState<string>();

  async function save({ formData }: IChangeEvent) {
    setError(undefined);
    try {
      const response = await fetch('/api/people', { method: 'POST', body: JSON.stringify(formData) });
      if (!response.ok) {
        setError(`Saving failed (${response.status}). Try again.`);
      }
    } catch {
      setError('Saving failed. Check your connection and try again.');
    }
  }

  return (
    <>
      {error && <p role='alert'>{error}</p>}
      <Form schema={schema} validator={validator} onSubmit={save} />
    </>
  );
}

render(<PersonForm />, document.getElementById('app'));
```

The form does not handle a rejection for you. When the promise rejects, the form's own copy of it rejects with the same error and is reported as an unhandled rejection, even if you handle the promise you return, and it never reaches an Error Boundary. A transition is different, see [below](#with-useactionstate). Catch the error inside `onSubmit` and return a promise that resolves, as `save` does, and show the error, for example as above or as [`extraErrors`](#errors-from-the-server).

Only a promise counts, such as one an `async` function returns. The form leaves another thenable alone, such as a query builder, since calling its `then()` again may run its request a second time. `await` it in an `async` `onSubmit` instead.

A promise that never settles keeps the form ignoring submits until [`FormRef.reset()`](../advanced-customization/internals.md) is called or the form unmounts. Give a request that can hang a timeout, such as `fetch(url, { signal: AbortSignal.timeout(10_000) })`, which rejects once it passes, and catch that error as `save` does.

The form keeps this pending state itself rather than running the promise in a React transition, so the rest of your app's transitions don't wait for it. That also means `useFormStatus().pending` stays `false` for a plain promise. To have React's form status report the submission, start the transition yourself, as the next section does.

An `onSubmit` that returns nothing works as before, and the form is never pending.

## With `useActionState`

React's `useActionState` gives you an action whose result and pending state the component keeps.
Dispatch it from `onSubmit`, inside a transition, with the validated data:

```tsx
import { startTransition, useActionState, useRef } from 'react';
import Form, { type FormRef } from '@rjsf/core';
import { ErrorSchema, RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } } };

type Person = { name?: string };
type SaveState = { errors?: ErrorSchema<Person> };

function PersonForm() {
  const formRef = useRef<FormRef<Person>>(null);
  const [state, dispatch, isPending] = useActionState(async (previous: SaveState, person: Person) => {
    try {
      const response = await fetch('/api/people', { method: 'POST', body: JSON.stringify(person) });
      if (!response.ok) {
        return { errors: await response.json() };
      }
    } catch {
      return { errors: { __errors: ['Saving failed. Check your connection and try again.'] } };
    }
    markSaved(formRef.current, person);
    return {};
  }, {});
  return (
    <Form<Person>
      ref={formRef}
      schema={schema}
      validator={validator}
      extraErrors={state.errors}
      onSubmit={({ formData }) => {
        if (!isPending) {
          startTransition(() => dispatch(formData));
        }
      }}
    />
  );
}
```

`markSaved()` makes the saved data the baseline and keeps any edit made while the save ran, see [Making the saved data the baseline](#making-the-saved-data-the-baseline).

- **The action gets the validated, typed data**, not the DOM's `FormData`. `Form` can't infer the data's type from the schema, so `<Form<Person>>` gives `formData` the type the action takes. `FormData` would turn numbers and booleans into strings, hold some widgets' encoded option values instead of the values themselves, and miss the values of widgets that don't render native form controls.
- **The form is pending while the action runs**, so the submit button gets `pending` and `aria-disabled`, and `useFormStatus().pending` is `true` inside the form. `isPending` tells the component that owns the action the same.
- **Catch errors inside the action.** React rethrows an error thrown in a `useActionState` action from the hook, to the nearest Error Boundary, which then replaces the form, and cancels the dispatches queued after it. Return the error as state instead, as the action above does.
- **Check `isPending` before dispatching again.** `onSubmit` returns no promise here, so the form doesn't know the action is running and doesn't ignore a second submit, from `FormRef.submit()` or a button passed as `children`. Only the default submit button takes no click meanwhile, since it reads the form status. `useActionState` would queue a second dispatch and run the action again once the first finishes. `isPending` is the value of the last render, so the check covers a submit that arrives after React has re-rendered with it, not a second `FormRef.submit()` in the same handler.
- **The form keeps showing its data.** React resets a `<form>` after an action passed to its `action` prop succeeds, but `Form` handles its own submit, so nothing is reset.
- **The saved data becomes the form's baseline.** The action calls `markSaved()` once the save succeeds, so the form is clean again unless the user kept editing during the save. See [Unsaved changes](#unsaved-changes).
- **The form has to render a `<form>`.** With a [`tagName`](../api-reference/form-props.md#tagname) such as `'div'`, a submit through `FormRef.submit()` that starts a transition makes React throw, since React builds a `FormData` from the element the submit event reaches, and the submit button doesn't read `useFormStatus()`, which would read an enclosing form's.
- **Don't pass the action to `Form`'s `action` prop.** That prop is the HTML attribute: `Form` prevents the browser's own submit, so React never calls a function passed there.

### Errors from the server

The action's state is a good place for errors the server reports. Return them as an `ErrorSchema` and pass them to [`extraErrors`](../api-reference/form-props.md#extraerrors), as the example above does, and they show on the fields they belong to.

## Reading the pending state yourself

- **A custom `SubmitButton` template** gets `pending` as a prop. See [SubmitButton](../advanced-customization/custom-templates.md#submitbutton).
- **Buttons you pass to `Form` as `children`** replace the submit button, so the form doesn't render one to give `pending` to. The form still ignores a second submit while a promise `onSubmit` returned is pending. Your code owns that promise, so keep the pending state yourself around it:

  ```tsx
  import { useState } from 'react';

  function PersonForm() {
    const [saving, setSaving] = useState(false);

    async function handleSubmit({ formData }: IChangeEvent) {
      setSaving(true);
      try {
        await save(formData);
      } catch {
        // Show the error, as the first example does
      } finally {
        setSaving(false);
      }
    }

    return (
      <Form schema={schema} validator={validator} onSubmit={handleSubmit}>
        <button
          type='submit'
          aria-disabled={saving}
          onClick={(event) => {
            if (saving) {
              event.preventDefault();
            }
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </Form>
    );
  }
  ```

  Canceling the click while saving keeps the browser's constraint validation from running for a submit the form ignores. Or call `useFormStatus()` in them, and start the submission in a transition, by dispatching a `useActionState` action as above or with `startTransition`. While an async transition runs, React holds every other transition in your app until it settles. `onSubmit` returns no promise then, so the form doesn't ignore a second submit, and the button below cancels its click while pending to stop one, as the one above does. Catch the error inside the transition too: one thrown in a transition the standalone `startTransition` started reaches no Error Boundary and is reported as an uncaught error, and one thrown in a transition `useTransition` started reaches the nearest Error Boundary of the component that called `useTransition`.

  ```tsx
  import { startTransition } from 'react';
  import { useFormStatus } from 'react-dom';

  function SaveButton() {
    const { pending } = useFormStatus();
    return (
      <button
        type='submit'
        aria-disabled={pending}
        onClick={(event) => {
          if (pending) {
            event.preventDefault();
          }
        }}
      >
        {pending ? 'Saving…' : 'Save'}
      </button>
    );
  }

  render(
    <Form
      schema={schema}
      validator={validator}
      onSubmit={({ formData }) =>
        startTransition(async () => {
          try {
            await save(formData);
          } catch {
            // Show the error, as the first example does
          }
        })
      }
    >
      <SaveButton />
    </Form>,
    document.getElementById('app'),
  );
  ```

- **A button outside the `<form>`**, such as one in a dialog's footer that submits the form through its `form` attribute, can't read `useFormStatus()`, which only reads the `<form>` a component is rendered inside. Get the pending state from the component that owns the submission instead: `isPending` from `useActionState`, or state you keep around your own promise.
- **Don't read `useFormStatus().data`.** It is the `FormData` the browser would post, which holds the encoded option values of the form's selects (such as an enum's index) and misses widgets that don't render native form controls. The data your submission works with is the argument `onSubmit` gets.

## Unsaved changes

The form compares its data with a baseline: the data it was last seeded with, on mount or by `reset()`, with the schema's defaults filled in. A form that only holds its seed and its defaults is clean. Every [`onChange`](../api-reference/form-props.md#onchange) and `onSubmit` event, and [`getStatus()`](../advanced-customization/internals.md#read-the-form-status) on the form's ref, report:

- `dirty`: whether the data differs from the baseline. Typing a field's original value back makes the form clean again, as long as that value isn't blank.

  Clearing a field stores `undefined`, which is not the same as the field being absent or holding `''`. So a field the seed left out, or seeded with `''`, stays dirty once it is typed into and cleared, as it does in react-hook-form. For a field seeded with `''`, set [`ui:emptyValue`](../api-reference/uiSchema.md#emptyvalue) to `''` on that field to have clearing store `''`, which makes the form clean again. A field the seed left out has no such fix: seed it with `''` and set `ui:emptyValue` if it matters.

- `dirtyFields`: where it differs, nested like the data, with `true` at each field that changed, for example `{ address: { city: true } }`. For an array it holds an entry for each item, `undefined` where the item is unchanged. An object or array field added, removed or replaced whole, such as one cleared from `{}` to nothing, can hold `true` itself, so check that a member is an object before reading into it.
- `submitCount`: how many submits have reached the form since it mounted or was last reset, valid or not, including one the form [ignores while a save is pending](#a-pending-submission), as TanStack Form counts every submit attempt. The browser's own constraint validation, such as for a `required` input left empty, blocks a submit before it reaches the form, so such a submit isn't counted unless you set [`noHtml5Validate`](../api-reference/form-props.md#nohtml5validate). While a save is pending, though, the form ignores a click on its own submit button, Enter in a field that clicks it, and `FormRef.submit()` before the browser's validation would run, so those are counted either way. A submit button you pass as `children`, or a `<button form>` outside the form, still goes through the browser's validation then.

Changes the user didn't make leave the form clean. When a new `schema` prop fills in a default, or `omitExtraData` with `liveOmit` drops data the schema doesn't describe, the baseline changes with the data. A prop change calls no `onChange`, so the status it leaves, which can turn a dirty form clean, is read with `getStatus()` after passing the new props. A change that follows from the user's own edit does count: when changing one field makes a conditional schema drop another field's value, both fields are dirty.

### Making the saved data the baseline

After a save, call `reset(saved)` on the form's ref with the data you saved. That data, with the schema's defaults filled in as on mount, becomes the baseline and the form's data, and the form clears its errors and its submit count, without remounting. `reset()` with no argument goes back to the data the last `reset(saved)` passed, or to the props' seed if there was none.

That makes `saved` the seed for good, as `reset(values)` replaces the default values in react-hook-form and TanStack Form. `reset(undefined)` is the same call as `reset()`. To start on another record, pass it: `reset(record)`, or `reset({})` for a blank form whose data is an object, which fills in the schema's defaults as `initialFormData={{}}` would on mount. To go back to the props' seed, such as after `initialFormData` changes to another record, or to a blank form whose data isn't an object, remount the form under a `key`.

The fields stay editable while a save is pending, so the user may change the data after submitting it. `reset(saved)` alone would replace those edits with the saved data. `getFormData()` returns the very object `onSubmit` was given until an edit replaces it, so compare the two by reference, and apply the newer data again as an edit on top of the saved baseline:

```tsx
function markSaved<T>(form: FormRef<T> | null, saved: T) {
  if (!form) {
    return;
  }
  const edited = form.getFormData();
  form.reset(saved);
  if (edited !== saved) {
    form.setFieldValue('', edited);
  }
}
```

Since `reset(saved)` fills in the schema's defaults, a field with a `default` that the user cleared before saving can come back. With [`mergeDefaultsIntoFormData`](../api-reference/form-props.md#mergedefaultsintoformdata) set to `'useDefaultIfFormDataUndefined'`, or when `saved` comes from the server without the cleared field, the reset fills the default in, and `markSaved()` keeps it, since no edit was made during the save. The form then shows the default, clean, and the next submit sends it.

Any new data object counts as an edit here, including one the user didn't make: if the form re-derives its data while the save is pending, such as for a new `schema` prop that fills in a default, `markSaved()` applies that data as an edit too, so the form reads dirty after the save.

Call it in the handler or action that saves, once the save succeeds, as the [`useActionState` example](#with-useactionstate) does, rather than in an Effect that watches for the save to finish. The save is what causes the reset, so it belongs where the save happens; see [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect).

### Warning before closing

Check `getStatus().dirty` when the user asks to leave, for example in a dialog's close handler:

```tsx
import { useRef } from 'react';
import Form, { type FormRef } from '@rjsf/core';

function EditPersonDialog({ person, onClose }: { person: Person; onClose: () => void }) {
  const formRef = useRef<FormRef<Person>>(null);

  function close() {
    if (formRef.current?.getStatus().dirty && !window.confirm('Discard your unsaved changes?')) {
      return;
    }
    onClose();
  }

  return (
    <dialog open>
      <Form
        ref={formRef}
        schema={schema}
        validator={validator}
        initialFormData={person}
        onSubmit={async ({ formData }) => {
          await save(formData);
          markSaved(formRef.current, formData);
        }}
      />
      <button type='button' onClick={close}>
        Close
      </button>
    </dialog>
  );
}
```

### Disabling submit when nothing changed

To render from `dirty`, keep it in state from `onChange`. `onChange` fires for every edit and for the reset after a save, so the state follows the user's changes. A prop change, such as a new `schema` filling in a default, updates the status without calling `onChange`; if your form's props change while it is shown, read `getStatus().dirty` after passing them as well. A field typed into and cleared counts as changed, see `dirty` above, so the button stays available after that.

Mark the default submit button `aria-disabled` through [`ui:submitButtonOptions`](../api-reference/uiSchema.md#submitbuttonoptions), and cancel its click while nothing has changed, as the form does while a save is pending, see [A pending submission](#a-pending-submission). Don't pass `disabled`: the save makes the form clean, and the browser moves focus away from a focused button that becomes disabled, so a keyboard user who saved with it would lose their place. Canceling the click also stops Enter pressed in a field, which clicks the button, and keeps the browser's constraint validation from running. `FormRef.submit()` doesn't click the button, so check `getStatus().dirty` before calling it. While a save is pending, the form marks the button `aria-disabled` and cancels its click whatever you pass, and still calls your `onClick`:

```tsx
function PersonForm({ person }: { person: Person }) {
  const formRef = useRef<FormRef<Person>>(null);
  const [isDirty, setIsDirty] = useState(false);

  return (
    <Form
      ref={formRef}
      schema={schema}
      validator={validator}
      initialFormData={person}
      uiSchema={{
        'ui:submitButtonOptions': {
          props: {
            'aria-disabled': !isDirty,
            onClick: (event) => {
              if (!isDirty) {
                event.preventDefault();
              }
            },
          },
        },
      }}
      onChange={({ dirty }) => setIsDirty(dirty)}
      onSubmit={async ({ formData }) => {
        await save(formData);
        markSaved(formRef.current, formData);
      }}
    />
  );
}
```
