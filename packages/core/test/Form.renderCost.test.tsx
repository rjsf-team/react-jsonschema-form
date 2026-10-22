import { Profiler, StrictMode, useLayoutEffect } from 'react';
import type { RJSFSchema, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';
import { buildRegistry } from '../src/Theme.ts';
import { AcceptingParent, createFormRef, handleOf, ListeningParent, input } from './testUtils.tsx';

// Spied rather than replaced, so the form builds its real registry and every call is counted
vi.mock('../src/Theme.ts', { spy: true });

const user = userEvent.setup();

const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string', minLength: 3 } } };

describe('render cost of one update', () => {
  it('commits once for a keystroke in a live-validated form under a parent that stores each edit', async () => {
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

  it('commits once for a keystroke inside an option, with a parent that stores what onChange reports', async () => {
    const withOptions: RJSFSchema = {
      type: 'object',
      properties: {
        pet: {
          anyOf: [
            { type: 'object', properties: { a: { type: 'string' } } },
            { type: 'object', properties: { b: { type: 'string' } } },
          ],
        },
      },
    };
    const onRender = vi.fn();
    const { container } = render(
      <StrictMode>
        <Profiler id='form' onRender={onRender}>
          <AcceptingParent schema={withOptions} initialValue={{ pet: { a: '' } }} />
        </Profiler>
      </StrictMode>,
    );
    onRender.mockClear();

    await user.type(input(container, 'root_pet_a'), 'xy');

    expect(onRender).toHaveBeenCalledTimes(2);
  });

  it('commits once for a prop change the form state does not take, on a form seeded with initialFormData', () => {
    const onRender = vi.fn();
    const element = (className: string) => (
      <Profiler id='form' onRender={onRender}>
        <Form schema={schema} validator={validator} initialFormData={{ name: '' }} className={className} />
      </Profiler>
    );
    const { rerender } = render(element('one'));
    onRender.mockClear();

    rerender(element('other'));

    expect(onRender).toHaveBeenCalledTimes(1);
  });

  it('commits once for a prop change the form state takes, rendering each field once', () => {
    const onRender = vi.fn();
    const widgetRenders = vi.fn();
    function CountingWidget({ id, value }: WidgetProps) {
      widgetRenders(id);
      return <input id={id} value={typeof value === 'string' ? value : ''} readOnly />;
    }
    const element = (idPrefix: string) => (
      <Profiler id='form' onRender={onRender}>
        <Form
          schema={schema}
          validator={validator}
          widgets={{ TextWidget: CountingWidget }}
          initialFormData={{ name: '' }}
          idPrefix={idPrefix}
        />
      </Profiler>
    );
    const { rerender } = render(element('root'));
    onRender.mockClear();
    widgetRenders.mockClear();

    rerender(element('other'));

    // What the render derives from the new props is not written back to the store, so nothing renders again
    expect(onRender).toHaveBeenCalledTimes(1);
    expect(widgetRenders.mock.calls).toEqual([['other_name']]);
  });

  it('derives the render state once per keystroke render', async () => {
    const { container } = render(<Form schema={schema} validator={validator} initialFormData={{ name: '' }} />);
    vi.mocked(buildRegistry).mockClear();

    await user.type(input(container, 'root_name'), 'x');

    // Once for the edited data in `applyChangeToData()`, once for the render; the render restart `setCache` causes reuses it
    expect(vi.mocked(buildRegistry).mock.calls.length).toBeLessThanOrEqual(2);
  });

  it('derives the render state once per keystroke under a parent that stores nothing back', async () => {
    const { container } = render(<ListeningParent schema={schema} initialValue={{ name: '' }} />);
    vi.mocked(buildRegistry).mockClear();

    await user.type(input(container, 'root_name'), 'x');

    // Once for the edit in `applyChangeToData()`, once for the render of it; the parent renders nothing new
    expect(vi.mocked(buildRegistry).mock.calls.length).toBeLessThanOrEqual(2);
  });

  it('derives once more for an edit a widget makes from a layout Effect of the render of a record set through setFieldValue', () => {
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
    const ref = createFormRef();
    const onChange = vi.fn();
    render(
      <Form
        ref={ref}
        schema={schema}
        validator={validator}
        uiSchema={{ name: { 'ui:widget': UpperCaseWidget } }}
        onChange={onChange}
        initialFormData={{ name: 'AB' }}
      />,
    );
    vi.mocked(buildRegistry).mockClear();

    // Another record is loaded through the ref; the widget normalizes it once
    act(() => handleOf(ref).setFieldValue('', { name: 'cd' }));

    // Once for the record's change in `applyChangeToData()` and once for its render, then once for the widget's edit and
    // once for the render of that; each change reports through `onChange`
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(vi.mocked(buildRegistry).mock.calls.length).toBeLessThanOrEqual(4);
  });
});
