import { Suspense, startTransition, use, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  ArrayFieldItemButtonsTemplateProps,
  ArrayFieldItemTemplateProps,
  ArrayFieldTemplateProps,
  FieldPathList,
  ObjectFieldTemplateProps,
  FieldProps,
  RJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { noop } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';

import ArrayField from '../src/components/fields/ArrayField.tsx';
import type { FormRef, IChangeEvent } from '../src/index.ts';
import Form, { ArrayFieldItemTemplate as DefaultItemTemplate } from '../src/index.ts';
import type { NoValFormProps } from './testUtils.tsx';
import {
  AcceptingParent,
  createFormComponent,
  createFormRef,
  createRetainingWidget,
  errorListMessages,
  expectToHaveBeenCalledWithFormData,
  handleOf,
  input,
  renderInActivity,
} from './testUtils.tsx';

const user = userEvent.setup();
const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } } };

it('an abandoned concurrent render does not publish parent data or callbacks to the model', async () => {
  const ref = createFormRef<{ name: string }>();
  const committedCallback = vi.fn();
  const pendingCallback = vi.fn();
  const never = new Promise<void>(() => {});
  function SuspendingWidget({ value }: WidgetProps) {
    if (value === 'pending') {
      use(never);
    }
    return <span>{value}</span>;
  }
  function Parent() {
    const [value, setValue] = useState('committed');
    return (
      <>
        <button type='button' onClick={() => startTransition(() => setValue('pending'))}>
          Suspend
        </button>
        <Suspense fallback={<span>Loading</span>}>
          <Form
            ref={ref}
            schema={schema}
            validator={validator}
            formData={{ name: value }}
            onChange={value === 'pending' ? pendingCallback : committedCallback}
            widgets={{ TextWidget: SuspendingWidget }}
          />
        </Suspense>
      </>
    );
  }
  render(<Parent />);
  await user.click(screen.getByRole('button', { name: 'Suspend' }));
  expect(handleOf(ref).getFormData()).toEqual({ name: 'committed' });
  act(() => handleOf(ref).setFieldValue('name', 'event'));
  expectToHaveBeenCalledWithFormData(committedCallback, { name: 'event' }, 'root_name');
  expect(pendingCallback).not.toHaveBeenCalled();
});

it('an array wrapper edits its displayed sorted view rather than the raw model order', async () => {
  function SortedArray(props: FieldProps<string[]>) {
    return <ArrayField {...props} formData={[...(props.formData ?? [])].sort()} />;
  }
  function RemoveButton({ index, onRemoveItem }: ArrayFieldItemButtonsTemplateProps) {
    return (
      <button type='button' onClick={onRemoveItem}>
        Remove {index}
      </button>
    );
  }
  const { onChange, getFormData } = createFormComponent({
    schema: { type: 'array', items: { type: 'string' } },
    initialFormData: ['b', 'a', 'c'],
    fields: { ArrayField: SortedArray },
    templates: { ArrayFieldItemButtonsTemplate: RemoveButton },
  });
  await user.click(screen.getByRole('button', { name: 'Remove 0' }));
  expectToHaveBeenCalledWithFormData(onChange, ['b', 'c'], 'root');
  expect(getFormData()).toEqual(['b', 'c']);
});

it('an array wrapper whose view is sometimes the data itself chains edits on the view it rendered', async () => {
  function ReversedArray(props: FieldProps<string[]>) {
    const { formData = [], fieldPath, onChange } = props;
    // Reversing fewer than two items changes nothing, so the wrapper hands over the data itself
    const view = formData.length < 2 ? formData : formData.toReversed();
    return (
      <ArrayField
        {...props}
        formData={view}
        onChange={(value, path, errors, id) =>
          onChange(path === fieldPath && Array.isArray(value) ? value.toReversed() : value, path, errors, id)
        }
      />
    );
  }
  function AddTwice({ items, onAddClick }: ArrayFieldTemplateProps) {
    return (
      <div>
        {items}
        <button
          type='button'
          onClick={(event) => {
            onAddClick(event);
            onAddClick(event);
          }}
        >
          Add twice
        </button>
      </div>
    );
  }
  const { getFormData } = createFormComponent({
    schema: { type: 'array', items: { type: 'string', default: 'new' } },
    initialFormData: ['a'],
    fields: { ArrayField: ReversedArray },
    templates: { ArrayFieldTemplate: AddTwice },
  });

  await user.click(screen.getByRole('button', { name: 'Add twice' }));

  // The second add builds on the view the first proposed, ['a', 'new'], not on the data the wrapper wrote back
  expect(getFormData()).toEqual(['new', 'new', 'a']);
});

