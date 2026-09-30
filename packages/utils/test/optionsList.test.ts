import type { MockInstance } from 'vitest';

import type { RJSFSchema, UiSchema } from '../src/index.ts';
import { CONST_KEY, PROPERTIES_KEY, getByPath, noop, optionsList } from '../src/index.ts';

describe('optionsList()', () => {
  let consoleWarnSpy: MockInstance;
  let oldProcessEnv: string | undefined;
  beforeAll(() => {
    oldProcessEnv = process.env.NODE_ENV;
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);
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
    it('should ignore unknown values in enumOrder', () => {
      const enumSchema: RJSFSchema = {
        type: 'string',
        enum: ['a', 'b'],
      };
      const uiSchema: UiSchema = {
        'ui:enumOrder': ['b', 'nonexistent', 'a'],
      };
      expect(optionsList(enumSchema, uiSchema)).toEqual([
        { label: 'b', value: 'b' },
        { label: 'a', value: 'a' },
      ]);
    });
    it('should fall back to String(value) for missing entries in array enumNames', () => {
      const enumSchema: RJSFSchema = {
        type: 'number',
        enum: [1, 2, 3],
      };
      const uiSchema: UiSchema = {
        'ui:enumNames': ['One'],
      };
      expect(optionsList(enumSchema, uiSchema)).toEqual([
        { label: 'One', value: 1 },
        { label: '2', value: 2 },
        { label: '3', value: 3 },
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
      const anyOfUiSchema = {
        anyOf: [
          {
            'ui:title': 'Alternate',
          },
        ],
      } satisfies UiSchema;
      expect(optionsList(anyOfSchema, anyOfUiSchema)).toEqual(
        anyOfSchema.anyOf!.map((schema, index) => ({
          schema,
          label: anyOfUiSchema.anyOf[index]['ui:title'],
          value: getByPath(schema, CONST_KEY),
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
    it('should keep an empty string title for a oneOf option instead of falling back to the value', () => {
      const oneOfSchema: RJSFSchema = {
        type: 'string',
        oneOf: [
          {
            const: 'empty',
            title: '',
          },
          {
            const: 'active',
          },
        ],
      };
      expect(optionsList(oneOfSchema)).toEqual([
        { schema: oneOfSchema.oneOf![0], label: '', value: 'empty' },
        { schema: oneOfSchema.oneOf![1], label: 'active', value: 'active' },
      ]);
    });
    it('should keep an empty string title for a discriminator option instead of falling back to the value', () => {
      const anyOfSchema: RJSFSchema = {
        discriminator: {
          propertyName: 'animal',
        },
        anyOf: [
          {
            type: 'object',
            title: '',
            properties: {
              animal: {
                type: 'string',
                const: 'dog',
              },
            },
          },
        ],
      };
      expect(optionsList(anyOfSchema)).toEqual([{ schema: anyOfSchema.anyOf![0], label: '', value: 'dog' }]);
    });
    it('should generate an option with an undefined value when a discriminator option has no properties', () => {
      const anyOfSchema: RJSFSchema = {
        discriminator: {
          propertyName: 'animal',
        },
        anyOf: [{ type: 'object', title: 'NoProps' }],
      };
      expect(optionsList(anyOfSchema)).toEqual([{ schema: anyOfSchema.anyOf![0], label: 'NoProps', value: undefined }]);
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
          label: getByPath(schema, ['title']),
          value: getByPath(schema, [PROPERTIES_KEY, 'animal', CONST_KEY]),
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
          label: getByPath(schema, [PROPERTIES_KEY, 'animal', 'title']),
          value: getByPath(schema, [PROPERTIES_KEY, 'animal', CONST_KEY]),
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
          label: getByPath(schema, [PROPERTIES_KEY, 'animal', CONST_KEY]),
          value: getByPath(schema, [PROPERTIES_KEY, 'animal', CONST_KEY]),
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
      const anyOfUiSchema = {
        'ui:options': { optionsSchemaSelector: 'animal' },
      };
      expect(optionsList(anyOfSchema, anyOfUiSchema)).toEqual(
        anyOfSchema.anyOf!.map((schema) => ({
          schema,
          label: getByPath(schema, [PROPERTIES_KEY, 'animal', 'title']),
          value: getByPath(schema, [PROPERTIES_KEY, 'animal', CONST_KEY]),
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
          value: getByPath(schema, [PROPERTIES_KEY, 'animal', CONST_KEY]),
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
      const oneOfUiSchema = {
        oneOf: [
          {
            'ui:title': 'Alternate',
          },
        ],
      } satisfies UiSchema;
      expect(optionsList(oneOfSchema, oneOfUiSchema)).toEqual(
        oneOfSchema.oneOf!.map((schema, index) => ({
          schema,
          label: oneOfUiSchema.oneOf[index]['ui:title'],
          value: getByPath(schema, CONST_KEY),
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
          label: getByPath(schema, ['title']),
          value: getByPath(schema, [PROPERTIES_KEY, 'animal', CONST_KEY]),
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
          label: getByPath(schema, [PROPERTIES_KEY, 'animal', 'title']),
          value: getByPath(schema, [PROPERTIES_KEY, 'animal', CONST_KEY]),
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
          label: getByPath(schema, [PROPERTIES_KEY, 'animal', CONST_KEY]),
          value: getByPath(schema, [PROPERTIES_KEY, 'animal', CONST_KEY]),
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
      const oneOfUiSchema = {
        'ui:options': { optionsSchemaSelector: 'animal' },
      };
      expect(optionsList(oneOfSchema, oneOfUiSchema)).toEqual(
        oneOfSchema.oneOf!.map((schema) => ({
          schema,
          label: getByPath(schema, [PROPERTIES_KEY, 'animal', 'title']),
          value: getByPath(schema, [PROPERTIES_KEY, 'animal', CONST_KEY]),
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
          value: getByPath(schema, [PROPERTIES_KEY, 'animal', CONST_KEY]),
        })),
      );
    });
  });
  it('should label an untitled object or array constant with its JSON', () => {
    const schema: RJSFSchema = { oneOf: [{ const: { a: 1 } }, { const: [1, 2] }, { const: null }] };
    expect(optionsList(schema)?.map(({ label }) => label)).toEqual(['{"a":1}', '[1,2]', 'null']);
  });
  it('should label an untitled object enum value with its JSON', () => {
    const schema: RJSFSchema = { enum: [{ a: 1 }] };
    expect(optionsList(schema)?.map(({ label }) => label)).toEqual(['{"a":1}']);
  });
  it('should not label object or array enum values from a map-based enumNames', () => {
    const schema: RJSFSchema = { enum: [{ tier: 1 }, [2], 'free'] };
    const uiSchema: UiSchema = { 'ui:enumNames': { '[object Object]': 'Tier', '2': 'Two', free: 'Free' } };
    expect(optionsList(schema, uiSchema)?.map(({ label }) => label)).toEqual(['{"tier":1}', '[2]', 'Free']);
  });
  it('should reorder object and array enum values by deep equality', () => {
    const schema: RJSFSchema = { enum: [{ tier: 1 }, { tier: 2 }, [1, 2], [3], 'free'] };
    const uiSchema = { 'ui:enumOrder': [{ tier: 2 }, [3], '*'] } as unknown as UiSchema;
    expect(optionsList(schema, uiSchema)?.map(({ value }) => value)).toEqual([
      { tier: 2 },
      [3],
      { tier: 1 },
      [1, 2],
      'free',
    ]);
  });
  it('should reorder an enum value by the entry equal to it before one that only shares its string', () => {
    const schema: RJSFSchema = { enum: [1, '1', { tier: 1 }] };
    const uiSchema = { 'ui:enumOrder': [1, { tier: 2 }, '*'] } as unknown as UiSchema;
    expect(optionsList(schema, uiSchema)?.map(({ value }) => value)).toEqual([1, '1', { tier: 1 }]);
  });
  it('should list an enum value several ui:enumOrder entries find only once', () => {
    const schema: RJSFSchema = { enum: [1, 2, { tier: 1 }] };
    const uiSchema = { 'ui:enumOrder': ['2', 2, { tier: 1 }, { tier: 1 }, '*'] } as unknown as UiSchema;
    expect(optionsList(schema, uiSchema)?.map(({ value }) => value)).toEqual([2, { tier: 1 }, 1]);
  });
  describe('anyOf and oneOf together', () => {
    it('should read anyOf, the list isSelect() reads, when both are constants', () => {
      const schema: RJSFSchema = {
        oneOf: [{ const: 'a' }, { const: 'b' }],
        anyOf: [{ const: 1 }, { const: 2 }],
      };
      expect(optionsList(schema)?.map(({ value }) => value)).toEqual([1, 2]);
    });
    it('should return undefined rather than throw when the list it reads is not all constants', () => {
      const schema: RJSFSchema = {
        type: 'string',
        anyOf: [{ minLength: 1 }],
        oneOf: [{ const: 'a' }, { const: 'b' }],
      };
      expect(optionsList(schema)).toBeUndefined();
    });
    it('should return undefined rather than throw for a boolean option', () => {
      const schema: RJSFSchema = { oneOf: [{ const: 'a' }, true] };
      expect(optionsList(schema)).toBeUndefined();
    });
    it('should read constant options by their constants under a discriminator', () => {
      const schema: RJSFSchema = {
        discriminator: { propertyName: 'kind' },
        oneOf: [{ const: 'a' }, { const: 'b' }],
      };
      expect(optionsList(schema)?.map(({ value }) => value)).toEqual(['a', 'b']);
    });
    it('should read constant options by their constants under ui:optionsSchemaSelector', () => {
      const schema: RJSFSchema = { anyOf: [{ const: true }, { const: false }] };
      const uiSchema: UiSchema = { 'ui:options': { optionsSchemaSelector: 'kind' } };
      expect(optionsList(schema, uiSchema)?.map(({ value }) => value)).toEqual([true, false]);
    });
  });
  describe('fallbackLabel', () => {
    const fallbackLabel = (value: unknown) => (value === true ? 'Yes' : undefined);

    it('should label an enum value ui:enumNames does not name, by the value itself when it returns undefined', () => {
      const uiSchema: UiSchema = { 'ui:enumNames': { false: 'false' } };
      expect(optionsList({ enum: [true, false, null] }, uiSchema, fallbackLabel)).toEqual([
        { label: 'Yes', value: true },
        { label: 'false', value: false },
        { label: 'null', value: null },
      ]);
    });

    it('should label a constant option with no title or ui:title', () => {
      const schema: RJSFSchema = { anyOf: [{ const: true }, { const: true, title: '' }, { const: true }] };
      const uiSchema: UiSchema = { anyOf: [{}, {}, { 'ui:title': 'Sure' }] };
      expect(optionsList(schema, uiSchema, fallbackLabel)?.map(({ label }) => label)).toEqual(['Yes', '', 'Sure']);
    });

    it('should label a discriminated option with no title', () => {
      const schema: RJSFSchema = {
        discriminator: { propertyName: 'flag' },
        oneOf: [
          { type: 'object', properties: { flag: { const: true } } },
          { type: 'object', properties: { flag: { const: false } } },
        ],
      };
      expect(optionsList(schema, undefined, fallbackLabel)?.map(({ label }) => label)).toEqual(['Yes', 'false']);
    });
  });
});
