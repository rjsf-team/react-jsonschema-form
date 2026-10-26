# Submitting

When the form is submitted and its data are valid, `Form` calls your [`onSubmit`](../api-reference/form-props.md#onsubmit) with the validated data.
This page covers what happens while that submission is in flight, and how `Form` fits React's form APIs, `useActionState` and `useFormStatus`.

## A pending submission

When `onSubmit` returns a promise, the form ignores another submit until that promise settles, whether it comes from a submit button, from Enter pressed in a field or from `FormRef.submit()`. That is what TanStack Form's documented `disabled={!canSubmit}` submit button does in your app, built into the form; react-hook-form doesn't block a second submit. Meanwhile the submit button gets the `pending` prop, and the form sets `aria-disabled`, and an `onClick` that cancels the click, in the props `ui:submitButtonOptions` give the button, so the submit button of `@rjsf/core`, of every theme and a custom one that spreads those props tells assistive technology it is unavailable, and a click on it, or Enter pressed in a field, which clicks it, starts no submit. The browser's constraint validation doesn't run for it either, which would show its message and move focus to an input it rejects, nor for a `FormRef.submit()`, which returns without submitting. The button isn't `disabled`: the browser moves focus away from a focused button that becomes disabled, so a keyboard user who submitted with it would lose their place.

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
import { startTransition, useActionState } from 'react';
import Form from '@rjsf/core';
import { ErrorSchema, RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } } };

type Person = { name?: string };
type SaveState = { errors?: ErrorSchema<Person> };

async function savePerson(previous: SaveState, person: Person): Promise<SaveState> {
  try {
    const response = await fetch('/api/people', { method: 'POST', body: JSON.stringify(person) });
    return response.ok ? {} : { errors: await response.json() };
  } catch {
    return { errors: { __errors: ['Saving failed. Check your connection and try again.'] } };
  }
}

function PersonForm() {
  const [state, dispatch, isPending] = useActionState(savePerson, {});
  return (
    <Form<Person>
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

- **The action gets the validated, typed data**, not the DOM's `FormData`. `Form` can't infer the data's type from the schema, so `<Form<Person>>` gives `formData` the type the action takes. `FormData` would turn numbers and booleans into strings, hold some widgets' encoded option values instead of the values themselves, and miss the values of widgets that don't render native form controls.
- **The form is pending while the action runs**, so the submit button gets `pending` and `aria-disabled`, and `useFormStatus().pending` is `true` inside the form. `isPending` tells the component that owns the action the same.
- **Catch errors inside the action.** React rethrows an error thrown in a `useActionState` action from the hook, to the nearest Error Boundary, which then replaces the form, and cancels the dispatches queued after it. Return the error as state instead, as `savePerson` does.
- **Check `isPending` before dispatching again.** `onSubmit` returns no promise here, so the form doesn't know the action is running and doesn't ignore a second submit, from `FormRef.submit()` or a button passed as `children`. Only the default submit button takes no click meanwhile, since it reads the form status. `useActionState` would queue a second dispatch and run the action again once the first finishes. `isPending` is the value of the last render, so the check covers a submit that arrives after React has re-rendered with it, not a second `FormRef.submit()` in the same handler.
- **The form keeps showing its data.** React resets a `<form>` after an action passed to its `action` prop succeeds, but `Form` handles its own submit, so nothing is reset.
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
