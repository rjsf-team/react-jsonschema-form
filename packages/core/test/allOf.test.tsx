import type { RJSFSchema, FieldProps } from '@rjsf/utils';
import { userEvent } from '@testing-library/user-event';

import SchemaField from '../src/components/fields/SchemaField.tsx';
import {
  createFormComponent,
  expectToHaveBeenCalledWithFormData,
  getSelectedOptionValue,
  setupConsoleWarnSuppression,
} from './testUtils.tsx';

const user = userEvent.setup();

setupConsoleWarnSuppression();

describe('allOf', () => {
  it('should render a regular input element with a single type, when multiple types specified', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: {
          allOf: [{ type: ['string', 'number', 'null'] }, { type: 'string' }],
        },
      },
    };

    const { node } = createFormComponent({
      schema,
    });

    expect(node.querySelectorAll('input')).toHaveLength(1);
  });

  it('should be able to handle incompatible types and not crash', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: {
          allOf: [{ type: 'string' }, { type: 'boolean' }],
        },
      },
    };

    const { node } = createFormComponent({
      schema,
    });

    expect(node.querySelectorAll('input')).toHaveLength(0);
  });
  it('should pass form context to schema field', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: {
          allOf: [{ type: 'string' }, { type: 'boolean' }],
        },
      },
    };
    const formContext: Record<string, string> = { root: 'root-id', root_foo: 'foo-id' };
    function CustomSchemaField(props: FieldProps<unknown, RJSFSchema, Record<string, string>>) {
      const {
        registry: { formContext },
        id,
      } = props;
      return (
        <>
          <code id={formContext[id]}>Ha</code>
          <SchemaField {...props} />
        </>
      );
    }
    const { node } = createFormComponent({
      schema,
      initialFormData: { userId: 'foobarbaz' },
      formContext,
      fields: { SchemaField: CustomSchemaField },
    });

    const codeBlocks = node.querySelectorAll('code');
    expect(codeBlocks).toHaveLength(2);
    Object.keys(formContext).forEach((key) => {
      expect(node.querySelector(`code#${formContext[key]}`)).toBeInTheDocument();
    });
  });
  const COLOR: RJSFSchema = { type: 'string', enum: ['red', 'green', 'blue'] };
  it.each<[string, RJSFSchema]>([
    ['a $ref', { allOf: [{ $ref: '#/definitions/Color' }], default: 'red' }],
    ['an inline enum', { allOf: [COLOR], default: 'red' }],
  ])('should keep the option picked in the select of an enum wrapped in allOf with %s', async (_name, color) => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { color },
      definitions: { Color: COLOR },
    };
    const { node, onChange } = createFormComponent({ schema });
    const select = node.querySelector<HTMLSelectElement>('select')!;

    await user.selectOptions(select, 'green');

    expectToHaveBeenCalledWithFormData(onChange, { color: 'green' }, 'root_color');
    expect(getSelectedOptionValue(select)).toEqual('green');
  });
});
