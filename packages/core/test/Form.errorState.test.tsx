import { useState } from 'react';
import type {
  ArrayFieldItemTemplateProps,
  ErrorListProps,
  ErrorSchema,
  ErrorTransformer,
  FieldProps,
  FormValidation,
  RJSFSchema,
  RJSFValidationError,
  UiSchema,
  WidgetProps,
} from '@rjsf/utils';
import { optionalControlsId, toFieldPath } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import type { FormProps } from '../src/index.ts';
import Form from '../src/index.ts';
import {
  createFormComponent,
  createFormRef,
  errorListMessages,
  fieldErrorsById,
  handleOf,
  input,
  setupConsoleErrorSuppression,
  submitForm,
} from './testUtils.tsx';

const user = userEvent.setup();

setupConsoleErrorSuppression();

describe('Error state consistency when deriving from new props', () => {
  const schema: RJSFSchema = {
    type: 'object',
    properties: { name: { type: 'string', minLength: 8 }, other: { type: 'string' } },
  };
  const relaxedSchema: RJSFSchema = {
    type: 'object',
    properties: { name: { type: 'string' }, other: { type: 'string' } },
  };
  const serverErrors: ErrorSchema = { name: { __errors: ['from the server'] } };
  const otherServerErrors: ErrorSchema = { other: { __errors: ['from the server'] } };
  const shortName = { name: 'short' };
  /** Raises a custom error on every keystroke, the way a widget validating as the user types does */
  const errorRaisingWidgets = {
    TextWidget: ({ id, value, onChange, onBlur }: WidgetProps) => (
      <input
        id={id}
        type='text'
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value, { __errors: [`custom:${event.target.value}`] })}
        onBlur={(event) => onBlur(id, event.target.value)}
      />
    ),
  };

  /** A root field that renders the `ObjectField` beside a button that raises through `onChange`, the way a custom root
   * `Field` does from an event handler of its own
   */
  const captureRootField = vi.fn<(fieldProps: FieldProps) => void>();
  let raiseOnClick: (field: FieldProps) => void = () => {};
  beforeEach(() => {
    captureRootField.mockClear();
  });
  function rootField() {
    const fieldProps = captureRootField.mock.lastCall?.[0];
    if (!fieldProps) {
      throw new Error('RaisingRootField has not rendered');
    }
    return fieldProps;
  }
  function RaisingRootField(fieldProps: FieldProps) {
    captureRootField(fieldProps);
    const { ObjectField } = fieldProps.registry.fields;
    return (
      <>
        <ObjectField {...fieldProps} />
        <button type='button' onClick={() => raiseOnClick(fieldProps)}>
          raise
        </button>
      </>
    );
  }
  async function raise(send: (field: FieldProps) => void) {
    raiseOnClick = send;
    await user.click(screen.getByRole('button', { name: 'raise' }));
  }
  const raisingUiSchema: UiSchema = { 'ui:field': RaisingRootField };

  /** A parent that never follows `onChange`, so every edit the user makes is declined
   */
  function IgnoringParent() {
    const [className, setClassName] = useState<string | undefined>(undefined);
    return (
      <>
        <button type='button' onClick={() => setClassName('x')}>
          restyle
        </button>
        <Form
          schema={schema}
          validator={validator}
          liveValidate='onChange'
          extraErrors={serverErrors}
          formData={shortName}
          className={className}
        />
      </>
    );
  }

  /** A controlled parent that echoes `onChange` back into `formData`, the ordinary controlled setup */
  function EchoingParent({ liveValidate, widgets }: Pick<FormProps, 'liveValidate' | 'widgets'>) {
    const [value, setValue] = useState<{ name?: string; other?: string }>(shortName);
    return (
      <>
        <button type='button' onClick={() => setValue({ name: 'longenoughvalue' })}>
          replace
        </button>
        <Form
          schema={schema}
          validator={validator}
          liveValidate={liveValidate}
          widgets={widgets}
          formData={value}
          onChange={(event) => setValue(event.formData)}
        />
      </>
    );
  }

  it('does not duplicate an extraError once the parent declined an edit', async () => {
    const { container } = render(<IgnoringParent />);

    // The parent keeps handing back `shortName`, so this keystroke is only a proposal, and the errors validated for it
    // go with it
    await user.type(container.querySelector<HTMLInputElement>('#root_name')!, 'x');
    await user.click(container.querySelector('button')!);

    expect(container.querySelector<HTMLInputElement>('#root_name')!.value).toBe('short');
    expect(fieldErrorsById(container)).toEqual({ root_name: ['from the server'] });
    expect(errorListMessages(container)).toEqual(['.name from the server']);
  });

  it('drops the stored validator errors when the schema stops producing them under onBlur', async () => {
    function SchemaSwappingParent() {
      const [current, setCurrent] = useState(schema);
      const [className, setClassName] = useState<string | undefined>(undefined);
      return (
        <>
          <button type='button' onClick={() => setCurrent(relaxedSchema)}>
            relax
          </button>
          <button type='button' onClick={() => setClassName('x')}>
            restyle
          </button>
          <Form
            schema={current}
            validator={validator}
            liveValidate='onBlur'
            formData={shortName}
            className={className}
          />
        </>
      );
    }
    const { container } = render(<SchemaSwappingParent />);
    const buttons = container.querySelectorAll('button');

    await user.click(container.querySelector<HTMLInputElement>('#root_name')!);
    await user.tab();
    expect(fieldErrorsById(container)).toEqual({ root_name: ['must NOT have fewer than 8 characters'] });

    await user.click(buttons[0]);
    expect(fieldErrorsById(container)).toEqual({});

    // The schema no longer has the rule, so no later prop change may bring its error back
    await user.click(buttons[1]);
    expect(fieldErrorsById(container)).toEqual({});
    expect(errorListMessages(container)).toEqual([]);
  });

  it('keeps a custom error raised on a path that already carries a validator error', async () => {
    // Restyles without a click, so the field the user is typing in is not blurred, which would validate it afresh
    function RestylingParent({ className }: { className?: string }) {
      return (
        <Form
          schema={schema}
          validator={validator}
          liveValidate='onBlur'
          widgets={errorRaisingWidgets}
          initialFormData={shortName}
          className={className}
        />
      );
    }
    const { container, rerender } = render(<RestylingParent />);

    await user.click(container.querySelector<HTMLInputElement>('#root_name')!);
    await user.tab();
    expect(fieldErrorsById(container)).toEqual({ root_name: ['must NOT have fewer than 8 characters'] });

    await user.type(container.querySelector<HTMLInputElement>('#root_name')!, 'y');
    // The raise is the field's say over its path, the validator's error there included, so the `ErrorList` says the
    // same as the field does, and a re-derivation merges the raise onto the validator's result again
    rerender(<RestylingParent className='x' />);

    expect(fieldErrorsById(container)).toEqual({ root_name: ['custom:shorty'] });
    expect(errorListMessages(container)).toEqual(['.name custom:shorty']);
  });

  /** A controlled parent that holds the data still and restyles the form, so a click is a non-data prop change */
  function RestylingParent(formProps: Pick<FormProps, 'extraErrors' | 'liveValidate' | 'onChange'>) {
    const [className, setClassName] = useState<string | undefined>(undefined);
    return (
      <>
        <button type='button' onClick={() => setClassName('x')}>
          restyle
        </button>
        <Form
          schema={schema}
          uiSchema={raisingUiSchema}
          validator={validator}
          formData={shortName}
          className={className}
          {...formProps}
        />
      </>
    );
  }
  const nameStreetPath = toFieldPath('name');

  it("keeps a field's raise over a validator error when the parent echoes the edit (#5347)", async () => {
    const { container } = render(<EchoingParent widgets={errorRaisingWidgets} />);

    await submitForm(container, user);
    expect(fieldErrorsById(container)).toEqual({ root_name: ['must NOT have fewer than 8 characters'] });

    await user.type(input(container, 'root_name'), 'x');

    expect(input(container, 'root_name')).toHaveValue('shortx');
    expect(fieldErrorsById(container)).toEqual({ root_name: ['custom:shortx'] });
    expect(errorListMessages(container)).toEqual(['.name custom:shortx']);
  });

  it.each([
    { name: 'an empty error list', cleared: { __errors: [] } },
    { name: 'an empty errorSchema', cleared: {} },
  ] satisfies { name: string; cleared: ErrorSchema }[])(
    "clears a field's earlier raise along with the validator error when the field raises $name (#5348)",
    async ({ cleared }) => {
      const { container } = render(<RestylingParent />);

      await raise((field) => field.onChange('short', nameStreetPath, { __errors: ['name own'] }));
      await submitForm(container, user);
      expect(fieldErrorsById(container)).toEqual({
        root_name: ['must NOT have fewer than 8 characters', 'name own'],
      });

      await raise((field) => field.onChange('short', nameStreetPath, cleared));
      expect(fieldErrorsById(container)).toEqual({});
      expect(errorListMessages(container)).toEqual([]);

      await user.click(screen.getByRole('button', { name: 'restyle' }));

      expect(fieldErrorsById(container)).toEqual({});
      expect(errorListMessages(container)).toEqual([]);
    },
  );

  it("lists a field's raise over a validator error beside that error once the form validates again", async () => {
    const { container } = render(
      <Form schema={schema} validator={validator} widgets={errorRaisingWidgets} initialFormData={shortName} />,
    );

    await submitForm(container, user);
    await user.type(input(container, 'root_name'), 'y');
    expect(errorListMessages(container)).toEqual(['.name custom:shorty']);

    await submitForm(container, user);

    expect(fieldErrorsById(container)).toEqual({
      root_name: ['must NOT have fewer than 8 characters', 'custom:shorty'],
    });
    expect(errorListMessages(container)).toEqual([
      '.name must NOT have fewer than 8 characters',
      '.name custom:shorty',
    ]);
  });

  it.each([
    { name: 'at a path with nothing to clear', earlier: undefined },
    { name: "that cleared the field's only raise", earlier: { __errors: ['other own'] } },
  ] satisfies { name: string; earlier: ErrorSchema | undefined }[])(
    'reports an error with no message after an empty raise $name',
    async ({ earlier }) => {
      const onError = vi.fn();
      const { container } = render(
        <Form
          schema={schema}
          uiSchema={raisingUiSchema}
          validator={validator}
          // Leaves the error in the list and out of the `ErrorSchema`, which is built from the messages
          transformErrors={(errors) => errors.map((error) => ({ ...error, message: undefined }))}
          initialFormData={shortName}
          onError={onError}
        />,
      );

      if (earlier) {
        await raise((field) => field.onChange(undefined, toFieldPath('other'), earlier));
      }
      await raise((field) => field.onChange(undefined, toFieldPath('other'), {}));
      await submitForm(container, user);

      expect(onError).toHaveBeenLastCalledWith([expect.objectContaining({ property: '.name', name: 'minLength' })]);
    },
  );

  it('keeps a root-path raise across a later prop change', async () => {
    const { container } = render(<RestylingParent />);

    await submitForm(container.querySelector('form')!, user);
    expect(fieldErrorsById(container)).toEqual({ root_name: ['must NOT have fewer than 8 characters'] });

    // What a custom root `Field` hands to `onChange`: like a raise at any other path, it replaces every error below it
    await raise((field) => field.onChange(shortName, field.fieldPath, { __errors: ['root level problem'] }));
    expect(fieldErrorsById(container)).toEqual({ root: ['root level problem'] });

    await user.click(container.querySelector('button')!);

    expect(fieldErrorsById(container)).toEqual({ root: ['root level problem'] });
    expect(errorListMessages(container)).toEqual(['. root level problem']);
  });

  it('keeps the errors a raise put below its path until the field raises again', async () => {
    const { container } = render(<RestylingParent />);

    await raise((field) => field.onChange(shortName, field.fieldPath, { name: { __errors: ['own'] } }));
    expect(fieldErrorsById(container)).toEqual({ root_name: ['own'] });

    await raise((field) => field.onChange(shortName, field.fieldPath));
    expect(fieldErrorsById(container)).toEqual({ root_name: ['own'] });

    await raise((field) => field.onChange(shortName, field.fieldPath, {}));
    expect(fieldErrorsById(container)).toEqual({});
  });

  it("keeps a field's own error that reads the same as one of the extraErrors once the parent clears those (#5348)", async () => {
    const { container, rerender } = render(<RestylingParent extraErrors={serverErrors} />);

    await raise((field) => field.onChange('short', nameStreetPath, { __errors: ['from the server'] }));
    expect(fieldErrorsById(container)).toEqual({ root_name: ['from the server'] });

    rerender(<RestylingParent />);

    expect(fieldErrorsById(container)).toEqual({ root_name: ['from the server'] });
    expect(errorListMessages(container)).toEqual(['.name from the server']);
  });

  it("lists a field's own error that reads the same as one of the extraErrors once", async () => {
    const { container } = render(<RestylingParent extraErrors={serverErrors} />);

    await raise((field) => field.onChange('short', nameStreetPath, { __errors: ['from the server'] }));

    expect(fieldErrorsById(container)).toEqual({ root_name: ['from the server'] });
    expect(errorListMessages(container)).toEqual(['.name from the server']);
  });

  it.each([
    {
      name: 'the root',
      schema: { type: 'string', minLength: 5 },
      id: 'root',
      message: 'must NOT have fewer than 5 characters',
    },
    {
      name: 'a required property',
      schema: { type: 'object', required: ['foo'], properties: { foo: { type: 'string', minLength: 5 } } },
      id: 'root_foo',
      message: 'must NOT have fewer than 5 characters',
    },
    {
      name: 'a required property that is missing',
      schema: { type: 'object', required: ['foo'], properties: { foo: { type: 'string' } } },
      id: 'root_foo',
      message: "must have required property 'foo'",
      emptied: true,
    },
  ] satisfies { name: string; schema: RJSFSchema; id: string; message: string; emptied?: boolean }[])(
    "lists a field's own error that reads the same as the validator's once, at $name",
    async ({ schema: validated, id, message, emptied = false }) => {
      const widgets = {
        TextWidget: ({ value, onChange }: WidgetProps) => (
          <input
            id={id}
            type='text'
            value={value ?? ''}
            onChange={(event) => onChange(event.target.value || undefined, { __errors: [message] })}
          />
        ),
      };
      const { container } = render(<Form schema={validated} validator={validator} widgets={widgets} />);

      await user.type(input(container, id), 'abc');
      if (emptied) {
        await user.clear(input(container, id));
      }
      await submitForm(container, user);

      expect(fieldErrorsById(container)).toEqual({ [id]: [message] });
      expect(errorListMessages(container)).toHaveLength(1);
    },
  );

  it("takes everything a raise holds for the field's own, the errors it was shown included", async () => {
    const { container, rerender } = render(<RestylingParent extraErrors={otherServerErrors} />);

    await submitForm(container, user);
    // Handing back the displayed `errorSchema` claims the validator's error and the parent's as the root field's own
    await raise((field) => field.onChange(shortName, field.fieldPath, field.errorSchema));
    rerender(<RestylingParent />);

    expect(fieldErrorsById(container)).toEqual({
      root_name: ['must NOT have fewer than 8 characters'],
      root_other: ['from the server'],
    });
  });

  it('leaves the validator errors a raise does not cover as the validator reported them', async () => {
    const pairSchema: RJSFSchema = {
      type: 'object',
      properties: { name: { type: 'string', minLength: 8 }, other: { type: 'string', minLength: 8 } },
    };
    const onChange = vi.fn();
    const { container } = render(
      <Form
        schema={pairSchema}
        uiSchema={raisingUiSchema}
        validator={validator}
        initialFormData={{ name: 'short', other: 'brief' }}
        onChange={onChange}
      />,
    );

    await submitForm(container, user);
    await raise((field) => field.onChange('short', nameStreetPath, { __errors: ['name own'] }));

    expect(onChange.mock.lastCall?.[0].errors).toEqual([
      expect.objectContaining({ property: '.other', name: 'minLength', params: { limit: 8 } }),
      { property: '.name', message: 'name own', stack: '.name name own' },
    ]);
  });

  it('reports a raise in the change it is made with when the form does not validate', async () => {
    const onChange = vi.fn();
    render(
      <Form
        schema={schema}
        uiSchema={raisingUiSchema}
        validator={validator}
        // oxlint-disable-next-line typescript/no-deprecated -- exercises the deprecated `noValidate` prop
        noValidate
        initialFormData={shortName}
        onChange={onChange}
      />,
    );

    await raise((field) => field.onChange('short', nameStreetPath, { __errors: ['name own'] }));

    expect(onChange.mock.lastCall?.[0].errorSchema).toEqual({ name: { __errors: ['name own'] } });
  });

  it('keeps the nested errors of a root raise with no validator error below it', async () => {
    const { container } = render(<RestylingParent />);

    await raise((field) => field.onChange(shortName, field.fieldPath, { other: { __errors: ['x'] } }));
    await user.click(screen.getByRole('button', { name: 'restyle' }));

    expect(fieldErrorsById(container)).toEqual({ root_other: ['x'] });
    expect(errorListMessages(container)).toEqual(['.other x']);
  });

  it('does not leave an emptied validator entry for an ancestor raise to mistake for an error', async () => {
    const addrSchema: RJSFSchema = {
      type: 'object',
      properties: {
        addr: { type: 'object', properties: { street: { type: 'string', minLength: 3 } } },
        other: { type: 'string' },
      },
    };
    const { container } = render(
      <Form
        schema={addrSchema}
        uiSchema={raisingUiSchema}
        validator={validator}
        liveValidate='onBlur'
        initialFormData={{ addr: { street: 'a' } }}
      />,
    );

    await submitForm(container.querySelector('form')!, user);
    // `FallbackField` clearing the errors of the value its type change replaced
    await raise((field) => field.onChange('a', toFieldPath('street', toFieldPath('addr')), {}));
    // With no validator error left at `addr`, this is a custom error, which a later validation pass keeps
    await raise((field) => field.onChange({ street: 'a' }, toFieldPath('addr'), { __errors: ['addr problem'] }));
    await user.click(container.querySelector<HTMLInputElement>('#root_other')!);
    await user.tab();

    expect(fieldErrorsById(container)).toEqual(expect.objectContaining({ root_addr: ['addr problem'] }));
  });

  describe('after an ArrayField reorder moved an invalid item', () => {
    const arraySchema: RJSFSchema = {
      type: 'object',
      properties: { arr: { type: 'array', items: { type: 'string', minLength: 3 } } },
    };
    const arrayData = { arr: ['a', 'bbbb', 'cccc'] };
    function Parent({
      restyles = 0,
      ...formProps
    }: Pick<FormProps, 'formData' | 'initialFormData'> & { restyles?: number }) {
      return <Form schema={arraySchema} validator={validator} className={`restyled-${restyles}`} {...formProps} />;
    }
    function inputValues(container: HTMLElement) {
      return Array.from(container.querySelectorAll('input'), (input) => input.value);
    }
    async function submitAndMoveFirstItemDown(container: HTMLElement) {
      await submitForm(container.querySelector('form')!, user);
      expect(fieldErrorsById(container)).toEqual({ root_arr_0: ['must NOT have fewer than 3 characters'] });
      await user.click(container.querySelectorAll<HTMLButtonElement>('.rjsf-array-item-move-down')[0]);
    }

    it('reports the moved error at its new index with what the validator said of it', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <Form schema={arraySchema} validator={validator} initialFormData={arrayData} onChange={onChange} />,
      );

      await submitAndMoveFirstItemDown(container);

      expect(onChange.mock.lastCall?.[0].errors).toEqual([
        expect.objectContaining({
          property: '.arr.1',
          stack: '.arr.1 must NOT have fewer than 3 characters',
          name: 'minLength',
          params: { limit: 3 },
        }),
      ]);
    });

    it('moves the error with its item below a custom field that passes its props on', async () => {
      function PassingObjectField(fieldProps: FieldProps) {
        const { ObjectField } = fieldProps.registry.fields;
        return <ObjectField {...fieldProps} />;
      }
      const { container } = render(
        <Form
          schema={arraySchema}
          uiSchema={{ 'ui:field': PassingObjectField }}
          validator={validator}
          initialFormData={arrayData}
        />,
      );

      await submitAndMoveFirstItemDown(container);

      expect(inputValues(container)).toEqual(['bbbb', 'a', 'cccc']);
      expect(fieldErrorsById(container)).toEqual({ root_arr_1: ['must NOT have fewer than 3 characters'] });
    });

    it('drops the errors of a removed item and moves up those of the items after it', async () => {
      const { container } = render(
        <Form schema={arraySchema} validator={validator} initialFormData={{ arr: ['a', 'bbbb', 'c'] }} />,
      );
      await submitForm(container, user);
      expect(Object.keys(fieldErrorsById(container))).toEqual(['root_arr_0', 'root_arr_2']);

      await user.click(container.querySelectorAll<HTMLButtonElement>('.rjsf-array-item-remove')[0]);

      expect(inputValues(container)).toEqual(['bbbb', 'c']);
      expect(fieldErrorsById(container)).toEqual({ root_arr_1: ['must NOT have fewer than 3 characters'] });
      expect(errorListMessages(container)).toEqual(['.arr.1 must NOT have fewer than 3 characters']);
    });

    it('keeps the error on its item when a custom item template moves the last item down', async () => {
      function AlwaysMovableItem({ children, buttonsProps }: ArrayFieldItemTemplateProps) {
        return (
          <div>
            {children}
            <button type='button' className='always-move-down' onClick={buttonsProps.onMoveDownItem}>
              down
            </button>
          </div>
        );
      }
      const { container } = render(
        <Form
          schema={arraySchema}
          validator={validator}
          templates={{ ArrayFieldItemTemplate: AlwaysMovableItem }}
          initialFormData={{ arr: ['aaaa', 'bbbb', 'c'] }}
        />,
      );
      await submitForm(container, user);
      expect(fieldErrorsById(container)).toEqual({ root_arr_2: ['must NOT have fewer than 3 characters'] });

      await user.click(container.querySelectorAll<HTMLButtonElement>('.always-move-down')[2]);

      expect(inputValues(container)).toEqual(['aaaa', 'bbbb', 'c']);
      expect(fieldErrorsById(container)).toEqual({ root_arr_2: ['must NOT have fewer than 3 characters'] });
      expect(errorListMessages(container)).toEqual(['.arr.2 must NOT have fewer than 3 characters']);
    });

    it('leaves the errors where they are when a custom field replaces the array without saying how it moved', async () => {
      const { container } = render(
        <Form schema={arraySchema} uiSchema={raisingUiSchema} validator={validator} initialFormData={arrayData} />,
      );
      await submitForm(container, user);

      await raise((field) => field.onChange(['bbbb', 'a', 'cccc'], toFieldPath('arr')));

      expect(inputValues(container)).toEqual(['bbbb', 'a', 'cccc']);
      expect(fieldErrorsById(container)).toEqual({ root_arr_0: ['must NOT have fewer than 3 characters'] });
    });

    it('keeps the error on the moved item in an uncontrolled form across later prop changes', async () => {
      const { container, rerender } = render(<Parent initialFormData={arrayData} />);

      await submitAndMoveFirstItemDown(container);
      expect(fieldErrorsById(container)).toEqual({ root_arr_1: ['must NOT have fewer than 3 characters'] });
      rerender(<Parent initialFormData={arrayData} restyles={1} />);

      expect(inputValues(container)).toEqual(['bbbb', 'a', 'cccc']);
      expect(fieldErrorsById(container)).toEqual({ root_arr_1: ['must NOT have fewer than 3 characters'] });
    });

    it('keeps the error on the original item when a controlled parent declines the reorder', async () => {
      // The parent never follows `onChange`, so the reorder is only a proposal and its own order stays shown
      const { container, rerender } = render(<Parent formData={arrayData} />);

      await submitAndMoveFirstItemDown(container);
      expect(inputValues(container)).toEqual(['a', 'bbbb', 'cccc']);
      expect(fieldErrorsById(container)).toEqual({ root_arr_0: ['must NOT have fewer than 3 characters'] });
      rerender(<Parent formData={arrayData} restyles={1} />);

      expect(inputValues(container)).toEqual(['a', 'bbbb', 'cccc']);
      expect(fieldErrorsById(container)).toEqual({ root_arr_0: ['must NOT have fewer than 3 characters'] });
    });

    it('keeps the error on the original item when a parent that declines the reorder answers it with an edit', async () => {
      const ref = createFormRef();
      const countedSchema: RJSFSchema = {
        type: 'object',
        properties: { arr: { type: 'array', items: { type: 'string', minLength: 3 } }, moves: { type: 'string' } },
      };
      let isCounted = false;
      // The edit is made while the reorder is still an unanswered proposal, so it builds on it
      const countMove = () => {
        if (!isCounted) {
          isCounted = true;
          handleOf(ref).setFieldValue('moves', 'one');
        }
      };
      const { container } = render(
        <Form ref={ref} schema={countedSchema} validator={validator} formData={arrayData} onChange={countMove} />,
      );

      await submitAndMoveFirstItemDown(container);

      expect(inputValues(container)).toEqual(['a', 'bbbb', 'cccc', '']);
      expect(fieldErrorsById(container)).toEqual({ root_arr_0: ['must NOT have fewer than 3 characters'] });
    });

    it('leaves no empty entry behind when the only item with an error is removed', async () => {
      const nestedSchema: RJSFSchema = { type: 'object', properties: { group: arraySchema } };
      const onChange = vi.fn();
      const { container } = render(
        <Form
          schema={nestedSchema}
          validator={validator}
          initialFormData={{ group: { arr: ['a'] } }}
          onChange={onChange}
        />,
      );
      await submitForm(container, user);
      expect(Object.keys(fieldErrorsById(container))).toEqual(['root_group_arr_0']);

      await user.click(container.querySelectorAll<HTMLButtonElement>('.rjsf-array-item-remove')[0]);

      expect(onChange.mock.lastCall?.[0].errors).toEqual([]);
      expect(onChange.mock.lastCall?.[0].errorSchema).toEqual({});
    });

    it('leaves an error a field raised under a key of the array that is no index where it is', async () => {
      const { container } = render(
        <Form schema={arraySchema} uiSchema={raisingUiSchema} validator={validator} initialFormData={arrayData} />,
      );
      await raise((field) => field.onChange(arrayData.arr, toFieldPath('arr'), { length: { __errors: ['too long'] } }));
      expect(errorListMessages(container)).toEqual(['.arr.length too long']);

      await user.click(container.querySelectorAll<HTMLButtonElement>('.rjsf-array-item-move-down')[0]);

      expect(inputValues(container)).toEqual(['bbbb', 'a', 'cccc']);
      expect(errorListMessages(container)).toEqual(['.arr.length too long']);
    });

    it('leaves an error a field raised for the array itself where it is', async () => {
      const { container } = render(
        <Form schema={arraySchema} uiSchema={raisingUiSchema} validator={validator} initialFormData={arrayData} />,
      );
      await raise((field) => field.onChange(arrayData.arr, toFieldPath('arr'), { __errors: ['too many'] }));
      expect(errorListMessages(container)).toEqual(['.arr too many']);

      await user.click(container.querySelectorAll<HTMLButtonElement>('.rjsf-array-item-move-down')[0]);

      expect(inputValues(container)).toEqual(['bbbb', 'a', 'cccc']);
      expect(errorListMessages(container)).toEqual(['.arr too many']);
    });

    it('clears the moved items errors when a controlled parent echoes the reorder', async () => {
      function EchoingArrayParent({ restyles = 0 }: { restyles?: number }) {
        const [value, setValue] = useState<unknown>(arrayData);
        return (
          <Form
            schema={arraySchema}
            validator={validator}
            className={`restyled-${restyles}`}
            formData={value}
            onChange={(event) => setValue(event.formData)}
          />
        );
      }
      const { container, rerender } = render(<EchoingArrayParent />);

      await submitForm(container.querySelector('form')!, user);
      expect(fieldErrorsById(container)).toEqual({ root_arr_0: ['must NOT have fewer than 3 characters'] });
      // The echo counts both moved items as changed, which clears their errors
      await user.click(container.querySelectorAll<HTMLButtonElement>('.rjsf-array-item-move-down')[0]);

      expect(inputValues(container)).toEqual(['bbbb', 'a', 'cccc']);
      expect(fieldErrorsById(container)).toEqual({});
      expect(errorListMessages(container)).toEqual([]);

      rerender(<EchoingArrayParent restyles={1} />);

      expect(fieldErrorsById(container)).toEqual({});
      expect(errorListMessages(container)).toEqual([]);
    });
  });

  // Add, copy, move and remove all go through `moveItemErrors()`, so a move covers them
  describe('after an ArrayField remaps its items in an uncontrolled form', () => {
    const items: RJSFSchema = { type: 'array', minItems: 4, items: { type: 'string', minLength: 3 } };
    it.each<[string, RJSFSchema, unknown, string]>([
      ['a root array', items, ['aaa', 'bbbb', 'cccc'], 'root'],
      ['a nested array', { type: 'object', properties: { arr: items } }, { arr: ['aaa', 'bbbb', 'cccc'] }, 'root_arr'],
    ])("keeps %s's own errors across later prop changes", async (_, schema, data, id) => {
      function Parent({ restyles = 0 }: { restyles?: number }) {
        return <Form schema={schema} validator={validator} className={`restyled-${restyles}`} initialFormData={data} />;
      }
      const { container, rerender } = render(<Parent />);
      const ownErrors = { [id]: ['must NOT have fewer than 4 items'] };

      await submitForm(container.querySelector('form')!, user);
      expect(fieldErrorsById(container)).toEqual(ownErrors);
      await user.click(container.querySelectorAll<HTMLButtonElement>('.rjsf-array-item-move-down')[0]);
      expect(fieldErrorsById(container)).toEqual(ownErrors);
      rerender(<Parent restyles={1} />);

      expect(fieldErrorsById(container)).toEqual(ownErrors);
      expect(errorListMessages(container)).toHaveLength(1);
    });
  });

  it('lets the parent clear the extraErrors of an item an ArrayField reorder moved', async () => {
    const arraySchema: RJSFSchema = {
      type: 'object',
      properties: { arr: { type: 'array', items: { type: 'string', minLength: 3 } } },
    };
    const arrayData = { arr: ['a', 'bbbb', 'cccc'] };
    const arrayServerErrors: ErrorSchema = { arr: { 2: { __errors: ['server'] } } };
    function Parent({ extraErrors }: { extraErrors?: ErrorSchema }) {
      return <Form schema={arraySchema} validator={validator} formData={arrayData} extraErrors={extraErrors} />;
    }
    const { container, rerender } = render(<Parent extraErrors={arrayServerErrors} />);

    await submitForm(container.querySelector('form')!, user);
    expect(errorListMessages(container)).toEqual(['.arr.0 must NOT have fewer than 3 characters', '.arr.2 server']);

    // The reorder moves only the errors the form holds: `server` stays the prop's, at the index the parent gave it
    await user.click(container.querySelectorAll<HTMLButtonElement>('.rjsf-array-item-move-down')[1]);
    rerender(<Parent />);

    expect(fieldErrorsById(container)).toEqual({ root_arr_0: ['must NOT have fewer than 3 characters'] });
    expect(errorListMessages(container)).toEqual(['.arr.0 must NOT have fewer than 3 characters']);
  });

  it.each([
    {
      name: 'a server message of its own',
      street: { type: 'string', minLength: 3 },
      server: 'server',
      expected: ['.addr.street must NOT have fewer than 3 characters'],
    },
    {
      name: 'the message the validator reports',
      street: { type: 'string', minLength: 3 },
      server: 'must NOT have fewer than 3 characters',
      expected: ['.addr.street must NOT have fewer than 3 characters'],
    },
    { name: 'the only error on the path', street: { type: 'string' }, server: 'server', expected: [] },
  ] satisfies { name: string; street: RJSFSchema; server: string; expected: string[] }[])(
    'takes none of the errors it displayed for its own when an optional object Remove is declined, with $name',
    async ({ street, server, expected }) => {
      const addrSchema: RJSFSchema = {
        type: 'object',
        properties: { addr: { type: 'object', properties: { street } } },
      };
      const addrUiSchema: UiSchema = { 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } };
      const addrData = { addr: { street: 'a' } };
      const addrServerErrors: ErrorSchema = { addr: { street: { __errors: [server] } } };
      function Parent({ extraErrors, className }: { extraErrors?: ErrorSchema; className?: string }) {
        return (
          <Form
            schema={addrSchema}
            uiSchema={addrUiSchema}
            validator={validator}
            formData={addrData}
            extraErrors={extraErrors}
            className={className}
          />
        );
      }
      const { container, rerender } = render(<Parent extraErrors={addrServerErrors} />);

      await submitForm(container.querySelector('form')!, user);
      expect(errorListMessages(container)).toEqual([...expected, `.addr.street ${server}`]);

      await user.click(container.querySelector(`#${optionalControlsId('root_addr', 'Remove')}`)!);
      rerender(<Parent />);
      rerender(<Parent className='x' />);

      // The Remove is a raise like any other: it took the validator's errors off its path until the form validates
      // again, whatever the parent does with the change
      expect(errorListMessages(container)).toEqual([]);

      await submitForm(container, user);

      expect(errorListMessages(container)).toEqual(expected);
      expect(Object.values(fieldErrorsById(container)).flat()).toEqual(
        expected.map((stack) => stack.replace('.addr.street ', '')),
      );
    },
  );

  it('clears the errors at and below an optional object it removes, the fields own included', async () => {
    const addrSchema: RJSFSchema = {
      type: 'object',
      properties: {
        addr: { type: 'object', properties: { street: { type: 'string', minLength: 3 }, city: { type: 'string' } } },
      },
    };
    const onSubmit = vi.fn();
    const { container } = render(
      <Form
        schema={addrSchema}
        uiSchema={{ 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } }}
        validator={validator}
        widgets={errorRaisingWidgets}
        initialFormData={{ addr: { street: 'a', city: 'b' } }}
        onSubmit={onSubmit}
      />,
    );
    await submitForm(container, user);
    await user.type(screen.getByLabelText('city'), 'c');
    expect(errorListMessages(container)).toEqual([
      '.addr.street must NOT have fewer than 3 characters',
      '.addr.city custom:bc',
    ]);

    await user.click(screen.getByRole('button', { name: 'Remove data for optional field' }));

    expect(errorListMessages(container)).toEqual([]);
    await submitForm(container, user);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('clears the errors at and below an additional property that is removed, the fields own included', async () => {
    const onSubmit = vi.fn();
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: { street: { type: 'string', minLength: 3 }, city: { type: 'string' } },
          },
        }}
        validator={validator}
        widgets={errorRaisingWidgets}
        initialFormData={{ addr: { street: 'a', city: 'b' } }}
        onSubmit={onSubmit}
      />,
    );
    await submitForm(container, user);
    await user.type(input(container, 'root_addr_city'), 'c');
    expect(errorListMessages(container)).toEqual([
      '.addr.street must NOT have fewer than 3 characters',
      '.addr.city custom:bc',
    ]);

    await user.click(container.querySelectorAll<HTMLButtonElement>('.rjsf-object-property-remove')[0]);

    expect(errorListMessages(container)).toEqual([]);
    await submitForm(container, user);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('clears the errors the fields of an anyOf option raised when the option is switched', async () => {
    const onSubmit = vi.fn();
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          properties: {
            payment: {
              anyOf: [
                { title: 'Card', type: 'object', properties: { holder: { type: 'string' } } },
                { title: 'Invoice', type: 'object', properties: { reference: { type: 'string' } } },
              ],
            },
          },
        }}
        validator={validator}
        widgets={errorRaisingWidgets}
        initialFormData={{ payment: { holder: 'b' } }}
        onSubmit={onSubmit}
      />,
    );
    await user.type(input(container, 'root_payment_holder'), 'c');
    expect(errorListMessages(container)).toEqual(['.payment.holder custom:bc']);

    await user.selectOptions(screen.getByRole('combobox'), 'Invoice');

    expect(errorListMessages(container)).toEqual([]);
    await submitForm(container, user);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('keeps the errors of the fields an anyOf still renders when the option is switched', async () => {
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          properties: { name: { type: 'string' }, code: { type: 'string', minLength: 3 } },
          anyOf: [
            {
              title: 'Card',
              properties: { name: { maxLength: 9 }, holder: { type: 'string' }, note: { type: 'string' } },
            },
            { title: 'Invoice', properties: { reference: { type: 'string' }, note: { type: 'string' } } },
          ],
        }}
        validator={validator}
        widgets={errorRaisingWidgets}
        initialFormData={{ name: 'a', code: 'b', holder: 'c', note: 'd' }}
      />,
    );
    await submitForm(container, user);
    await user.type(input(container, 'root_name'), 'x');
    await user.type(input(container, 'root_holder'), 'y');
    await user.type(input(container, 'root_note'), 'z');
    expect(errorListMessages(container)).toEqual([
      '.code must NOT have fewer than 3 characters',
      '.name custom:ax',
      '.holder custom:cy',
      '.note custom:dz',
    ]);

    await user.selectOptions(screen.getByRole('combobox'), 'Invoice');

    expect(errorListMessages(container)).toEqual([
      '.code must NOT have fewer than 3 characters',
      '.name custom:ax',
      '.note custom:dz',
    ]);
    expect(fieldErrorsById(container)).toEqual({
      root_code: ['must NOT have fewer than 3 characters'],
      root_name: ['custom:ax'],
      root_note: ['custom:dz'],
    });
  });

  it('moves the errors of an additional property to the name it is renamed to, the fields own included', async () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', additionalProperties: { type: 'string', minLength: 3 } }}
        validator={validator}
        widgets={errorRaisingWidgets}
        initialFormData={{ first: 'a', second: 'b' }}
      />,
    );
    const rename = async (from: string, to: string) => {
      const keyInput = input(container, `root_${from}-key`);
      await user.clear(keyInput);
      await user.type(keyInput, to);
      await user.tab();
    };
    await submitForm(container, user);
    await user.type(input(container, 'root_second'), 'c');
    expect(errorListMessages(container)).toEqual(['.first must NOT have fewer than 3 characters', '.second custom:bc']);

    await rename('first', 'primary');
    await rename('second', 'other');

    expect(errorListMessages(container)).toEqual([
      '.primary must NOT have fewer than 3 characters',
      '.other custom:bc',
    ]);
    expect(fieldErrorsById(container)).toEqual({
      root_primary: ['must NOT have fewer than 3 characters'],
      root_other: ['custom:bc'],
    });

    await user.type(input(container, 'root_primary'), 'bc');
    expect(fieldErrorsById(container)).toEqual({ root_primary: ['custom:abc'], root_other: ['custom:bc'] });
  });

  it('lists a message once when a field raises as its own what the validator also reported', async () => {
    const addrSchema: RJSFSchema = {
      type: 'object',
      properties: { addr: { type: 'object', properties: { street: { type: 'string', minLength: 3 } } } },
    };
    const minLengthError = 'must NOT have fewer than 3 characters';
    const streetPath = toFieldPath('street', toFieldPath('addr'));
    const { container } = render(
      <Form
        schema={addrSchema}
        uiSchema={raisingUiSchema}
        validator={validator}
        initialFormData={{ addr: { street: 'a' } }}
      />,
    );

    await raise((field) => field.onChange('a', streetPath, { __errors: [minLengthError] }));
    await submitForm(container.querySelector('form')!, user);
    const street: ErrorSchema<string> | undefined = rootField().errorSchema?.addr?.street;
    expect(street).toEqual({ __errors: [minLengthError] });
    await raise((field) => field.onChange('a', streetPath, street));

    expect(fieldErrorsById(container)).toEqual({ root_addr_street: [minLengthError] });
    // The raise takes the validator's copy off the path and replaces the field's earlier raise of the same message
    expect(errorListMessages(container)).toEqual([`.addr.street ${minLengthError}`]);

    // An empty raise at `street` must unset its node rather than leave `{ addr: { street: {} } }`, which the empty
    // raise at `addr` would read as the validator's error still being there, and the `addr` that leaves empty with it
    await raise((field) => field.onChange('a', streetPath, {}));
    expect(rootField().errorSchema).toEqual({});
    expect(fieldErrorsById(container)).toEqual({});
    expect(errorListMessages(container)).toEqual([]);
    await raise((field) => field.onChange({ street: 'a' }, toFieldPath('addr'), {}));

    expect(fieldErrorsById(container)).toEqual({});
    expect(errorListMessages(container)).toEqual([]);
  });

  it('clears the errors of a changed field in both the field and the error list while typing under onBlur', async () => {
    const { container } = render(<EchoingParent liveValidate='onBlur' />);

    await user.click(container.querySelector<HTMLInputElement>('#root_name')!);
    await user.tab();
    expect(fieldErrorsById(container)).toEqual({ root_name: ['must NOT have fewer than 8 characters'] });

    await user.type(container.querySelector<HTMLInputElement>('#root_name')!, 'y');

    expect(fieldErrorsById(container)).toEqual({});
    expect(errorListMessages(container)).toEqual([]);
  });

  it('drops the errors of data the parent replaced under onBlur', async () => {
    const { container } = render(<EchoingParent liveValidate='onBlur' />);

    await user.click(container.querySelector<HTMLInputElement>('#root_name')!);
    await user.tab();
    expect(fieldErrorsById(container)).toEqual({ root_name: ['must NOT have fewer than 8 characters'] });

    await user.click(container.querySelector('button')!);

    expect(container.querySelector<HTMLInputElement>('#root_name')!).toHaveValue('longenoughvalue');
    expect(fieldErrorsById(container)).toEqual({});
    expect(errorListMessages(container)).toEqual([]);
  });

  it('lists a server error once when a field raises a custom error with live validation off', async () => {
    // Uncontrolled, so nothing re-derives state from props afterwards and the merge below is the last word
    const { container } = render(
      <Form
        schema={schema}
        validator={validator}
        extraErrors={otherServerErrors}
        widgets={errorRaisingWidgets}
        initialFormData={shortName}
      />,
    );

    await submitForm(container.querySelector('form')!, user);
    expect(errorListMessages(container).filter((stack) => stack === '.other from the server')).toHaveLength(1);

    await user.type(container.querySelector<HTMLInputElement>('#root_name')!, 'y');

    expect(errorListMessages(container).filter((stack) => stack === '.other from the server')).toHaveLength(1);
  });

  describe('when a parent replaces data the last validation reported on (#5034)', () => {
    const tooShort = 'must NOT have fewer than 8 characters';
    const leaf: RJSFSchema = { type: 'string', minLength: 8 };
    const list: RJSFSchema = { type: 'array', items: leaf };
    const pair: RJSFSchema = { type: 'object', minProperties: 2, properties: { name: leaf, other: leaf } };
    const pairs: RJSFSchema = { type: 'object', properties: { first: pair, second: pair } };

    it.each([
      {
        name: 'a root primitive has no error left',
        schema: leaf,
        before: 'short',
        validated: [tooShort],
        after: 'brief',
        remaining: [],
      },
      {
        name: 'a root array of another length has no error left',
        schema: list,
        before: ['short'],
        validated: [`.0 ${tooShort}`],
        after: ['short', 'brief'],
        remaining: [],
      },
      {
        name: "a root array of the same length keeps an unchanged item's error",
        schema: list,
        before: ['short', 'brief'],
        validated: [`.0 ${tooShort}`, `.1 ${tooShort}`],
        after: ['short', 'other'],
        remaining: [`.0 ${tooShort}`],
      },
      {
        name: 'a root object that only gained a key holding undefined keeps every error',
        schema: pair,
        before: { name: 'short' },
        validated: ['must NOT have fewer than 2 properties', `.name ${tooShort}`],
        after: { name: 'short', other: undefined },
        remaining: ['must NOT have fewer than 2 properties', `.name ${tooShort}`],
      },
      {
        name: 'a root object that only lost a key holding undefined keeps every error',
        schema: pair,
        before: { name: 'short', other: undefined },
        validated: ['must NOT have fewer than 2 properties', `.name ${tooShort}`],
        after: { name: 'short' },
        remaining: ['must NOT have fewer than 2 properties', `.name ${tooShort}`],
      },
      {
        name: 'an object under a property that only gained or lost a key holding undefined keeps every error',
        schema: pairs,
        before: { first: { name: 'short', other: undefined }, second: { name: 'short' } },
        validated: [
          '.first must NOT have fewer than 2 properties',
          `.first.name ${tooShort}`,
          '.second must NOT have fewer than 2 properties',
          `.second.name ${tooShort}`,
        ],
        after: { first: { name: 'short' }, second: { name: 'short', other: undefined } },
        remaining: [
          '.first must NOT have fewer than 2 properties',
          `.first.name ${tooShort}`,
          '.second must NOT have fewer than 2 properties',
          `.second.name ${tooShort}`,
        ],
      },
      {
        name: "a root object whose changed key splits to no path keeps an unchanged field's error",
        schema: { type: 'object', properties: { '': { type: 'string' }, name: leaf } },
        before: { '': 'a', name: 'short' },
        validated: [`.name ${tooShort}`],
        after: { '': 'b', name: 'short' },
        remaining: [`.name ${tooShort}`],
      },
      {
        name: 'a root value of another type has no error left',
        schema: pair,
        before: { name: 'short', other: 'brief' },
        validated: [`.name ${tooShort}`, `.other ${tooShort}`],
        after: 'short',
        remaining: [],
      },
      {
        name: "the root object loses its own error and keeps an unchanged field's",
        schema: pair,
        before: { name: 'short' },
        validated: ['must NOT have fewer than 2 properties', `.name ${tooShort}`],
        after: { name: 'short', other: 'longenough' },
        remaining: [`.name ${tooShort}`],
      },
    ] satisfies {
      name: string;
      schema: RJSFSchema;
      before: unknown;
      validated: string[];
      after: unknown;
      remaining: string[];
    }[])('$name', async ({ schema, before, validated, after, remaining }) => {
      const { container, node, rerender } = createFormComponent({ schema, formData: before });

      await submitForm(node, user);
      expect(errorListMessages(container)).toEqual(validated);

      rerender({ schema, formData: after });

      expect(errorListMessages(container)).toEqual(remaining);
    });

    it('keeps the error an invalid schema is reported with, which describes no field, when a field changes', async () => {
      const invalid: RJSFSchema = { type: 'object', properties: { name: { type: 'string', minLength: -1 } } };
      const { container, node, rerender } = createFormComponent({ schema: invalid, formData: { name: 'a' } });

      await submitForm(node, user);
      const listed = errorListMessages(container);
      expect(listed).toHaveLength(1);

      rerender({ schema: invalid, formData: { name: 'b' } });

      expect(errorListMessages(container)).toEqual(listed);
    });

    it('keeps the error an invalid schema is reported with, listed and in the ErrorSchema, when the root value itself is replaced', async () => {
      const shown = vi.fn<(errorList: Pick<ErrorListProps, 'errors' | 'errorSchema'>) => void>();
      const props = {
        schema: { type: 'string', minLength: -1 } satisfies RJSFSchema,
        templates: {
          ErrorListTemplate: ({ errors, errorSchema }: ErrorListProps) => {
            shown({ errors, errorSchema });
            return null;
          },
        },
      };
      const { node, rerender } = createFormComponent({ ...props, formData: 'a' });

      await submitForm(node, user);
      const validated = shown.mock.lastCall?.[0];
      expect(validated?.errors).toHaveLength(1);
      expect(validated?.errorSchema).not.toEqual({});

      rerender({ ...props, formData: 'b' });

      expect(shown.mock.lastCall?.[0]).toEqual(validated);
    });

    it.each([
      {
        name: 'a message',
        transformErrors: (errors) => errors.map((error) => ({ ...error, message: `translated: ${error.stack}` })),
      },
      {
        name: 'a message and another stack',
        transformErrors: (errors) =>
          errors.map((error) => ({
            ...error,
            message: `translated: ${error.stack}`,
            stack: `translated: ${error.stack}`,
          })),
      },
    ] satisfies {
      name: string;
      transformErrors: ErrorTransformer;
    }[])(
      'keeps the error an invalid schema is reported with listed when a transformErrors gave it $name',
      async ({ transformErrors }) => {
        const invalid: RJSFSchema = { type: 'object', properties: { name: { type: 'string', minLength: -1 } } };
        const props = { schema: invalid, transformErrors };
        const { container, node, rerender } = createFormComponent({ ...props, formData: { name: 'a' } });

        await submitForm(node, user);
        const listed = errorListMessages(container);
        expect(listed).toHaveLength(1);

        rerender({ ...props, formData: { name: 'b' } });

        expect(errorListMessages(container)).toEqual(listed);
      },
    );

    it('keeps every error when the parent renders a root NaN again', async () => {
      const props = {
        schema: { type: 'number' } satisfies RJSFSchema,
        formData: Number.NaN,
        customValidate: (_: unknown, errors: FormValidation) => {
          errors.addError('is not a number');
          return errors;
        },
      };
      const { container, node, rerender } = createFormComponent(props);

      await submitForm(node, user);
      const listed = errorListMessages(container);
      expect(listed).not.toHaveLength(0);

      rerender({ ...props, className: 'rerendered' });

      expect(errorListMessages(container)).toEqual(listed);
    });

    it('clears a root error listed with a message and no property from the list as from the root field', async () => {
      const transformErrors: ErrorTransformer = (errors) => [...errors, { message: 'form-level', stack: 'form-level' }];
      const props = { schema: pair, transformErrors };
      const { container, node, rerender } = createFormComponent({
        ...props,
        formData: { name: 'short', other: 'brief' },
      });

      await submitForm(node, user);
      expect(errorListMessages(container)).toEqual([`.name ${tooShort}`, `.other ${tooShort}`, 'form-level']);
      expect(fieldErrorsById(container)).toEqual({
        root: ['form-level'],
        root_name: [tooShort],
        root_other: [tooShort],
      });

      rerender({ ...props, formData: { name: 'short', other: 'longenough' } });

      expect(errorListMessages(container)).toEqual([`.name ${tooShort}`]);
      expect(fieldErrorsById(container)).toEqual({ root_name: [tooShort] });
    });

    it('clears the errors of a property named $schema, and a root error listed without a property, like any other', async () => {
      const named: RJSFSchema = {
        type: 'object',
        properties: { $schema: { type: 'string', minLength: 50 }, name: { type: 'string', minLength: 8 } },
      };
      const transformErrors: ErrorTransformer = (errors) => [...errors, { message: 'form-level', stack: 'form-level' }];
      const props = { schema: named, transformErrors };
      const { container, node, rerender } = createFormComponent({
        ...props,
        formData: { $schema: 'short', name: 'short' },
      });

      await submitForm(node, user);
      expect(errorListMessages(container)).toEqual([
        '.$schema must NOT have fewer than 50 characters',
        `.name ${tooShort}`,
        'form-level',
      ]);

      rerender({ ...props, formData: { $schema: 'x'.repeat(50), name: 'longenough' } });

      expect(errorListMessages(container)).toEqual([]);
      expect(fieldErrorsById(container)).toEqual({});
    });

    it('leaves no node of a container whose errors a parent cleared for a raise there to read as the validator still reporting', async () => {
      const nested: RJSFSchema = {
        type: 'object',
        properties: { foo: { type: 'object', properties: { bar: leaf, baz: { type: 'string' } } } },
      };
      // A `customValidate` has the validators file an empty `__errors` at every node of the data
      const customValidate = (_: unknown, errors: FormValidation) => errors;
      function ClearingParent() {
        const [value, setValue] = useState<unknown>({ foo: { bar: 'short', baz: 'b' } });
        return (
          <>
            <button type='button' onClick={() => setValue({ foo: { bar: 'longenough', baz: 'b' } })}>
              replace
            </button>
            <Form
              schema={nested}
              uiSchema={raisingUiSchema}
              validator={validator}
              customValidate={customValidate}
              formData={value}
              onChange={(event) => setValue(event.formData)}
            />
          </>
        );
      }
      const { container } = render(<ClearingParent />);

      await submitForm(container.querySelector('form')!, user);
      expect(fieldErrorsById(container)).toEqual({ root_foo_bar: [tooShort] });
      await user.click(screen.getByRole('button', { name: 'replace' }));
      expect(fieldErrorsById(container)).toEqual({});
      await raise((field) =>
        field.onChange({ bar: 'longenough', baz: 'b' }, toFieldPath('foo'), { __errors: ['own'] }),
      );
      expect(fieldErrorsById(container)).toEqual({ root_foo: ['own'] });

      // The echo of an edit below `foo` clears the validator's errors at `foo`, so a raise kept there as the
      // validator's would go with them
      await user.type(container.querySelector<HTMLInputElement>('#root_foo_baz')!, 'x');

      expect(fieldErrorsById(container)).toEqual({ root_foo: ['own'] });
    });

    it('keeps an error with no message listed when extraErrors arrive after the only error with one was cleared', async () => {
      const both: RJSFSchema = { type: 'object', properties: { name: leaf, other: leaf } };
      const props = {
        schema: both,
        // Leaves the `.name` error in the list and out of the `ErrorSchema`, which is built from the messages
        transformErrors: (errors: RJSFValidationError[]) =>
          errors.map((error) => (error.property === '.name' ? { ...error, message: undefined } : error)),
      };
      const { container, node, rerender } = createFormComponent({ ...props, formData: { name: 'a', other: 'b' } });

      await submitForm(node, user);
      rerender({ ...props, formData: { name: 'a', other: 'c' } });
      expect(errorListMessages(container)).toEqual([`.name ${tooShort}`]);

      rerender({
        ...props,
        formData: { name: 'a', other: 'c' },
        extraErrors: { other: { __errors: ['from the server'] } },
      });

      expect(errorListMessages(container)).toEqual([`.name ${tooShort}`, '.other from the server']);
    });

    it('keeps every error when the parent renders the same data again', async () => {
      const { container, node, rerender } = createFormComponent({ schema: leaf, formData: 'short' });

      await submitForm(node, user);
      rerender({ schema: leaf, formData: 'short' });

      expect(errorListMessages(container)).toEqual([tooShort]);
    });
  });
});
