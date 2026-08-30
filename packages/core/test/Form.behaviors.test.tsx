import { createRef, useEffect, useRef, useState, useCallback } from 'react';
import type { ErrorSchema, Experimental_DefaultFormStateBehavior, FieldProps, RJSFSchema, UiSchema } from '@rjsf/utils';
import { bracketNameGenerator, buttonId, dotNotationNameGenerator, optionalControlsId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { FormProps, IChangeEvent } from '../src/index.ts';
import Form from '../src/index.ts';
import type { NoValFormProps } from './testUtils.tsx';
import {
  actWrappedDelayPromise,
  createComponent,
  createFormComponent,
  delayPromise,
  expectToHaveBeenCalledWithFormData,
  setupConsoleErrorSuppression,
  submitForm,
} from './testUtils.tsx';
import widgetsSchema from './widgets_schema.json';

const user = userEvent.setup();

setupConsoleErrorSuppression();

describe('Error paths that collide with prototype keys', () => {
  it('renders the inline error for a field literally named "constructor"', async () => {
    // An explicit own-property string value (rather than an absent/required one) is used deliberately:
    // formData.constructor otherwise resolves to the inherited Object constructor function via normal JS
    // property access, which is a pre-existing, unrelated quirk of validating plain objects against
    // JSON Schema and not what this test is pinning down.
    // Typed separately: a literal `constructor:` key inline gets contextually typed against
    // Object.prototype.constructor instead of RJSFSchema's index signature.
    const constructorFieldSchema: RJSFSchema = { type: 'string', minLength: 5 };
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        constructor: constructorFieldSchema,
      },
    };
    const formRef = createRef<Form>();
    const { node } = createFormComponent({ ref: formRef, schema, formData: { constructor: 'ab' } });

    await submitForm(node, user);

    expect(node.querySelectorAll('.error-detail')).toHaveLength(1);
    expect(node.querySelector('.error-detail')).toHaveTextContent('must NOT have fewer than 5 characters');
    expect(formRef.current!.state.errorSchema).toEqual({
      constructor: { __errors: ['must NOT have fewer than 5 characters'] },
    });
    // No actual prototype pollution occurred while building the error schema.
    expect(({} as { __errors?: string[] }).__errors).toBeUndefined();
  });
});

describe('Live validation onBlur', () => {
  const schema: RJSFSchema = {
    type: 'string',
    minLength: 8,
  };

  it('does not occur during onChange, no errors produced', async () => {
    const onBlur = vi.fn();
    const { node, onChange } = createFormComponent({
      schema,
      onBlur,
      liveValidate: 'onBlur',
    });
    await user.type(node.querySelector<HTMLInputElement>('input[type=text]')!, 'short');
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: 'short',
        errorSchema: {},
      }),
      'root',
    );

    expect(onBlur).not.toHaveBeenCalled();
  });

  it('occurs during onBlur, onChange not called during blur due to no state update', async () => {
    const onBlur = vi.fn();
    const { node, onChange } = createFormComponent({
      schema,
      onBlur,
      liveValidate: 'onBlur',
    });
    const element = node.querySelector<HTMLInputElement>('input[type=text]')!;
    await user.type(element, 'longenough');
    const changeCallCount = onChange.mock.calls.length;
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: 'longenough',
        errorSchema: {},
      }),
      'root',
    );

    await user.tab();

    expect(onBlur).toHaveBeenLastCalledWith('root', 'longenough');
    expect(onChange).toHaveBeenCalledTimes(changeCallCount);
  });

  it('occurs during onBlur, onChange called during blur with errors due to a state update', async () => {
    const onBlur = vi.fn();
    const { node, onChange } = createFormComponent({
      schema,
      onBlur,
      liveValidate: 'onBlur',
    });
    const element = node.querySelector<HTMLInputElement>('input[type=text]')!;
    await user.type(element, 'short');
    const changeCallCount = onChange.mock.calls.length;
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: 'short',
        errorSchema: {},
      }),
      'root',
    );

    await user.tab();

    expect(onBlur).toHaveBeenLastCalledWith('root', 'short');
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: 'short',
        errorSchema: {
          __errors: ['must NOT have fewer than 8 characters'],
        },
      }),
      'root',
    );
    expect(onChange).toHaveBeenCalledTimes(changeCallCount + 1);
  });
});

describe('omitExtraData and live omit onBlur', () => {
  const schema: RJSFSchema = {
    type: 'object',
    properties: {
      foo: { type: 'string' },
      bar: { type: 'string' },
    },
  };
  const formData = { foo: 'foo', bar: 'bar' };
  const formData1 = { foo: 'foo', bar: 'bar', baz: 'baz' };

  it('does not occur during onChange, no extra data removed', async () => {
    const onBlur = vi.fn();
    const { node, onChange } = createFormComponent({
      schema,
      formData: formData1,
      onBlur,
      omitExtraData: true,
      liveOmit: 'onBlur',
    });

    await user.clear(node.querySelector('#root_foo')!);
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: { ...formData1, foo: undefined },
      }),
      'root_foo',
    );

    expect(onBlur).not.toHaveBeenCalled();
  });

  it('occurs during onBlur, onChange not called during blur due to no state update', async () => {
    const onBlur = vi.fn();
    const { node, onChange } = createFormComponent({
      schema,
      formData, // Use form data with nothing to omit to test case
      onBlur,
      omitExtraData: true,
      liveOmit: 'onBlur',
    });
    await user.clear(node.querySelector('#root_foo')!);
    await user.type(node.querySelector('#root_foo')!, 'foo');
    const changeCallCount = onChange.mock.calls.length;

    await user.tab();

    expect(onBlur).toHaveBeenLastCalledWith('root_foo', 'foo');
    expect(onChange).toHaveBeenCalledTimes(changeCallCount);
  });

  it('occurs during onBlur, onChange called during blur due to extra data removal in state', async () => {
    const onBlur = vi.fn();
    const { node, onChange } = createFormComponent({
      schema,
      formData: formData1,
      onBlur,
      omitExtraData: true,
      liveOmit: 'onBlur',
    });
    await user.clear(node.querySelector('#root_foo')!);
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: { ...formData1, foo: undefined },
      }),
      'root_foo',
    );
    const changeCallCount = onChange.mock.calls.length;

    await user.tab();

    expect(onBlur).toHaveBeenLastCalledWith('root_foo', '');
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: { bar: 'bar', foo: undefined },
      }),
      'root_foo',
    );
    expect(onChange).toHaveBeenCalledTimes(changeCallCount + 1);
  });
});

