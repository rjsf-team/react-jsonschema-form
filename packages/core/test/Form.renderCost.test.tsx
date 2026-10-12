import { Profiler, useLayoutEffect } from 'react';
import type { RJSFSchema, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';
import { buildRegistry } from '../src/Theme.ts';
import { AcceptingParent, RejectingParent, input } from './testUtils.tsx';

// Spied rather than replaced, so the form builds its real registry and every call is counted
vi.mock('../src/Theme.ts', { spy: true });

const user = userEvent.setup();

const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string', minLength: 3 } } };

describe('render cost of one update', () => {
  it('commits once for a keystroke in a controlled, live-validated form', async () => {
    const onRender = vi.fn();
    const { container } = render(
      <Profiler id='form' onRender={onRender}>
        <AcceptingParent schema={schema} initialValue={{ name: '' }} liveValidate='onChange' />
      </Profiler>,
    );
    onRender.mockClear();

    await user.type(input(container, 'root_name'), 'x');

    expect(onRender).toHaveBeenCalledTimes(1);
  });

  it('commits once for an unrelated prop change on a self-owned form', () => {
    const onRender = vi.fn();
    const element = (idPrefix: string) => (
      <Profiler id='form' onRender={onRender}>
        <Form schema={schema} validator={validator} initialFormData={{ name: '' }} idPrefix={idPrefix} />
      </Profiler>
    );
    const { rerender } = render(element('root'));
    onRender.mockClear();

    rerender(element('other'));

    expect(onRender).toHaveBeenCalledTimes(1);
  });

  it('derives the render state once per keystroke render', async () => {
    const { container } = render(<Form schema={schema} validator={validator} initialFormData={{ name: '' }} />);
    vi.mocked(buildRegistry).mockClear();

    await user.type(input(container, 'root_name'), 'x');

    // Once for the edited data in `applyChange()`, once for the render; the render restart `setCache` causes reuses it
    expect(vi.mocked(buildRegistry).mock.calls.length).toBeLessThanOrEqual(2);
  });

  it('derives nothing in the render for the first edit a parent refuses', async () => {
    const { container } = render(<RejectingParent schema={schema} initialValue={{ name: '' }} />);
    vi.mocked(buildRegistry).mockClear();

    await user.type(input(container, 'root_name'), 'x');

    // Once for the proposal in `applyChange()`; the parent renders nothing new, so the render has nothing to derive
    expect(vi.mocked(buildRegistry).mock.calls.length).toBeLessThanOrEqual(1);
  });

  it('derives nothing more for a proposal a widget makes from a layout Effect', () => {
    // Normalizes its value as it commits, the way a masked or formatted input does
    function UpperCaseWidget({ id, value, onChange }: WidgetProps) {
      const text = typeof value === 'string' ? value : '';
      useLayoutEffect(() => {
        if (text !== text.toUpperCase()) {
          onChange(text.toUpperCase());
        }
      }, [text, onChange]);
      return <input id={id} value={text} readOnly />;
    }
    const props = { schema, validator, uiSchema: { name: { 'ui:widget': UpperCaseWidget } }, onChange: vi.fn() };
    const { rerender } = render(<Form {...props} formData={{ name: 'AB' }} />);
    vi.mocked(buildRegistry).mockClear();

    // The parent loads another record and keeps to it, whatever the widget proposes
    rerender(<Form {...props} formData={{ name: 'cd' }} />);

    // Once for the render of the record, once for the proposal in `applyChange()`
    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(vi.mocked(buildRegistry).mock.calls.length).toBeLessThanOrEqual(2);
  });
});
