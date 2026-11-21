import type { RJSFSchema, UiSchema, ValidatorType } from '../../src/index.ts';

const nameHolder = (keywords: RJSFSchema = {}, title?: string): RJSFSchema => ({
  type: 'object',
  properties: { name: { type: 'string', ...(title ? { title } : {}) } },
  ...keywords,
});
const requiredDirectly: RJSFSchema = { required: ['name'] };
const requiredByAllOf: RJSFSchema = { allOf: [{ required: ['name'] }] };

/** Runs the cases where an error's field is found from its `property` without splitting a key holding a `.` and an
 * array item's field is found in the uiSchema under `items`. Each validator package runs them against its validator.
 *
 * @param buildValidator - Returns the package's validator
 */
export default function errorPropertyTests(buildValidator: () => ValidatorType) {
  describe('an error under a key holding a `.`', () => {
    it.each<[string, RJSFSchema]>([
      ['required directly under it', requiredDirectly],
      ['required by an allOf branch', requiredByAllOf],
    ])('is filed on its field and named by its ui:title when %s', (_, keywords) => {
      const schema: RJSFSchema = { type: 'object', properties: { 'a.b': nameHolder(keywords) } };
      const uiSchema: UiSchema = { 'a.b': { name: { 'ui:title': 'Name ui' } } };
      const { errors, errorSchema } = buildValidator().validateFormData(
        { 'a.b': {} },
        schema,
        undefined,
        undefined,
        uiSchema,
      );
      expect(errors.filter((error) => error.name === 'required')).toEqual([
        expect.objectContaining({
          property: "['a.b'].name",
          title: 'Name ui',
          message: expect.stringContaining("'Name ui'"),
        }),
      ]);
      expect(errorSchema).not.toHaveProperty('a');
      expect(errorSchema).toEqual(
        expect.objectContaining({
          'a.b': expect.objectContaining({ name: { __errors: [expect.stringContaining("'Name ui'")] } }),
        }),
      );
    });

    it.each<[string, RJSFSchema]>([
      ['required directly under it', requiredDirectly],
      ['required by an allOf branch', requiredByAllOf],
    ])('takes its own ui:title, not that of a field at the split path, when %s', (_, keywords) => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          'a.b': nameHolder(keywords),
          a: { type: 'object', properties: { b: nameHolder() } },
        },
      };
      const uiSchema: UiSchema = {
        a: { b: { name: { 'ui:title': 'Wrong' } } },
        'a.b': { name: { 'ui:title': 'Right' } },
      };
      const { errors } = buildValidator().validateFormData({ 'a.b': {} }, schema, undefined, undefined, uiSchema);
      expect(errors.filter((error) => error.name === 'required')).toEqual([
        expect.objectContaining({ title: 'Right', message: expect.stringContaining("'Right'") }),
      ]);
    });

    it('takes its own schema title, not that of a field at the split path, when an allOf branch requires it', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          'a.b': nameHolder(requiredByAllOf, 'Right'),
          a: { type: 'object', properties: { b: nameHolder({}, 'Wrong') } },
        },
      };
      const { errors } = buildValidator().validateFormData({ 'a.b': {} }, schema);
      expect(errors.filter((error) => error.name === 'required')).toEqual([
        expect.objectContaining({ title: 'Right', message: expect.stringContaining("'Right'") }),
      ]);
    });

    it('is filed on its field when it is no required error', () => {
      const schema: RJSFSchema = { type: 'object', properties: { 'a.b': { type: 'string' } } };
      const uiSchema: UiSchema = { 'a.b': { 'ui:title': 'Dotted ui' } };
      const { errors, errorSchema } = buildValidator().validateFormData(
        { 'a.b': 1 },
        schema,
        undefined,
        undefined,
        uiSchema,
      );
      expect(errors.filter((error) => error.name === 'type')).toEqual([
        expect.objectContaining({ property: "['a.b']", title: 'Dotted ui' }),
      ]);
      expect(errorSchema).not.toHaveProperty('a');
      expect(errorSchema).toEqual(
        expect.objectContaining({ 'a.b': { __errors: [expect.stringContaining('string')] } }),
      );
    });
  });

  describe('an error inside an array item', () => {
    it("is named by the item field's ui:title when it is no required error", () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { arr: { type: 'array', items: nameHolder(requiredDirectly) } },
      };
      const uiSchema: UiSchema = { arr: { items: { name: { 'ui:title': 'Name ui' } } } };
      const { errors } = buildValidator().validateFormData(
        { arr: [{ name: 1 }] },
        schema,
        undefined,
        undefined,
        uiSchema,
      );
      expect(errors.filter((error) => error.name === 'type')).toEqual([
        expect.objectContaining({
          property: '.arr.0.name',
          title: 'Name ui',
          stack: expect.stringMatching(/^'Name ui' /),
        }),
      ]);
    });

    const nameUi: UiSchema = { arr: { items: { name: { 'ui:title': 'Name ui' } } } };
    const inArray = (items: RJSFSchema, definitions?: RJSFSchema['definitions']): RJSFSchema => ({
      ...(definitions ? { definitions } : {}),
      type: 'object',
      properties: { arr: { type: 'array', items } },
    });

    it.each<[string, RJSFSchema, string, unknown]>([
      ['whose item schema is a $ref', inArray({ $ref: '#/definitions/T' }, { T: nameHolder() }), 'type', [{ name: 1 }]],
      [
        'whose item schema is a $ref, for a required error',
        inArray({ $ref: '#/definitions/T' }, { T: nameHolder(requiredDirectly) }),
        'required',
        [{}],
      ],
      [
        'whose field is declared in an allOf branch of the item',
        inArray({ type: 'object', allOf: [{ properties: { name: { type: 'string' } } }] }),
        'type',
        [{ name: 1 }],
      ],
    ])("is named by the item field's ui:title %s", (_, schema, keyword, arr) => {
      const { errors } = buildValidator().validateFormData({ arr }, schema, undefined, undefined, nameUi);
      expect(errors.filter((error) => error.name === keyword)).toEqual([
        expect.objectContaining({ property: '.arr.0.name', title: 'Name ui' }),
      ]);
    });

    it("is named by the item's own ui:title, not an anyOf option's, from inside that option", () => {
      const uiSchema: UiSchema = { arr: { items: { 'ui:title': 'Item ui', anyOf: [{ 'ui:title': 'Option ui' }] } } };
      const { errors } = buildValidator().validateFormData(
        { arr: [1] },
        inArray({ anyOf: [{ type: 'string' }] }),
        undefined,
        undefined,
        uiSchema,
      );
      // ata reports only the `anyOf` error, the others the option's own `type` error too
      const itemErrors = errors.filter((error) => error.property === '.arr.0');
      expect(itemErrors).not.toEqual([]);
      expect(itemErrors.map((error) => error.title)).toEqual(itemErrors.map(() => 'Item ui'));
    });

    it("is named by the item field's raw uiSchema title", () => {
      const uiSchema = { arr: { items: { name: { title: 'Raw name' } } } };
      const { errors } = buildValidator().validateFormData(
        { arr: [{}] },
        inArray(nameHolder(requiredDirectly)),
        undefined,
        undefined,
        uiSchema,
      );
      expect(errors.filter((error) => error.name === 'required')).toEqual([
        expect.objectContaining({ property: '.arr.0.name', title: 'Raw name' }),
      ]);
    });
  });

  describe('an error on an object property named like an index', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        obj: { type: 'object', properties: { items: { type: 'string' }, 0: { type: 'string' } }, required: ['0'] },
      },
    };
    const uiSchema: UiSchema = { obj: { items: { 'ui:title': 'Items ui' } } };

    it.each<[string, unknown, string]>([
      ['a required error', {}, 'required'],
      ['a type error', { 0: 1 }, 'type'],
    ])("doesn't take the ui:title of a sibling property named items for %s", (_, obj, keyword) => {
      const { errors } = buildValidator().validateFormData({ obj }, schema, undefined, undefined, uiSchema);
      expect(errors.filter((error) => error.name === keyword)).toEqual([
        expect.objectContaining({ property: '.obj.0', title: '' }),
      ]);
    });
  });

  describe('an error on an additional property', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { obj: { type: 'object', additionalProperties: { type: 'string', minLength: 3 } } },
    };

    it.each<[string, UiSchema, string]>([
      [
        'the ui:title additionalProperties gives it',
        { obj: { additionalProperties: { 'ui:title': 'Extra ui' } } },
        'Extra ui',
      ],
      [
        'its own ui:title over the one additionalProperties gives it',
        { obj: { extra: { 'ui:title': 'Own ui' }, additionalProperties: { 'ui:title': 'Extra ui' } } },
        'Own ui',
      ],
    ])('takes %s', (_, uiSchema, title) => {
      const { errors } = buildValidator().validateFormData(
        { obj: { extra: 'x' } },
        schema,
        undefined,
        undefined,
        uiSchema,
      );
      expect(errors.filter((error) => error.name === 'minLength')).toEqual([
        expect.objectContaining({ property: '.obj.extra', title }),
      ]);
    });
  });

  describe('an error under a $ref to another property', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        billing: { type: 'object', properties: { street: { type: 'string' } }, required: ['street'] },
        shipping: { $ref: '#/properties/billing' },
      },
    };

    it("doesn't take the ui:title of the property the $ref names", () => {
      const uiSchema: UiSchema = { billing: { street: { 'ui:title': 'Billing street' } } };
      const { errors } = buildValidator().validateFormData(
        { billing: { street: 'x' }, shipping: { street: 1 } },
        schema,
        undefined,
        undefined,
        uiSchema,
      );
      expect(errors.filter((error) => error.name === 'type')).toEqual([
        expect.objectContaining({ property: '.shipping.street', title: '' }),
      ]);
    });

    it("doesn't take the ui:title of the property the $ref names for a missing property", () => {
      const uiSchema: UiSchema = { billing: { street: { 'ui:title': 'Billing street' } } };
      const { errors } = buildValidator().validateFormData(
        { billing: { street: 'x' }, shipping: {} },
        schema,
        undefined,
        undefined,
        uiSchema,
      );
      expect(errors.filter((error) => error.name === 'required')).toEqual([
        expect.objectContaining({ property: '.shipping.street', title: '' }),
      ]);
    });

    it('takes its own ui:title', () => {
      const uiSchema: UiSchema = {
        billing: { street: { 'ui:title': 'Billing street' } },
        shipping: { street: { 'ui:title': 'Shipping street' } },
      };
      const { errors } = buildValidator().validateFormData(
        { billing: { street: 'x' }, shipping: { street: 1 } },
        schema,
        undefined,
        undefined,
        uiSchema,
      );
      expect(errors.filter((error) => error.name === 'type')).toEqual([
        expect.objectContaining({ property: '.shipping.street', title: 'Shipping street' }),
      ]);
    });
  });

  describe('an error under a $ref', () => {
    const schema: RJSFSchema = {
      definitions: {
        Obj: { type: 'object', properties: { name: { type: 'string', minLength: 3 } }, required: ['name'] },
      },
      type: 'object',
      properties: { obj: { $ref: '#/definitions/Obj', additionalProperties: { type: 'string' } } },
    };

    it("doesn't take the ui:title additionalProperties gives a property the $ref target declares", () => {
      const uiSchema: UiSchema = { obj: { additionalProperties: { 'ui:title': 'Extra ui' } } };
      const { errors } = buildValidator().validateFormData(
        { obj: { name: 'x' } },
        schema,
        undefined,
        undefined,
        uiSchema,
      );
      expect(errors.filter((error) => error.name === 'minLength')).toEqual([
        expect.objectContaining({ property: '.obj.name', title: '' }),
      ]);
    });

    it("doesn't take the root field's ui:title for a missing property of an item behind a $ref to the root", () => {
      const recursive: RJSFSchema = {
        type: 'object',
        properties: { name: { type: 'string' }, children: { type: 'array', items: { $ref: '#' } } },
        required: ['name'],
      };
      const { errors } = buildValidator().validateFormData(
        { name: 'x', children: [{}] },
        recursive,
        undefined,
        undefined,
        { name: { 'ui:title': 'Root name' } },
      );
      expect(errors.filter((error) => error.name === 'required')).toEqual([
        expect.objectContaining({ property: '.children.0.name', title: '' }),
      ]);
    });
  });
}