describe('Form omitExtraData and liveOmit', () => {
  it('should call omitExtraData when the omitExtraData prop is true and liveOmit is true', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: {
          type: 'string',
        },
      },
    };
    const formData = {
      foo: 'bar',
    };
    const omitExtraData = true;
    const liveOmit = true;
    const ref = createRef<Form>();

    const { node } = createFormComponent({
      ref,
      schema,
      formData,
      omitExtraData,
      liveOmit,
    });

    const theSpy = vi.spyOn(ref.current!, 'omitExtraData').mockReturnValue({ foo: '' });

    await user.clear(node.querySelector('[type=text]')!);
    await user.type(node.querySelector('[type=text]')!, 'new');

    expect(theSpy).toHaveBeenCalled();
  });

  it('should not call omitExtraData when the omitExtraData prop is true and liveOmit is unspecified', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: {
          type: 'string',
        },
      },
    };
    const formData = {
      foo: 'bar',
    };
    const omitExtraData = true;
    const ref = createRef<Form>();
    const { node } = createFormComponent({
      ref,
      schema,
      formData,
      omitExtraData,
    });

    const theSpy = vi.spyOn(ref.current!, 'omitExtraData').mockReturnValue({ foo: '' });

    await user.clear(node.querySelector('[type=text]')!);
    await user.type(node.querySelector('[type=text]')!, 'new');

    expect(theSpy).not.toHaveBeenCalled();
  });

  it('should not omit data on change with omitExtraData=false and liveOmit=false', async () => {
    const omitExtraData = false;
    const liveOmit = false;
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'string' },
      },
    };
    const formData = { foo: 'foo', baz: 'baz' };
    const { node, onChange } = createFormComponent({
      ref: createRef(),
      schema,
      formData,
      omitExtraData,
      liveOmit,
    });

    await user.clear(node.querySelector('#root_foo')!);
    await user.type(node.querySelector('#root_foo')!, 'foobar');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: { foo: 'foobar', baz: 'baz' },
      }),
      'root_foo',
    );
  });

  it('should not omit data on change with omitExtraData=true and liveOmit=false', async () => {
    const omitExtraData = true;
    const liveOmit = false;
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'string' },
      },
    };
    const formData = { foo: 'foo', baz: 'baz' };
    const { node, onChange } = createFormComponent({
      schema,
      formData,
      omitExtraData,
      liveOmit,
    });

    await user.clear(node.querySelector('#root_foo')!);
    await user.type(node.querySelector('#root_foo')!, 'foobar');

    expectToHaveBeenCalledWithFormData(onChange, { foo: 'foobar', baz: 'baz' }, 'root_foo');
  });

  it('should not omit data on change with omitExtraData=false and liveOmit=true', async () => {
    const omitExtraData = false;
    const liveOmit = true;
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'string' },
      },
    };
    const formData = { foo: 'foo', baz: 'baz' };
    const { node, onChange } = createFormComponent({
      schema,
      formData,
      omitExtraData,
      liveOmit,
    });

    await user.clear(node.querySelector('#root_foo')!);
    await user.type(node.querySelector('#root_foo')!, 'foobar');

    expectToHaveBeenCalledWithFormData(onChange, { foo: 'foobar', baz: 'baz' }, 'root_foo');
  });

  it('should omit data on change with omitExtraData=true and liveOmit=true', async () => {
    const omitExtraData = true;
    const liveOmit = true;
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'string' },
      },
    };
    const formData = { foo: 'foo', baz: 'baz' };
    const { node, onChange } = createFormComponent({
      schema,
      formData,
      omitExtraData,
      liveOmit,
    });

    await user.clear(node.querySelector('#root_foo')!);
    await user.type(node.querySelector('#root_foo')!, 'foobar');

    expectToHaveBeenCalledWithFormData(onChange, { foo: 'foobar' }, 'root_foo');
  });

  it('should not omit additionalProperties on change with omitExtraData=true and liveOmit=true', async () => {
    const omitExtraData = true;
    const liveOmit = true;
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'string' },
        add: {
          type: 'object',
          additionalProperties: {},
        },
      },
    };
    const formData = { foo: 'foo', baz: 'baz', add: { prop: 123 } };
    const { node, onChange } = createFormComponent({
      schema,
      formData,
      omitExtraData,
      liveOmit,
    });

    await user.clear(node.querySelector('#root_foo')!);
    await user.type(node.querySelector('#root_foo')!, 'foobar');

    expectToHaveBeenCalledWithFormData(onChange, { foo: 'foobar', add: { prop: 123 } }, 'root_foo');
  });

  it('should rename formData key if key input is renamed in a nested object with omitExtraData=true and liveOmit=true', async () => {
    const { node, onChange } = createFormComponent({
      schema: {
        type: 'object',
        properties: {
          nested: {
            additionalProperties: { type: 'string' },
          },
        },
      },
      formData: { nested: { key1: 'value' } },
      omitExtraData: true,
      liveOmit: true,
    });

    const textNode = node.querySelector<HTMLInputElement>('#root_nested_key1-key')!;
    await user.clear(textNode);
    await user.type(textNode, 'key1new');
    await user.tab();

    expectToHaveBeenCalledWithFormData(onChange, { nested: { key1new: 'value' } }, 'root_nested');
  });

  it('should allow oneOf data entry with omitExtraData=true and liveOmit=true', async () => {
    const { node, onChange } = createFormComponent({
      schema: {
        type: 'object',
        oneOf: [
          {
            properties: {
              lorem: {
                type: 'string',
              },
            },
            required: ['lorem'],
          },
          {
            properties: {
              ipsum: {
                type: 'string',
              },
            },
            required: ['ipsum'],
          },
        ],
      },
      formData: { lorum: '' },
      omitExtraData: true,
      liveOmit: true,
    });

    const textNode = node.querySelector('#root_lorem')!;
    await user.type(textNode, '12');

    expectToHaveBeenCalledWithFormData(onChange, { lorem: '12' }, 'root_lorem');
  });

  it('should allow anyOf data entry with omitExtraData=true and liveOmit=true', async () => {
    const { node, onChange } = createFormComponent({
      schema: {
        type: 'object',
        anyOf: [
          {
            properties: {
              lorem: {
                type: 'string',
              },
            },
            required: ['lorem'],
          },
          {
            properties: {
              ipsum: {
                type: 'string',
              },
            },
            required: ['ipsum'],
          },
        ],
      },
      formData: { ipsum: '' },
      omitExtraData: true,
      liveOmit: true,
    });

    const textNode = node.querySelector('#root_ipsum')!;
    await user.type(textNode, '12');

    expectToHaveBeenCalledWithFormData(onChange, { ipsum: '12' }, 'root_ipsum');
  });

  it('should not omit conditionally displayed fields with nested if/then when omitExtraData=true and liveOmit=true', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        nested: {
          type: 'object',
          properties: {
            booleanProperty: { type: 'boolean', default: true },
          },
          if: {
            properties: { booleanProperty: { const: true } },
          },
          then: {
            properties: {
              otherProperty: { type: 'string' },
            },
          },
        },
      },
    };
    const formData = {
      nested: {
        booleanProperty: true,
        otherProperty: 'initial value',
      },
    };
    const { node, onChange } = createFormComponent({
      ref: createRef(),
      schema,
      formData,
      omitExtraData: true,
      liveOmit: true,
    });

    const otherPropInput = node.querySelector<HTMLInputElement>('#root_nested_otherProperty')!;
    await user.clear(otherPropInput);
    await user.type(otherPropInput, 'new value');

    // The otherProperty should NOT be omitted because it's a valid conditional field
    expectToHaveBeenCalledWithFormData(
      onChange,
      {
        nested: {
          booleanProperty: true,
          otherProperty: 'new value',
        },
      },
      'root_nested_otherProperty',
    );
  });

  it('should keep schema errors when extraErrors set after submit and liveValidate is false', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
      required: ['foo'],
    };

    const extraErrors = {
      foo: {
        __errors: ['foo'],
      },
    } as unknown as ErrorSchema;

    const onSubmit = vi.fn();

    const formRef = createRef<Form>();
    const props: NoValFormProps = {
      ref: formRef,
      schema,
      onSubmit,
      liveValidate: false,
    };
    const { rerender, node } = createFormComponent(props);
    // forceFireEvent=true: clicking the submit button focuses it, blurring the
    // currently focused field and firing onChange which may mutate formData before
    // the submit handler runs. fireEvent.submit bypasses that side-effect chain.
    await submitForm(node, user, true);
    expect(node.querySelectorAll('.error-detail li')).toHaveLength(1);

    rerender({
      ...props,
      extraErrors,
    });
    // We use delayPromist of 0ms to allow all asynchronous operations to complete in the React component.
    // Despite this being a workaround, it turned out to be the only effective method to handle this test case.
    await delayPromise(0);
    expect(node.querySelectorAll('.error-detail li')).toHaveLength(2);
  });
});

describe('omitExtraData on submit', () => {
  it('should call omitExtraData when the omitExtraData prop is true', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: {
          type: 'string',
        },
      },
    };
    const formData = {
      foo: '',
    };
    const omitExtraData = true;
    const ref = createRef<Form>();
    const { node } = createFormComponent({
      ref,
      schema,
      formData,
      omitExtraData,
    });

    const theSpy = vi.spyOn(ref.current!, 'omitExtraData').mockReturnValue({ foo: '' });

    await submitForm(node, user);

    expect(theSpy).toHaveBeenCalledTimes(1);
  });

  it('Should call validateFormWithFormData with the current formData if omitExtraData is false', async () => {
    const omitExtraData = false;
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };
    const formData = { foo: 'bar', baz: 'baz' };
    const formRef = createRef<Form>();
    const props: NoValFormProps = {
      ref: formRef,
      schema,
      formData,
      omitExtraData,
    };
    const { node } = createFormComponent(props);
    const theSpy = vi.spyOn(formRef.current!, 'validateFormWithFormData').mockReturnValue(true);
    await submitForm(node, user);
    expect(theSpy).toHaveBeenCalledWith(formData);
  });

  it('Should call validateFormWithFormData with a new formData with only used fields if omitExtraData is true', async () => {
    const omitExtraData = true;
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };
    const formData = { foo: 'bar', baz: 'baz' };
    const formRef = createRef<Form>();
    const props: NoValFormProps = {
      ref: formRef,
      schema,
      formData,
      omitExtraData,
    };
    const { node } = createFormComponent(props);
    const theSpy = vi.spyOn(formRef.current!, 'validateFormWithFormData').mockReturnValue(true);
    await submitForm(node, user);
    expect(theSpy).toHaveBeenCalledWith({ foo: 'bar' });
  });
});

describe('omitExtraData prunes empty optional objects', () => {
  // Schema with an optional nested object whose inner field is required
  const schema: RJSFSchema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      address: {
        type: 'object',
        properties: {
          street: { type: 'string' },
        },
      },
    },
    required: ['name'],
  };

  it('prunes an empty optional object on submit when omitExtraData is true', async () => {
    const { node, onSubmit } = createFormComponent({
      schema,
      formData: { name: 'Alice', address: {} },
      omitExtraData: true,
    });

    await submitForm(node, user);

    expectToHaveBeenCalledWithFormData(onSubmit, { name: 'Alice' }, true);
  });

  it('does not prune a required object even when all its fields are empty', async () => {
    const requiredAddressSchema: RJSFSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        address: {
          type: 'object',
          properties: {
            street: { type: 'string' },
          },
        },
      },
      required: ['name', 'address'],
    };

    const { node, onSubmit } = createFormComponent({
      schema: requiredAddressSchema,
      formData: { name: 'Alice', address: {} },
      omitExtraData: true,
    });

    await submitForm(node, user);

    expectToHaveBeenCalledWithFormData(onSubmit, { name: 'Alice', address: {} }, true);
  });

  it('keeps an optional object when it has a non-empty field', async () => {
    const { node, onSubmit } = createFormComponent({
      schema,
      formData: { name: 'Alice', address: { street: '123 Main St' } },
      omitExtraData: true,
    });

    await submitForm(node, user);

    expectToHaveBeenCalledWithFormData(onSubmit, { name: 'Alice', address: { street: '123 Main St' } }, true);
  });

  it('prunes an empty optional object on change when omitExtraData and liveOmit are true', async () => {
    const { node, onChange } = createFormComponent({
      schema,
      formData: { name: 'Alice', address: { street: 'value' } },
      omitExtraData: true,
      liveOmit: true,
    });

    await user.clear(node.querySelector('#root_address_street')!);

    expectToHaveBeenCalledWithFormData(onChange, { name: 'Alice' }, 'root_address_street');
  });

  it('prunes an empty optional object on blur when omitExtraData is true and liveOmit is onBlur', async () => {
    const { node, onChange } = createFormComponent({
      schema,
      formData: { name: 'Alice', address: { street: 'value' } },
      omitExtraData: true,
      liveOmit: 'onBlur',
    });

    const streetInput = node.querySelector<HTMLInputElement>('#root_address_street')!;

    await user.clear(streetInput);
    await user.tab();

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ formData: { name: 'Alice' } }),
      'root_address_street',
    );
  });
});

