import { RJSFSchema, UiSchema, optionsList } from '../src';

describe('optionsList()', () => {
  let consoleWarnSpy: jest.SpyInstance;
  let oldProcessEnv: string | undefined;
  beforeAll(() => {
    oldProcessEnv = process.env.NODE_ENV;
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });
  afterAll(() => {
    consoleWarnSpy.mockRestore();
  });
  afterEach(() => {
    process.env.NODE_ENV = oldProcessEnv;
    consoleWarnSpy.mockClear();
  });
  it('returns undefined when schema does not have any options', () => {
    expect(optionsList({})).toBeUndefined();
  });
  describe('enums', () => {
    it('should generate options for an enum schema', () => {
      const enumSchema: RJSFSchema = {
        type: 'string',
        enum: ['Opt1', 'Opt2', 'Opt3'],
      };

      expect(optionsList(enumSchema)).toEqual(enumSchema.enum!.map((opt) => ({ label: opt, value: opt })));
    });
    it('should generate options for an enum schema and uiSchema enumNames', () => {
      const enumSchema: RJSFSchema = {
        type: 'string',
        enum: ['Opt1', 'Opt2', 'Opt3'],
      };
      const uiSchema: UiSchema = {
        'ui:enumNames': ['Option1', 'Option2', 'Option3'],
      };

      expect(optionsList(enumSchema, uiSchema)).toEqual(
        enumSchema.enum!.map((opt, index) => {
          const label: string = uiSchema['ui:enumNames']![index] ?? opt;
          return { label, value: opt };
        })
      );
    });
    it('generates options and favors uiSchema if schema.enumNames is present', () => {
      const enumSchema: RJSFSchema = {
        type: 'string',
        enum: ['Opt1', 'Opt2', 'Opt3'],
      };
      const uiSchema: UiSchema = {
        'ui:enumNames': ['Option1', 'Option2', 'Option3'],
      };

      const enumNameSchema = {
        ...enumSchema,
        enumNames: ['Option One', 'Option Two', 'Option Three'],
      };

      expect(optionsList(enumNameSchema, uiSchema)).toEqual(
        enumNameSchema.enum!.map((opt, index) => {
          const label: string = uiSchema['ui:enumNames']![index] ?? opt;
          return { label, value: opt };
        })
      );
      expect(console.warn).not.toHaveBeenCalled();
    });
    it('generates options and does not emit a deprecation warning for a schema with enumNames in production', () => {
      process.env.NODE_ENV = 'production';
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
          return { label, value: opt };
        })
      );
      expect(console.warn).not.toHaveBeenCalled();
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
          return { label, value: opt };
        })
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringMatching(/The "enumNames" property in the schema is deprecated/)
      );
    });
  });
  describe('anyOf', () => {
    it('should generate options for a anyOf schema', () => {
      const anyOfSchema = {
        title: 'string',
        anyOf: [
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
        ...anyOfSchema,
        anyOf: anyOfSchema.anyOf,
      };
      expect(optionsList(anyOfSchema)).toEqual(
        anyOfSchema.anyOf.map((schema) => ({
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
    it('should generate options for a anyOf schema and uiSchema', () => {
      const anyOfSchema = {
        title: 'string',
        anyOf: [
          {
            const: 'Option',
            description: 'Option description',
          },
        ],
      };
      const anyOfUiSchema: UiSchema = {
        anyOf: [
          {
            'ui:title': 'Alternate',
          },
        ],
      };
      expect(optionsList<RJSFSchema>(anyOfSchema, anyOfUiSchema)).toEqual(
        anyOfSchema.anyOf.map((schema, index) => ({
          schema,
          label: anyOfUiSchema.anyOf[index]['ui:title'],
          value: schema.const,
        }))
      );
    });
    it('should generate options for a anyOf schema uses value as fallback title', () => {
      const anyOfSchema = {
        title: 'string',
        anyOf: [
          {
            const: 'Option',
            description: 'Option description',
          },
        ],
      };
      expect(optionsList(anyOfSchema)).toEqual(
        anyOfSchema.anyOf.map((schema) => ({
          schema,
          label: schema.const,
          value: schema.const,
        }))
      );
    });
  });
  describe('oneOf', () => {
    it('should generate options for a oneOf schema', () => {
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
    it('should generate options for a oneOf schema and uiSchema', () => {
      const oneOfSchema = {
        title: 'string',
        oneOf: [
          {
            const: 'Option',
            description: 'Option description',
          },
        ],
      };
      const oneOfUiSchema: UiSchema = {
        oneOf: [
          {
            'ui:title': 'Alternate',
          },
        ],
      };
      expect(optionsList<RJSFSchema>(oneOfSchema, oneOfUiSchema)).toEqual(
        oneOfSchema.oneOf.map((schema, index) => ({
          schema,
          label: oneOfUiSchema.oneOf[index]['ui:title'],
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
});
