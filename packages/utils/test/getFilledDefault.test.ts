import type { PropertyPlacement, RJSFSchema, SchemaContext } from '../src/index.ts';
import { getFilledDefault } from '../src/index.ts';
import getTestValidator from './testUtils/getTestValidator.ts';

const descendantWins: SchemaContext = { validator: getTestValidator({}) };
const ancestorWins: SchemaContext = {
  ...descendantWins,
  defaultFormStateBehavior: { nestedDefaultsPrecedence: 'ancestorWins' },
};

describe('getFilledDefault()', () => {
  it('reads whichever of the two defaults is declared', () => {
    expect(getFilledDefault(descendantWins, { type: 'string', default: 'own' }, {}, undefined)).toBe('own');
    expect(getFilledDefault(ancestorWins, { type: 'string' }, {}, 'inherited')).toBe('inherited');
    expect(getFilledDefault(descendantWins, { type: 'string' }, {}, undefined)).toBeUndefined();
  });

  it.each([
    { context: descendantWins, expected: null },
    { context: ancestorWins, expected: 'inherited' },
  ])('reads a null default of its own by nestedDefaultsPrecedence', ({ context, expected }) => {
    expect(getFilledDefault(context, { type: ['string', 'null'], default: null }, {}, 'inherited')).toBe(expected);
  });

  it('reads its own default under ancestorWins where its type cannot hold the inherited one', () => {
    expect(getFilledDefault(ancestorWins, { type: 'string', default: 'own' }, {}, null)).toBe('own');
  });

  it.each([
    { context: descendantWins, expected: { a: 'own', b: 'inherited', c: 'own' } },
    { context: ancestorWins, expected: { a: 'inherited', b: 'inherited', c: 'own' } },
  ])('merges two object defaults, the winner over the other', ({ context, expected }) => {
    const schema: RJSFSchema = { type: 'object', default: { a: 'own', c: 'own' } };

    expect(getFilledDefault(context, schema, {}, { a: 'inherited', b: 'inherited' })).toEqual(expected);
  });

  it('takes one object default whole for a select over object constants', () => {
    const schema: RJSFSchema = { type: 'object', enum: [{ a: 1 }, { b: 2 }], default: { a: 1 } };

    expect(getFilledDefault(descendantWins, schema, {}, { b: 2 })).toEqual({ a: 1 });
    expect(getFilledDefault(ancestorWins, schema, {}, { b: 2 })).toEqual({ b: 2 });
  });

  it('merges in the default of the option its own default picks, not the first option', () => {
    // Both options validate the default under the test validator, so only the discriminator picks the second
    const schema: RJSFSchema = {
      type: 'object',
      discriminator: { propertyName: 'k' },
      properties: { k: { type: 'string' } },
      default: { k: 'B' },
      oneOf: [
        { properties: { k: { const: 'A' } }, default: { a: 1 } },
        { properties: { k: { const: 'B' } }, default: { b: 2 } },
      ],
    };

    expect(getFilledDefault(descendantWins, schema, {}, undefined)).toEqual({ k: 'B', b: 2 });
  });

  it.each([
    { context: descendantWins, expected: { a: 'option', b: 'inherited' } },
    { context: ancestorWins, expected: { a: 'inherited', b: 'inherited' } },
  ])(
    'merges the default of the option it picks over its own, and only the inherited one is an ancestor',
    ({ context, expected }) => {
      const schema: RJSFSchema = {
        type: 'object',
        default: { a: 'own' },
        oneOf: [{ default: { a: 'option' } }],
      };

      expect(getFilledDefault(context, schema, {}, { a: 'inherited', b: 'inherited' })).toEqual(expected);
      expect(getFilledDefault(context, schema, {}, undefined)).toEqual({ a: 'option' });
    },
  );

  it('picks no option of a select over constants, whose options are values', () => {
    const context: SchemaContext = { validator: getTestValidator({}) };
    const schema: RJSFSchema = { type: 'string', default: 'b', oneOf: [{ const: 'a' }, { const: 'b' }] };

    expect(getFilledDefault(context, schema, {}, undefined, { isRequired: true })).toBe('b');
    expect(context.validator.isValid).not.toHaveBeenCalled();
  });

  it('reads a key that is a select over constants, or a $ref to one, by its own default, sparing it a fill', () => {
    const context: SchemaContext = { validator: getTestValidator({}) };
    const schema: RJSFSchema = {
      type: 'object',
      definitions: { color: { type: 'string', default: 'x', oneOf: [{ const: 'x' }, { const: 'y' }] } },
      properties: {
        d: { type: 'string', oneOf: [{ const: 'x' }, { const: 'y' }] },
        e: { $ref: '#/definitions/color' },
      },
      default: { d: 'y', e: 'y' },
    };

    expect(getFilledDefault(context, schema, schema, undefined, { isRequired: true })).toEqual({ d: 'y', e: 'x' });
    expect(context.validator.isValid).not.toHaveBeenCalled();
  });

  it('stops picking at an option list it has picked from, as an option leads back to it', () => {
    const rootSchema: RJSFSchema = {
      definitions: {
        v: { anyOf: [{ $ref: '#/definitions/w' }, { type: 'string' }] },
        w: { oneOf: [{ $ref: '#/definitions/v' }] },
      },
    };

    expect(getFilledDefault(descendantWins, rootSchema.definitions!.v as RJSFSchema, rootSchema, undefined)).toBe(
      undefined,
    );
  });

  it("reads no default for a property under emptyObjectFields: 'skipDefaults', and its own for the root or an item", () => {
    const skipDefaults: SchemaContext = {
      ...descendantWins,
      defaultFormStateBehavior: { emptyObjectFields: 'skipDefaults' },
    };
    const schema: RJSFSchema = { type: 'string', default: 'own' };

    expect(getFilledDefault(skipDefaults, schema, {}, 'inherited', { isRequired: true })).toBeUndefined();
    expect(getFilledDefault(skipDefaults, schema, {}, undefined)).toBe('own');
  });

  it.each([
    { placement: { isRequired: false }, expected: undefined },
    { placement: { isRequired: true }, expected: 'own' },
    { placement: { isRequired: true, isParentRequired: false }, expected: undefined },
    { placement: { isRequired: true, isParentRequired: true }, expected: 'own' },
  ])(
    "reads a property's default under emptyObjectFields: 'populateRequiredDefaults' only where it is written, at $placement",
    ({ placement, expected }) => {
      const populateRequired: SchemaContext = {
        ...descendantWins,
        defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' },
      };

      expect(getFilledDefault(populateRequired, { type: 'string', default: 'own' }, {}, undefined, placement)).toBe(
        expected,
      );
    },
  );
});

