import type { RJSFSchema } from '@rjsf/utils';
import { userEvent } from '@testing-library/user-event';

import {
  createFormComponent,
  errorListMessages,
  expectToHaveBeenCalledWithFormData,
  submitForm,
} from './testUtils.tsx';

const user = userEvent.setup();

describe('const', () => {
  it('should render a schema that uses const with a string value', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { const: 'bar' },
      },
    };

    const { node } = createFormComponent({
      schema,
    });

    expect(node.querySelector('input#root_foo')).not.toBeNull();
  });

  it('should render a schema that uses const with a number value', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { const: 123 },
      },
    };

    const { node } = createFormComponent({
      schema,
    });

    expect(node.querySelector('input#root_foo')).not.toBeNull();
  });

  it('should render a schema that uses const with a boolean value', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { const: true },
      },
    };

    const { node } = createFormComponent({
      schema,
    });

    expect(node.querySelector("input#root_foo[type='checkbox']")).not.toBeNull();
  });

  it.each([
    ['beside a parent default', { default: { x: { a: 2 } } }],
    ['without a parent default', {}],
  ])('should submit an object const declaring no properties as the const %s', async (_, parent) => {
    const schema: RJSFSchema = {
      type: 'object',
      ...parent,
      properties: { x: { type: 'object', const: { a: 2 } } },
    };
    const { node, onSubmit } = createFormComponent({ schema });

    await submitForm(node, user);

    expect(errorListMessages(node)).toEqual([]);
    expectToHaveBeenCalledWithFormData(onSubmit, { x: { a: 2 } }, true);
  });
});
