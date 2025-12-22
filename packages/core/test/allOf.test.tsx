import { RJSFSchema, FieldProps, GenericObjectType } from '@rjsf/utils';

import { createFormComponent } from './testUtils';
import SchemaField from '../src/components/fields/SchemaField';

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
    const formContext: GenericObjectType = { root: 'root-id', root_foo: 'foo-id' };
    function CustomSchemaField(props: FieldProps) {
      const {
        registry: { formContext },
        fieldPathId,
      } = props;
      return (
        <>
          <code id={formContext[fieldPathId.$id]}>Ha</code>
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
    expect(codeBlocks).toHaveLength(2);
    Object.keys(formContext).forEach((key) => {
      expect(node.querySelector(`code#${formContext[key]}`)).toBeInTheDocument();
    });
  });
});
