import get from 'lodash/get';

import { CONST_KEY, optionsList, PROPERTIES_KEY, RJSFSchema, UiSchema } from '../src';

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
        }),
      );
    });
    it('should generate options for an enum schema with map-based enumNames', () => {
      const enumSchema: RJSFSchema = {
        type: 'string',
        enum: ['person', 'phone', 'video'],
      };
      const uiSchema: UiSchema = {
        'ui:enumNames': {
          person: 'In person',
          phone: 'By phone',
          video: 'Via video',
        },
      };
      expect(optionsList(enumSchema, uiSchema)).toEqual([
        { label: 'In person', value: 'person' },
        { label: 'By phone', value: 'phone' },
        { label: 'Via video', value: 'video' },
      ]);
    });
    it('should fall back to String(value) for values missing from map-based enumNames', () => {
      const enumSchema: RJSFSchema = {
        type: 'number',
        enum: [1, 2, 3],
      };
      const uiSchema: UiSchema = {
        'ui:enumNames': { '1': 'One', '3': 'Three' },
      };
      expect(optionsList(enumSchema, uiSchema)).toEqual([
        { label: 'One', value: 1 },
        { label: '2', value: 2 },
        { label: 'Three', value: 3 },
      ]);
    });
    it('should reorder options using enumOrder with wildcard', () => {
      const enumSchema: RJSFSchema = {
        type: 'string',
        enum: ['a', 'b', 'c', 'd'],
      };
      const uiSchema: UiSchema = {
        'ui:enumOrder': ['d', '*', 'a'],
      };
      expect(optionsList(enumSchema, uiSchema)).toEqual([
        { label: 'd', value: 'd' },
        { label: 'b', value: 'b' },
        { label: 'c', value: 'c' },
        { label: 'a', value: 'a' },
      ]);
    });
    it('should drop unlisted options when enumOrder has no wildcard', () => {
      const enumSchema: RJSFSchema = {
        type: 'string',
        enum: ['a', 'b', 'c'],
      };
      const uiSchema: UiSchema = {
        'ui:enumOrder': ['c', 'a'],
      };
      expect(optionsList(enumSchema, uiSchema)).toEqual([
        { label: 'c', value: 'c' },
        { label: 'a', value: 'a' },
      ]);
    });
    it('should support combined map-based enumNames and enumOrder', () => {
      const enumSchema: RJSFSchema = {
        type: 'number',
        enum: [0, 1, 2, 3, 4],
      };
      const uiSchema: UiSchema = {
        'ui:enumNames': {
          '0': "Didn't like it",
          '1': 'Meh',
          '2': 'OK',
          '3': 'Liked it',
          '4': 'Loved it',
        },
        'ui:enumOrder': [4, 3, 2, 1, 0],
      };
      expect(optionsList(enumSchema, uiSchema)).toEqual([
        { label: 'Loved it', value: 4 },
        { label: 'Liked it', value: 3 },
        { label: 'OK', value: 2 },
        { label: 'Meh', value: 1 },
        { label: "Didn't like it", value: 0 },
      ]);
    });
  });
  describe('anyOf', () => {
    it('should generate options for an anyOf schema', () => {
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
        })),
      );
      expect(optionsList(anyofSchema)).toEqual(
        anyofSchema.anyOf.map((schema) => ({
          schema,
          label: schema.title,
          value: schema.const,
        })),
      );
    });
    it('should generate options for an anyOf schema and uiSchema', () => {
      const anyOfSchema: RJSFSchema = {
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
      expect(optionsList(anyOfSchema, anyOfUiSchema)).toEqual(
        anyOfSchema.anyOf!.map((schema, index) => ({
          schema,
          label: anyOfUiSchema.anyOf[index]['ui:title'],
          value: get(schema, CONST_KEY),
        })),
      );
    });
    it('should generate options for an anyOf schema uses value as fallback title', () => {
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
        })),
      );
    });
    it('should generate options for an anyOf object schema with a discriminator, titles in object', () => {
      const anyOfSchema: RJSFSchema = {
        title: 'string',
        discriminator: {
          propertyName: 'animal',
        },
        anyOf: [
          {
            type: 'object',
            title: 'Dog',
            properties: {
              animal: {
                type: 'string',
                const: 'dog',
              },
            },
          },
          {
            type: 'object',
            title: 'Fish',
            properties: {
              animal: {
                type: 'string',
                const: 'fish',
              },
            },
          },
        ],
      };
      expect(optionsList(anyOfSchema)).toEqual(
        anyOfSchema.anyOf!.map((schema) => ({
          schema,
          label: get(schema, ['title']),
          value: get(schema, [PROPERTIES_KEY, 'animal', CONST_KEY]),
        })),
      );
    });
    it('should generate options for an anyOf object schema with a discriminator, titles in discriminator property', () => {
      const anyOfSchema: RJSFSchema = {
        title: 'string',
        discriminator: {
          propertyName: 'animal',
        },
        anyOf: [
          {
            type: 'object',
            properties: {
              animal: {
                type: 'string',
                title: 'Dog',
                const: 'dog',
              },
            },
          },
          {
            type: 'object',
            properties: {
              animal: {
                type: 'string',
                title: 'Fish',
                const: 'fish',
              },
            },
          },
        ],
      };
      expect(optionsList(anyOfSchema)).toEqual(
        anyOfSchema.anyOf!.map((schema) => ({
          schema,
          label: get(schema, [PROPERTIES_KEY, 'animal', 'title']),
          value: get(schema, [PROPERTIES_KEY, 'animal', CONST_KEY]),
        })),
      );
    });
    it('should generate options for an anyOf object schema with a discriminator, value as fallback titles', () => {
      const anyOfSchema: RJSFSchema = {
        title: 'string',
        discriminator: {
          propertyName: 'animal',
        },
        anyOf: [
          {
            type: 'object',
            properties: {
              animal: {
                type: 'string',
                const: 'dog',
              },
            },
          },
          {
            type: 'object',
            properties: {
              animal: {
                type: 'string',
                const: 'fish',
              },
            },
          },
        ],
      };
      expect(optionsList(anyOfSchema, {})).toEqual(
        anyOfSchema.anyOf!.map((schema) => ({
          schema,
          label: get(schema, [PROPERTIES_KEY, 'animal', CONST_KEY]),
          value: get(schema, [PROPERTIES_KEY, 'animal', CONST_KEY]),
        })),
      );
    });
    it('should generate options for an anyOf object schema without a discriminator, with optionsSchemaSelector', () => {
      const anyOfSchema: RJSFSchema = {
        title: 'string',
        anyOf: [
          {
            type: 'object',
            properties: {
              animal: {
                type: 'string',
                title: 'Dog',
                const: 'dog',
              },
            },
          },
          {
            type: 'object',
            properties: {
              animal: {
                type: 'string',
                title: 'Fish',
                const: 'fish',
              },
            },
          },
        ],
      };
      const anyOfUiSchema = { 'ui:options': { optionsSchemaSelector: 'animal' } };
      expect(optionsList(anyOfSchema, anyOfUiSchema)).toEqual(
        anyOfSchema.anyOf!.map((schema) => ({
          schema,
          label: get(schema, [PROPERTIES_KEY, 'animal', 'title']),
          value: get(schema, [PROPERTIES_KEY, 'animal', CONST_KEY]),
        })),
      );
    });
    it('should generate options for an anyOf object schema without a discriminator, with optionsSchemaSelector, uiTitles', () => {
      const anyOfSchema: RJSFSchema = {
        title: 'string',
        anyOf: [
          {
            type: 'object',
            properties: {
              animal: {
                type: 'string',
                const: 'dog',
              },
            },
          },
        ],
      };
      const anyOfUiSchema = {
        'ui:options': { optionsSchemaSelector: 'animal' },
        anyOf: [
          {
            'ui:title': 'Alternate',
          },
        ],
      };
      expect(optionsList(anyOfSchema, anyOfUiSchema)).toEqual(
        anyOfSchema.anyOf!.map((schema, index) => ({
          schema,
          label: anyOfUiSchema.anyOf[index]['ui:title'],
          value: get(schema, [PROPERTIES_KEY, 'animal', CONST_KEY]),
        })),
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
        })),
      );
      expect(optionsList(anyofSchema)).toEqual(
        anyofSchema.anyOf.map((schema) => ({
          schema,
          label: schema.title,
          value: schema.const,
        })),
      );
    });
    it('should generate options for a oneOf schema and uiSchema', () => {
      const oneOfSchema: RJSFSchema = {
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
      expect(optionsList(oneOfSchema, oneOfUiSchema)).toEqual(
        oneOfSchema.oneOf!.map((schema, index) => ({
          schema,
          label: oneOfUiSchema.oneOf[index]['ui:title'],
          value: get(schema, CONST_KEY),
        })),
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
        })),
      );
    });
    it('should generate options for a oneOf object schema with a discriminator, titles in object', () => {
      const oneOfSchema: RJSFSchema = {
        title: 'string',
        discriminator: {
          propertyName: 'animal',
        },
        oneOf: [
          {
            type: 'object',
            title: 'Dog',
            properties: {
              animal: {
                type: 'string',
                const: 'dog',
              },
            },
          },
          {
            type: 'object',
            title: 'Fish',
            properties: {
              animal: {
                type: 'string',
                const: 'fish',
              },
            },
          },
        ],
      };
      expect(optionsList(oneOfSchema)).toEqual(
        oneOfSchema.oneOf!.map((schema) => ({
          schema,
          label: get(schema, ['title']),
          value: get(schema, [PROPERTIES_KEY, 'animal', CONST_KEY]),
        })),
      );
    });
    it('should generate options for a oneOf object schema with a discriminator, titles in discriminator property', () => {
      const oneOfSchema: RJSFSchema = {
        title: 'string',
        discriminator: {
          propertyName: 'animal',
        },
        oneOf: [
          {
            type: 'object',
            properties: {
              animal: {
                type: 'string',
                title: 'Dog',
                const: 'dog',
              },
            },
          },
          {
            type: 'object',
            properties: {
              animal: {
                type: 'string',
                title: 'Fish',
                const: 'fish',
              },
            },
          },
        ],
      };
      expect(optionsList(oneOfSchema)).toEqual(
        oneOfSchema.oneOf!.map((schema) => ({
          schema,
          label: get(schema, [PROPERTIES_KEY, 'animal', 'title']),
          value: get(schema, [PROPERTIES_KEY, 'animal', CONST_KEY]),
        })),
      );
    });
    it('should generate options for a oneOf object schema with a discriminator, value as fallback titles', () => {
      const oneOfSchema: RJSFSchema = {
        title: 'string',
        discriminator: {
          propertyName: 'animal',
        },
        oneOf: [
          {
            type: 'object',
            properties: {
              animal: {
                type: 'string',
                const: 'dog',
              },
            },
          },
          {
            type: 'object',
            properties: {
              animal: {
                type: 'string',
                const: 'fish',
              },
            },
          },
        ],
      };
      expect(optionsList(oneOfSchema, {})).toEqual(
        oneOfSchema.oneOf!.map((schema) => ({
          schema,
          label: get(schema, [PROPERTIES_KEY, 'animal', CONST_KEY]),
          value: get(schema, [PROPERTIES_KEY, 'animal', CONST_KEY]),
        })),
      );
    });
    it('should generate options for a oneOf object schema without a discriminator, with optionsSchemaSelector', () => {
      const oneOfSchema: RJSFSchema = {
        title: 'string',
        oneOf: [
          {
            type: 'object',
            properties: {
              animal: {
                type: 'string',
                title: 'Dog',
                const: 'dog',
              },
            },
          },
          {
            type: 'object',
            properties: {
              animal: {
                type: 'string',
                title: 'Fish',
                const: 'fish',
              },
            },
          },
        ],
      };
      const oneOfUiSchema = { 'ui:options': { optionsSchemaSelector: 'animal' } };
      expect(optionsList(oneOfSchema, oneOfUiSchema)).toEqual(
        oneOfSchema.oneOf!.map((schema) => ({
          schema,
          label: get(schema, [PROPERTIES_KEY, 'animal', 'title']),
          value: get(schema, [PROPERTIES_KEY, 'animal', CONST_KEY]),
        })),
      );
    });
    it('should generate options for a oneOf object schema without a discriminator, with optionsSchemaSelector, uiTitles', () => {
      const oneOfSchema: RJSFSchema = {
        title: 'string',
        oneOf: [
          {
            type: 'object',
            properties: {
              animal: {
                type: 'string',
                const: 'dog',
              },
            },
          },
        ],
      };
      const oneOfUiSchema = {
        'ui:options': { optionsSchemaSelector: 'animal' },
        oneOf: [
          {
            'ui:title': 'Alternate',
          },
        ],
      };
      expect(optionsList(oneOfSchema, oneOfUiSchema)).toEqual(
        oneOfSchema.oneOf!.map((schema, index) => ({
          schema,
          label: oneOfUiSchema.oneOf[index]['ui:title'],
          value: get(schema, [PROPERTIES_KEY, 'animal', CONST_KEY]),
        })),
      );
    });
  });
});