it('renders seeded data on the server without a browser or effect publishing a snapshot', () => {
  const markup = renderToString(<Form schema={schema} validator={validator} initialFormData={{ name: 'server' }} />);
  expect(markup).toContain('value="server"');
});

it('new controlled props are available to the Effects of the commit that renders them', () => {
  const ref = createFormRef<{ name: string }>();
  const phases: [string, unknown, unknown][] = [];
  function ObservingWidget({ value }: WidgetProps) {
    useLayoutEffect(() => {
      phases.push(['layout', value, ref.current?.getFormData()]);
    }, [value]);
    useEffect(() => {
      phases.push(['passive', value, ref.current?.getFormData()]);
    }, [value]);
    return <span>{value}</span>;
  }
  const props = { ref, schema, validator, widgets: { TextWidget: ObservingWidget }, onChange: vi.fn() };
  const { rerender } = render(<Form {...props} formData={{ name: 'before' }} />);
  phases.length = 0;
  rerender(<Form {...props} formData={{ name: 'after' }} />);
  expect(phases).toEqual([
    ['layout', 'after', { name: 'after' }],
    ['passive', 'after', { name: 'after' }],
  ]);
});

it('several additional-property adds in one event use current self-owned data', async () => {
  function AddTwice({ properties, onAddProperty }: ObjectFieldTemplateProps) {
    return (
      <div>
        {properties.map(({ content }) => content)}
        <button
          type='button'
          onClick={() => {
            onAddProperty();
            onAddProperty();
          }}
        >
          Add twice
        </button>
      </div>
    );
  }
  const { onChange, getFormData } = createFormComponent({
    schema: { type: 'object', additionalProperties: { type: 'string', default: 'value' } },
    templates: { ObjectFieldTemplate: AddTwice },
  });
  await user.click(screen.getByRole('button', { name: 'Add twice' }));
  expect(getFormData()).toEqual({ newKey: 'value', 'newKey-1': 'value' });
  expectToHaveBeenCalledWithFormData(onChange, getFormData(), 'root');
});

describe('an item set through the handle and an add in one event, on an array a core field renders below itself', () => {
  const list: RJSFSchema = { type: 'array', items: { type: 'string', default: 'new' } };
  const node: RJSFSchema = { type: 'object', properties: { list, next: { $ref: '#/definitions/node' } } };

  it.each<{ field: string; props: NoValFormProps; arrayId: string; itemPath: FieldPathList; expected: object }>([
    {
      field: 'LayoutGridField',
      props: {
        schema: { type: 'object', properties: { list } },
        uiSchema: { 'ui:field': 'LayoutGridField', 'ui:layoutGrid': { 'ui:row': { children: ['list'] } } },
        initialFormData: { list: ['a'] },
      },
      arrayId: 'root_list',
      itemPath: ['list', 0],
      expected: { list: ['edited', 'new'] },
    },
    {
      field: 'FallbackField',
      props: {
        schema: { ...list, type: ['array', 'string'] },
        useFallbackUiForUnsupportedType: true,
        initialFormData: ['a'],
      },
      arrayId: 'root',
      itemPath: [0],
      expected: ['edited', 'new'],
    },
    {
      field: 'CyclicSchemaField',
      props: {
        schema: { definitions: { node }, type: 'object', properties: { tree: { $ref: '#/definitions/node' } } },
        initialFormData: { tree: { list: [], next: { list: ['a'] } } },
      },
      arrayId: 'root_tree_next_list',
      itemPath: ['tree', 'next', 'list', 0],
      expected: { tree: { list: [], next: { list: ['edited', 'new'] } } },
    },
  ])('below $field, the add builds on the item set', async ({ field, props, arrayId, itemPath, expected }) => {
    const ref = createFormRef();
    function SetThenAdd({ id, items, onAddClick }: ArrayFieldTemplateProps) {
      return (
        <div>
          {items}
          <button
            type='button'
            onClick={(event) => {
              handleOf(ref).setFieldValue(itemPath, 'edited');
              onAddClick(event);
            }}
          >
            Set then add {id}
          </button>
        </div>
      );
    }
    const { getFormData } = createFormComponent({ ...props, ref, templates: { ArrayFieldTemplate: SetThenAdd } });
    if (field === 'CyclicSchemaField') {
      await user.click(screen.getAllByRole('button', { name: 'Expand Cycle' })[0]);
    }

    await user.click(screen.getByRole('button', { name: `Set then add ${arrayId}` }));

    expect(getFormData()).toMatchObject(expected);
  });
});