describe('Async errors', () => {
  it('should render the async errors', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        candy: {
          type: 'object',
          properties: {
            bar: { type: 'string' },
          },
        },
      },
    };

    const extraErrors = {
      foo: {
        __errors: ['some error that got added as a prop'],
      },
      candy: {
        bar: {
          __errors: ['some other error that got added as a prop'],
        },
      },
    } as unknown as ErrorSchema;

    const { node } = createFormComponent({ schema, extraErrors });

    expect(node.querySelectorAll('.error-detail li')).toHaveLength(2);
  });

  it('should not block form submission', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };

    const extraErrors = {
      foo: {
        __errors: ['some error that got added as a prop'],
      },
    } as unknown as ErrorSchema;

    const { node, onSubmit } = createFormComponent({ schema, extraErrors });
    await submitForm(node, user);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('should reset when props extraErrors changes and noValidate is true', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };

    const extraErrors = {
      foo: {
        __errors: ['foo'],
      },
    } as unknown as ErrorSchema;

    const formRef = createRef<Form>();
    const props: NoValFormProps = {
      ref: formRef,
      schema,
      noValidate: true,
    };

    const { rerender } = createFormComponent({
      ...props,
      extraErrors,
    });

    rerender({
      ...props,
      extraErrors: {},
    });

    expect(formRef.current!.state.errorSchema).toEqual({});
    expect(formRef.current!.state.errors).toEqual([]);
  });

  it('should reset when props extraErrors changes and liveValidate is false', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };

    const extraErrors = {
      foo: {
        __errors: ['foo'],
      },
    } as unknown as ErrorSchema;

    const formRef = createRef<Form>();
    const props: NoValFormProps = {
      ref: formRef,
      schema,
      liveValidate: false,
    };
    const { rerender } = createFormComponent({
      ...props,
      extraErrors,
    });

    rerender({
      ...props,
      extraErrors: {},
    });

    expect(formRef.current!.state.errorSchema).toEqual({});
    expect(formRef.current!.state.errors).toEqual([]);
  });

  it('should reset when schema changes', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
      required: ['foo'],
    };

    const formRef = createRef<Form>();
    const { rerender, node } = createFormComponent({
      ref: formRef,
      schema,
    });

    // forceFireEvent=true: clicking the submit button focuses it, blurring the
    // currently focused field and firing onChange which may mutate formData before
    // the submit handler runs. fireEvent.submit bypasses that side-effect chain.
    await submitForm(node, user, true);

    expect(formRef.current!.state.errorSchema).toEqual({ foo: { __errors: ["must have required property 'foo'"] } });
    expect(formRef.current!.state.errors).toEqual([
      {
        message: "must have required property 'foo'",
        property: 'foo',
        name: 'required',
        params: {
          missingProperty: 'foo',
        },
        schemaPath: '#/required',
        stack: "must have required property 'foo'",
        title: '',
      },
    ]);

    // Changing schema to reset errors state.
    rerender({
      ref: formRef,
      schema: {
        type: 'object',
        properties: {
          foo: { type: 'string' },
        },
      },
    });
    expect(formRef.current!.state.errorSchema).toEqual({});
    expect(formRef.current!.state.errors).toEqual([]);
  });

  it('should display extraErrors on first async set with array field and controlled formData', async () => {
    // Reproduces https://github.com/rjsf-team/react-jsonschema-form/issues/4982
    // When formData is controlled externally and the schema has an array field,
    // setting extraErrors after submit should show errors on the first attempt.
    // The bug was in mergeErrors() where the customErrors merge (created by array
    // field interactions) overwrote the extraErrors merge by using the original
    // schemaValidation base instead of the accumulated result.
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        values: {
          type: 'array',
          items: { type: 'number' },
        },
      },
    };

    const formRef = createRef<Form>();

    function Wrapper() {
      const [formData, setFormData] = useState<Record<string, unknown>>({ values: [] });
      const [extraErrors, setExtraErrors] = useState<ErrorSchema>({});

      const onSubmit = useCallback(async () => {
        await delayPromise(50);
        setExtraErrors({
          values: {
            0: { __errors: ['ERROR MESSAGE'] },
          },
          __errors: ['Root error'],
        } as unknown as ErrorSchema);
      }, []);

      return (
        <Form
          ref={formRef}
          schema={schema}
          validator={validator}
          formData={formData}
          onChange={({ formData: next }: IChangeEvent) => setFormData((next as Record<string, unknown>) ?? {})}
          extraErrors={extraErrors}
          onSubmit={onSubmit}
        />
      );
    }

    const { container } = render(<Wrapper />);
    const form = container.firstElementChild!;

    // Add an array item and fill it with a valid number
    const addBtn = form.querySelector('.btn-add');
    await user.click(addBtn!);
    const input = form.querySelector<HTMLInputElement>('input[type="number"]')!;
    await user.clear(input);
    await user.type(input, '42');

    // Submit the form, then wait for async extraErrors to be set
    await submitForm(form, user);
    await actWrappedDelayPromise();

    // The extra errors should be displayed on the FIRST submit
    expect(formRef.current!.state.errors.length).toBeGreaterThan(0);
    expect(formRef.current!.state.errorSchema).toEqual(
      expect.objectContaining({
        __errors: ['Root error'],
      }),
    );
  });
});

describe('Calling onChange right after updating a Form with props formData', () => {
  const schema: RJSFSchema = {
    type: 'array',
    items: {
      type: 'string',
    },
  };

  let changed = false;
  const ArrayThatTriggersOnChangeRightAfterUpdated = (fieldProps: FieldProps) => {
    const { ArrayField } = fieldProps.registry.fields;
    const isMounted = useRef(false);
    const latestProps = useRef(fieldProps);
    latestProps.current = fieldProps;
    useEffect(() => {
      if (!isMounted.current) {
        isMounted.current = true;
        return;
      }
      if (changed) {
        return;
      }
      changed = true;
      latestProps.current.onChange('test', [latestProps.current.formData.length]);
    });
    return <ArrayField {...fieldProps} />;
  };

  const uiSchema: UiSchema = {
    'ui:field': ArrayThatTriggersOnChangeRightAfterUpdated,
  };

  const props: FormProps = {
    schema,
    uiSchema,
    validator,
  };

  const Container = (containerProps: FormProps) => {
    const [state, setState] = useState<{ formData?: any }>({});
    const onChange = useCallback(({ formData }: IChangeEvent) => {
      setState({ formData });
    }, []);
    return <Form {...containerProps} {...state} onChange={onChange} />;
  };

  it("doesn't cause a race condition", async () => {
    const { node } = createComponent(Container, { ...props });

    await user.click(node.querySelector('.rjsf-array-item-add button')!);

    expect(node.querySelector('#root_0')).toBeInTheDocument();
    expect(node.querySelector('#root_1')).toHaveAttribute('value', 'test');
  });
});

