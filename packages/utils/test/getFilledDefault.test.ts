import type { FieldFill, RJSFSchema, SchemaContext } from '../src/index.ts';
import { childFillOf, getDefaultFormState, getFieldDefault, getFilledDefault, retrieveSchema } from '../src/index.ts';
import { check } from './schema/graph/miniValidator.ts';
import getTestValidator from './testUtils/getTestValidator.ts';

/** A validator answering as a real one does, which the fill asks to pick the option a default matches */
const answering = () => getTestValidator({ isValid: (schema, data, root) => check(schema, data, root) });

const descendantWins: SchemaContext = { validator: answering() };
const ancestorWins: SchemaContext = {
  ...descendantWins,
  defaultFormStateBehavior: { nestedDefaultsPrecedence: 'ancestorWins' },
};

/** Where a field sits as a property of an object: whether the object lists it in `required`, and is required itself */
interface Placement {
  isRequired?: boolean;
  isParentRequired?: boolean;
}

/** The fill of a field handed `inheritedDefault`, as a property at `placement` where one is given */
const fillOf = (inheritedDefault: unknown, placement?: Placement): FieldFill =>
  placement ? { inheritedDefault, isProperty: true, ...placement } : { inheritedDefault };

describe('getFilledDefault()', () => {
  it('reads whichever of the two defaults is declared', () => {
    expect(getFilledDefault(descendantWins, { type: 'string', default: 'own' }, {}, fillOf(undefined))).toBe('own');
    expect(getFilledDefault(ancestorWins, { type: 'string' }, {}, fillOf('inherited'))).toBe('inherited');
    expect(getFilledDefault(descendantWins, { type: 'string' }, {}, fillOf(undefined))).toBeUndefined();
  });

  it.each([
    { context: descendantWins, expected: null },
    { context: ancestorWins, expected: 'inherited' },
  ])('reads a null default of its own by nestedDefaultsPrecedence', ({ context, expected }) => {
    expect(getFilledDefault(context, { type: ['string', 'null'], default: null }, {}, fillOf('inherited'))).toBe(
      expected,
    );
  });

  it('reads its own default under ancestorWins where its type cannot hold the inherited one', () => {
    expect(getFilledDefault(ancestorWins, { type: 'string', default: 'own' }, {}, fillOf(null))).toBe('own');
  });

  it.each([
    { context: descendantWins, expected: { a: 'own', b: 'inherited', c: 'own' } },
    { context: ancestorWins, expected: { a: 'inherited', b: 'inherited', c: 'own' } },
  ])('merges two object defaults, the winner over the other', ({ context, expected }) => {
    const properties = { a: { type: 'string' }, b: { type: 'string' }, c: { type: 'string' } } as const;
    const schema: RJSFSchema = { type: 'object', properties, default: { a: 'own', c: 'own' } };

    expect(getFilledDefault(context, schema, {}, fillOf({ a: 'inherited', b: 'inherited' }))).toEqual(expected);
  });

  it('takes one object default whole for a select over object constants', () => {
    const schema: RJSFSchema = { type: 'object', enum: [{ a: 1 }, { b: 2 }], default: { a: 1 } };

    expect(getFilledDefault(descendantWins, schema, {}, fillOf({ b: 2 }))).toEqual({ a: 1 });
    expect(getFilledDefault(ancestorWins, schema, {}, fillOf({ b: 2 }))).toEqual({ b: 2 });
  });

  it('merges in the default of the option its own default picks, not the first option', () => {
    // The discriminator picks the second option
    const schema: RJSFSchema = {
      type: 'object',
      discriminator: { propertyName: 'k' },
      properties: { k: { type: 'string' }, a: { type: 'number' }, b: { type: 'number' } },
      default: { k: 'B' },
      oneOf: [
        { properties: { k: { const: 'A' } }, default: { a: 1 } },
        { properties: { k: { const: 'B' } }, default: { b: 2 } },
      ],
    };

    expect(getFilledDefault(descendantWins, schema, {}, fillOf(undefined))).toEqual({ k: 'B', b: 2 });
  });

  it.each([
    { context: descendantWins, expected: { a: 'option', b: 'inherited' } },
    { context: ancestorWins, expected: { a: 'inherited', b: 'inherited' } },
  ])(
    'merges the default of the option it picks over its own, and only the inherited one is an ancestor',
    ({ context, expected }) => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { a: { type: 'string' }, b: { type: 'string' } },
        default: { a: 'own' },
        oneOf: [{ default: { a: 'option' } }],
      };

      expect(getFilledDefault(context, schema, {}, fillOf({ a: 'inherited', b: 'inherited' }))).toEqual(expected);
      expect(getFilledDefault(context, schema, {}, fillOf(undefined))).toEqual({ a: 'option' });
    },
  );

  it('reads a select over constants as the constant its default names', () => {
    const schema: RJSFSchema = { type: 'string', default: 'b', oneOf: [{ const: 'a' }, { const: 'b' }] };

    expect(getFilledDefault(descendantWins, schema, {}, fillOf(undefined, { isRequired: true }))).toBe('b');
  });

  it("reads a key that is a select over constants, or a $ref to one, by its own default over its object's", () => {
    const context = descendantWins;
    const schema: RJSFSchema = {
      type: 'object',
      definitions: { color: { type: 'string', default: 'x', oneOf: [{ const: 'x' }, { const: 'y' }] } },
      properties: {
        d: { type: 'string', oneOf: [{ const: 'x' }, { const: 'y' }] },
        e: { $ref: '#/definitions/color' },
      },
      default: { d: 'y', e: 'y' },
    };

    expect(getFilledDefault(context, schema, schema, fillOf(undefined, { isRequired: true }))).toEqual({
      d: 'y',
      e: 'x',
    });
  });

  it('stops picking at an option list it has picked from, as an option leads back to it', () => {
    const rootSchema: RJSFSchema = {
      definitions: {
        v: { anyOf: [{ $ref: '#/definitions/w' }, { type: 'string' }] },
        w: { oneOf: [{ $ref: '#/definitions/v' }] },
      },
    };

    expect(
      getFilledDefault(descendantWins, rootSchema.definitions!.v as RJSFSchema, rootSchema, fillOf(undefined)),
    ).toBe(undefined);
  });

  it("reads no default for a property under emptyObjectFields: 'skipDefaults', and its own for the root or an item", () => {
    const skipDefaults: SchemaContext = {
      ...descendantWins,
      defaultFormStateBehavior: { emptyObjectFields: 'skipDefaults' },
    };
    const schema: RJSFSchema = { type: 'string', default: 'own' };

    expect(getFilledDefault(skipDefaults, schema, {}, fillOf('inherited', { isRequired: true }))).toBeUndefined();
    expect(getFilledDefault(skipDefaults, schema, {}, fillOf(undefined))).toBe('own');
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

      expect(
        getFilledDefault(populateRequired, { type: 'string', default: 'own' }, {}, fillOf(undefined, placement)),
      ).toBe(expected);
    },
  );
});

