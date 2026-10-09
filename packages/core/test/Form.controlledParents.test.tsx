import { Component, useEffect, useLayoutEffect, useState } from 'react';
import type { ErrorSchema, FieldProps, RJSFSchema, RJSFValidationError, UiSchema, WidgetProps } from '@rjsf/utils';
import { getTemplates, getUiOptions } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';
import type { ControlledParentProps } from './testUtils.tsx';
import {
  AcceptingParent,
  RejectingParent,
  TransformingParent,
  aMicrotaskApart,
  createFormRef,
  createParentLog,
  createRetainingWidget,
  errorListMessages,
  fieldErrorsById,
  handleOf,
  input,
  outsideAct,
  submitForm,
} from './testUtils.tsx';

const user = userEvent.setup();

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    other: { type: 'string' },
  },
};

const lengthSchema: RJSFSchema = { type: 'object', properties: { name: { type: 'string', minLength: 3 } } };
const tooShort = 'must NOT have fewer than 3 characters';

interface Data {
  name?: string;
  other?: string | null;
}

describe('controlled parent harnesses', () => {
  it('an accepting parent commits each proposal and the form renders the committed value', async () => {
    const log = createParentLog<Data>();
    const { container } = render(<AcceptingParent<Data> schema={schema} initialValue={{ name: 'a' }} log={log} />);

    await user.type(input(container, 'root_name'), 'bc');

    expect(input(container, 'root_name')).toHaveValue('abc');
    expect(log.value).toEqual({ name: 'abc' });
    expect(log.proposals.at(-1)).toEqual({ name: 'abc' });
  });

  it('a rejecting parent records proposals while its value stays put', async () => {
    const log = createParentLog<Data>();
    const { container } = render(<RejectingParent<Data> schema={schema} initialValue={{ name: 'a' }} log={log} />);

    await user.type(input(container, 'root_name'), 'b');

    expect(log.proposals).toEqual([{ name: 'ab' }]);
    // A controlled form renders the parent's value (RFC, section 3.2): the refused edit is never shown
    expect(input(container, 'root_name')).toHaveValue('a');
  });

  it('a transforming parent commits the transformed proposal and the form renders it', async () => {
    const log = createParentLog<Data>();
    const upper = (proposal: Data | undefined) => proposal && { ...proposal, name: proposal.name?.toUpperCase() };
    const { container } = render(
      <TransformingParent<Data> schema={schema} initialValue={{ name: '' }} log={log} transform={upper} />,
    );

    await user.type(input(container, 'root_name'), 'ab');

    expect(log.proposals).toEqual([{ name: 'a' }, { name: 'Ab' }]);
    expect(log.value).toEqual({ name: 'AB' });
    expect(input(container, 'root_name')).toHaveValue('AB');
  });

  it('two same-tick changes from mount Effects both reach the parent', async () => {
    // The Form.handlers variant merges into an external variable, which proves nothing about composition through a
    // parent. Both proposals here precede parent acceptance, so the second builds on the first.
    function changeOnMount<V extends string | null | undefined>(from: string, to: string) {
      return function Widget(props: WidgetProps<V>) {
        const { value, id, onChange, uiSchema, registry } = props;
        const { BaseInputTemplate } = getTemplates(registry, getUiOptions(uiSchema));
        useEffect(() => {
          if (value === from) {
            onChange(to, undefined, id);
          }
        }, [value, onChange, id]);
        return <BaseInputTemplate {...props} />;
      };
    }
    const uiSchema: UiSchema<Data> = {
      name: { 'ui:widget': changeOnMount<Data['name']>('a', 'a2') },
      other: { 'ui:widget': changeOnMount<Data['other']>('b', 'b2') },
    };
    const log = createParentLog<Data>();

    await act(async () => {
      render(
        <AcceptingParent<Data>
          schema={schema}
          uiSchema={uiSchema}
          initialValue={{ name: 'a', other: 'b' }}
          log={log}
        />,
      );
    });

    await waitFor(() => expect(log.value).toEqual({ name: 'a2', other: 'b2' }));
  });

  it('a dependent field clearing itself from an effect when its sibling changes (#3367)', async () => {
    // The second field watches the first through formContext and clears itself from an effect, so its onChange(null)
    // fires in the very commit that shows the sibling's change, and both must survive the trip through the parent
    // (RFC, section 5).
    // The parent is written out rather than using the harness because formContext has to derive from its state.
    function ClearWhenSiblingChanges({
      formData,
      fieldPath,
      onChange,
      registry,
    }: FieldProps<string | null | undefined, RJSFSchema, Data>) {
      const sibling = registry.formContext.name;
      useEffect(() => {
        if (sibling) {
          onChange(null, fieldPath);
        }
      }, [sibling, fieldPath, onChange]);
      return <span id='root_other'>{formData ?? 'null'}</span>;
    }
    const uiSchema: UiSchema<Data, RJSFSchema, Data> = { other: { 'ui:field': ClearWhenSiblingChanges } };
    const committed: (Data | undefined)[] = [];
    function Parent() {
      const [data, setData] = useState<Data | undefined>({ name: '', other: 'keep' });
      committed.push(data);
      return (
        <Form<Data, RJSFSchema, Data>
          schema={schema}
          uiSchema={uiSchema}
          validator={validator}
          formData={data}
          formContext={{ name: data?.name }}
          onChange={(event) => setData(event.formData)}
        />
      );
    }
    const { container } = render(<Parent />);

    await user.type(input(container, 'root_name'), 'x');

    await waitFor(() => expect(committed.at(-1)).toEqual({ name: 'x', other: null }));
  });

  it('sibling null fields both reach the parent when they fill themselves in on mount', async () => {
    // Each `NullField` proposes `null` from a mount Effect, before the parent has rendered the other's proposal
    const log = createParentLog<{ a?: null; b?: null }>();
    await act(async () => {
      render(
        <AcceptingParent<{ a?: null; b?: null }>
          schema={{ type: 'object', properties: { a: { type: 'null' }, b: { type: 'null' } } }}
          initialValue={{}}
          log={log}
        />,
      );
    });

    expect(log.value).toEqual({ a: null, b: null });
  });

  it('an edit a field makes as it unmounts and one a field makes as it mounts both reach the parent', async () => {
    // One commit removes the first field and mounts the second. React runs what the removed field does as it goes
    // before it hands the commit to the form, and the mounting field's layout Effect after, so the hand-off comes
    // between two proposals that no render has answered, and the second must still build on the first.
    class EditsAsItUnmounts extends Component<WidgetProps<Data['name']>> {
      override componentWillUnmount() {
        this.props.onChange('left', undefined, this.props.id);
      }

      override render() {
        return null;
      }
    }
    function EditsAsItMounts({ value, id, onChange }: WidgetProps<Data['other']>) {
      useLayoutEffect(() => {
        if (value !== 'arrived') {
          onChange('arrived', undefined, id);
        }
      }, [value, onChange, id]);
      return null;
    }
    const log = createParentLog<Data>();
    const props = { schema, initialValue: { name: 'a', other: 'b' }, log };
    const { rerender } = render(
      <AcceptingParent<Data> {...props} uiSchema={{ name: { 'ui:widget': EditsAsItUnmounts } }} />,
    );

    rerender(<AcceptingParent<Data> {...props} uiSchema={{ other: { 'ui:widget': EditsAsItMounts } }} />);

    expect(log.proposals).toEqual([
      { name: 'left', other: 'b' },
      { name: 'left', other: 'arrived' },
    ]);
    expect(log.value).toEqual({ name: 'left', other: 'arrived' });
  });
});