describe('Calling reset from ref object', () => {
  it('Reset API test', async () => {
    const schema: RJSFSchema = {
      title: 'Test form',
      type: 'string',
    };
    const formRef = createRef<Form>();
    const props: NoValFormProps = {
      ref: formRef,
      schema,
    };
    const { node } = createFormComponent(props);
    expect(formRef.current!.reset).toBeDefined();
    expect(node.querySelector<HTMLInputElement>('input')).toBeInTheDocument();
    await user.type(node.querySelector<HTMLInputElement>('input')!, 'Some Value');
    act(() => {
      formRef.current!.reset();
    });
    expect(node.querySelector<HTMLInputElement>('input')).toHaveAttribute('value', '');
  });

  it('Clear errors', async () => {
    const schema: RJSFSchema = {
      title: 'Test form',
      type: 'number',
    };
    const formRef = createRef<Form>();
    const props: NoValFormProps = {
      ref: formRef,
      schema,
    };
    const { node } = createFormComponent(props);
    expect(formRef.current!.reset).toBeDefined();
    expect(node.querySelector<HTMLInputElement>('input')).toBeInTheDocument();
    await user.type(node.querySelector<HTMLInputElement>('input')!, 'Some Value');
    expect(formRef.current!.state.errors).toHaveLength(0);
    await submitForm(node, user);
    expect(formRef.current!.state.errors).toHaveLength(1);
    expect(node.querySelector('.errors')).toBeInTheDocument();
    act(() => {
      formRef.current!.reset();
    });
    expect(node.querySelector('.errors')).not.toBeInTheDocument();
    expect(node.querySelector<HTMLInputElement>('input')).toHaveAttribute('value', '');
    expect(formRef.current!.state.errors).toHaveLength(0);
  });

  it('Reset button test with default value', async () => {
    const schemaWithDefault: RJSFSchema = {
      title: 'Test form',
      type: 'string',
      default: 'Some-Value',
    };
    const formRef = createRef<Form>();
    const props: NoValFormProps = {
      ref: formRef,
      schema: schemaWithDefault,
    };
    const { node } = createFormComponent(props);
    const input = node.querySelector<HTMLInputElement>('input');
    expect(formRef.current!.reset).toBeDefined();
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('value', 'Some-Value');
    act(() => {
      formRef.current!.reset();
    });
    expect(input).toHaveAttribute('value', 'Some-Value');
    await user.clear(input!);
    await user.type(input!, 'Changed value');
    act(() => {
      formRef.current!.reset();
    });
    expect(input).toHaveAttribute('value', 'Some-Value');
  });

  it('Reset button test with complex schema', async () => {
    const schema = widgetsSchema as RJSFSchema;
    const formRef = createRef<Form>();
    const props: NoValFormProps = {
      ref: formRef,
      schema,
    };
    const { node } = createFormComponent(props);
    const checkbox = node.querySelector<HTMLInputElement>('input[type="checkbox"]');
    const input = node.querySelector<HTMLInputElement>('input[type="text"]');
    expect(formRef.current!.reset).toBeDefined();
    expect(checkbox).toBeInTheDocument();
    expect(input).toBeInTheDocument();
    expect(checkbox).toBeChecked();
    expect(input).toHaveAttribute('value', '');
    act(() => {
      formRef.current!.reset();
    });
    expect(checkbox).toBeChecked();
    expect(input).toHaveAttribute('value', '');
    await user.click(checkbox!);
    await user.clear(input!);
    await user.type(input!, 'Changed value');
    expect(checkbox).not.toBeChecked();
    expect(input).toHaveAttribute('value', 'Changed value');
    act(() => {
      formRef.current!.reset();
    });
    expect(input).toHaveAttribute('value', '');
    expect(checkbox).toBeChecked();
  });

  it('Reset button test with initialFormData', async () => {
    const schemaWithDefault: RJSFSchema = {
      title: 'Test form',
      type: 'string',
    };
    const formRef = createRef<Form>();
    const props: NoValFormProps = {
      ref: formRef,
      initialFormData: 'foo',
      schema: schemaWithDefault,
    };
    const { node } = createFormComponent(props);
    const input = node.querySelector<HTMLInputElement>('input');
    expect(formRef.current!.reset).toBeDefined();
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('value', props.initialFormData);
    await user.clear(input!);
    await user.type(input!, 'Changed value');
    expect(input).toHaveAttribute('value', 'Changed value');
    act(() => {
      formRef.current!.reset();
    });
    expect(input).toHaveAttribute('value', props.initialFormData);
  });
});

describe('validateForm()', () => {
  it('Should call validateFormWithFormData with the current formData if omitExtraData is false', () => {
    const omitExtraData = false;
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };
    const formData = { foo: 'bar', baz: 'baz' };
    const formRef = createRef<Form>();
    const props: NoValFormProps = {
      ref: formRef,
      schema,
      formData,
      omitExtraData,
    };
    createFormComponent(props);
    const theSpy = vi.spyOn(formRef.current!, 'validateFormWithFormData').mockReturnValue(true);
    act(() => {
      formRef.current!.validateForm();
    });
    expect(theSpy).toHaveBeenCalledWith(formData);
  });

  it('Should call validateFormWithFormData with a new formData with only used fields if omitExtraData is true', () => {
    const omitExtraData = true;
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };
    const formData = { foo: 'bar', baz: 'baz' };
    const formRef = createRef<Form>();
    const props: NoValFormProps = {
      ref: formRef,
      schema,
      formData,
      omitExtraData,
    };
    createFormComponent(props);
    const theSpy = vi.spyOn(formRef.current!, 'validateFormWithFormData').mockReturnValue(true);
    act(() => {
      formRef.current!.validateForm();
    });
    expect(theSpy).toHaveBeenCalledWith({ foo: 'bar' });
  });

  it('Should update state when data updated from invalid to valid', async () => {
    const ref = createRef<Form>();
    const props: NoValFormProps = {
      schema: {
        type: 'object',
        required: ['input'],
        properties: {
          input: {
            type: 'string',
          },
        },
      },
      formData: {},
      ref,
    };
    const { rerender, node } = createFormComponent(props);
    // trigger programmatic validation and make sure an error appears.
    act(() => {
      expect(ref.current!.validateForm()).toBe(false);
    });

    let errors = node.querySelectorAll('.error-detail');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toHaveTextContent("must have required property 'input'");

    // populate the input and trigger a re-render from the parent.
    const textNode = node.querySelector<HTMLInputElement>('#root_input')!;
    await user.type(textNode, 'populated value');
    rerender({ ...props, formData: { input: 'populated value' } });
    // // error should still be present.
    errors = node.querySelectorAll('.error-detail');
    // screen.debug();
    // change formData and make sure the error disappears.
    expect(errors).toHaveLength(0);

    // trigger programmatic validation again and make sure the error disappears.
    act(() => {
      expect(ref.current!.validateForm()).toEqual(true);
    });
    errors = node.querySelectorAll('.error-detail');
    expect(errors).toHaveLength(0);
  });

  it('Should keep non-blocking extraErrors in state when schema is valid and extraErrorsBlockSubmit is not set', () => {
    const formRef = createRef<Form>();
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };
    const extraErrors = {
      foo: {
        __errors: ['async error for foo'],
      },
    } as unknown as ErrorSchema;
    const props: NoValFormProps = {
      ref: formRef,
      schema,
      formData: { foo: 'valid' },
      extraErrors,
    };
    const { onError } = createFormComponent(props);

    act(() => {
      // Should return true (non-blocking)
      expect(formRef.current!.validateForm()).toBe(true);
    });

    // extraErrors should remain visible in state
    expect(formRef.current!.state.errors).toHaveLength(1);
    expect(formRef.current!.state.errors[0].message).toBe('async error for foo');
    expect(formRef.current!.state.errorSchema).toEqual(extraErrors);
    // onError should NOT be called for non-blocking errors
    expect(onError).not.toHaveBeenCalled();
  });

  it('Should return false and call onError when extraErrors are present with extraErrorsBlockSubmit set', () => {
    const formRef = createRef<Form>();
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };
    const extraErrors = {
      foo: {
        __errors: ['blocking async error'],
      },
    } as unknown as ErrorSchema;
    const props: NoValFormProps = {
      ref: formRef,
      schema,
      formData: { foo: 'valid' },
      extraErrors,
      extraErrorsBlockSubmit: true,
    };
    const { onError } = createFormComponent(props);

    act(() => {
      // Should return false (non-blocking)
      expect(formRef.current!.validateForm()).toBe(false);
    });

    // Merged errors should be in state
    expect(formRef.current!.state.errors).toHaveLength(1);
    expect(formRef.current!.state.errors[0].message).toBe('blocking async error');
    // onError SHOULD be called
    expect(onError).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ message: 'blocking async error' })]),
    );
  });

  it('Should show both schema and extraErrors in state when schema is invalid regardless of extraErrorsBlockSubmit', () => {
    const formRef = createRef<Form>();
    const schema: RJSFSchema = {
      type: 'object',
      required: ['foo'],
      properties: {
        foo: { type: 'string' },
      },
    };
    const extraErrors = {
      foo: {
        __errors: ['async error for foo'],
      },
    } as unknown as ErrorSchema;
    const props: NoValFormProps = {
      ref: formRef,
      schema,
      formData: {},
      extraErrors,
      // extraErrorsBlockSubmit intentionally omitted
    };
    createFormComponent(props);

    act(() => {
      // Schema error blocks submission → false
      expect(formRef.current!.validateForm()).toBe(false);
    });

    // Both schema error and extra error should be in state
    const errorMessages = formRef.current!.state.errors.map((e) => e.message);
    expect(errorMessages).toContain("must have required property 'foo'");
    expect(errorMessages).toContain('async error for foo');
  });

  it('Should clear extraErrors from state when extraErrors prop is removed and validateForm is called again', () => {
    const formRef = createRef<Form>();
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };
    const extraErrors = {
      foo: {
        __errors: ['async error for foo'],
      },
    } as unknown as ErrorSchema;
    const props: NoValFormProps = {
      ref: formRef,
      schema,
      formData: { foo: 'valid' },
      extraErrors,
    };
    const { rerender } = createFormComponent(props);

    // First call: extraErrors should appear in state
    act(() => {
      formRef.current!.validateForm();
    });
    expect(formRef.current!.state.errors).toHaveLength(1);

    // Rerender without extraErrors
    rerender({ ...props, extraErrors: undefined });

    // Second call: no extraErrors, no schema errors → state should be cleared
    act(() => {
      formRef.current!.validateForm();
    });
    expect(formRef.current!.state.errors).toHaveLength(0);
    expect(formRef.current!.state.errorSchema).toEqual({});
  });
});

