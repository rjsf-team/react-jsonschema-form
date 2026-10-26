import { Profiler, StrictMode, useLayoutEffect } from 'react';
import type { ArrayFieldItemTemplateProps, RJSFSchema, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form, { ArrayFieldItemTemplate as DefaultItemTemplate } from '../src/index.ts';
import { buildRegistry } from '../src/Theme.ts';
import { AcceptingParent, createFormRef, elementOf, handleOf, ListeningParent, input } from './testUtils.tsx';

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

describe('render cost of an edit in a long list (#3183)', () => {
  const rows: RJSFSchema = { type: 'array', items: { type: 'object', properties: { a: { type: 'string' } } } };
  const initialFormData = Array.from({ length: 20 }, (_, index) => ({ a: `item ${index}` }));
  function renderList() {
    const items = new Map<number, number>();
    const widgets = new Map<string, number>();
    function CountingItem(props: ArrayFieldItemTemplateProps) {
      items.set(props.index, (items.get(props.index) ?? 0) + 1);
      return <DefaultItemTemplate {...props} />;
    }
    function CountingTextWidget({ id, value, onChange }: WidgetProps) {
      widgets.set(id, (widgets.get(id) ?? 0) + 1);
      return (
        <input
          id={id}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    }
    const { container } = render(
      <Form
        schema={rows}
        validator={validator}
        initialFormData={initialFormData}
        widgets={{ TextWidget: CountingTextWidget }}
        templates={{ ArrayFieldItemTemplate: CountingItem }}
      />,
    );
    items.clear();
    widgets.clear();
    return { container, items, widgets };
  }

  it('re-renders only the two rows that trade places for a move down', async () => {
    const { container, items, widgets } = renderList();

    await user.click(elementOf(container, '#root_0__moveDown'));

    expect(input(container, 'root_0_a')).toHaveValue('item 1');
    expect(input(container, 'root_1_a')).toHaveValue('item 0');
    expect(Object.fromEntries(items)).toEqual({ 0: 1, 1: 1 });
    expect(Object.fromEntries(widgets)).toEqual({ root_0_a: 1, root_1_a: 1 });
  });

  it("re-renders every row's item template once for the new length, and only the shifted rows' widgets, for a remove", async () => {
    const { container, items, widgets } = renderList();

    await user.click(elementOf(container, '#root_10__remove'));

    expect(input(container, 'root_10_a')).toHaveValue('item 11');
    expect(container.querySelector('#root_19_a')).toBeNull();
    // An item template takes `totalItems`, so each remaining row's template renders again
    expect(Object.fromEntries(items)).toEqual(Object.fromEntries(Array.from({ length: 19 }, (_, index) => [index, 1])));
    const shifted = Array.from({ length: 9 }, (_, index) => 10 + index);
    expect(Object.fromEntries(widgets)).toEqual(Object.fromEntries(shifted.map((index) => [`root_${index}_a`, 1])));
  });
});
