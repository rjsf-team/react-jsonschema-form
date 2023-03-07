import { RJSFSchema, optionsList } from '../src';

describe('optionsList()', () => {
  let consoleWarnSpy: jest.SpyInstance;
  beforeAll(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });
  afterAll(() => {
    consoleWarnSpy.mockRestore();
  });
  afterEach(() => {
    consoleWarnSpy.mockClear();
  });

  it('should generate options for an enum schema', () => {
    const enumSchema: RJSFSchema = {
      type: 'string',
      enum: ['Opt1', 'Opt2', 'Opt3'],
    };

    expect(optionsList(enumSchema)).toEqual(enumSchema.enum!.map((opt) => ({ label: opt, value: opt })));
  });

  it('generates options and emits a deprecation warning for a schema with enumNames', () => {
    const enumSchema: RJSFSchema = {
      type: 'string',
      enum: ['Opt1', 'Opt2', 'Opt3'],
    };

    const enumNameSchema = {
      ...enumSchema,
      enumNames: ['Option1', 'Option2', 'Option3'],
    };

    expect(optionsList(enumNameSchema)).toEqual(
      enumNameSchema.enum!.map((opt, index) => {
        const label = enumNameSchema.enumNames[index] || opt;
        return { label: label, value: opt };
      })
    );
    expect(console.warn).toHaveBeenCalledWith(expect.stringMatching(/The enumNames property is deprecated/));
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
      oneOfSchema.oneOf.map((schema) => ({
        schema,
        label: schema.title,
        value: schema.const,
      }))
    );
    expect(optionsList(anyofSchema)).toEqual(
      anyofSchema.anyOf.map((schema) => ({
        schema,
        label: schema.title,
        value: schema.const,
      }))
    );
  });
  it('should generate options for a oneOf schema uses value as fallback title', () => {
    const oneOfSchema = {
      title: 'string',
      oneOf: [
        {
          const: 'Option',
          description: 'Option description',
        },
      ],
    };
    expect(optionsList(oneOfSchema)).toEqual(
      oneOfSchema.oneOf.map((schema) => ({
        schema,
        label: schema.const,
        value: schema.const,
      }))
    );
  });
});