describe('setFieldValue()', () => {
  it('Sets root to value using ""', () => {
    const ref = createRef<Form>();
    const props: NoValFormProps = {
      schema: {
        type: 'string',
      },
      formData: {},
      ref,
    };
    const { onChange, node } = createFormComponent(props);
    // populate the input
    act(() => {
      ref.current!.setFieldValue('', 'populated value');
    });

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: 'populated value',
      }),
      'root_',
    );

    expect(node.querySelector<HTMLInputElement>('input')).toHaveAttribute('value', 'populated value');
  });
  it('Sets root to value using []', () => {
    const ref = createRef<Form>();
    const props: NoValFormProps = {
      schema: {
        type: 'string',
      },
      formData: {},
      ref,
    };
    const { onChange, node } = createFormComponent(props);
    // populate the input
    act(() => {
      ref.current!.setFieldValue([], 'populated value');
    });

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: 'populated value',
      }),
      'root',
    );

    expect(node.querySelector<HTMLInputElement>('input')).toHaveAttribute('value', 'populated value');
  });
  it('Sets field to new value via dotted path', () => {
    const ref = createRef<Form>();
    const props: NoValFormProps = {
      schema: {
        type: 'object',
        properties: {
          foo: {
            type: 'object',
            required: ['input'],
            properties: {
              input: {
                type: 'string',
              },
            },
          },
        },
        required: ['foo'],
      },
      formData: {},
      ref,
      liveValidate: true,
    };
    const { onChange, node } = createFormComponent(props);
    // trigger programmatic validation and make sure an error appears.
    act(() => {
      expect(ref.current!.validateForm()).toBe(false);
    });

    let errors = node.querySelectorAll('.error-detail');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toHaveTextContent("must have required property 'input'");

    // populate the input
    act(() => {
      ref.current!.setFieldValue('foo.input', 'populated value');
    });

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: {
          foo: {
            input: 'populated value',
          },
        },
      }),
      'root_foo_input',
    );

    // error should still be present.
    errors = node.querySelectorAll('.error-detail');
    // screen.debug();
    // change formData and make sure the error disappears.
    expect(errors).toHaveLength(0);
  });
  it('Sets field to new value via field path list', () => {
    const ref = createRef<Form>();
    const props: NoValFormProps = {
      schema: {
        type: 'object',
        properties: {
          foo: {
            type: 'object',
            required: ['input'],
            properties: {
              input: {
                type: 'string',
              },
            },
          },
        },
        required: ['foo'],
      },
      formData: {},
      ref,
      liveValidate: true,
    };
    const { onChange, node } = createFormComponent(props);
    // trigger programmatic validation and make sure an error appears.
    act(() => {
      expect(ref.current!.validateForm()).toBe(false);
    });

    let errors = node.querySelectorAll('.error-detail');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toHaveTextContent("must have required property 'input'");

    // populate the input
    act(() => {
      ref.current!.setFieldValue(['foo', 'input'], 'populated value');
    });

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: {
          foo: {
            input: 'populated value',
          },
        },
      }),
      'root_foo_input',
    );

    // error should still be present.
    errors = node.querySelectorAll('.error-detail');
    // screen.debug();
    // change formData and make sure the error disappears.
    expect(errors).toHaveLength(0);
  });
});