it.each([false, true])(
  'an edit renders zero unaffected rows or widgets in a 200-item form (controlled: %s)',
  async (controlled) => {
    const rows = new Map<number, number>();
    const widgets = new Map<string, number>();
    function CountingItem(props: ArrayFieldItemTemplateProps) {
      rows.set(props.index, (rows.get(props.index) ?? 0) + 1);
      return <DefaultItemTemplate {...props} />;
    }
    function CountingWidget({ id, value, onChange }: WidgetProps) {
      widgets.set(id, (widgets.get(id) ?? 0) + 1);
      return <input id={id} value={value ?? ''} onChange={(event) => onChange(event.target.value)} />;
    }
    const schema: RJSFSchema = { type: 'array', items: { type: 'string' } };
    const props = {
      schema,
      widgets: { TextWidget: CountingWidget },
      templates: { ArrayFieldItemTemplate: CountingItem },
    };
    const initial = Array.from({ length: 200 }, (_, index) => String(index));
    const { container } = controlled
      ? render(<AcceptingParent<string[]> {...props} initialValue={initial} />)
      : createFormComponent({ ...props, initialFormData: initial });
    const previousRows = new Map(rows);
    const previousWidgets = new Map(widgets);
    expect(previousRows.size).toBe(200);
    expect(previousWidgets.size).toBe(200);
    await user.type(input(container, 'root_0'), 'x');
    expect(widgets.get('root_0')).toBeGreaterThan(previousWidgets.get('root_0') ?? Infinity);
    for (let index = 1; index < 200; index++) {
      expect(rows.get(index)).toBe(previousRows.get(index));
      expect(widgets.get(`root_${index}`)).toBe(previousWidgets.get(`root_${index}`));
    }
  },
);

it('same-tick validation sees the custom errors a field raises with its edit', async () => {
  const ref = createFormRef();
  const results: boolean[] = [];
  function RaiseAndValidate({ fieldPath, onChange }: FieldProps) {
    return (
      <button
        type='button'
        onClick={() => {
          onChange('edited', fieldPath, { __errors: ['blocked'] });
          results.push(handleOf(ref).validateForm());
        }}
      >
        Raise and validate
      </button>
    );
  }
  const onError = vi.fn();
  createFormComponent({
    ref,
    schema,
    uiSchema: { name: { 'ui:field': RaiseAndValidate } },
    onError,
    initialFormData: { name: 'committed' },
  });

  await user.click(screen.getByRole('button', { name: 'Raise and validate' }));

  expect(results).toEqual([false]);
  expect(handleOf(ref).getFormData()).toEqual({ name: 'edited' });
  expect(onError).toHaveBeenLastCalledWith(expect.arrayContaining([expect.objectContaining({ message: 'blocked' })]));
});