describe('getFilledDefault() writes an object default key by key, as the fill builds it', () => {
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
    placement: Placement;
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
      // The discriminator picks the second option, whose `const` is written whatever `emptyObjectFields` says
      name: 'a key the option its default discriminates requires is written, beside its const',
      context: populateRequired,
      schema: {
        type: 'object',
        discriminator: { propertyName: 'k' },
        properties: { k: { type: 'string' }, a: { type: 'number' } },
        oneOf: [{ properties: { k: { const: 'A' } } }, { properties: { k: { const: 'B' } }, required: ['a'] }],
        default: { k: 'B', a: 1 },
      },
      placement: required,
      expected: { k: 'B', a: 1 },
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
    // The fill merges a nested `allOf` only under `allOf: 'populateDefaults'`, so a property declared through one keeps
    // its object default whole, as the fill writes it
    ...[
      { name: 'a $ref', c: { $ref: '#/definitions/C' }, expected: {} },
      { name: 'an allOf', c: { allOf: [{ $ref: '#/definitions/C' }] }, expected: { c: { a: 1 } } },
    ].map(({ name, c, expected }) => ({
      name: `an object property declared through ${name} is cut down as the fill reads it`,
      context: populateRequired,
      schema: {
        type: 'object',
        definitions: { C: { type: 'object', properties: { a: { type: 'number' }, b: { type: 'string' } } } },
        properties: { c },
        default: { c: { a: 1 } },
      } satisfies RJSFSchema,
      placement: required,
      expected,
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
    expect(getFilledDefault(context, schema, schema, fillOf(undefined, placement))).toEqual(expected);
  });

  // The fill seeds the keys an object `const` that closes the object names, whatever `emptyObjectFields` says, as on
  // the issue's own schema (#5644), and no other undeclared key
  it.each<{ inherited: Record<string, number>; expected: unknown }>([
    { inherited: { a: 2 }, expected: { a: 2 } },
    { inherited: { a: 2, b: 3 }, expected: { a: 2 } },
  ])('keeps the keys of an object const that closes the object, from $inherited', ({ inherited, expected }) => {
    const x: RJSFSchema = { type: 'object', const: { a: 2 } };
    const root: RJSFSchema = { type: 'object', default: { x: inherited }, properties: { x } };

    expect(getDefaultFormState(descendantWins, { schema: root, rootSchema: root })).toEqual({ x: expected });
    expect(getFilledDefault(descendantWins, x, root, fillOf(inherited, optional))).toEqual(expected);
    expect(getFilledDefault(populateRequired, x, root, fillOf(inherited, required))).toEqual(expected);
  });

  it('fills the root as the fill fills it, its optional keys left out under populateRequiredDefaults', () => {
    const schema: RJSFSchema = { type: 'object', properties: { a: { type: 'number' } }, default: { a: 1 } };

    expect(getFilledDefault(populateRequired, schema, {}, fillOf(undefined))).toEqual({});
    expect(getFilledDefault(descendantWins, schema, {}, fillOf(undefined))).toEqual({ a: 1 });
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

      expect(getFilledDefault(context, schema, schema, fillOf({ y: 1 }, optional))).toEqual(expected);
    },
  );
});

describe('getFilledDefault() reads what the fill writes', () => {
  /** The value `getDefaultFormState()` writes at `path` of `root` holding no data */
  const filledAt = (context: SchemaContext, root: RJSFSchema, path: (string | number)[]): unknown =>
    path.reduce<unknown>(
      (value, key) =>
        value === null || typeof value !== 'object' ? undefined : (value as Record<string, unknown>)[key],
      getDefaultFormState(context, { schema: root, rootSchema: root }),
    );
  /** What `getFilledDefault()` reads at `path` of `root`, through the fills `childFillOf()` hands each field */
  const readAt = (context: SchemaContext, root: RJSFSchema, path: (string | number)[]): unknown => {
    let schema = root;
    let fill: FieldFill = {};
    for (const key of path) {
      fill = childFillOf(context, schema, root, fill, key);
      const raw = typeof key === 'number' ? (schema.items as RJSFSchema) : (schema.properties![key] as RJSFSchema);
      schema = retrieveSchema(context, raw, root);
    }
    return getFilledDefault(context, schema, root, fill);
  };

  it.each<{ name: string; context?: SchemaContext; root: RJSFSchema; path: (string | number)[] }>([
    {
      name: "an ancestor's const over a key's own default (#5819)",
      root: {
        type: 'object',
        properties: {
          o: {
            type: 'object',
            const: { a: 'c' },
            default: { a: 'd' },
            properties: { a: { type: 'string', default: 'e' } },
          },
        },
      },
      path: ['o', 'a'],
    },
    {
      name: 'a default its own properties declare, for an object declaring none (#5839)',
      root: {
        type: 'object',
        properties: { o: { type: 'object', properties: { a: { type: 'number', default: 1 } } } },
      },
      path: ['o'],
    },
    {
      name: "a key the object's default doesn't name, beside one it does (#5839)",
      root: {
        type: 'object',
        properties: {
          o: {
            type: 'object',
            default: { x: 1 },
            properties: {
              x: { type: 'number' },
              c: { type: 'object', default: { a: 1 }, properties: { a: { type: 'number' } } },
            },
          },
        },
      },
      path: ['o'],
    },
    {
      name: 'an array default padded to minItems (#5825)',
      root: {
        type: 'object',
        required: ['v'],
        properties: { v: { type: 'array', minItems: 2, items: { type: 'string', default: 'z' }, default: ['x'] } },
      },
      path: ['v'],
    },
    {
      name: "an item at its index of its array's default (#5826)",
      root: { type: 'object', properties: { list: { type: 'array', items: { type: 'string' }, default: ['x', 'w'] } } },
      path: ['list', 0],
    },
    {
      name: "an extra key a pattern describes, by the pattern's own default (#5819)",
      context: { ...descendantWins, additionalPropertiesWhenAbsent: 'allow' },
      root: {
        type: 'object',
        properties: {
          o: { type: 'object', patternProperties: { '^x': { type: 'number', default: 7 } }, default: { x1: 1 } },
        },
      },
      path: ['o'],
    },
    {
      name: 'a oneOf of constants whose default names none of them, which the fill takes as it stands (#5898)',
      root: {
        type: 'object',
        properties: { s: { type: 'string', default: 'z', oneOf: [{ const: 'a' }, { const: 'b' }] } },
      },
      path: ['s'],
    },
  ])('reads $name as the fill writes it', ({ context = descendantWins, root, path }) => {
    const filled = filledAt(context, root, path);
    expect(filled).not.toBeUndefined();
    expect(readAt(context, root, path)).toEqual(filled);
  });

  it('reads nothing for a value the fill only computes for a field no default reaches', () => {
    const root: RJSFSchema = {
      type: 'object',
      required: ['b', 'l'],
      properties: {
        b: { type: 'boolean' },
        l: { type: 'array', minItems: 2, items: { type: 'string', default: 'z' } },
      },
    };
    expect(filledAt(descendantWins, root, ['b'])).toBe(false);
    expect(readAt(descendantWins, root, ['b'])).toBeUndefined();
    expect(filledAt(descendantWins, root, ['l'])).toEqual(['z', 'z']);
    expect(readAt(descendantWins, root, ['l'])).toBeUndefined();
  });

  it.each<{ name: string; root: RJSFSchema; path: (string | number)[] }>([
    {
      name: 'an object whose only default sits in a oneOf option the fill did not pick',
      root: {
        type: 'object',
        required: ['o'],
        properties: { o: { type: 'object', oneOf: [{}, { properties: { b: { type: 'string', default: 'z' } } }] } },
      },
      path: ['o'],
    },
    {
      name: 'an object whose only default sits in an else while its then applies',
      root: {
        type: 'object',
        required: ['o'],
        properties: {
          o: { type: 'object', if: true, then: {}, else: { properties: { b: { type: 'string', default: 'z' } } } },
        },
      },
      path: ['o'],
    },
    {
      name: 'a required array beside a dependencies entry declaring a default',
      root: {
        type: 'object',
        required: ['arr'],
        properties: { arr: { type: 'array', items: { type: 'string' } }, k: { type: 'string' } },
        dependencies: { k: { properties: { m: { type: 'string', default: 'z' } } } },
      },
      path: ['arr'],
    },
    {
      name: 'a required boolean beside a property declaring a default',
      root: {
        type: 'object',
        required: ['b'],
        properties: { a: { type: 'number', default: 1 }, b: { type: 'boolean' } },
      },
      path: ['b'],
    },
  ])('reads nothing for $name, which no default reaches', ({ root, path }) => {
    expect(filledAt(descendantWins, root, path)).not.toBeUndefined();
    expect(readAt(descendantWins, root, path)).toBeUndefined();
  });

  it('hands the children of an object const beside options the const, not the option fold', () => {
    const root: RJSFSchema = {
      type: 'object',
      properties: { a: { type: 'string' } },
      const: { a: 'c' },
      oneOf: [{ properties: { b: { type: 'string', default: 'b' } } }],
    };
    expect(childFillOf(descendantWins, root, root, {}, 'a').inheritedConst).toBe('c');
  });

  it("hands a field's children the default its own fill combines, before it is filled out", () => {
    const array: RJSFSchema = { type: 'array', minItems: 2, items: { type: 'string', default: 'z' }, default: ['x'] };
    expect(getFieldDefault(descendantWins, array, array, { isRequired: true })).toEqual(['x']);
    expect(getFilledDefault(descendantWins, array, array, { isRequired: true })).toEqual(['x', 'z']);
  });

  it('fills a reused fill anew under another root schema or context', () => {
    const field: RJSFSchema = { type: 'object', properties: { a: { $ref: '#/definitions/a' } } };
    const rootOf = (d: string): RJSFSchema => ({ definitions: { a: { type: 'string', default: d } }, ...field });
    const ROOT: FieldFill = {};
    expect(getFilledDefault(descendantWins, field, rootOf('one'), ROOT)).toEqual({ a: 'one' });
    expect(getFilledDefault(descendantWins, field, rootOf('two'), ROOT)).toEqual({ a: 'two' });

    const own: RJSFSchema = { type: 'object', properties: { a: { type: 'string', default: 'own' } } };
    const inheriting: FieldFill = { inheritedDefault: { a: 'p' } };
    expect(getFilledDefault(descendantWins, own, own, inheriting)).toEqual({ a: 'own' });
    expect(getFilledDefault(ancestorWins, own, own, inheriting)).toEqual({ a: 'p' });

    const parent: RJSFSchema = { type: 'object', default: { a: 'p' }, properties: own.properties };
    const child = childFillOf(descendantWins, parent, parent, ROOT, 'a');
    expect(getFilledDefault(descendantWins, { type: 'string', default: 'own' }, parent, child)).toBe('own');
    expect(getFilledDefault(ancestorWins, { type: 'string', default: 'own' }, parent, child)).toBe('p');
  });

  it('hands the same fill for the same child, so its parent is filled once', () => {
    const root: RJSFSchema = { type: 'object', properties: { a: { type: 'string', default: 'x' } } };
    const fill: FieldFill = {};
    expect(childFillOf(descendantWins, root, root, fill, 'a')).toBe(childFillOf(descendantWins, root, root, fill, 'a'));
  });

  it.each<{ name: string; child: RJSFSchema }>([
    {
      name: 'an if',
      child: { type: 'string', if: { minLength: 1 }, then: { default: 'then' }, else: { default: 'else' } },
    },
    { name: 'an option list', child: { type: 'string', oneOf: [{ default: 'one' }, { default: 'two' }] } },
    { name: 'an option list an allOf offers', child: { type: 'string', allOf: [{ oneOf: [{ default: 'one' }] }] } },
  ])("fills a child reading $name by itself, not off its parent's fill", ({ child }) => {
    const root: RJSFSchema = { type: 'object', properties: { c: child }, default: { c: 'object' } };
    const context: SchemaContext = { validator: answering() };
    const fill = childFillOf(context, root, root, {}, 'c');
    // A schema the caller resolved otherwise than the parent's fill read it, which a child reading data may be
    const resolved: RJSFSchema = { type: 'string', default: 'resolved' };
    expect(getFilledDefault(context, resolved, root, fill)).toBe('resolved');
  });

  it("fills a child whose name a pattern reading data matches by itself, not off its parent's fill", () => {
    const root: RJSFSchema = {
      type: 'object',
      properties: { c: { type: 'string' } },
      patternProperties: { '^c': { if: { minLength: 1 }, then: { default: 'then' } } },
      default: { c: 'object' },
    };
    const context: SchemaContext = { validator: answering() };
    const fill = childFillOf(context, root, root, {}, 'c');
    expect(getFilledDefault(context, { type: 'string', default: 'resolved' }, root, fill)).toBe('resolved');
  });

  it("reads a child an ancestor's const or option default gives a value off its parent's fill", () => {
    const constRoot: RJSFSchema = { type: 'object', properties: { a: { type: 'string' } }, const: { a: 'c' } };
    const constFill = childFillOf(descendantWins, constRoot, constRoot, {}, 'a');
    expect(getFilledDefault(descendantWins, { type: 'string' }, constRoot, constFill)).toBe('c');
    const optionRoot: RJSFSchema = {
      type: 'object',
      properties: { a: { type: 'string' } },
      oneOf: [{ default: { a: 'o' } }],
    };
    const optionFill = childFillOf(descendantWins, optionRoot, optionRoot, {}, 'a');
    expect(getFilledDefault(descendantWins, { type: 'string' }, optionRoot, optionFill)).toBe('o');
    const refRoot: RJSFSchema = {
      type: 'object',
      definitions: { option: { default: { a: 'r' } } },
      properties: { a: { type: 'string' } },
      oneOf: [{ $ref: '#/definitions/option' }],
    };
    const refFill = childFillOf(descendantWins, refRoot, refRoot, {}, 'a');
    expect(getFilledDefault(descendantWins, { type: 'string' }, refRoot, refFill)).toBe('r');
  });

  it.each<{ name: string; tuple: RJSFSchema }>([
    { name: 'prefixItems', tuple: { type: 'array', prefixItems: [{ type: 'string', default: 'a' }] } },
    { name: 'an items list', tuple: { type: 'array', items: [{ type: 'string', default: 'a' }] } },
  ])('reads the item defaults a tuple declares through $name as its default, as the fill writes them', ({ tuple }) => {
    expect(getFilledDefault(descendantWins, tuple, tuple)).toEqual(['a']);
  });

  it("reads a child deciding nothing from data off its parent's fill", () => {
    const root: RJSFSchema = { type: 'object', properties: { c: { type: 'string' } }, default: { c: 'object' } };
    const fill = childFillOf(descendantWins, root, root, {}, 'c');
    expect(getFilledDefault(descendantWins, { type: 'string', default: 'resolved' }, root, fill)).toBe('object');
  });

  it('reads a child of a fill the caller made by what that fill hands down', () => {
    const root: RJSFSchema = { type: 'object', properties: { a: { type: 'string' } } };
    const fill = childFillOf(descendantWins, root, root, { inheritedDefault: { a: 'x' } }, 'a');
    expect(getFilledDefault(descendantWins, { type: 'string' }, root, fill)).toBe('x');
    const constFill = childFillOf(descendantWins, root, root, { inheritedConst: { a: 'c' } }, 'a');
    expect(getFilledDefault(descendantWins, { type: 'string' }, root, constFill)).toBe('c');
  });

  it('reads no default for a tuple item no default reaches, though an ancestor declares one', () => {
    const tuple: RJSFSchema = {
      type: 'array',
      prefixItems: [{ type: 'object', properties: { a: { type: 'string' } } }, { type: 'boolean' }],
    };
    const root: RJSFSchema = { type: 'object', default: {}, required: ['t'], properties: { t: tuple } };
    const tupleFill = childFillOf(descendantWins, root, root, {}, 't');
    expect(childFillOf(descendantWins, tuple, root, tupleFill, 0).inheritedDefault).toBeUndefined();
    expect(
      getFilledDefault(
        descendantWins,
        { type: 'boolean' },
        root,
        childFillOf(descendantWins, tuple, root, tupleFill, 1),
      ),
    ).toBeUndefined();
  });
});
