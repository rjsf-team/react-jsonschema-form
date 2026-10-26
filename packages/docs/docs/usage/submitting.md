# Submitting

When the form is submitted and its data are valid, `Form` calls your [`onSubmit`](../api-reference/form-props.md#onsubmit) with the validated data.
This page covers what happens while that submission is in flight, and how `Form` fits React's form APIs, `useActionState` and `useFormStatus`.

## A pending submission

When `onSubmit` returns a promise, the form ignores another submit until that promise settles, whether it comes from a submit button, from Enter pressed in a field or from `FormRef.submit()`, as TanStack Form does while it is submitting. Meanwhile the submit button gets the `pending` prop, and the form sets `aria-disabled` in the props `ui:submitButtonOptions` give the button, so the submit button of `@rjsf/core`, of every theme and a custom one that spreads those props tells assistive technology it is unavailable. The button isn't `disabled`: the browser moves focus away from a focused button that becomes disabled, so a keyboard user who submitted with it would lose their place.

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

The form does not handle a rejection for you. When the promise rejects, the form's own copy of it rejects with the same error and is reported as an unhandled rejection, even if you handle the promise you return, and it never reaches an Error Boundary. Catch the error inside `onSubmit` and return a promise that resolves, as `save` does, and show the error, for example as above or as [`extraErrors`](#errors-from-the-server).

Only a promise counts, such as one an `async` function returns. The form leaves another thenable alone, such as a query builder, since calling its `then()` again may run its request a second time. `await` it in an `async` `onSubmit` instead.

A promise that never settles keeps the form ignoring submits until it unmounts.

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
  const response = await fetch('/api/people', { method: 'POST', body: JSON.stringify(person) });
  return response.ok ? {} : { errors: await response.json() };
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
- **Check `isPending` before dispatching again.** `onSubmit` returns no promise here, so the form doesn't know the action is running and doesn't ignore a second submit. `useActionState` would queue a second dispatch and run the action again once the first finishes.
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
        <button type='submit' aria-disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </Form>
    );
  }
  ```

  Or call `useFormStatus()` in them, and start the submission in a transition, by dispatching a `useActionState` action as above or with `startTransition`. While an async transition runs, React holds every other transition in your app until it settles. `onSubmit` returns no promise then, so the form doesn't ignore a second submit, and the button below is `disabled` to stop one.

  ```tsx
  import { startTransition } from 'react';
  import { useFormStatus } from 'react-dom';

  function SaveButton() {
    const { pending } = useFormStatus();
    return (
      <button type='submit' disabled={pending}>
        {pending ? 'Saving…' : 'Save'}
      </button>
    );
  }

  render(
    <Form
      schema={schema}
      validator={validator}
      onSubmit={(data) =>
        startTransition(async () => {
          await save(data);
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