describe('getFilledDefault() cuts an object default down key by key, as the fill builds it', () => {
  const populateRequired: SchemaContext = {
    ...descendantWins,
    defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' },
  };
  const optional = { isRequired: false, isParentRequired: true };
  const required = { isRequired: true, isParentRequired: true };

  it.each<{
    name: string;
    context: SchemaContext;
    schema: RJSFSchema;
    placement: PropertyPlacement;
    expected: unknown;
  }>([
    {
      name: 'an optional key under populateRequiredDefaults leaves an optional object nothing to write',
      context: populateRequired,
      schema: { type: 'object', properties: { a: { type: 'number' } }, default: { a: 1 } },
      placement: optional,
      expected: undefined,
    },
    {
      name: 'an optional key under populateRequiredDefaults leaves a required object empty',
      context: populateRequired,
      schema: { type: 'object', properties: { a: { type: 'number' } }, default: { a: 1 } },
      placement: required,
      expected: {},
    },
    {
      name: 'a required key of a required object is written',
      context: populateRequired,
      schema: { type: 'object', properties: { a: { type: 'number' } }, required: ['a'], default: { a: 1 } },
      placement: required,
      expected: { a: 1 },
    },
    {
      name: "a key's own default is written over the one its object hands it",
      context: descendantWins,
      schema: {
        type: 'object',
        properties: {
          a: { type: 'string', default: 'own' },
          c: { type: 'object', default: { x: 'own' }, properties: { x: { type: 'string' }, y: { type: 'string' } } },
        },
        default: { a: 'object', c: { x: 'object', y: 'object' } },
      },
      placement: optional,
      expected: { a: 'own', c: { x: 'own', y: 'object' } },
    },
    {
      // The fill reads a scalar key's own default through the option it picks, a `$ref` or an `if`, and through an
      // `allOf` only under `allOf: 'populateDefaults'`. A select over constants is left as it is (see the shortcut in
      // `withFilledOptions()`)
      name: "a scalar key's own default read through its option, its $ref or its if is written over its object's",
      context: descendantWins,
      schema: {
        type: 'object',
        definitions: { own: { type: 'string', default: 'ref' } },
        properties: {
          a: { type: 'string', oneOf: [{ default: 'option' }, { maxLength: 0 }] },
          b: { $ref: '#/definitions/own' },
          c: { allOf: [{ type: 'string', default: 'all' }] },
          d: { type: 'string', oneOf: [{ const: 'x' }, { const: 'y' }] },
          e: { type: 'string', if: { maxLength: 100 }, then: { default: 'then' } },
        },
        default: { a: 'object', b: 'object', c: 'object', d: 'y', e: 'object' },
      },
      placement: optional,
      expected: { a: 'option', b: 'ref', c: 'object', d: 'y', e: 'then' },
    },
    {
      name: "a scalar key's own default read through its allOf is written under allOf: 'populateDefaults'",
      context: { ...descendantWins, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
      schema: {
        type: 'object',
        properties: { c: { allOf: [{ type: 'string', default: 'all' }] } },
        default: { c: 'object' },
      },
      placement: optional,
      expected: { c: 'all' },
    },
    {
      name: "a scalar key's own default read through its if is not written under skipEmptyDefaults",
      context: { ...descendantWins, defaultFormStateBehavior: { emptyObjectFields: 'skipEmptyDefaults' } },
      schema: {
        type: 'object',
        properties: { e: { type: 'string', if: { maxLength: 100 }, then: { default: 'then' } } },
        default: { e: 'object' },
      },
      placement: optional,
      expected: { e: 'object' },
    },
    {
      // The fill merges an `allOf` only under `allOf: 'populateDefaults'`, and an `if` not under `skipEmptyDefaults`,
      // wherever it sits: behind a `$ref`, inside an option or beside either
      name: "a scalar key's allOf or if behind its $ref or option is read as the fill's settings say",
      context: descendantWins,
      schema: {
        type: 'object',
        definitions: { A: { allOf: [{ type: 'string' }, { default: 'own' }] }, P: { type: 'string' } },
        properties: {
          a: { $ref: '#/definitions/A' },
          b: { type: 'string', oneOf: [{ allOf: [{ default: 'own' }] }, { maxLength: 0 }] },
          c: { $ref: '#/definitions/P', allOf: [{ default: 'own' }] },
        },
        default: { a: 'object', b: 'object', c: 'object' },
      },
      placement: optional,
      expected: { a: 'object', b: 'object', c: 'object' },
    },
    {
      name: "a scalar key's if behind its $ref or option is not read under skipEmptyDefaults",
      context: { ...descendantWins, defaultFormStateBehavior: { emptyObjectFields: 'skipEmptyDefaults' } },
      schema: {
        type: 'object',
        definitions: { I: { type: 'string', if: { maxLength: 100 }, then: { default: 'own' } } },
        properties: {
          a: { $ref: '#/definitions/I' },
          b: { type: 'string', oneOf: [{ if: { maxLength: 100 }, then: { default: 'own' } }, { maxLength: 0 }] },
        },
        default: { a: 'object', b: 'object' },
      },
      placement: optional,
      expected: { a: 'object', b: 'object' },
    },
    {
      // The fill writes a `const` over a default, fills an array up to its `minItems` with its items' default, and
      // fills a required one only under `requiredOnly`, behind a `$ref` or not
      name: "a key's const and array items are read as the fill writes them",
      context: { ...descendantWins, defaultFormStateBehavior: { arrayMinItems: { populate: 'requiredOnly' } } },
      schema: {
        type: 'object',
        definitions: { L: { type: 'array', minItems: 2, items: { type: 'string', default: 'z' } } },
        properties: {
          k: { type: 'string', const: 'k' },
          l: { type: 'array', minItems: 2, items: { type: 'string', default: 'z' } },
          r: { $ref: '#/definitions/L' },
        },
        required: ['l', 'r'],
        default: { k: 'object', l: [], r: [] },
      },
      placement: optional,
      expected: { k: 'k', l: ['z', 'z'], r: ['z', 'z'] },
    },
    {
      // The fill reads a `$ref`'s own keywords over the definition's, and a `const` a definition it chains through holds
      name: "a key's $ref to a select over constants is read with its own keywords and its chain's const",
      context: descendantWins,
      schema: {
        type: 'object',
        definitions: {
          E: { type: 'string', enum: ['a', 'b'], default: 'a' },
          C: { $ref: '#/definitions/E', const: 'b' },
        },
        properties: { s: { $ref: '#/definitions/E', default: 'b' }, c: { $ref: '#/definitions/C' } },
        default: { s: 'q', c: 'q' },
      },
      placement: optional,
      expected: { s: 'b', c: 'b' },
    },
    {
      // The fill builds an object over a value that is none, and fills an array without `items` up to its `minItems`
      name: 'a key typed object or array is read as the fill writes it over a value that is no object',
      context: descendantWins,
      schema: {
        type: 'object',
        properties: {
          o: { type: 'object', properties: { x: { type: 'string', default: 'd' } } },
          l: { type: 'array', minItems: 2 },
        },
        required: ['l'],
        default: { o: null, l: [] },
      },
      placement: optional,
      expected: { o: { x: 'd' }, l: [undefined, undefined] },
    },
    {
      // The fill reads a tuple's defaults from its items whether or not it declares a `type`
      name: "a key's tuple without a type is read from its items' defaults",
      context: descendantWins,
      schema: {
        type: 'object',
        properties: { t: { items: [{ type: 'string', default: 'a' }] } },
        default: { t: ['z'] },
      },
      placement: optional,
      expected: { t: ['a'] },
    },
    {
      // The fill merges the option a field holding no data matches by its default into the field
      name: 'a key its option requires of a property the object declares too is written',
      context: populateRequired,
      schema: {
        type: 'object',
        properties: { c: { type: 'object', properties: { a: { type: 'number' }, b: { type: 'number' } } } },
        oneOf: [{ properties: { c: { type: 'object', required: ['a'] } } }],
        default: { c: { a: 1 } },
      },
      placement: required,
      expected: { c: { a: 1 } },
    },
    {
      // Both options validate the default under the test validator, so only the discriminator picks the second
      name: 'a key the option its default discriminates requires is written',
      context: populateRequired,
      schema: {
        type: 'object',
        discriminator: { propertyName: 'k' },
        properties: { k: { type: 'string' }, a: { type: 'number' } },
        oneOf: [{ properties: { k: { const: 'A' } } }, { properties: { k: { const: 'B' } }, required: ['a'] }],
        default: { k: 'B', a: 1 },
      },
      placement: required,
      expected: { a: 1 },
    },
    {
      name: 'a property typed by its option is cut by that option',
      context: populateRequired,
      schema: {
        type: 'object',
        properties: { c: { anyOf: [{ type: 'object', properties: { a: { type: 'number' } } }] } },
        default: { c: { a: 1 } },
      },
      placement: required,
      expected: {},
    },
    {
      name: 'a true option leaves the object to its own properties',
      context: populateRequired,
      schema: { type: 'object', properties: { a: { type: 'number' } }, oneOf: [true], default: { a: 1 } },
      placement: required,
      expected: {},
    },
    {
      name: 'a true property is a key like any other',
      context: populateRequired,
      schema: { type: 'object', properties: { a: true }, default: { a: 1 } },
      placement: required,
      expected: {},
    },
    {
      // The fill hands such an object no `required`, so its required keys are written as the root's
      name: "a required key of an object listing no required for it is written as the root's",
      context: populateRequired,
      schema: {
        type: 'object',
        properties: { c: { type: 'object', required: ['g'], properties: { g: { type: 'string' } } } },
        default: { c: { g: 'x' } },
      },
      placement: required,
      expected: { c: { g: 'x' } },
    },
    {
      name: "a required key of a property whose object lists no required is written as the root's",
      context: populateRequired,
      schema: { type: 'object', required: ['a'], properties: { a: { type: 'number' } }, default: { a: 1 } },
      placement: { isRequired: undefined, isParentRequired: true },
      expected: { a: 1 },
    },
    {
      // The fill seeds an extra key whatever `emptyObjectFields` says, one level down as at the top
      name: 'an extra key of an object property taking extra keys is seeded under populateRequiredDefaults',
      context: populateRequired,
      schema: {
        type: 'object',
        properties: {
          c: { type: 'object', additionalProperties: { type: 'string' }, properties: { a: { type: 'number' } } },
        },
        default: { c: { x: 'e' } },
      },
      placement: required,
      expected: { c: { x: 'e' } },
    },
    ...[
      { name: 'a $ref', c: { $ref: '#/definitions/C' } },
      { name: 'an allOf', c: { allOf: [{ $ref: '#/definitions/C' }] } },
    ].map(({ name, c }) => ({
      name: `an object property declared through ${name} is cut down as one declared inline`,
      context: populateRequired,
      schema: {
        type: 'object',
        definitions: { C: { type: 'object', properties: { a: { type: 'number' }, b: { type: 'string' } } } },
        properties: { c },
        default: { c: { a: 1 } },
      } satisfies RJSFSchema,
      placement: required,
      expected: {},
    })),
    {
      name: 'an empty optional object below leaves an optional object nothing to write',
      context: descendantWins,
      schema: { type: 'object', properties: { b: { type: 'object', properties: {} } }, default: { b: {} } },
      placement: optional,
      expected: undefined,
    },
    {
      name: 'a key no property declares is dropped',
      context: descendantWins,
      schema: { type: 'object', default: { a: 1 } },
      placement: required,
      expected: {},
    },
    {
      name: 'a key additionalProperties seeds is kept, whatever emptyObjectFields says',
      context: populateRequired,
      schema: {
        type: 'object',
        properties: { a: { type: 'number' } },
        additionalProperties: true,
        default: { a: 1, x: 2 },
      },
      placement: optional,
      expected: { x: 2 },
    },
    {
      name: 'an untyped field with no properties is written whole',
      context: populateRequired,
      schema: { default: { a: 1 } },
      placement: required,
      expected: { a: 1 },
    },
  ])('$name', ({ context, schema, placement, expected }) => {
    expect(getFilledDefault(context, schema, schema, undefined, placement)).toEqual(expected);
  });

  it('leaves the object default whole without a placement', () => {
    const schema: RJSFSchema = { type: 'object', properties: { a: { type: 'number' } }, default: { a: 1 } };

    expect(getFilledDefault(populateRequired, schema, {}, undefined)).toEqual({ a: 1 });
  });

  // The fill matches a field holding no data by its own default, so an inherited one picks no option
  it.each([
    { context: descendantWins, expected: undefined },
    { context: ancestorWins, expected: { y: 1 } },
  ])(
    'picks the option its own default matches, not the inherited one, by nestedDefaultsPrecedence',
    ({ context, expected }) => {
      const schema: RJSFSchema = {
        type: 'object',
        additionalProperties: false,
        oneOf: [{ properties: { x: { type: 'number' } } }, { properties: { y: { type: 'number' } } }],
      };

      expect(getFilledDefault(context, schema, schema, { y: 1 }, optional)).toEqual(expected);
    },
  );
});