describe('optionalDataControls', () => {
  const schema: RJSFSchema = {
    title: 'test',
    properties: {
      nestedObjectOptional: {
        type: 'object',
        properties: {
          test: {
            type: 'string',
          },
        },
      },
      nestedArrayOptional: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
  };
  const arrayOnUiSchema: UiSchema = {
    'ui:globalOptions': {
      enableOptionalDataFieldForType: ['array'],
    },
  };
  const objectOnUiSchema: UiSchema = {
    'ui:globalOptions': {
      enableOptionalDataFieldForType: ['object'],
    },
  };
  const bothOnUiSchema: UiSchema = {
    'ui:globalOptions': {
      enableOptionalDataFieldForType: ['object', 'array'],
    },
  };
  const experimental_defaultFormStateBehavior: Experimental_DefaultFormStateBehavior = {
    // Set the emptyObjectFields to only populate required defaults to highlight the code working
    emptyObjectFields: 'populateRequiredDefaults',
  };
  const arrayId = 'root_nestedArrayOptional';
  const objectId = 'root_nestedObjectOptional';
  const arrayControlAddId = optionalControlsId(arrayId, 'Add');
  const arrayControlRemoveId = optionalControlsId(arrayId, 'Remove');
  const arrayControlMsgId = optionalControlsId(arrayId, 'Msg');
  const arrayAddId = buttonId(arrayId, 'add');
  const objectControlAddId = optionalControlsId(objectId, 'Add');
  const objectControlRemoveId = optionalControlsId(objectId, 'Remove');
  const objectControlMsgId = optionalControlsId(objectId, 'Msg');
  it('does not render any optional data control messages when not turned on and readonly and disabled', () => {
    const props: NoValFormProps = {
      schema,
      experimental_defaultFormStateBehavior,
      readonly: true,
      disabled: true,
    };
    const { node } = createFormComponent(props);
    const addArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlAddId}`);
    const removeArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlRemoveId}`);
    const msgArrayControlNode = node.querySelector(`#${arrayControlMsgId}`);
    const addArrayBtn = node.querySelector(`#${arrayAddId}`);
    const addObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlAddId}`);
    const removeObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlRemoveId}`);
    const msgObjectControlNode = node.querySelector(`#${objectControlMsgId}`);
    const testInput = node.querySelector(`#${objectId}_test`);
    // Check that the expected html elements are rendered (or not) as expected
    expect(addArrayControlNode).toEqual(null);
    expect(removeArrayControlNode).toEqual(null);
    expect(msgArrayControlNode).toEqual(null);
    expect(addArrayBtn).not.toEqual(null);
    expect(addObjectControlNode).toEqual(null);
    expect(removeObjectControlNode).toEqual(null);
    expect(msgObjectControlNode).toEqual(null);
    expect(testInput).not.toEqual(null);
  });
  it('renders optional data control messages when turned on and readonly', () => {
    const props: NoValFormProps = {
      schema,
      uiSchema: bothOnUiSchema,
      experimental_defaultFormStateBehavior,
      readonly: true,
    };
    const { node } = createFormComponent(props);
    const addArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlAddId}`);
    const removeArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlRemoveId}`);
    const msgArrayControlNode = node.querySelector(`#${arrayControlMsgId}`);
    const addArrayBtn = node.querySelector(`#${arrayAddId}`);
    const addObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlAddId}`);
    const removeObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlRemoveId}`);
    const msgObjectControlNode = node.querySelector(`#${objectControlMsgId}`);
    const testInput = node.querySelector(`#${objectId}_test`);
    // Check that the expected html elements are rendered (or not) as expected
    expect(addArrayControlNode).toEqual(null);
    expect(removeArrayControlNode).toEqual(null);
    expect(msgArrayControlNode).not.toEqual(null);
    expect(addArrayBtn).toEqual(null);
    expect(addObjectControlNode).toEqual(null);
    expect(removeObjectControlNode).toEqual(null);
    expect(msgObjectControlNode).not.toEqual(null);
    expect(testInput).toEqual(null);
  });
  it('renders optional data control messages when turned on and readonly', () => {
    const props: NoValFormProps = {
      schema,
      uiSchema: bothOnUiSchema,
      experimental_defaultFormStateBehavior,
      disabled: true,
    };
    const { node } = createFormComponent(props);
    const addArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlAddId}`);
    const removeArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlRemoveId}`);
    const msgArrayControlNode = node.querySelector(`#${arrayControlMsgId}`);
    const addArrayBtn = node.querySelector(`#${arrayAddId}`);
    const addObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlAddId}`);
    const removeObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlRemoveId}`);
    const msgObjectControlNode = node.querySelector(`#${objectControlMsgId}`);
    const testInput = node.querySelector(`#${objectId}_test`);
    // Check that the expected html elements are rendered (or not) as expected
    expect(addArrayControlNode).toEqual(null);
    expect(removeArrayControlNode).toEqual(null);
    expect(msgArrayControlNode).not.toEqual(null);
    expect(addArrayBtn).toEqual(null);
    expect(addObjectControlNode).toEqual(null);
    expect(removeObjectControlNode).toEqual(null);
    expect(msgObjectControlNode).not.toEqual(null);
    expect(testInput).toEqual(null);
  });
  it('does not render any optional data controls when not turned on', () => {
    const props: NoValFormProps = {
      schema,
      experimental_defaultFormStateBehavior,
    };
    const { node } = createFormComponent(props);
    const addArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlAddId}`);
    const removeArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlRemoveId}`);
    const addArrayBtn = node.querySelector(`#${arrayAddId}`);
    const addObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlAddId}`);
    const removeObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlRemoveId}`);
    const testInput = node.querySelector(`#${objectId}_test`);
    // Check that the expected html elements are rendered (or not) as expected
    expect(addArrayControlNode).toEqual(null);
    expect(removeArrayControlNode).toEqual(null);
    expect(addArrayBtn).not.toEqual(null);
    expect(addObjectControlNode).toEqual(null);
    expect(removeObjectControlNode).toEqual(null);
    expect(testInput).not.toEqual(null);
  });
  it('only render object optional data controls when only object is turned on', async () => {
    const props: NoValFormProps = {
      schema,
      uiSchema: objectOnUiSchema,
      experimental_defaultFormStateBehavior,
    };
    const { node } = createFormComponent(props);
    const addArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlAddId}`);
    const removeArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlRemoveId}`);
    const addArrayBtn = node.querySelector(`#${arrayAddId}`);
    let addObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlAddId}`);
    let removeObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlRemoveId}`);
    let testInput = node.querySelector(`#${objectId}_test`);
    // Check that the expected html elements are rendered (or not) as expected
    expect(addArrayControlNode).toEqual(null);
    expect(removeArrayControlNode).toEqual(null);
    expect(addArrayBtn).not.toEqual(null);
    expect(addObjectControlNode).not.toEqual(null);
    expect(removeObjectControlNode).toEqual(null);
    expect(testInput).toEqual(null);

    // now click on the add optional data button
    await user.click(addObjectControlNode!);
    // now check to see if the UI adjusted
    addObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlAddId}`);
    removeObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlRemoveId}`);
    testInput = node.querySelector(`#${objectId}_test`);
    expect(addObjectControlNode).toEqual(null);
    expect(removeObjectControlNode).not.toEqual(null);
    expect(testInput).not.toEqual(null);

    // now click on the remove optional data button
    await user.click(removeObjectControlNode!);
    // now check to see if the UI adjusted
    addObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlAddId}`);
    removeObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlRemoveId}`);
    testInput = node.querySelector(`#${objectId}_test`);
    expect(addObjectControlNode).not.toEqual(null);
    expect(removeObjectControlNode).toEqual(null);
    expect(testInput).toEqual(null);
  });
  it('only render array optional data controls when only array is turned on', async () => {
    const props: NoValFormProps = {
      schema,
      uiSchema: arrayOnUiSchema,
      experimental_defaultFormStateBehavior,
    };
    const { node } = createFormComponent(props);
    let addArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlAddId}`);
    let removeArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlRemoveId}`);
    let addArrayBtn = node.querySelector(`#${arrayAddId}`);
    const addObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlAddId}`);
    const removeObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlRemoveId}`);
    const testInput = node.querySelector(`#${objectId}_test`);
    // Check that the expected html elements are rendered (or not) as expected
    expect(addArrayControlNode).not.toEqual(null);
    expect(removeArrayControlNode).toEqual(null);
    expect(addArrayBtn).toEqual(null);
    expect(addObjectControlNode).toEqual(null);
    expect(removeObjectControlNode).toEqual(null);
    expect(testInput).not.toEqual(null);

    // now click on the add optional data button
    await user.click(addArrayControlNode!);
    // now check to see if the UI adjusted
    addArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlAddId}`);
    removeArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlRemoveId}`);
    addArrayBtn = node.querySelector(`#${arrayAddId}`);
    expect(addArrayControlNode).toEqual(null);
    expect(removeArrayControlNode).not.toEqual(null);
    expect(addArrayBtn).not.toEqual(null);

    // now click on the remove optional data button
    await user.click(removeArrayControlNode!);
    // now check to see if the UI adjusted
    addArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlAddId}`);
    removeArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlRemoveId}`);
    addArrayBtn = node.querySelector(`#${arrayAddId}`);
    expect(addArrayControlNode).not.toEqual(null);
    expect(removeArrayControlNode).toEqual(null);
    expect(addArrayBtn).toEqual(null);
  });
  it('render both kinds of optional data controls when only both are turned on', async () => {
    const props: NoValFormProps = {
      schema,
      uiSchema: bothOnUiSchema,
      experimental_defaultFormStateBehavior,
    };
    const { node } = createFormComponent(props);
    let addArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlAddId}`);
    let removeArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlRemoveId}`);
    let addArrayBtn = node.querySelector(`#${arrayAddId}`);
    let addObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlAddId}`);
    let removeObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlRemoveId}`);
    let testInput = node.querySelector(`#${objectId}_test`);
    // Check that the expected html elements are rendered (or not) as expected
    expect(addArrayControlNode).not.toEqual(null);
    expect(removeArrayControlNode).toEqual(null);
    expect(addArrayBtn).toEqual(null);
    expect(addObjectControlNode).not.toEqual(null);
    expect(removeObjectControlNode).toEqual(null);
    expect(testInput).toEqual(null);

    // now click on the add optional data button
    await user.click(addArrayControlNode!);
    await user.click(addObjectControlNode!);
    // now check to see if the UI adjusted
    addArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlAddId}`);
    removeArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlRemoveId}`);
    addArrayBtn = node.querySelector(`#${arrayAddId}`);
    addObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlAddId}`);
    removeObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlRemoveId}`);
    testInput = node.querySelector(`#${objectId}_test`);
    expect(addArrayControlNode).toEqual(null);
    expect(removeArrayControlNode).not.toEqual(null);
    expect(addArrayBtn).not.toEqual(null);
    expect(addObjectControlNode).toEqual(null);
    expect(removeObjectControlNode).not.toEqual(null);
    expect(testInput).not.toEqual(null);

    // now click on the remove optional data button
    await user.click(removeArrayControlNode!);
    await user.click(removeObjectControlNode!);
    // now check to see if the UI adjusted
    addArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlAddId}`);
    removeArrayControlNode = node.querySelector<HTMLButtonElement>(`#${arrayControlRemoveId}`);
    addArrayBtn = node.querySelector(`#${arrayAddId}`);
    addObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlAddId}`);
    removeObjectControlNode = node.querySelector<HTMLButtonElement>(`#${objectControlRemoveId}`);
    testInput = node.querySelector(`#${objectId}_test`);
    expect(addArrayControlNode).not.toEqual(null);
    expect(removeArrayControlNode).toEqual(null);
    expect(addArrayBtn).toEqual(null);
    expect(addObjectControlNode).not.toEqual(null);
    expect(removeObjectControlNode).toEqual(null);
    expect(testInput).toEqual(null);
  });
});

