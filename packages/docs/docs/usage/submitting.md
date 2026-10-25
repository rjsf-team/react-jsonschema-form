# Submitting

When the form is submitted and its data are valid, `Form` calls your [`onSubmit`](../api-reference/form-props.md#onsubmit) with the validated data.
This page covers what happens while that submission is in flight, and how `Form` fits React's form APIs, `useActionState` and `useFormStatus`.

## A pending submission

When `onSubmit` returns a promise, the submit button gets the `pending` prop until that promise settles. The submit button of `@rjsf/core` and of every theme disables itself while it is set, so the form can't be submitted a second time meanwhile. A button that is disabled also keeps the browser from submitting the form when Enter is pressed in a field.

```tsx
import Form from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } } };

async function save({ formData }) {
  await fetch('/api/people', { method: 'POST', body: JSON.stringify(formData) });
}

render(<Form schema={schema} validator={validator} onSubmit={save} />, document.getElementById('app'));
```

The form does not handle a rejection for you. A promise that rejects is reported as an unhandled rejection, as an error thrown by any other event handler is, and it never reaches an Error Boundary. Catch the error inside `onSubmit` to show it, for example as [`extraErrors`](#errors-from-the-server).

A promise that never settles keeps the submit button disabled until the form unmounts.

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
    <Form
      schema={schema}
      validator={validator}
      extraErrors={state.errors}
      onSubmit={({ formData }) => startTransition(() => dispatch(formData))}
    />
  );
}
```

- **The action gets the validated, typed data**, not the DOM's `FormData`. `FormData` would turn numbers and booleans into strings, hold some widgets' encoded option values instead of the values themselves, and miss the values of widgets that don't render native form controls.
- **The form is pending while the action runs**, so the submit button disables itself and `useFormStatus().pending` is `true` inside the form. `isPending` tells the component that owns the action the same.
- **The form keeps showing its data.** React resets a `<form>` after an action passed to its `action` prop succeeds, but `Form` handles its own submit, so nothing is reset.
- **Don't pass the action to `Form`'s `action` prop.** That prop is the HTML attribute: `Form` prevents the browser's own submit, so React never calls a function passed there.

### Errors from the server

The action's state is a good place for errors the server reports. Return them as an `ErrorSchema` and pass them to [`extraErrors`](../api-reference/form-props.md#extraerrors), as the example above does, and they show on the fields they belong to.

## Reading the pending state yourself

- **A custom `SubmitButton` template** gets `pending` as a prop. See [SubmitButton](../advanced-customization/custom-templates.md#submitbutton).
- **Buttons you pass to `Form` as `children`** replace the submit button, so the form doesn't render one to give `pending` to. Call `useFormStatus()` in them, and start the submission in a transition, by dispatching a `useActionState` action as above or with `startTransition`. While an async transition runs, React holds every other transition in your app until it settles.

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