it('a handle retained past the unmount still applies and reports operations', () => {
  const ref = createFormRef();
  const { onChange, unmount } = createFormComponent({ ref, schema, initialFormData: { name: 'a' } });
  const handle = handleOf(ref);
  unmount();
  onChange.mockClear();

  // A debounced widget or an autosave timer firing after a route change: the form is gone, its model is not
  handle.setFieldValue('name', 'later');

  expect(handle.getFormData()).toEqual({ name: 'later' });
  expectToHaveBeenCalledWithFormData(onChange, { name: 'later' }, 'root_name');
});

it.each(['layout', 'passive'] as const)(
  'a change a widget makes from its %s Effect cleanup as the form unmounts is applied and reported',
  (kind) => {
    const useCleanupEffect = kind === 'layout' ? useLayoutEffect : useEffect;
    function FlushOnUnmountWidget({ onChange, value }: WidgetProps) {
      useCleanupEffect(() => () => onChange('flushed', undefined, 'root_name'), [onChange]);
      return <span>{String(value ?? '')}</span>;
    }
    const { onChange, unmount } = createFormComponent({
      schema,
      initialFormData: { name: 'a' },
      uiSchema: { name: { 'ui:widget': FlushOnUnmountWidget } },
    });
    onChange.mockClear();

    unmount();

    expect(onChange).toHaveBeenCalledTimes(1);
    expectToHaveBeenCalledWithFormData(onChange, { name: 'flushed' }, 'root_name');
  },
);

it('a form hidden by Activity applies a retained handle and a late field change, and reports them at once', () => {
  const { RetainingWidget, change } = createRetainingWidget();
  const ref = createFormRef<{ name?: string }>();
  const onChange = vi.fn();
  const { hide, show } = renderInActivity(() => (
    <Form
      ref={ref}
      schema={schema}
      validator={validator}
      initialFormData={{ name: 'a' }}
      uiSchema={{ name: { 'ui:widget': RetainingWidget } }}
      onChange={onChange}
    />
  ));
  const handle = handleOf(ref);
  hide();

  act(() => {
    handle.setFieldValue('name', 'later');
    change('root_name', 'late');
  });

  expect(handle.getFormData()).toEqual({ name: 'late' });
  expect(onChange.mock.calls.map(([event]: IChangeEvent[]) => event.formData)).toEqual([
    { name: 'later' },
    { name: 'late' },
  ]);

  show();

  expect(screen.getByText('late')).toBeInTheDocument();
});

it('a form hidden by Activity shows an edit made while it was hidden, with no render of its own to show it', () => {
  const ref = createFormRef<{ name?: string }>();
  const form = (className: string) => (
    <Form ref={ref} className={className} schema={schema} validator={validator} initialFormData={{ name: 'a' }} />
  );
  const { container, hide, show } = renderInActivity((element: ReactNode) => element, form('mounted'));
  // Rendered once more, as most forms have been by the time they are hidden. The same element from then on, so
  // neither hiding nor showing the form renders it
  const rendered = form('rendered');
  show(rendered);
  const handle = handleOf(ref);
  hide(rendered);

  act(() => handle.setFieldValue('name', 'later'));
  show(rendered);

  expect(input(container, 'root_name')).toHaveValue('later');
});

it('a form hidden by Activity takes the data its parent passes while it is hidden', () => {
  interface Record {
    name?: string;
    other?: string;
  }
  const ref = createFormRef<Record>();
  const onChange = vi.fn();
  const { hide, show } = renderInActivity(
    (formData: Record) => (
      <Form
        ref={ref}
        schema={{ type: 'object', properties: { name: { type: 'string' }, other: { type: 'string' } } }}
        validator={validator}
        formData={formData}
        onChange={onChange}
      />
    ),
    { name: 'a', other: 'x' },
  );
  const handle = handleOf(ref);
  hide({ name: 'a', other: 'x' });

  // The parent loads another record while the form is hidden
  hide({ name: 'b', other: 'y' });

  expect(handle.getFormData()).toEqual({ name: 'b', other: 'y' });

  act(() => handle.setFieldValue('name', 'edited'));
  show({ name: 'b', other: 'y' });

  expectToHaveBeenCalledWithFormData(onChange, { name: 'edited', other: 'y' }, 'root_name');
});

