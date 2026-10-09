import { useState } from 'react';
import type {
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
  errorListMessages,
  fieldErrorsById,
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

  it('lists a supplied error once when a root raise hands back the displayed errorSchema', async () => {
    const { container } = render(<RestylingParent extraErrors={otherServerErrors} />);
    const expected = ['.name must NOT have fewer than 8 characters', '.other from the server'];

    await submitForm(container.querySelector('form')!, user);
    expect(errorListMessages(container)).toEqual(expected);

    // What a root-level `ArrayField` reorder or an optional-data Remove does with the errors it displays
    await raise((field) => field.onChange(shortName, field.fieldPath, field.errorSchema));
    expect(errorListMessages(container)).toEqual(expected);

    await user.click(container.querySelector('button')!);
    expect(errorListMessages(container)).toEqual(expected);
  });

  it('clears a validator error when a field raises an empty error list', async () => {
    const { container } = render(<RestylingParent />);

    await submitForm(container.querySelector('form')!, user);
    // The shape `createErrorHandler()` and `ErrorSchemaBuilder.clearErrors()` produce
    await raise((field) => field.onChange('short', nameStreetPath, { __errors: [] }));

    expect(fieldErrorsById(container)).toEqual({});
    expect(errorListMessages(container)).toEqual([]);
  });

  it.each([
    { name: 'an empty error list', cleared: { __errors: [] } },
    { name: 'an empty errorSchema', cleared: {} },
  ] satisfies { name: string; cleared: ErrorSchema }[])(
    'clears a root custom error when a root raise has $name',
    async ({ cleared }) => {
      const { container } = render(<RestylingParent />);

      await raise((field) => field.onChange(shortName, field.fieldPath, { __errors: ['root own'] }));
      expect(errorListMessages(container)).toEqual(['. root own']);
      await raise((field) => field.onChange(shortName, field.fieldPath, cleared));

      expect(fieldErrorsById(container)).toEqual({});
      expect(errorListMessages(container)).toEqual([]);
    },
  );

  it('keeps the nested errors of a root raise with no validator error below it', async () => {
    const { container } = render(<RestylingParent />);

    await raise((field) => field.onChange(shortName, field.fieldPath, { other: { __errors: ['x'] } }));
    await user.click(container.querySelector('button')!);

    expect(fieldErrorsById(container)).toEqual({ root_other: ['x'] });
    expect(errorListMessages(container)).toEqual(['.other x']);
  });

  it('clears a validator error when a field raises only the supplied error it still displays', async () => {
    const { container } = render(<RestylingParent extraErrors={serverErrors} />);

    await submitForm(container.querySelector('form')!, user);
    expect(fieldErrorsById(container)).toEqual({
      root_name: ['must NOT have fewer than 8 characters', 'from the server'],
    });
    await raise((field) => field.onChange('short', nameStreetPath, { __errors: ['from the server'] }));
    await user.click(container.querySelector('button')!);

    expect(fieldErrorsById(container)).toEqual({ root_name: ['from the server'] });
    expect(errorListMessages(container)).toEqual(['.name from the server']);
  });

  it('keeps the validator error objects a raise hands back unchanged', async () => {
    const onChange = vi.fn();
    const { container } = render(<RestylingParent extraErrors={otherServerErrors} onChange={onChange} />);

    await submitForm(container.querySelector('form')!, user);
    const name: ErrorSchema<string> | undefined = rootField().errorSchema?.name;
    expect(name).toEqual({ __errors: ['must NOT have fewer than 8 characters'] });
    await raise((field) => field.onChange('short', nameStreetPath, name));

    const [{ errors }] = onChange.mock.calls.at(-1)!;
    expect(errors).toEqual([
      expect.objectContaining({ property: '.name', name: 'minLength', params: { limit: 8 } }),
      expect.objectContaining({ property: '.other', message: 'from the server' }),
    ]);
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

  // Add, copy, move and remove all remap through `remapItemErrors()`, so a move covers them
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

  it('lets the parent clear the extraErrors an ArrayField reorder remapped', async () => {
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

    // The reorder raises the remapped item errors, `server` among them, which must not become part of the stored
    // validator result
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
    'lets the parent clear the extraErrors an optional object Remove sent back, with $name',
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

      // Remove hands back the displayed `errorSchema`, `server` included, which must not outlive the prop supplying it
      await user.click(container.querySelector(`#${optionalControlsId('root_addr', 'Remove')}`)!);
      rerender(<Parent />);
      rerender(<Parent className='x' />);

      expect(errorListMessages(container)).toEqual(expected);
      expect(Object.values(fieldErrorsById(container)).flat()).toEqual(
        expected.map((stack) => stack.replace('.addr.street ', '')),
      );
    },
  );

  it('lets the parent clear the root extraErrors a root-path raise sent back', async () => {
    const streetSchema: RJSFSchema = { type: 'object', properties: { street: { type: 'string' } } };
    const rootServerErrors: ErrorSchema = { __errors: ['server'] };
    function Parent({ extraErrors, className }: { extraErrors?: ErrorSchema; className?: string }) {
      return (
        <Form
          schema={streetSchema}
          uiSchema={raisingUiSchema}
          validator={validator}
          formData={{ street: 'a' }}
          extraErrors={extraErrors}
          className={className}
        />
      );
    }
    const { container, rerender } = render(<Parent extraErrors={rootServerErrors} />);

    await submitForm(container.querySelector('form')!, user);
    expect(errorListMessages(container)).toEqual(['. server']);

    // A custom root `Field` handing back the `errorSchema` it displays, `server` included
    await raise((field) => field.onChange({ street: 'b' }, field.fieldPath, field.errorSchema));
    rerender(<Parent />);
    rerender(<Parent className='x' />);

    expect(errorListMessages(container)).toEqual([]);
    expect(fieldErrorsById(container)).toEqual({});
  });

  it('leaves the error an invalid schema is reported with to the validator when a root field hands it back', async () => {
    const invalid: RJSFSchema = { type: 'object', properties: { name: { type: 'string', minLength: -1 } } };
    function Parent({ current }: { current: RJSFSchema }) {
      return (
        <Form
          schema={current}
          uiSchema={raisingUiSchema}
          validator={validator}
          initialFormData={{ name: 'longenoughvalue' }}
        />
      );
    }
    const { container, rerender } = render(<Parent current={invalid} />);

    await submitForm(container, user);
    expect(errorListMessages(container)).toHaveLength(1);

    // The list carries the error with no `property`, the `ErrorSchema` under `$schema`: taken for the field's own, it
    // would outlive the schema it describes
    await raise((field) => field.onChange(field.formData, field.fieldPath, field.errorSchema));
    rerender(<Parent current={schema} />);

    expect(errorListMessages(container)).toEqual([]);
  });

  it('keeps the validator error when a raise hands back only errors supplied elsewhere', async () => {
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
    // The copy handed back is the validator's, and it replaces the field's earlier raise of the same message
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
