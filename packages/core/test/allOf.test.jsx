import { expect } from 'chai';

import { createFormComponent, createSandbox } from './test_utils';
import SchemaField from '../src/components/fields/SchemaField';

describe('allOf', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should render a regular input element with a single type, when multiple types specified', () => {
    const schema = {
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

    expect(node.querySelectorAll('input')).to.have.length.of(1);
  });

  it('should be able to handle incompatible types and not crash', () => {
    const schema = {
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

    expect(node.querySelectorAll('input')).to.have.length.of(0);
  });
  it('should pass form context to schema field', () => {
    const schema = {
      type: 'object',
      properties: {
        foo: {
          allOf: [{ type: 'string' }, { type: 'boolean' }],
        },
      },
    };
    const formContext = { root: 'root-id', root_foo: 'foo-id' };
    function CustomSchemaField(props) {
      const { formContext, idSchema } = props;
      return (
        <>
          <code id={formContext[idSchema.$id]}>Ha</code>
          <SchemaField {...props} />
        </>
      );
    }
    const { node } = createFormComponent({
      schema,
      formData: { userId: 'foobarbaz' },
      formContext,
      fields: { SchemaField: CustomSchemaField },
    });

    const codeBlocks = node.querySelectorAll('code');
    expect(codeBlocks).to.have.length(2);
    Object.keys(formContext).forEach((key) => {
      expect(node.querySelector(`code#${formContext[key]}`)).to.exist;
    });
  });
});