describe('edits from outside React, the way a widget reports from a timer or a FileReader callback', () => {
  function renderRetaining() {
    const { RetainingWidget, change } = createRetainingWidget();
    const log = createParentLog<Data>();
    render(
      <AcceptingParent<Data>
        schema={schema}
        uiSchema={{ name: { 'ui:widget': RetainingWidget }, other: { 'ui:widget': RetainingWidget } }}
        initialValue={{ name: 'a', other: 'b' }}
        log={log}
      />,
    );
    return { change, log };
  }

  it('a second edit in the same task builds on the first, which the parent has yet to render', async () => {
    const { change, log } = renderRetaining();
    // React schedules the parent's update as it would in a browser
    await outsideAct(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve);
      });
      // Nothing renders between the two: the parent's answer to the first is still to come
      change('root_name', 'a2');
      change('root_other', 'b2');
      await waitFor(() => expect(log.value).toEqual({ name: 'a2', other: 'b2' }));
    });

    expect(log.proposals).toEqual([
      { name: 'a2', other: 'b' },
      { name: 'a2', other: 'b2' },
    ]);
  });

  it('a second edit a microtask later starts from the answer the parent has rendered by then', async () => {
    const { change, log } = renderRetaining();
    await outsideAct(async () => {
      // React flushes the form's render of the first proposal in the microtask between the two, and the parent's
      // update with it, so the second edit needs no proposal to build on
      await aMicrotaskApart(
        () => change('root_name', 'a2'),
        () => change('root_other', 'b2'),
      );
      await waitFor(() => expect(log.value).toEqual({ name: 'a2', other: 'b2' }));
    });
  });
});

