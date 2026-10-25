# Submitting

When the form is submitted and its data are valid, `Form` calls your [`onSubmit`](../api-reference/form-props.md#onsubmit) with the validated data.
This page covers what happens while that submission is in flight, how `Form` fits React's form APIs, `useActionState` and `useFormStatus`, how to tell whether the form holds changes that haven't been saved, and which fields the user has touched.

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
    const response = await fetch('/api/people', { method: 'POST', body: JSON.stringify(person) });
    if (!response.ok) {
      return { errors: await response.json() };
    }
    formRef.current?.reset(person);
    return {};
  }, {});
  return (
    <Form
      ref={formRef}
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
- **The saved data becomes the form's baseline.** The action calls `reset(person)` once the save succeeds, so the form is clean again. See [Unsaved changes](#unsaved-changes).
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

## Unsaved changes

The form compares its data with a baseline: the data it was last seeded with, on mount or by `reset()`, with the schema's defaults filled in. A form that only holds its seed and its defaults is clean. Every [`onChange`](../api-reference/form-props.md#onchange) and `onSubmit` event, and [`getStatus()`](../advanced-customization/internals.md#read-the-form-status) on the form's ref, report:

- `dirty`: whether the data differs from the baseline. Typing a field's original value back makes the form clean again, as long as that value isn't blank.

  Clearing a field stores `undefined`, which is not the same as the field being absent or holding `''`. So a field the seed left out, or seeded with `''`, stays dirty once it is typed into and cleared, as it does in react-hook-form. For a field seeded with `''`, set [`ui:emptyValue`](../api-reference/uiSchema.md#emptyvalue) to `''` on that field to have clearing store `''`, which makes the form clean again. A field the seed left out has no such fix: seed it with `''` and set `ui:emptyValue` if it matters.

- `dirtyFields`: where it differs, nested like the data, with `true` at each field that changed, for example `{ address: { city: true } }`. For an array it holds an entry for each item, `undefined` where the item is unchanged.
- `submitCount`: how many submits have reached the form since it mounted or was last reset, valid or not. The browser's own constraint validation, such as for a `required` input left empty, blocks a submit before it reaches the form, so such a submit isn't counted unless you set [`noHtml5Validate`](../api-reference/form-props.md#nohtml5validate).

Changes the user didn't make leave the form clean. When a new `schema` prop fills in a default, or `omitExtraData` with `liveOmit` drops data the schema doesn't describe, the baseline changes with the data. A prop change calls no `onChange`, so the status it leaves, which can turn a dirty form clean, is read with `getStatus()` after passing the new props. A change that follows from the user's own edit does count: when changing one field makes a conditional schema drop another field's value, both fields are dirty.

### Making the saved data the baseline

After a save, call `reset(saved)` on the form's ref with the data you saved. That data becomes the baseline and the form's data, and the form clears its errors, its touched fields and its submit count, without remounting. `reset()` with no argument goes back to the data the last `reset(saved)` passed, or to the props' seed if there was none.

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
    <dialog open onCancel={close}>
      <Form
        ref={formRef}
        schema={schema}
        validator={validator}
        initialFormData={person}
        onSubmit={async ({ formData }) => {
          await save(formData);
          formRef.current?.reset(formData);
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

To render from `dirty`, keep it in state from `onChange`. `onChange` fires for every edit and for the `reset(saved)` after a save, so the state follows the user's changes. A prop change, such as a new `schema` filling in a default, updates the status without calling `onChange`; if your form's props change while it is shown, read `getStatus().dirty` after passing them as well. A field typed into and cleared counts as changed, see `dirty` above, so the button stays enabled after that. Disable the default submit button through [`ui:submitButtonOptions`](../api-reference/uiSchema.md#submitbuttonoptions), which keeps it disabled while a save is pending as well:

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
      uiSchema={{ 'ui:submitButtonOptions': { props: { disabled: !isDirty } } }}
      onChange={({ dirty }) => setIsDirty(dirty)}
      onSubmit={async ({ formData }) => {
        await save(formData);
        formRef.current?.reset(formData);
      }}
    />
  );
}
```

## Touched fields

A field is touched once its widget reports a blur, the same blur [`liveValidate="onBlur"`](../api-reference/form-props.md#livevalidate) validates on. Every `onChange` and `onSubmit` event, and `getStatus()`, report:

- `touched`: whether any field has been touched since the form mounted or was last reset.
- `touchedFields`: which, nested like the data, with `true` at each touched field, for example `{ address: { street: true } }`. For an array it holds an entry for each item, `undefined` where the item holds no touched field. A widget that handles a whole array or object, such as checkboxes for an array of enum values, touches every item or member it holds, so `touchedFields` holds `true` at each of them. One that holds nothing, empty or not yet given a value, has nothing to mark: tabbing through a checkbox group with nothing checked leaves the form untouched. A blurred text field is touched whether or not it holds a value. The selector of an `anyOf` or `oneOf` field is no field of the data, so blurring it touches nothing. Under [`liveErrors="field"`](../api-reference/form-props.md#liveerrors) its errors are revealed on that blur all the same. A touched field stays with its array item when the item is moved, and goes when the item is removed, or when its key is dropped from the data, as `setFieldValue()` writing a whole object without it does; the key starts untouched if it comes back. `touched` is `true` exactly when `touchedFields` holds a `true`.

A submit doesn't touch any field; read `submitCount` to tell whether one was attempted. A blur that only touches a field fires no `onChange`, so `onChange` isn't called more often than before: the next event carries it, and `getStatus()` reads it right away. `reset()` clears the touched fields.

To show a field's errors only once the user has reached it, use [`liveErrors="field"`](../api-reference/form-props.md#liveerrors) rather than filtering errors by `touchedFields` yourself.
