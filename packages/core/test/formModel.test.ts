import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

import type { FormProps } from '../src/components/Form.tsx';
import { createFormModel } from '../src/components/formModel.ts';
import { initialState } from '../src/components/formState.ts';

const schema: RJSFSchema = { type: 'object', properties: { a: { type: 'string' } } };

/** A self-owned form's model as `Form`'s Effects leave it after the first commit: mounted and attached */
function createMountedModel(onChange?: FormProps['onChange']) {
  const props: FormProps = { schema, validator, onChange };
  const model = createFormModel(props, initialState(props));
  const unmount = model.mount();
  model.attach();
  return { model, props, unmount };
}

describe('the reports a detached model holds', () => {
  it('are delivered when the form is shown again', () => {
    const onChange = vi.fn();
    const { model } = createMountedModel(onChange);
    model.detach();

    model.handle.setFieldValue('a', 'x');
    expect(onChange).not.toHaveBeenCalled();

    model.attach();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('are released by the unmount, and none is held after it', () => {
    const onChange = vi.fn();
    const { model, unmount } = createMountedModel(onChange);
    model.detach();
    model.handle.setFieldValue('a', 'held while hidden');
    unmount();
    model.handle.setFieldValue('a', 'made through a handle kept past the unmount');

    // React never shows an unmounted form again. Attaching it anyway is how the test sees that neither report was kept
    model.mount();
    model.attach();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('proposing()', () => {
  it('has the form render only for a proposal that did not reach the model', () => {
    const { model } = createMountedModel();
    const listener = vi.fn();
    model.subscribe(listener);

    // The edit reached the model, which notified for it
    const reached = model.proposing();
    model.handle.setFieldValue('a', 'x');
    reached();
    expect(listener).toHaveBeenCalledTimes(1);

    // A proposal the model never heard of, as one a custom parent kept to itself is, has nothing else to render the
    // form for it
    model.proposing()();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('has the form render for a proposal made while React commits a render the store asked for', () => {
    const { model, props } = createMountedModel();
    const listener = vi.fn();
    model.subscribe(listener);
    model.handle.setFieldValue('a', 'x');
    const rendered = model.getSnapshot();
    const epoch = model.epoch();

    // A field React cleans up in that commit proposes to a custom parent, which keeps the proposal to itself. The
    // commit has yet to reach the model, and it is the only render on its way
    model.proposing()();
    model.committed(props, rendered.state, rendered);

    expect(listener).toHaveBeenCalledTimes(2);
    // The field's record of the proposal outlives the commit, until the render it asked for
    expect(model.epoch()).toBe(epoch);
  });
});
