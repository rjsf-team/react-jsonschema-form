import { JSONSchema7 } from 'json-schema';

import { optionsList } from '../src';

describe('optionsList()', () => {
  it('should generate options for an enum schema', () => {
    const enumSchema: JSONSchema7 = {
      type: 'string',
      enum: ['Opt1', 'Opt2', 'Opt3'],
    };

    const enumNameSchema = {
      ...enumSchema,
      enumNames: ['Option1', 'Option2', 'Option3'],
    };
    expect(optionsList(enumSchema)).toEqual(
      enumSchema.enum!.map(opt => ({ label: opt, value: opt }))
    );
    expect(optionsList(enumNameSchema)).toEqual(
      enumNameSchema.enum!.map((opt, index) => {
        const label = enumNameSchema.enumNames[index] || opt;
        return { label: label, value: opt };
      })
    );
  });
  it('should generate options for a oneOf|anyOf schema', () => {
    const oneOfSchema = {
      title: 'string',
      oneOf: [
        {
          const: 'Option1',
          title: 'Option1 title',
          description: 'Option1 description',
        },
        {
          const: 'Option2',
          title: 'Option2 title',
          description: 'Option2 description',
        },
        {
          const: 'Option3',
          title: 'Option3 title',
          description: 'Option3 description',
        },
      ],
    };
    const anyofSchema = {
      ...oneOfSchema,
      oneOf: undefined,
      anyOf: oneOfSchema.oneOf,
    };
    expect(optionsList(oneOfSchema)).toEqual(
      oneOfSchema.oneOf.map(schema => ({
        schema,
        label: schema.title,
        value: schema.const,
      }))
    );
    expect(optionsList(anyofSchema)).toEqual(
      anyofSchema.anyOf.map(schema => ({
        schema,
        label: schema.title,
        value: schema.const,
      }))
    );
  });
});