describe('nameGenerator', () => {
  it('should generate bracket notation names for simple fields', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
      },
    };
    const { node } = createFormComponent({ schema, nameGenerator: bracketNameGenerator });

    const firstNameInput = node.querySelector('#root_firstName');
    const lastNameInput = node.querySelector('#root_lastName');

    expect(firstNameInput).toHaveAttribute('name', 'root[firstName]');
    expect(lastNameInput).toHaveAttribute('name', 'root[lastName]');
  });

  it('should generate dot notation names for simple fields', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
      },
    };
    const { node } = createFormComponent({ schema, nameGenerator: dotNotationNameGenerator });

    const firstNameInput = node.querySelector('#root_firstName');
    const lastNameInput = node.querySelector('#root_lastName');

    expect(firstNameInput).toHaveAttribute('name', 'root.firstName');
    expect(lastNameInput).toHaveAttribute('name', 'root.lastName');
  });

  it('should generate bracket notation names for nested objects', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        person: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
              },
            },
          },
        },
      },
    };
    const { node } = createFormComponent({ schema, nameGenerator: bracketNameGenerator });

    const firstNameInput = node.querySelector('#root_person_firstName');
    const streetInput = node.querySelector('#root_person_address_street');
    const cityInput = node.querySelector('#root_person_address_city');

    expect(firstNameInput).toHaveAttribute('name', 'root[person][firstName]');
    expect(streetInput).toHaveAttribute('name', 'root[person][address][street]');
    expect(cityInput).toHaveAttribute('name', 'root[person][address][city]');
  });

  it('should generate bracket notation names for array items', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    };
    const formData = {
      tags: ['foo', 'bar'],
    };
    const { node } = createFormComponent({ schema, formData, nameGenerator: bracketNameGenerator });

    const firstTagInput = node.querySelector('#root_tags_0');
    const secondTagInput = node.querySelector('#root_tags_1');

    expect(firstTagInput).toHaveAttribute('name', 'root[tags][0]');
    expect(secondTagInput).toHaveAttribute('name', 'root[tags][1]');
  });

  it('should generate bracket notation names for array of objects', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              done: { type: 'boolean' },
            },
          },
        },
      },
    };
    const formData = {
      tasks: [
        { title: 'Task 1', done: false },
        { title: 'Task 2', done: true },
      ],
    };
    const { node } = createFormComponent({ schema, formData, nameGenerator: bracketNameGenerator });

    const firstTaskTitleInput = node.querySelector('#root_tasks_0_title');
    const firstTaskDoneInput = node.querySelector('#root_tasks_0_done');
    const secondTaskTitleInput = node.querySelector('#root_tasks_1_title');
    const secondTaskDoneInput = node.querySelector('#root_tasks_1_done');

    expect(firstTaskTitleInput).toHaveAttribute('name', 'root[tasks][0][title]');
    expect(firstTaskDoneInput).toHaveAttribute('name', 'root[tasks][0][done]');
    expect(secondTaskTitleInput).toHaveAttribute('name', 'root[tasks][1][title]');
    expect(secondTaskDoneInput).toHaveAttribute('name', 'root[tasks][1][done]');
  });

  it('should generate bracket notation names for select widgets', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        color: {
          type: 'string',
          enum: ['red', 'green', 'blue'],
        },
      },
    };
    const { node } = createFormComponent({ schema, nameGenerator: bracketNameGenerator });

    const selectInput = node.querySelector('#root_color');
    expect(selectInput).toHaveAttribute('name', 'root[color]');
  });

  it('should generate bracket notation names for radio widgets', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        option: {
          type: 'string',
          enum: ['foo', 'bar'],
        },
      },
    };
    const uiSchema: UiSchema = {
      option: {
        'ui:widget': 'radio',
      },
    };
    const { node } = createFormComponent({ schema, uiSchema, nameGenerator: bracketNameGenerator });

    const radioInputs = node.querySelectorAll('input[type="radio"]');
    expect(radioInputs[0]).toHaveAttribute('name', 'root[option]');
    expect(radioInputs[1]).toHaveAttribute('name', 'root[option]');
  });

  it('should generate bracket notation names for checkboxes widgets', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        choices: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['foo', 'bar', 'baz'],
          },
          uniqueItems: true,
        },
      },
    };
    const uiSchema: UiSchema = {
      choices: {
        'ui:widget': 'checkboxes',
      },
    };
    const { node } = createFormComponent({ schema, uiSchema, nameGenerator: bracketNameGenerator });

    const checkboxInputs = node.querySelectorAll('input[type="checkbox"]');
    // Checkboxes for multi-value fields have [] appended to indicate multiple values
    expect(checkboxInputs[0]).toHaveAttribute('name', 'root[choices][]');
    expect(checkboxInputs[1]).toHaveAttribute('name', 'root[choices][]');
    expect(checkboxInputs[2]).toHaveAttribute('name', 'root[choices][]');
  });

  it('should generate bracket notation names for textarea widgets', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        description: { type: 'string' },
      },
    };
    const uiSchema: UiSchema = {
      description: {
        'ui:widget': 'textarea',
      },
    };
    const { node } = createFormComponent({ schema, uiSchema, nameGenerator: bracketNameGenerator });

    const textareaInput = node.querySelector('#root_description');
    expect(textareaInput).toHaveAttribute('name', 'root[description]');
  });

  it('should use default id if nameGenerator is not provided', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
      },
    };
    const { node } = createFormComponent({ schema });

    const firstNameInput = node.querySelector('#root_firstName');
    expect(firstNameInput).toHaveAttribute('name', 'root_firstName');
  });

  it('should handle nameGenerator with number fields', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        age: { type: 'number' },
        count: { type: 'integer' },
      },
    };
    const { node } = createFormComponent({ schema, nameGenerator: bracketNameGenerator });

    const ageInput = node.querySelector('#root_age');
    const countInput = node.querySelector('#root_count');

    expect(ageInput).toHaveAttribute('name', 'root[age]');
    expect(countInput).toHaveAttribute('name', 'root[count]');
  });

  it('should handle nameGenerator with boolean fields', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        active: { type: 'boolean' },
      },
    };
    const { node } = createFormComponent({ schema, nameGenerator: bracketNameGenerator });

    const activeInput = node.querySelector('#root_active');
    expect(activeInput).toHaveAttribute('name', 'root[active]');
  });
});

describe('initialFormData feature to prevent form reset', () => {
  const schema: RJSFSchema = {
    title: 'Reset Example',
    properties: {
      name: { type: 'string', title: 'Name' },
    },
  };
  const data = { name: 'initial_id' };
  /** This was adapted from the [example](https://playcode.io/2038613) provided in issue #391
   */
  const FormWrapper = ({ formData, initialFormData }: { formData?: any; initialFormData?: any }) => {
    const [isPending, setIsPending] = useState(false);

    const handleSubmit = () => {
      setIsPending(true);
      setTimeout(() => setIsPending(false), 3000);
    };

    const props: NoValFormProps = {
      schema,
      ...(formData !== undefined && { formData }),
    };

    return (
      <Form
        initialFormData={initialFormData}
        validator={validator}
        onSubmit={handleSubmit}
        disabled={isPending}
        {...props}
      />
    );
  };
  it('show that Form resets without initial data when it is controlled', async () => {
    const { container } = render(<FormWrapper formData={data} />);
    let input = container.querySelector<HTMLInputElement>('input')!;
    expect(input).toHaveAttribute('value', data.name);

    await user.clear(input);
    await user.type(input, 'new value');
    input = container.querySelector('input')!;
    expect(input).toHaveAttribute('value', 'new value');

    await submitForm(container.querySelector('form')!, user);

    input = container.querySelector('input')!;
    expect(input).toHaveAttribute('value', data.name);
  });
  it('show that Form does not reset with initialFormData when it is uncontrolled', async () => {
    const { container } = render(<FormWrapper initialFormData={data} />);
    let input = container.querySelector<HTMLInputElement>('input')!;
    expect(input).toHaveAttribute('value', data.name);

    await user.clear(input);
    await user.type(input, 'new value');
    input = container.querySelector('input')!;
    expect(input).toHaveAttribute('value', 'new value');

    await submitForm(container.querySelector('form')!, user);

    input = container.querySelector('input')!;
    expect(input).toHaveAttribute('value', 'new value');
  });
});

describe('extraErrors set after submit (#4965)', () => {
  it('should show extraErrors when set for the first time via onSubmit callback', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };

    const sampleErrors: ErrorSchema = {
      foo: {
        __errors: ['Sample error on field foo'],
      },
    } as unknown as ErrorSchema;

    function Wrapper() {
      const [extraErrors, setExtraErrors] = useState<ErrorSchema>({} as ErrorSchema);

      const onSubmit = useCallback(async () => {
        setExtraErrors({} as ErrorSchema);
        await delayPromise(50);
        setExtraErrors(sampleErrors);
      }, []);

      return <Form schema={schema} validator={validator} onSubmit={onSubmit} extraErrors={extraErrors} />;
    }

    const { container } = render(<Wrapper />);
    const form = container.querySelector('form')!;

    await submitForm(form, user);

    await actWrappedDelayPromise();

    expect(container.querySelectorAll('.error-detail li')).toHaveLength(1);
  });

  it('should show extraErrors when set for the first time via async onSubmit callback', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      required: ['a', 'b'],
      properties: {
        a: { type: 'integer', title: 'A', default: 10 },
        b: { type: 'integer', title: 'B' },
      },
    };

    const sampleErrors: ErrorSchema = {
      __errors: ['Simulated submit failure.'],
      a: { __errors: ['Sample error on field a'] },
      b: { __errors: ['Sample error on field b'] },
    } as unknown as ErrorSchema;

    function Wrapper() {
      const [extraErrors, setExtraErrors] = useState<ErrorSchema>({} as ErrorSchema);

      const onSubmit = useCallback(async () => {
        setExtraErrors({} as ErrorSchema);
        await delayPromise();
        setExtraErrors(sampleErrors);
      }, []);

      // oxlint-disable-next-line typescript/no-deprecated
      return <Form schema={schema} validator={validator} onSubmit={onSubmit} extraErrors={extraErrors} noValidate />;
    }

    const { container } = render(<Wrapper />);
    const form = container.querySelector('form')!;

    // forceFireEvent=true: clicking the submit button focuses it, blurring the
    // currently focused field and firing onChange which may mutate formData before
    // the submit handler runs. fireEvent.submit bypasses that side-effect chain.
    await submitForm(form, user, true);

    await actWrappedDelayPromise(200);

    const errorItems = container.querySelectorAll('.error-detail li');
    expect(errorItems.length).toBeGreaterThan(0);
  });

  it('should show extraErrors after successful validation and async onSubmit', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };

    const sampleErrors: ErrorSchema = {
      foo: { __errors: ['Server-side error'] },
    } as unknown as ErrorSchema;

    const formRef = createRef<Form>();

    function Wrapper() {
      const [extraErrors, setExtraErrors] = useState<ErrorSchema>({} as ErrorSchema);

      const onSubmit = useCallback(async () => {
        setExtraErrors({} as ErrorSchema);
        await delayPromise();
        setExtraErrors(sampleErrors);
      }, []);

      return <Form ref={formRef} schema={schema} validator={validator} onSubmit={onSubmit} extraErrors={extraErrors} />;
    }

    const { container } = render(<Wrapper />);
    const form = container.querySelector('form')!;

    await submitForm(form, user);

    await actWrappedDelayPromise(200);

    // Check the form state directly
    const { state } = formRef.current!;
    expect(state.errors.length).toBeGreaterThan(0);
    expect(state.errorSchema).toEqual(sampleErrors);

    // Also check DOM
    const errorItems = container.querySelectorAll('.error-detail li');
    expect(errorItems.length).toBeGreaterThan(0);
  });
});

