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

    it("isn't named by a `title` the item field's uiSchema holds, which isn't a ui:title the form labels it with", () => {
      const uiSchema = { arr: { items: { name: { title: 'Raw name' } } } };
      const { errors } = buildValidator().validateFormData(
        { arr: [{}] },
        inArray(nameHolder(requiredDirectly, 'Name')),
        undefined,
        undefined,
        uiSchema,
      );
      expect(errors.filter((error) => error.name === 'required')).toEqual([
        expect.objectContaining({ property: '.arr.0.name', title: 'Name' }),
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

    it.each<[string, UiSchema]>([
      ['the ui:title additionalProperties gives it', { obj: { additionalProperties: { 'ui:title': 'Extra ui' } } }],
      [
        'a ui:title of its own',
        { obj: { extra: { 'ui:title': 'Own ui' }, additionalProperties: { 'ui:title': 'Extra ui' } } },
      ],
    ])('takes no title, as the form labels it by its key whatever %s', (_, uiSchema) => {
      const { errors } = buildValidator().validateFormData(
        { obj: { extra: 'x' } },
        schema,
        undefined,
        undefined,
        uiSchema,
      );
      expect(errors.filter((error) => error.name === 'minLength')).toEqual([
        expect.objectContaining({ property: '.obj.extra', title: '' }),
      ]);
    });

    it.each<[string, UiSchema]>([
      ['ui:title', { obj: { additionalProperties: { 'ui:title': 'Extra ui' } } }],
      ['title', { obj: { additionalProperties: { title: 'Extra raw' } } }],
    ])("doesn't name a missing undeclared property by the %s additionalProperties gives every key", (_, uiSchema) => {
      const required: RJSFSchema = {
        type: 'object',
        properties: { obj: { type: 'object', required: ['foo', 'bar'], additionalProperties: { type: 'string' } } },
      };
      const { errors } = buildValidator().validateFormData({ obj: {} }, required, undefined, undefined, uiSchema);
      const missingFoo = { message: expect.stringContaining('foo'), title: expect.not.stringContaining('Extra') };
      const missingBar = { message: expect.stringContaining('bar'), title: expect.not.stringContaining('Extra') };
      expect(errors.filter((error) => error.name === 'required')).toEqual([
        expect.objectContaining(missingFoo),
        expect.objectContaining(missingBar),
      ]);
    });
    it('names a missing declared property by the ui:title at its own key, not the one additionalProperties gives', () => {
      const required: RJSFSchema = {
        type: 'object',
        properties: {
          obj: {
            type: 'object',
            properties: { foo: { type: 'string' } },
            required: ['foo'],
            additionalProperties: { type: 'string' },
          },
        },
      };
      const uiSchema: UiSchema = {
        obj: { foo: { 'ui:title': 'Foo ui' }, additionalProperties: { 'ui:title': 'Extra ui' } },
      };
      const { errors } = buildValidator().validateFormData({ obj: {} }, required, undefined, undefined, uiSchema);
      expect(errors.filter((error) => error.name === 'required')).toEqual([
        expect.objectContaining({
          property: '.obj.foo',
          title: 'Foo ui',
          message: expect.stringContaining("'Foo ui'"),
        }),
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

  describe('an error is named by the label the form shows its field with', () => {
    const p = (field: RJSFSchema): RJSFSchema => ({ type: 'object', properties: { p: field } });

    it.each<[string, RJSFSchema, unknown, string]>([
      [
        "an allOf entry's title where it has none",
        p({ allOf: [{ title: 'Branch', type: 'string' }] }),
        { p: 1 },
        'Branch',
      ],
      [
        "its own title over an anyOf option's",
        p({ title: 'Field', anyOf: [{ title: 'Option', type: 'string' }] }),
        { p: 1 },
        'Field',
      ],
      [
        "its own title over its oneOf options'",
        p({
          title: 'Field',
          oneOf: [
            { title: 'B1', type: 'string' },
            { title: 'B2', type: 'boolean' },
          ],
        }),
        { p: 1 },
        'Field',
      ],
      [
        "its own title over a then's",
        p({ title: 'Field', type: 'number', if: { type: 'number' }, then: { title: 'Branch', minimum: 5 } }),
        { p: 1 },
        'Field',
      ],
      [
        "a then's title where it has none",
        p({ type: 'number', if: { type: 'number' }, then: { title: 'Branch', minimum: 5 } }),
        { p: 1 },
        'Branch',
      ],
      [
        "its own title over its $ref target's",
        { $defs: { D: { title: 'Definition', type: 'string' } }, ...p({ title: 'Field', $ref: '#/$defs/D' }) },
        { p: 1 },
        'Field',
      ],
      [
        "its own title over the $ref target's of an allOf entry",
        {
          $defs: { D: { title: 'Definition', type: 'string' } },
          ...p({ title: 'Field', allOf: [{ $ref: '#/$defs/D' }] }),
        },
        { p: 1 },
        'Field',
      ],
      [
        "the title a parent's then redeclares it with",
        {
          type: 'object',
          properties: { x: { type: 'string' }, p: { title: 'Field', type: 'number' } },
          if: { required: ['x'] },
          then: { properties: { p: { title: 'Branch', minimum: 5 } } },
        },
        { x: 'on', p: 1 },
        'Branch',
      ],
    ])('takes %s', (_, schema, formData, title) => {
      const { errors } = buildValidator().validateFormData(formData, schema);
      const fieldErrors = errors.filter((error) => error.property === '.p');
      expect(fieldErrors).not.toEqual([]);
      expect(fieldErrors.map((error) => error.title)).toEqual(fieldErrors.map(() => title));
      for (const error of fieldErrors) {
        expect(error.stack).toEqual(`'${title}' ${error.message}`);
      }
    });

    // The cases #5948 and its follow-ups report, each titled as the form labels its field
    it.each<[string, RJSFSchema, unknown, string, string]>([
      [
        "its own title over an allOf entry's",
        p({ title: 'Field', allOf: [{ title: 'Branch', type: 'string' }] }),
        { p: 1 },
        '.p',
        'Field',
      ],
      [
        "the $ref target's title for a draft-07 tuple item",
        {
          $schema: 'http://json-schema.org/draft-07/schema#',
          definitions: { N: { title: 'Num', type: 'number' } },
          type: 'object',
          properties: { t: { type: 'array', items: [{ $ref: '#/definitions/N' }] } },
        },
        { t: ['x'] },
        '.t.0',
        'Num',
      ],
      [
        'the title a draft-07 dependency under a $ref declares a property with',
        {
          $schema: 'http://json-schema.org/draft-07/schema#',
          definitions: {
            T: {
              type: 'object',
              properties: { n: {} },
              dependencies: { n: { properties: { m: { title: 'M', type: 'string' } } } },
            },
          },
          type: 'object',
          properties: { a: { $ref: '#/definitions/T' } },
        },
        { a: { n: 'x', m: 1 } },
        '.a.m',
        'M',
      ],
      [
        'its own title where a then redeclares it without one',
        {
          type: 'object',
          properties: {
            a: {
              type: 'object',
              properties: { k: {}, n: { type: 'string', title: 'N' } },
              if: { required: ['k'] },
              then: { properties: { n: { minLength: 3 } } },
            },
          },
        },
        { a: { k: 1, n: 'a' } },
        '.a.n',
        'N',
      ],
      [
        "its own title where a $ref target's then redeclares it as an untitled $ref",
        {
          $defs: {
            Short: { type: 'string', minLength: 3 },
            T: {
              type: 'object',
              properties: { k: {}, n: { type: 'string', title: 'N' } },
              if: { required: ['k'] },
              then: { properties: { n: { $ref: '#/$defs/Short' } } },
            },
          },
          type: 'object',
          properties: { a: { $ref: '#/$defs/T' } },
        },
        { a: { k: 1, n: 'a' } },
        '.a.n',
        'N',
      ],
    ])('takes %s', (_, schema, formData, property, title) => {
      const { errors } = buildValidator().validateFormData(formData, schema);
      const fieldErrors = errors.filter((error) => error.property === property);
      expect(fieldErrors).not.toEqual([]);
      expect(fieldErrors.map((error) => error.title)).toEqual(fieldErrors.map(() => title));
    });

    it.each<[string, RJSFSchema, unknown, UiSchema | undefined, string]>([
      [
        "a property keyed ''",
        { type: 'object', properties: { '': { type: 'string', title: 'Empty' } } },
        { '': 1 },
        undefined,
        'Empty',
      ],
      [
        "a field under a property keyed ''",
        {
          type: 'object',
          properties: { '': { type: 'object', properties: { name: { type: 'string', title: 'Name' } } } },
        },
        { '': { name: 1 } },
        undefined,
        'Name',
      ],
      [
        "the title an array hands an untitled item, from the array's title",
        { type: 'object', properties: { tags: { type: 'array', title: 'Tags', items: { type: 'string' } } } },
        { tags: [1] },
        { tags: { 'ui:title': 'Tags ui' } },
        'Tags-1',
      ],
      [
        'the title an untitled array hands an untitled item of its own item, from the outer array',
        {
          type: 'object',
          properties: {
            m: { type: 'array', title: 'M', items: { type: 'array', items: { type: 'string' } } },
          },
        },
        { m: [['a', 1]] },
        undefined,
        'M-1-2',
      ],
      [
        'the ui:title a function-form uiSchema.items gives an item field for its data',
        {
          type: 'object',
          properties: {
            arr: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' } } } },
          },
        },
        { arr: [{ name: 1 }] },
        { arr: { items: (item: unknown) => ({ name: { 'ui:title': `Name of ${JSON.stringify(item)}` } }) } },
        'Name of {"name":1}',
      ],
    ])('takes %s', (_, schema, formData, uiSchema, title) => {
      const { errors } = buildValidator().validateFormData(formData, schema, undefined, undefined, uiSchema);
      const typeErrors = errors.filter((error) => error.name === 'type');
      expect(typeErrors).toEqual([expect.objectContaining({ title, stack: `'${title}' ${typeErrors[0]?.message}` })]);
    });

    it("takes no title for an untitled item of an untitled array, which the form labels by the array's key", () => {
      const schema: RJSFSchema = { type: 'object', properties: { tags: { type: 'array', items: { type: 'string' } } } };
      const { errors } = buildValidator().validateFormData({ tags: [1] }, schema);
      expect(errors.filter((error) => error.name === 'type')).toEqual([
        expect.objectContaining({ property: '.tags.0', title: '' }),
      ]);
    });

    it("takes no title for an option's property the option shown for the data doesn't declare", () => {
      const schema = p({
        type: 'object',
        title: 'Field',
        oneOf: [
          { title: 'A', properties: { a: { type: 'string', title: 'Aa' } }, required: ['a'] },
          { title: 'B', properties: { b: { type: 'string', title: 'Bb' } }, required: ['b'] },
        ],
      });
      const { errors } = buildValidator().validateFormData({ p: {} }, schema);
      const required = errors.filter((error) => error.name === 'required');
      // ata reports only the `oneOf` error
      expect(required.map((error) => [error.property, error.title])).toEqual(
        required.map((error) => [error.property, error.property === '.p.a' ? 'Aa' : '']),
      );
    });
  });

  describe('the errors of one validation', () => {
    // Only the root's options declare `list`, so the walk to each item picks the option shown for the data. The items
    // are checked outside the options, so the option matches and each validator reports each item's error
    const schema: RJSFSchema = {
      type: 'object',
      anyOf: [
        { properties: { list: { type: 'array', title: 'List', items: { type: 'string' } } } },
        { properties: { other: { type: 'number' } }, required: ['other'] },
      ],
      patternProperties: { '^list$': { items: { type: 'string', minLength: 3 } } },
    };
    // Counts the reads of the root's `list`, which each walk from the root makes on its way to an item
    const rootReadsFor = (items: number) => {
      const list = Array.from({ length: items }, () => 'x');
      let reads = 0;
      const formData = {};
      Object.defineProperty(formData, 'list', {
        enumerable: true,
        get: () => {
          reads += 1;
          return list;
        },
      });
      const { errors } = buildValidator().validateFormData(formData, schema);
      const itemErrors = errors.filter((error) => error.property?.startsWith('.list.'));
      expect(new Set(itemErrors.map((error) => error.property))).toEqual(
        new Set(list.map((_, index) => `.list.${index}`)),
      );
      for (const { property, title } of itemErrors) {
        expect(title).toEqual(`List-${Number(property?.slice('.list.'.length)) + 1}`);
      }
      return reads;
    };

    it('share the walk to the fields above them, so the options above many errors are picked once', () => {
      expect(rootReadsFor(12)).toEqual(rootReadsFor(2));
    });
  });
}
