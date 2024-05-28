import { RJSFSchema, optionsList } from '../src';

const DEFAULT_PLACEHOLDER_ENUM_VALUE = {
  label: '',
  value: null,
};

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
    const multiple = false;
    const placeholder = undefined;

    expect(optionsList(enumSchema, multiple, placeholder)).toEqual([
      DEFAULT_PLACEHOLDER_ENUM_VALUE,
      ...enumSchema.enum!.map((opt) => ({ label: opt, value: opt })),
    ]);
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
    const multiple = false;
    const placeholder = undefined;

    expect(optionsList(enumNameSchema, multiple, placeholder)).toEqual([
      DEFAULT_PLACEHOLDER_ENUM_VALUE,
      ...enumNameSchema.enum!.map((opt, index) => {
        const label = enumNameSchema.enumNames[index] || opt;
        return { label: label, value: opt };
      }),
    ]);
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
    const multiple = false;
    const placeholder = undefined;

    expect(optionsList(oneOfSchema, multiple, placeholder)).toEqual([
      DEFAULT_PLACEHOLDER_ENUM_VALUE,
      ...oneOfSchema.oneOf.map((schema) => ({
        schema,
        label: schema.title,
        value: schema.const,
      })),
    ]);
    expect(optionsList(anyofSchema, multiple, placeholder)).toEqual([
      DEFAULT_PLACEHOLDER_ENUM_VALUE,
      ...anyofSchema.anyOf.map((schema) => ({
        schema,
        label: schema.title,
        value: schema.const,
      })),
    ]);
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
    const multiple = false;
    const placeholder = undefined;
    expect(optionsList(oneOfSchema, multiple, placeholder)).toEqual([
      DEFAULT_PLACEHOLDER_ENUM_VALUE,
      ...oneOfSchema.oneOf.map((schema) => ({
        schema,
        label: schema.const,
        value: schema.const,
      })),
    ]);
  });
  it('empty option has a label matching a specified placeholder', () => {
    const enumSchema: RJSFSchema = {
      type: 'string',
      enum: ['Opt1', 'Opt2', 'Opt3'],
    };
    const multiple = false;
    const placeholder = 'placeholder value';

    expect(optionsList(enumSchema, multiple, placeholder)).toEqual([
      { ...DEFAULT_PLACEHOLDER_ENUM_VALUE, label: placeholder },
      ...enumSchema.enum!.map((opt) => ({ label: opt, value: opt })),
    ]);
  });
  it('does not generate an empty choice when `multiple` is true', () => {
    const enumSchema: RJSFSchema = {
      type: 'string',
      enum: ['Opt1', 'Opt2', 'Opt3'],
    };
    const multiple = true;
    const placeholder = undefined;

    expect(optionsList(enumSchema, multiple, placeholder)).toEqual(
      // DEFAULT_PLACEHOLDER_ENUM_VALUE is not included
      enumSchema.enum!.map((opt) => ({ label: opt, value: opt }))
    );
  });
  it('does not generate an empty choice when `schema.default` is defined', () => {
    const enumSchema: RJSFSchema = {
      type: 'string',
      enum: ['Opt1', 'Opt2', 'Opt3'],
      default: 'Opt2',
    };
    const multiple = false;
    const placeholder = undefined;

    expect(optionsList(enumSchema, multiple, placeholder)).toEqual(
      // DEFAULT_PLACEHOLDER_ENUM_VALUE is not included
      enumSchema.enum!.map((opt) => ({ label: opt, value: opt }))
    );
  });
});