describe('a blur in the same event as a controlled edit, under onBlur validation', () => {
  interface Named {
    name?: string;
  }
  /** The props of a form whose one widget, in a single click, changes its field to `sent`, blurs it, and then does
   * whatever `afterBlur` says. A test asks for them once, since each call makes a widget of its own.
   */
  function propsFor({
    sent = 'ab',
    afterBlur,
    onRender,
  }: {
    sent?: string;
    afterBlur?: (onChange: WidgetProps['onChange']) => void;
    onRender?: () => void;
  } = {}): ControlledParentProps<Named> {
    function ChangeThenBlurWidget({ id, onChange, onBlur, value }: WidgetProps) {
      onRender?.();
      return (
        <button
          type='button'
          onClick={() => {
            onChange(sent);
            onBlur(id, sent);
            afterBlur?.(onChange);
          }}
        >
          {`Set from ${String(value ?? '')}`}
        </button>
      );
    }
    return {
      schema: lengthSchema,
      uiSchema: { name: { 'ui:widget': ChangeThenBlurWidget } },
      initialValue: { name: 'abcd' },
      liveValidate: 'onBlur',
    };
  }

  it('shows the errors found for the edit once the parent renders it', async () => {
    const { container } = render(<AcceptingParent<Named> {...propsFor()} />);

    await user.click(screen.getByRole('button', { name: 'Set from abcd' }));

    expect(fieldErrorsById(container)).toEqual({ root_name: [tooShort] });
  });

  it('drops the errors found for an edit the parent refuses', async () => {
    const { container } = render(<RejectingParent<Named> {...propsFor()} />);

    await user.click(screen.getByRole('button', { name: 'Set from abcd' }));

    // The inputs still show 'abcd', which is valid, so no error describes data that is not on screen
    expect(fieldErrorsById(container)).toEqual({});
  });

  it.each<[string, Partial<ControlledParentProps<Named>>]>([
    ['only omits extra data', { liveValidate: undefined, omitExtraData: true, liveOmit: 'onBlur' }],
    // oxlint-disable-next-line typescript/no-deprecated -- exercises the deprecated `noValidate` prop
    ['belongs to a form told not to validate', { noValidate: true }],
  ])('validates nothing at the render when the blur %s', async (_, overrides) => {
    const { container } = render(<AcceptingParent<Named> {...propsFor()} {...overrides} />);

    await user.click(screen.getByRole('button', { name: 'Set from abcd' }));

    expect(screen.getByRole('button', { name: 'Set from ab' })).toBeInTheDocument();
    expect(fieldErrorsById(container)).toEqual({});
  });

  it('validates the value a transforming parent renders', async () => {
    const { container } = render(
      <TransformingParent<Named>
        {...propsFor({ sent: 'ab ' })}
        transform={(proposal) => ({ name: proposal?.name?.trim() })}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Set from abcd' }));

    // The proposal 'ab ' is long enough; the 'ab' the parent rendered is not
    expect(fieldErrorsById(container)).toEqual({ root_name: [tooShort] });
  });

  it('lets a reset later in the same event clear the errors', async () => {
    const ref = createFormRef<Named>();
    const props = propsFor({ afterBlur: () => handleOf(ref).reset() });
    const { container } = render(<AcceptingParent<Named> {...props} ref={ref} />);

    await user.click(screen.getByRole('button', { name: 'Set from abcd' }));

    expect(fieldErrorsById(container)).toEqual({});
  });

  it('validates nothing at the render when a reset and then a change follow the blur in the same event', async () => {
    const ref = createFormRef<Named>();
    const props = propsFor({
      afterBlur: (onChange) => {
        handleOf(ref).reset();
        onChange('ab');
      },
    });
    const { container } = render(<AcceptingParent<Named> {...props} ref={ref} />);

    await user.click(screen.getByRole('button', { name: 'Set from abcd' }));

    // The reset called off the validation the blur owed, and no blur has followed the change after it
    expect(screen.getByRole('button', { name: 'Set from ab' })).toBeInTheDocument();
    expect(fieldErrorsById(container)).toEqual({});
  });

  it('keeps a custom error a later change in the same event raises', async () => {
    const props = propsFor({ afterBlur: (onChange) => onChange('ab', { __errors: ['custom'] }) });
    const { container } = render(<AcceptingParent<Named> {...props} />);

    await user.click(screen.getByRole('button', { name: 'Set from abcd' }));

    expect(fieldErrorsById(container).root_name).toContain('custom');
  });

  it('renders the edit and its blur in one pass', async () => {
    const rendered = vi.fn();
    render(<AcceptingParent<Named> {...propsFor({ onRender: rendered })} />);
    rendered.mockClear();

    await user.click(screen.getByRole('button', { name: 'Set from abcd' }));

    expect(rendered).toHaveBeenCalledTimes(1);
  });
});

describe('an edit after another operation on an unanswered proposal, in the same event', () => {
  interface Fields {
    name?: string;
    other?: string;
    third?: string;
  }
  const fieldsSchema: RJSFSchema = {
    type: 'object',
    properties: { name: { type: 'string' }, other: { type: 'string' }, third: { type: 'string' } },
  };
  /** A form whose `name` widget does, in one click, whatever `onClick` says */
  function mount(formSchema: RJSFSchema, onClick: (onChange: WidgetProps['onChange']) => void) {
    const ref = createFormRef<Fields>();
    function ActingWidget({ onChange, value }: WidgetProps) {
      return (
        <button type='button' onClick={() => onClick(onChange)}>
          {`Act from ${String(value ?? '')}`}
        </button>
      );
    }
    const { container } = render(
      <AcceptingParent<Fields>
        schema={formSchema}
        uiSchema={{ name: { 'ui:widget': ActingWidget } }}
        initialValue={{ name: 'a', other: 'b' }}
        onError={() => {}}
        ref={ref}
      />,
    );
    return { ref, container };
  }

  it('does not bring back a custom error a reset cleared', async () => {
    const { ref, container } = mount(fieldsSchema, (onChange) => {
      onChange('x', { __errors: ['custom'] });
      handleOf(ref).reset();
      handleOf(ref).setFieldValue('other', 'z');
    });

    await user.click(screen.getByRole('button', { name: 'Act from a' }));

    expect(handleOf(ref).getFormData()).toEqual({ name: 'x', other: 'z' });
    expect(fieldErrorsById(container)).toEqual({});
  });

  it('keeps the errors a validateForm() found', async () => {
    const { ref, container } = mount({ ...fieldsSchema, required: ['third'] }, (onChange) => {
      onChange('x');
      handleOf(ref).validateForm();
      handleOf(ref).setFieldValue('other', 'z');
    });

    await user.click(screen.getByRole('button', { name: 'Act from a' }));

    expect(handleOf(ref).getFormData()).toEqual({ name: 'x', other: 'z' });
    expect(fieldErrorsById(container)).toEqual({ root_third: ["must have required property 'third'"] });
  });
});

describe('validating a controlled form again after exactly one edit', () => {
  it('shows the errors of a second submit', async () => {
    const onError = vi.fn();
    const { container } = render(
      <AcceptingParent<Data> schema={lengthSchema} initialValue={{ name: 'a' }} onError={onError} noHtml5Validate />,
    );
    await submitForm(container, user);
    // Pasted, so it is one change; it leaves the field invalid, and the render that shows it clears the field's errors
    await user.click(input(container, 'root_name'));
    await user.paste('b');
    expect(fieldErrorsById(container)).toEqual({});

    await submitForm(container, user);

    expect(onError).toHaveBeenCalledTimes(2);
    expect(fieldErrorsById(container)).toEqual({ root_name: [tooShort] });
  });

  it('shows the errors of a second blur under onBlur validation', async () => {
    const { container } = render(
      <AcceptingParent<Data> schema={lengthSchema} initialValue={{ name: 'a' }} liveValidate='onBlur' />,
    );
    await user.click(input(container, 'root_name'));
    await user.tab();
    await user.click(input(container, 'root_name'));
    await user.paste('b');
    expect(fieldErrorsById(container)).toEqual({});

    await user.tab();

    expect(fieldErrorsById(container)).toEqual({ root_name: [tooShort] });
  });
});

describe('extraErrors a parent sets from onSubmit, with a focusOnFirstError callback (#3827)', () => {
  interface Log {
    submitted: (Data | undefined)[];
    focused: RJSFValidationError[];
  }
  function SubmitValidatedParent({ log, extraErrorsAreWarnings }: { log: Log; extraErrorsAreWarnings?: boolean }) {
    const [extraErrors, setExtraErrors] = useState<ErrorSchema<Data>>();
    return (
      <Form<Data>
        schema={schema}
        validator={validator}
        initialFormData={{}}
        extraErrors={extraErrors}
        extraErrorsAreWarnings={extraErrorsAreWarnings}
        focusOnFirstError={(error) => log.focused.push(error)}
        onSubmit={({ formData }) => {
          log.submitted.push(formData);
          setExtraErrors({ name: { __errors: [formData?.name ? 'name is filled' : 'name is not filled'] } });
        }}
      />
    );
  }

  it('hands the callback the extra error on every submit the errors block', async () => {
    const log: Log = { submitted: [], focused: [] };
    const { container } = render(<SubmitValidatedParent log={log} />);

    await submitForm(container, user);
    await submitForm(container, user);
    await submitForm(container, user);

    // The first submit has no extra errors to block it; they block each one after it
    expect(log.submitted).toEqual([{}]);
    expect(log.focused.map((error) => error.stack)).toEqual(['.name name is not filled', '.name name is not filled']);
  });

  it('calls onSubmit on every submit, and shows what the latest one found, when the errors are warnings', async () => {
    const log: Log = { submitted: [], focused: [] };
    const { container } = render(<SubmitValidatedParent log={log} extraErrorsAreWarnings />);

    await user.type(input(container, 'root_name'), 'x');
    await submitForm(container, user);
    expect(errorListMessages(container)).toEqual(['.name name is filled']);
    await user.clear(input(container, 'root_name'));
    await submitForm(container, user);

    expect(log.submitted).toEqual([{ name: 'x' }, {}]);
    expect(errorListMessages(container)).toEqual(['.name name is not filled']);
  });

  it('hands the callback an error inside an array item, on every submit', async () => {
    const focused: RJSFValidationError[] = [];
    const { container } = render(
      <Form
        schema={{ type: 'array', items: { type: 'object', required: ['a'], properties: { a: { type: 'string' } } } }}
        validator={validator}
        initialFormData={[{}]}
        // The browser's own check of the required input would stop the submit before the schema is validated
        noHtml5Validate
        focusOnFirstError={(error) => focused.push(error)}
        onError={() => undefined}
      />,
    );

    await submitForm(container, user);
    await submitForm(container, user);

    expect(focused.map((error) => error.property)).toEqual(['.0.a', '.0.a']);
  });
});

describe('a widget that sets its value from an Effect as it mounts (#3953)', () => {
  interface Kinds {
    kind?: string;
    extra?: string;
  }
  const dependentSchema: RJSFSchema = {
    type: 'object',
    properties: { kind: { type: 'string' } },
    dependencies: {
      kind: {
        oneOf: [
          { properties: { kind: { const: 'plain' } } },
          { properties: { kind: { const: 'detailed' }, extra: { type: 'string' } } },
        ],
      },
    },
  };
  function ChoosesDetailedOnMount({ value, id, onChange }: WidgetProps<Kinds['kind']>) {
    useEffect(() => {
      if (value !== 'detailed') {
        onChange('detailed', undefined, id);
      }
    }, [value, onChange, id]);
    return <span>{value}</span>;
  }
  const uiSchema: UiSchema<Kinds> = { kind: { 'ui:widget': ChoosesDetailedOnMount } };

  it('renders the field the schema makes depend on that value, in a parent-owned form', () => {
    const log = createParentLog<Kinds>();
    const { container } = render(
      <AcceptingParent<Kinds>
        schema={dependentSchema}
        uiSchema={uiSchema}
        initialValue={{ kind: 'plain' }}
        log={log}
      />,
    );

    expect(log.value).toEqual({ kind: 'detailed' });
    expect(input(container, 'root_extra')).toBeVisible();
  });

  it('renders the field the schema makes depend on that value, in a self-owned form', () => {
    const { container } = render(
      <Form<Kinds>
        schema={dependentSchema}
        uiSchema={uiSchema}
        validator={validator}
        initialFormData={{ kind: 'plain' }}
      />,
    );

    expect(input(container, 'root_extra')).toBeVisible();
  });
});

describe('typing in a custom widget under a parent that renders for every change (#4299)', () => {
  function CustomTextarea({ id, value, onChange }: WidgetProps<Data['name']>) {
    return <textarea id={id} value={value ?? ''} onChange={(event) => onChange(event.target.value)} />;
  }

  it('keeps the element, its focus and the caret', async () => {
    // The parent hands the form a new `uiSchema` object with every render
    function Parent() {
      const [data, setData] = useState<Data | undefined>({});
      return (
        <Form<Data>
          schema={schema}
          validator={validator}
          formData={data}
          uiSchema={{ name: { 'ui:widget': CustomTextarea } }}
          onChange={(event) => setData(event.formData)}
        />
      );
    }
    const { container } = render(<Parent />);
    const textarea = screen.getByRole('textbox', { name: 'name' });

    await user.type(textarea, 'hello');
    await user.keyboard('{ArrowLeft}{ArrowLeft}X');

    expect(container.querySelector('#root_name')).toBe(textarea);
    expect(textarea).toHaveFocus();
    expect(textarea).toHaveValue('helXlo');
  });
});