describe('extraErrors not duplicated when sibling array field mutated (#5041)', () => {
  it('should not accumulate duplicate extraErrors after array item is added', async () => {
    // Reproduces https://github.com/rjsf-team/react-jsonschema-form/issues/5041
    // processPendingChange() used originalErrorSchema (which already contains merged
    // extraErrors) as the base for re-merging extraErrors, causing __errors to be
    // appended again on every array mutation.
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        items: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    };

    const extraErrors: ErrorSchema = {
      name: { __errors: ['Name is required'] },
    } as unknown as ErrorSchema;

    const formRef = createRef<Form>();

    function Wrapper() {
      return <Form ref={formRef} schema={schema} validator={validator} extraErrors={extraErrors} />;
    }

    const { container } = render(<Wrapper />);
    const form = container.firstElementChild!;

    // Add an item to the sibling array field
    const addBtn = form.querySelector('.btn-add');
    await user.click(addBtn!);

    // The name field's extraErrors should still contain exactly one error
    const { state } = formRef.current!;
    const nameErrors = (state.errorSchema as any)?.name?.__errors ?? [];
    expect(nameErrors).toHaveLength(1);
    expect(nameErrors[0]).toBe('Name is required');
  });
});

describe('patternProperties with fixed properties (#4518)', () => {
  it('should submit valid formData after a nested string field is cleared (no undefined leaf values)', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        annotations: {
          type: 'object',
          additionalProperties: {
            type: 'string',
          },
          patternProperties: {
            '^.+$': {
              type: 'string',
            },
          },
          description: 'A set of key-value annotations.',
          properties: {
            testEmptyAnnotation1: {
              type: 'string',
              title: 'annotation1',
            },
            testEmptyAnnotation2: {
              type: 'string',
              title: 'annotation2',
            },
          },
        },
      },
    };

    const { container, node, onSubmit, onError } = createFormComponent({
      schema,
      formData: { annotations: {} },
    });

    await submitForm(node, user);
    expect(onError).not.toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalled();
    onSubmit.mockClear();
    onError.mockClear();

    const input = container.querySelector<HTMLInputElement>('#root_annotations_testEmptyAnnotation1');
    expect(input).toBeInTheDocument();
    await user.type(input!, 'hello');
    await user.clear(input!);

    await submitForm(node, user);
    expect(onError).not.toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalled();
    const { formData } = onSubmit.mock.calls[onSubmit.mock.calls.length - 1][0];
    expect(formData).toEqual({ annotations: {} });
  });
});

describe('clearing a field with a schema default does not re-apply the default (#5125)', () => {
  it('field stays empty after the user clears a string field that has a default value', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        name: { type: 'string', default: 'Chuck' },
      },
    };

    const { container, node, onSubmit, onError } = createFormComponent({ schema });

    // Initial default is populated
    const input = container.querySelector<HTMLInputElement>('#root_name');
    expect(input).toBeInTheDocument();
    expect(input!.value).toBe('Chuck');

    // User clears the field
    await user.clear(input!);
    expect(input!.value).toBe('');

    // After clearing, the field must NOT re-fill with the default
    expect(input!.value).toBe('');

    // Submitting should succeed and the cleared field must not carry the default
    await submitForm(node, user);
    expect(onError).not.toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalled();
    const { formData } = onSubmit.mock.calls[onSubmit.mock.calls.length - 1][0];
    expect(formData).not.toHaveProperty('name', 'Chuck');
  });

  it('clearing a second field does not re-apply the default to a previously-cleared field', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        someStrings: { type: 'string', default: 'Chuck' },
        someNumbers: { type: 'number', default: 1 },
      },
    };

    const { container, node, onSubmit, onError } = createFormComponent({ schema });
    const stringsInput = container.querySelector<HTMLInputElement>('#root_someStrings');
    const numbersInput = container.querySelector<HTMLInputElement>('#root_someNumbers');

    expect(stringsInput).toBeInTheDocument();
    expect(numbersInput).toBeInTheDocument();
    expect(stringsInput!.value).toBe('Chuck');
    expect(numbersInput!.value).toBe('1');

    // Clear the first field
    await user.clear(stringsInput!);
    expect(stringsInput!.value).toBe('');

    // Clear the second field — the first must NOT get its default re-applied
    await user.clear(numbersInput!);
    expect(stringsInput!.value).toBe('');
    expect(numbersInput!.value).toBe('');

    // Clear the first field again — the second must NOT get its default re-applied
    await user.clear(stringsInput!);
    expect(stringsInput!.value).toBe('');
    expect(numbersInput!.value).toBe('');

    // Submitting should succeed and the cleared field must not carry the default
    await submitForm(node, user);
    expect(onError).not.toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalled();

    // The formData must not contain the default values for either field
    const { formData } = onSubmit.mock.calls[onSubmit.mock.calls.length - 1][0];
    expect(formData).not.toHaveProperty('someStrings', 'Chuck');
    expect(formData).not.toHaveProperty('someNumbers', 1);
  });
});

describe('enum-based array values do not update when dependencies change (#1357 and #2492)', () => {
  it('should remove enum values in array when dependency switches', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        opt: {
          type: 'boolean',
        },
      },
      dependencies: {
        opt: {
          oneOf: [
            {
              properties: {
                opt: {
                  const: true,
                },
                arr: {
                  type: 'array',
                  uniqueItems: true,
                  items: {
                    type: 'string',
                    enum: ['a', 'b'],
                  },
                },
              },
            },
            {
              properties: {
                opt: {
                  const: false,
                },
                arr: {
                  type: 'array',
                  uniqueItems: true,
                  items: {
                    type: 'string',
                    enum: ['c', 'd'],
                  },
                },
              },
            },
          ],
        },
      },
    };
    const uiSchema: UiSchema = {
      arr: {
        'ui:widget': 'checkboxes',
      },
    };

    const { node, onChange } = createFormComponent({
      schema,
      uiSchema,
      formData: { opt: false },
    });

    const checkboxC = node.querySelector('#root_arr-0');
    expect(checkboxC).not.toBeChecked();
    await user.click(checkboxC!);
    expect(checkboxC).toBeChecked();

    expectToHaveBeenCalledWithFormData(onChange, { opt: false, arr: ['c'] }, 'root_arr');

    const checkboxOpt = node.querySelector('#root_opt');
    expect(checkboxOpt).not.toBeChecked();
    await user.click(checkboxOpt!);
    expect(checkboxOpt).toBeChecked();

    expectToHaveBeenCalledWithFormData(onChange, { opt: true, arr: [] }, 'root_opt');
  });
  it('array item defaults based on enums are switched when dependencies switch and arrayMinItems.mergeExtraDefaults is true', async () => {
    const schema: RJSFSchema = {
      title: 'Dependencies & Default',
      type: 'object',
      properties: {
        select_item: {
          type: 'string',
          enum: ['item1', 'item2'],
        },
      },
      dependencies: {
        select_item: {
          oneOf: [
            {
              properties: {
                select_item: {
                  const: 'item1',
                },
                item_detail: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['item_detail1', 'item_detail2'],
                  },
                  default: ['item_detail1', 'item_detail2'],
                },
              },
            },
            {
              properties: {
                select_item: {
                  const: 'item2',
                },
                item_detail: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['item_detail3', 'item_detail4'],
                  },
                  default: ['item_detail3', 'item_detail4'],
                },
              },
            },
          ],
        },
      },
    };
    const { node, onChange } = createFormComponent({
      schema,
      formData: { select_item: 'item1' },
      experimental_defaultFormStateBehavior: { arrayMinItems: { mergeExtraDefaults: true } },
    });

    expectToHaveBeenCalledWithFormData(onChange, {
      select_item: 'item1',
      item_detail: ['item_detail1', 'item_detail2'],
    });

    const selectItem = node.querySelector('#root_select_item');
    await user.selectOptions(selectItem!, 'item2');

    expectToHaveBeenCalledWithFormData(
      onChange,
      {
        select_item: 'item2',
        item_detail: ['item_detail3', 'item_detail4'],
      },
      'root_select_item',
    );
  });
});

describe('dependencies/oneOf constraint violation produces validation errors on submit (#3368)', () => {
  it('submitting form data that matches no oneOf branch in dependencies reports errors and blocks submission', async () => {
    const schema: RJSFSchema = {
      dependencies: {
        commands: {
          oneOf: [
            {
              properties: {
                commands: {
                  enum: ['docker_pull'],
                },
                image: {
                  default: 'sasdasd',
                  description: 'Images to pull - the image name specifically and defaults to latest',
                  title: 'Images',
                  type: 'string',
                },
              },
            },
            {
              properties: {
                commands: {
                  enum: ['docker_prune'],
                },
                prune_opts: {
                  default: 'until_24',
                  description: 'The prune options to get the images from',
                  enum: ['until_24'],
                  title: 'Prune Options',
                },
              },
            },
          ],
        },
      },
      properties: {
        commands: {
          description: 'Commands for host',
          enum: ['docker_pull', 'docker_ps', 'docker_images', 'docker_prune'],
          title: 'Commands',
        },
        env: {
          description: 'The env we SSH and make requests against',
          enum: ['develop'],
          title: 'Environment (Will connect against container host)',
        },
      },
      required: ['commands', 'env'],
      type: 'object',
    };
    const formData = {
      image: 'sasdasd',
      commands: 'docker_ps',
      env: 'develop',
    };
    const { node, onSubmit, onError } = createFormComponent({ schema, formData });
    await submitForm(node, user);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