it('a submit on a form hidden by Activity submits at once, after the change it reports', () => {
  const ref = createFormRef<{ name?: string }>();
  const calls: string[] = [];
  const { hide } = renderInActivity(() => (
    <Form
      ref={ref}
      schema={schema}
      validator={validator}
      initialFormData={{}}
      onChange={() => calls.push('change')}
      onSubmit={({ formData }) => calls.push(`submit ${JSON.stringify(formData)}`)}
    />
  ));
  const handle = handleOf(ref);
  hide();

  act(() => {
    handle.setFieldValue('name', 'later');
    handle.submit();
  });

  expect(calls).toEqual(['change', 'submit {"name":"later"}']);
});

describe('validateForm() from a passive Effect after a prop change (#5034)', () => {
  const schemaA: RJSFSchema = { type: 'string', minLength: 10, maxLength: 15 };
  const schemaB: RJSFSchema = { type: 'string', minLength: 20 };
  const valueA = 'invalid';
  const valueB = 'this is also invalid';

  type Validation = [RJSFSchema, string, boolean];

  function ValidatingParent({ validations }: { validations: Validation[] }) {
    const ref = useRef<FormRef<string>>(null);
    const [activeSchema, setActiveSchema] = useState(schemaA);
    const [formData, setFormData] = useState(valueA);
    useEffect(() => {
      validations.push([activeSchema, formData, handleOf(ref).validateForm()]);
    }, [validations, activeSchema, formData]);
    return (
      <>
        <Form<string>
          ref={ref}
          schema={activeSchema}
          validator={validator}
          formData={formData}
          onChange={(event) => setFormData(event.formData ?? '')}
          onError={noop}
        />
        <button type='button' onClick={() => setActiveSchema((previous) => (previous === schemaA ? schemaB : schemaA))}>
          Toggle schema
        </button>
        <button type='button' onClick={() => setFormData((previous) => (previous === valueA ? valueB : valueA))}>
          Toggle data
        </button>
      </>
    );
  }

  it('validates the initial props', () => {
    const validations: Validation[] = [];
    const { container } = render(<ValidatingParent validations={validations} />);

    expect(validations).toEqual([[schemaA, valueA, false]]);
    expect(errorListMessages(container)).toEqual(['must NOT have fewer than 10 characters']);
  });

  it('validates against the new schema', async () => {
    const validations: Validation[] = [];
    const { container } = render(<ValidatingParent validations={validations} />);

    await user.click(screen.getByRole('button', { name: 'Toggle schema' }));

    expect(validations.at(-1)).toEqual([schemaB, valueA, false]);
    expect(errorListMessages(container)).toEqual(['must NOT have fewer than 20 characters']);
  });

  it('validates the new data', async () => {
    const validations: Validation[] = [];
    const { container } = render(<ValidatingParent validations={validations} />);

    await user.click(screen.getByRole('button', { name: 'Toggle data' }));

    expect(validations.at(-1)).toEqual([schemaA, valueB, false]);
    expect(errorListMessages(container)).toEqual(['must NOT have more than 15 characters']);
  });

  it('renders the data a parent passes after validating only as it mounted, without the errors of the data it replaced', async () => {
    function ValidatedOnMountParent() {
      const ref = useRef<FormRef<string>>(null);
      const [formData, setFormData] = useState(valueA);
      useEffect(() => {
        handleOf(ref).validateForm();
      }, []);
      return (
        <>
          <Form<string> ref={ref} schema={schemaA} validator={validator} formData={formData} readonly onError={noop} />
          <button type='button' onClick={() => setFormData(valueB)}>
            Toggle data
          </button>
        </>
      );
    }
    const { container } = render(<ValidatedOnMountParent />);
    expect(errorListMessages(container)).toEqual(['must NOT have fewer than 10 characters']);

    await user.click(screen.getByRole('button', { name: 'Toggle data' }));

    expect(screen.getByRole('textbox')).toHaveValue(valueB);
    expect(errorListMessages(container)).toEqual([]);
  });
});
