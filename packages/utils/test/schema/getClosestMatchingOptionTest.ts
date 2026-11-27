import type { CustomMergeAllOf, RJSFSchema, SchemaContext, SchemaUtilsType } from '../../src/index.ts';
import { createSchemaUtils, getByPath, getClosestMatchingOption, isSchemaObject } from '../../src/index.ts';
import { calculateIndexScore } from '../../src/schema/getClosestMatchingOption.ts';
import { DECLARED_ABOVE_KEY } from '../../src/schemaMarkers.ts';
import {
  oneOfData,
  oneOfSchema,
  ONE_OF_SCHEMA_DATA,
  OPTIONAL_ONE_OF_DATA,
  OPTIONAL_ONE_OF_SCHEMA,
  ONE_OF_SCHEMA_OPTIONS,
  OPTIONAL_ONE_OF_SCHEMA_ONEOF,
  PET_RESOURCE_DEEP_SCHEMA,
  PET_RESOURCE_SCHEMA,
} from '../testUtils/testData.ts';
import type { TestValidatorType } from './types.ts';

const firstOption = oneOfSchema.definitions!.first_option_def as RJSFSchema;
const secondOption = oneOfSchema.definitions!.second_option_def as RJSFSchema;

export default function getClosestMatchingOptionTest(testValidator: TestValidatorType) {
  let schemaUtils: SchemaUtilsType;
  beforeAll(() => {
    schemaUtils = createSchemaUtils({ validator: testValidator }, oneOfSchema);
  });
  describe('calculateIndexScore', () => {
    it('returns 0 when schema is not specified', () => {
      expect(calculateIndexScore({ validator: testValidator }, OPTIONAL_ONE_OF_SCHEMA)).toEqual(0);
    });
    it('returns 0 when schema.properties is undefined', () => {
      expect(calculateIndexScore({ validator: testValidator }, OPTIONAL_ONE_OF_SCHEMA, {})).toEqual(0);
    });
    it('returns 0 when schema.properties is not an object', () => {
      expect(
        calculateIndexScore({ validator: testValidator }, OPTIONAL_ONE_OF_SCHEMA, {
          properties: 'foo',
        } as unknown as RJSFSchema),
      ).toEqual(0);
    });
    it('returns 0 when properties type is boolean', () => {
      expect(
        calculateIndexScore({ validator: testValidator }, OPTIONAL_ONE_OF_SCHEMA, {
          properties: { foo: true },
        }),
      ).toEqual(0);
    });
    it('returns 0 when formData is empty object', () => {
      expect(calculateIndexScore({ validator: testValidator }, oneOfSchema, firstOption, {})).toEqual(0);
    });
    it('leaves unstubbed an option whose additionalProperties takes only keys a field above declares', () => {
      const option = { type: 'object', additionalProperties: true, [DECLARED_ABOVE_KEY]: ['a'] } as RJSFSchema;
      expect(calculateIndexScore({ validator: testValidator }, option, option, { a: 1 })).toEqual(1);
    });
    it('scores a $ref property beside keywords of its own once, when the definition merges itself in through its allOf', () => {
      const rootSchema: RJSFSchema = {
        definitions: {
          node: { type: 'object', properties: { name: { type: 'string' } }, allOf: [{ $ref: '#/definitions/node' }] },
        },
      };
      const option: RJSFSchema = {
        properties: { d: { $ref: '#/definitions/node', properties: { sib: { type: 'string' } } } },
      };
      expect(calculateIndexScore({ validator: testValidator }, rootSchema, option, { d: { name: 'x' } })).toEqual(2);
    });
    it('scores an option written as a $ref naming a boolean definition as the empty schema it reads as', () => {
      const rootSchema: RJSFSchema = { definitions: { anything: true } };
      const option: RJSFSchema = { $ref: '#/definitions/anything' };
      expect(calculateIndexScore({ validator: testValidator }, rootSchema, option, 'x')).toEqual(0);
    });
    it('scores a $ref property naming a boolean definition as the empty schema it reads as', () => {
      const rootSchema: RJSFSchema = { definitions: { anything: true } };
      const option: RJSFSchema = { properties: { p: { $ref: '#/definitions/anything' } } };
      expect(calculateIndexScore({ validator: testValidator }, rootSchema, option, { p: 'x' })).toEqual(0);
    });
    it('scores a base that two allOf entries share once, so it cannot outweigh a property only the other option declares', () => {
      const Cat: RJSFSchema = { allOf: [{ $ref: '#/definitions/Pet' }, { $ref: '#/definitions/Named' }] };
      const Dog: RJSFSchema = { allOf: [{ $ref: '#/definitions/Pet' }, { properties: { bark: { type: 'string' } } }] };
      const rootSchema: RJSFSchema = {
        definitions: {
          Base: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } },
          Pet: { allOf: [{ $ref: '#/definitions/Base' }] },
          Named: { allOf: [{ $ref: '#/definitions/Base' }] },
          Cat,
          Dog,
        },
      };
      const formData = { id: '1', name: 'n', bark: 'b' };
      expect(calculateIndexScore({ validator: testValidator }, rootSchema, Cat, formData)).toEqual(2);
      expect(calculateIndexScore({ validator: testValidator }, rootSchema, Dog, formData)).toEqual(3);
    });
    it('returns 2 for first option in oneOf schema, scoring its $ref property as the definition it names', () => {
      expect(calculateIndexScore({ validator: testValidator }, oneOfSchema, firstOption, ONE_OF_SCHEMA_DATA)).toEqual(
        2,
      );
    });
    it('returns 10 for second option in oneOf schema', () => {
      expect(calculateIndexScore({ validator: testValidator }, oneOfSchema, secondOption, ONE_OF_SCHEMA_DATA)).toEqual(
        10,
      );
    });
    it('scores a property by the anyOf of a schema that also has a oneOf', () => {
      const schema: RJSFSchema = {
        properties: {
          foo: { anyOf: [{ const: 'a' }, { const: 'b' }], oneOf: [{ const: 'b' }] },
        },
      };
      testValidator.setReturnValues({ isValid: [false, true] });
      expect(calculateIndexScore({ validator: testValidator }, oneOfSchema, schema, { foo: 'b' })).toEqual(1);
    });
    it('returns 1 for a schema that has a type matching the formData type', () => {
      expect(calculateIndexScore({ validator: testValidator }, oneOfSchema, { type: 'boolean' }, true)).toEqual(1);
    });
    it('returns 2 for a schema that has a const matching the formData value', () => {
      expect(
        calculateIndexScore(
          { validator: testValidator },
          oneOfSchema,
          { properties: { foo: { type: 'string', const: 'constValue' } } },
          { foo: 'constValue' },
        ),
      ).toEqual(2);
    });
    it('scores a recursive $ref under a property named for an inherited member', () => {
      // `toString` is a legal property name that every object also inherits, so the read has to be an own-property one
      // or the recursion never sees the data run out
      const schema: RJSFSchema = {
        definitions: {
          Node: {
            type: 'object',
            properties: { name: { type: 'string' }, toString: { $ref: '#/definitions/Node' } },
          },
        },
      };
      expect(
        calculateIndexScore({ validator: testValidator }, schema, schema.definitions!.Node as RJSFSchema, {
          name: 'a',
        }),
      ).toEqual(1);
    });
    it('does not follow a $ref that the formData has no value for', () => {
      // Scoring a fabricated value against the resolved definition would only ever reward the absence of data
      const schema: RJSFSchema = {
        definitions: { Node: { type: 'object', properties: { x: { type: 'null' } } } },
        type: 'object',
        properties: { a: { $ref: '#/definitions/Node' }, b: { type: 'string' } },
      };
      expect(calculateIndexScore({ validator: testValidator }, schema, schema, { b: 'here' })).toEqual(1);
      expect(calculateIndexScore({ validator: testValidator }, schema, schema, { a: null, b: 'here' })).toEqual(1);
    });
    it('returns 0 for a schema that has a const that does not match the formData value', () => {
      expect(
        calculateIndexScore(
          { validator: testValidator },
          oneOfSchema,
          { properties: { foo: { type: 'string', const: 'constValue' } } },
          { foo: 'aValue' },
        ),
      ).toEqual(0);
    });
    it('scores a falsy const the way it scores a truthy one', () => {
      const schema: RJSFSchema = { properties: { flag: { type: 'boolean', const: false } } };
      expect(calculateIndexScore({ validator: testValidator }, oneOfSchema, schema, { flag: false })).toEqual(2);
      expect(calculateIndexScore({ validator: testValidator }, oneOfSchema, schema, { flag: true })).toEqual(0);
    });
    it('scores a nested oneOf holding a falsy value the way it scores a truthy one', () => {
      const schema: RJSFSchema = { properties: { value: { oneOf: [{ type: 'string' }, { type: 'number' }] } } };
      // The number option matches and its type is the value's: one for each, rather than its index
      expect(calculateIndexScore({ validator: testValidator }, oneOfSchema, schema, { value: 0 })).toEqual(2);
      expect(calculateIndexScore({ validator: testValidator }, oneOfSchema, schema, { value: 5 })).toEqual(2);
    });
    it('scores nothing for a nested oneOf with no options', () => {
      const schema: RJSFSchema = { properties: { value: { oneOf: [] } } };
      expect(calculateIndexScore({ validator: testValidator }, oneOfSchema, schema, { value: 5 })).toEqual(0);
    });
    it('does not score a nested oneOf against a null value', () => {
      const schema: RJSFSchema = {
        properties: { name: { type: 'string' }, extra: { oneOf: [{ type: 'string' }, { type: 'number' }] } },
      };
      expect(
        calculateIndexScore({ validator: testValidator }, oneOfSchema, schema, { name: 'a', extra: null }),
      ).toEqual(1);
      expect(calculateIndexScore({ validator: testValidator }, oneOfSchema, schema, { name: 'a' })).toEqual(1);
    });
    it('does not compare a missing value to a const of null', () => {
      const schema: RJSFSchema = { properties: { n: { type: 'null', const: null } } };
      expect(calculateIndexScore({ validator: testValidator }, oneOfSchema, schema, {})).toEqual(1);
      expect(calculateIndexScore({ validator: testValidator }, oneOfSchema, schema, { n: null })).toEqual(2);
    });
  });
  describe('oneOfMatchingOption', () => {
    it('oneOfSchema, oneOfData data, no options, returns -1', () => {
      expect(schemaUtils.getClosestMatchingOption(oneOfData, [])).toEqual(-1);
    });
    it('oneOfSchema, no data, 2 options, returns the first option', () => {
      expect(schemaUtils.getClosestMatchingOption(undefined, [{ type: 'string' }, { type: 'number' }])).toEqual(0);
    });
    it('oneOfSchema, oneOfData, no options, selectedOption 2, returns 2', () => {
      expect(schemaUtils.getClosestMatchingOption(oneOfData, [], 2)).toEqual(2);
    });
    it('oneOfSchema, no data, 2 options, selectedOption 2 past the options, returns the first option', () => {
      expect(schemaUtils.getClosestMatchingOption(undefined, [{ type: 'string' }, { type: 'number' }], 2)).toEqual(0);
    });
    it('keeps a selected option that ties with the others, where it is one of the candidates', () => {
      expect(schemaUtils.getClosestMatchingOption(undefined, [{ type: 'string' }, { type: 'number' }], 1)).toEqual(1);
    });
    it('never returns a selected option the data does not match while another option matches it', () => {
      // The second and third options match, and score the same, where the selected first one does not match
      testValidator.setReturnValues({ isValid: [true, true] });
      const options: RJSFSchema[] = [
        { type: 'object', properties: { a: { type: 'string' } }, required: ['a'] },
        { type: 'object', properties: { b: { type: 'string' } } },
        { type: 'object', properties: { c: { type: 'string' } } },
      ];
      expect(schemaUtils.getClosestMatchingOption({ b: 'x', c: 'y' }, options, 0)).toEqual(1);
    });
    it('returns the first option, which kind of matches the data', () => {
      expect(
        getClosestMatchingOption({ validator: testValidator }, oneOfSchema, { flag: true }, ONE_OF_SCHEMA_OPTIONS),
      ).toEqual(0);
    });
    it('returns the second option, which exactly matches the data', () => {
      // First 3 are mocked false, with the fourth being true for the real second option
      testValidator.setReturnValues({ isValid: [false, false, false, true] });
      expect(
        getClosestMatchingOption({ validator: testValidator }, oneOfSchema, ONE_OF_SCHEMA_DATA, ONE_OF_SCHEMA_OPTIONS),
      ).toEqual(1);
    });
    it('returns the first matching option (i.e. second index) when data is ambiguous', () => {
      testValidator.setReturnValues({
        isValid: [false, false, false, true, false, true],
      });
      const formData = { flag: false };
      expect(
        getClosestMatchingOption(
          { validator: testValidator },
          OPTIONAL_ONE_OF_SCHEMA,
          formData,
          OPTIONAL_ONE_OF_SCHEMA_ONEOF,
        ),
      ).toEqual(1);
    });
    it('returns the third index when data is clear', () => {
      testValidator.setReturnValues({
        isValid: [false, false, false, false, false, true],
      });
      expect(
        getClosestMatchingOption(
          { validator: testValidator },
          OPTIONAL_ONE_OF_SCHEMA,
          OPTIONAL_ONE_OF_DATA,
          OPTIONAL_ONE_OF_SCHEMA_ONEOF,
        ),
      ).toEqual(2);
    });
    describe('a tie among matching options whose properties have defaults (#5930)', () => {
      const withDefault = (key: string): RJSFSchema => ({ type: 'string', default: `${key}-default` });
      // A then×own pair each, as a `then` list merged with the field's own builds them: matching passes over the
      // missing `required` key and the typed values differ from the defaults, so both score 0
      const options: RJSFSchema[] = [
        { properties: { a: withDefault('a'), d: withDefault('d') }, required: ['a', 'd'] },
        { properties: { b: withDefault('b'), d: withDefault('d') }, required: ['b', 'd'] },
      ];
      const rootSchema: RJSFSchema = { oneOf: options };
      it('goes to the first option holding each key it requires', () => {
        testValidator.setReturnValues({ isValid: [true, true] });
        expect(
          getClosestMatchingOption({ validator: testValidator }, rootSchema, { b: 'typed b', d: 'typed d' }, options),
        ).toEqual(1);
      });
      it('goes to the option declaring the most keys the data holds where none requires any', () => {
        const unrequired = options.map(({ properties }) => ({ properties }));
        testValidator.setReturnValues({ isValid: [true, true] });
        expect(
          getClosestMatchingOption(
            { validator: testValidator },
            { oneOf: unrequired },
            { b: 'typed b', d: 'typed d' },
            unrequired,
          ),
        ).toEqual(1);
      });
      it('ranks holding each key an option requires over declaring more of the keys the data holds', () => {
        const ranked: RJSFSchema[] = [
          { properties: { a: withDefault('a'), b: withDefault('b'), d: withDefault('d') }, required: ['a'] },
          { properties: { d: withDefault('d') }, required: ['d'] },
        ];
        testValidator.setReturnValues({ isValid: [true, true] });
        expect(
          getClosestMatchingOption(
            { validator: testValidator },
            { oneOf: ranked },
            { b: 'typed b', d: 'typed d' },
            ranked,
          ),
        ).toEqual(1);
      });
      it('passes over a selected pair a merge of lists built where another ranks above it', () => {
        const merged: RJSFSchema = {
          type: 'object',
          oneOf: [
            { properties: { a: withDefault('a') }, required: ['a'] },
            { properties: { b: withDefault('b') }, required: ['b'] },
          ],
          if: true,
          then: { oneOf: [{ properties: { d: withDefault('d') }, required: ['d'] }] },
        };
        const formData = { b: 'typed b', d: 'typed d' };
        const { oneOf = [] } = createSchemaUtils({ validator: testValidator }, merged).retrieveSchema(merged, formData);
        const pairs = oneOf.filter(isSchemaObject);
        testValidator.setReturnValues({ isValid: [true, true] });
        expect(pairs).toHaveLength(2);
        expect(getClosestMatchingOption({ validator: testValidator }, merged, formData, pairs, 0)).toEqual(1);
      });
      // A custom merge builds its pairs as fresh objects, which record nothing of what they were built from
      const pairing: CustomMergeAllOf = (schema) => {
        const { allOf, oneOf, ...rest } = schema;
        const other = (allOf?.[0] as RJSFSchema | undefined)?.oneOf as RJSFSchema[] | undefined;
        const own = (oneOf ?? other) as RJSFSchema[];
        return {
          ...rest,
          oneOf: (oneOf && other ? oneOf : [{}]).flatMap((left) =>
            (oneOf && other ? other : own).map((right) => ({
              properties: { ...(left as RJSFSchema).properties, ...right.properties },
              required: [...((left as RJSFSchema).required ?? []), ...(right.required ?? [])],
            })),
          ),
        };
      };
      it('passes over a selected pair a customMergeAllOf built from two lists where another ranks above it', () => {
        const merged: RJSFSchema = {
          type: 'object',
          oneOf: [
            { properties: { a: withDefault('a') }, required: ['a'] },
            { properties: { b: withDefault('b') }, required: ['b'] },
          ],
          allOf: [{ oneOf: [{ properties: { d: withDefault('d') }, required: ['d'] }] }],
        };
        const formData = { b: 'typed b', d: 'typed d' };
        const context = { validator: testValidator, customMergeAllOf: pairing };
        const { oneOf = [] } = createSchemaUtils(context, merged).retrieveSchema(merged, formData);
        const pairs = oneOf.filter(isSchemaObject);
        testValidator.setReturnValues({ isValid: [true, true] });
        expect(pairs).toHaveLength(2);
        expect(getClosestMatchingOption(context, merged, formData, pairs, 0)).toEqual(1);
      });
      it('keeps a selected option a customMergeAllOf returns for one list, as it merged no lists', () => {
        const single: RJSFSchema = { type: 'object', allOf: [{ oneOf: options }] };
        const formData = { b: 'typed b', d: 'typed d' };
        const context = { validator: testValidator, customMergeAllOf: pairing };
        const { oneOf = [] } = createSchemaUtils(context, single).retrieveSchema(single, formData);
        const hoisted = oneOf.filter(isSchemaObject);
        testValidator.setReturnValues({ isValid: [true, true] });
        expect(hoisted).toHaveLength(2);
        expect(getClosestMatchingOption(context, single, formData, hoisted, 0)).toEqual(0);
      });
      it('keeps a selected option a customMergeAllOf hands back unchanged from one of the lists it merges', () => {
        const own: RJSFSchema = {
          type: 'object',
          oneOf: options,
          allOf: [{ oneOf: [{ properties: { d: withDefault('d') }, required: ['d'] }] }],
        };
        const formData = { b: 'typed b', d: 'typed d' };
        const ownWins: CustomMergeAllOf = ({ allOf, ...rest }) => rest;
        const context = { validator: testValidator, customMergeAllOf: ownWins };
        const { oneOf = [] } = createSchemaUtils(context, own).retrieveSchema(own, formData);
        const written = oneOf.filter(isSchemaObject);
        testValidator.setReturnValues({ isValid: [true, true] });
        expect(written).toHaveLength(2);
        expect(getClosestMatchingOption(context, own, formData, written, 0)).toEqual(0);
      });
      it('keeps a selected `true` option where another ranks above it, as no merge builds one', () => {
        const withTrue = [true, options[1]] as unknown as RJSFSchema[];
        testValidator.setReturnValues({ isValid: [true, true] });
        expect(
          getClosestMatchingOption(
            { validator: testValidator },
            { oneOf: withTrue },
            { b: 'typed b', d: 'typed d' },
            withTrue,
            0,
          ),
        ).toEqual(0);
      });
      it('keeps a selected written option where another ranks above it, as an explicit pick', () => {
        const written: RJSFSchema[] = [
          { title: 'Card', properties: { name: { type: 'string' }, card: { type: 'string' } } },
          { title: 'Bank', properties: { name: { type: 'string' }, iban: { type: 'string' } }, required: ['iban'] },
        ];
        testValidator.setReturnValues({ isValid: [true, true] });
        expect(
          getClosestMatchingOption({ validator: testValidator }, { oneOf: written }, { name: 'Jo' }, written, 1),
        ).toEqual(1);
      });
      it('ranks the tied options where a selected written option scores below them', () => {
        const written: RJSFSchema[] = [
          { properties: { name: { type: 'number' } } },
          { properties: { name: { type: 'string' } } },
          { properties: { name: { type: 'string' }, b: withDefault('b') }, required: ['b'] },
        ];
        testValidator.setReturnValues({ isValid: [true, true, true] });
        expect(
          getClosestMatchingOption(
            { validator: testValidator },
            { oneOf: written },
            { name: 'Jo', b: 'x' },
            written,
            0,
          ),
        ).toEqual(2);
      });
      it('keeps the selected option where it ranks as well', () => {
        testValidator.setReturnValues({ isValid: [true, true] });
        expect(
          getClosestMatchingOption({ validator: testValidator }, rootSchema, { d: 'typed d' }, options, 1),
        ).toEqual(1);
      });
      it('goes to the first option where none holds each key it requires', () => {
        testValidator.setReturnValues({ isValid: [true, true] });
        expect(getClosestMatchingOption({ validator: testValidator }, rootSchema, { d: 'typed d' }, options)).toEqual(
          0,
        );
      });
      it('reads the keys a definition an option names requires', () => {
        const definitions = { AD: options[0], BD: options[1] };
        const refs: RJSFSchema[] = [{ $ref: '#/definitions/AD' }, { $ref: '#/definitions/BD' }];
        testValidator.setReturnValues({ isValid: [true, true] });
        expect(
          getClosestMatchingOption(
            { validator: testValidator },
            { definitions, oneOf: refs },
            { b: 'typed b', d: 'typed d' },
            refs,
          ),
        ).toEqual(1);
      });
      it('reads a boolean option as requiring nothing it rejects', () => {
        const withBoolean = [options[0], true] as unknown as RJSFSchema[];
        testValidator.setReturnValues({ isValid: [true] });
        expect(
          getClosestMatchingOption({ validator: testValidator }, { oneOf: withBoolean }, { d: 'typed d' }, withBoolean),
        ).toEqual(1);
      });
    });
    it('returns the second option when data matches for oneOf', () => {
      // From https://github.com/rjsf-team/react-jsonschema-form/issues/2944
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          oneOf: [
            {
              properties: {
                lorem: {
                  type: 'string',
                },
              },
              required: ['lorem'],
            },
            {
              properties: {
                ipsum: {
                  oneOf: [
                    {
                      properties: {
                        day: {
                          type: 'string',
                        },
                      },
                    },
                    {
                      properties: {
                        night: {
                          type: 'string',
                        },
                      },
                    },
                  ],
                },
              },
              required: ['ipsum'],
            },
          ],
        },
      };
      const formData = { ipsum: { night: 'nicht' } };
      // Mock to return true for the last of the second one-ofs
      testValidator.setReturnValues({
        isValid: [false, false, false, false, false, false, false, true],
      });
      expect(
        getClosestMatchingOption(
          { validator: testValidator },
          schema,
          formData,
          getByPath<RJSFSchema[]>(schema, ['items', 'oneOf']),
        ),
      ).toEqual(1);
    });
    it('returns the second option when data matches for anyOf', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          anyOf: [
            {
              properties: {
                lorem: {
                  type: 'string',
                },
              },
              required: ['lorem'],
            },
            {
              properties: {
                ipsum: {
                  anyOf: [
                    {
                      properties: {
                        day: {
                          type: 'string',
                        },
                      },
                    },
                    {
                      properties: {
                        night: {
                          type: 'string',
                        },
                      },
                    },
                  ],
                },
              },
              required: ['ipsum'],
            },
          ],
        },
      };
      const formData = { ipsum: { night: 'nicht' } };
      // Mock to return true for the last of the second anyOfs
      testValidator.setReturnValues({
        isValid: [false, false, false, false, false, false, false, true],
      });
      expect(
        getClosestMatchingOption(
          { validator: testValidator },
          schema,
          formData,
          getByPath<RJSFSchema[]>(schema, ['items', 'anyOf']),
        ),
      ).toEqual(1);
    });
    it('should return 0 when schema has discriminator but no matching data', () => {
      // Mock isValid to fail both values
      testValidator.setReturnValues({ isValid: [false, false, false, false] });
      const schema: RJSFSchema = {
        type: 'object',
        definitions: {
          Foo: {
            title: 'Foo',
            type: 'object',
            properties: {
              code: {
                title: 'Code',
                default: 'foo_coding',
                enum: ['foo_coding'],
                type: 'string',
              },
            },
          },
          Bar: {
            title: 'Bar',
            type: 'object',
            properties: {
              code: {
                title: 'Code',
                default: 'bar_coding',
                enum: ['bar_coding'],
                type: 'string',
              },
            },
          },
        },
        discriminator: {
          propertyName: 'code',
        },
        oneOf: [{ $ref: '#/definitions/Foo' }, { $ref: '#/definitions/Bar' }],
      };
      const options = [schema.definitions!.Foo, schema.definitions!.Bar] as RJSFSchema[];
      expect(getClosestMatchingOption({ validator: testValidator }, schema, undefined, options, -1, 'code')).toEqual(0);
    });
    it('should return Bar when schema has discriminator for bar', () => {
      // Mock isValid to pass the second value
      testValidator.setReturnValues({ isValid: [false, false, false, true] });
      const schema: RJSFSchema = {
        type: 'object',
        definitions: {
          Foo: {
            title: 'Foo',
            type: 'object',
            properties: {
              code: {
                title: 'Code',
                default: 'foo_coding',
                enum: ['foo_coding'],
                type: 'string',
              },
            },
          },
          Bar: {
            title: 'Bar',
            type: 'object',
            properties: {
              code: {
                title: 'Code',
                default: 'bar_coding',
                enum: ['bar_coding'],
                type: 'string',
              },
            },
          },
        },
        discriminator: {
          propertyName: 'code',
        },
        oneOf: [{ $ref: '#/definitions/Foo' }, { $ref: '#/definitions/Bar' }],
      };
      const formData = { code: 'bar_coding' };
      const options = [schema.definitions!.Foo, schema.definitions!.Bar] as RJSFSchema[];
      // Use the schemaUtils to verify the discriminator prop gets passed
      const schemaUtils = createSchemaUtils({ validator: testValidator }, schema);
      expect(schemaUtils.getClosestMatchingOption(formData, options, 0, 'code')).toEqual(1);
    });
    it('picks for the additionalPropertiesWhenAbsent it is asked under, whichever it was asked under first for the same data', () => {
      testValidator.reset?.();
      const options: RJSFSchema[] = [
        { type: 'object', properties: { x: { type: 'string' } } },
        { type: 'object', properties: {} },
      ];
      const rootSchema: RJSFSchema = { type: 'object', oneOf: options };
      const formData = { a: 1 };
      const allowing = { validator: testValidator, additionalPropertiesWhenAbsent: 'allow' } as const;
      expect(getClosestMatchingOption(allowing, rootSchema, formData, options)).toEqual(1);
      expect(getClosestMatchingOption({ validator: testValidator }, rootSchema, formData, options)).toEqual(0);
    });
    describe('recursive $ref in an option, see https://github.com/rjsf-team/react-jsonschema-form/issues/5337', () => {
      const schema: RJSFSchema = {
        definitions: {
          Node: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              child: { $ref: '#/definitions/Node' },
            },
          },
        },
      };
      const options: RJSFSchema[] = [
        { $ref: '#/definitions/Node' },
        { type: 'object', properties: { name: { type: 'string' }, other: { type: 'string' } } },
      ];
      beforeEach(() => {
        testValidator.setReturnValues({ isValid: [] });
      });
      it('terminates when the recursion runs out of form data', () => {
        // Neither option matches `{ child: 5 }` and both score 0, so the tie falls to the first option
        testValidator.setReturnValues({ isValid: [false] });
        expect(getClosestMatchingOption({ validator: testValidator }, schema, { child: 5 }, options)).toEqual(0);
      });
      it('scores the recursive option as deep as the form data goes', () => {
        // The recursive option scores `name` at both levels, the flat one only at the top
        expect(
          getClosestMatchingOption({ validator: testValidator }, schema, { name: 'a', child: { name: 'b' } }, options),
        ).toEqual(0);
      });
      it('terminates for a pair of mutually recursive definitions', () => {
        const mutualSchema: RJSFSchema = {
          definitions: {
            A: { type: 'object', properties: { name: { type: 'string' }, b: { $ref: '#/definitions/B' } } },
            B: { type: 'object', properties: { label: { type: 'string' }, a: { $ref: '#/definitions/A' } } },
          },
        };
        const mutualOptions: RJSFSchema[] = [{ $ref: '#/definitions/A' }, options[1]];
        // The recursive option scores `name`, the matching structure of `b` and the nested `label`, the flat one
        // only `name`
        expect(
          getClosestMatchingOption(
            { validator: testValidator },
            mutualSchema,
            { name: 'a', b: { label: 'x' } },
            mutualOptions,
          ),
        ).toEqual(0);
      });
      it('scores a property written as a recursive $ref as the definition it names, as far as the data goes', () => {
        const rootSchema: RJSFSchema = {
          definitions: { Node: { type: 'object', properties: { next: { $ref: '#/definitions/Node' } } } },
        };
        const nodeOptions: RJSFSchema[] = [
          { properties: { a: { $ref: '#/definitions/Node' } } },
          { properties: { a: { type: 'object', properties: { next: { type: 'object' }, z: { type: 'string' } } } } },
        ];
        expect(
          getClosestMatchingOption(
            { validator: testValidator },
            rootSchema,
            { a: { next: { next: {} } } },
            nodeOptions,
          ),
        ).toEqual(0);
      });
    });
    it('reads the keywords beside a $ref that an option reaches through another $ref in place of its target', () => {
      const rootSchema: RJSFSchema = {
        definitions: {
          O: { properties: { a: { type: 'string' } } },
          M: { $ref: '#/definitions/O', properties: { b: { type: 'string' } } },
        },
      };
      const options: RJSFSchema[] = [
        { type: 'object', properties: { a: { type: 'string' } } },
        { $ref: '#/definitions/M' },
      ];
      expect(getClosestMatchingOption({ validator: testValidator }, rootSchema, { b: 'y' }, options)).toEqual(1);
      expect(getClosestMatchingOption({ validator: testValidator }, rootSchema, { a: 'y' }, options)).toEqual(0);
    });
    it('scores a property written as a $ref to a oneOf by the option of it the data matches', () => {
      const rootSchema: RJSFSchema = {
        definitions: {
          Shift: {
            oneOf: [
              { type: 'object', properties: { day: { type: 'string' } }, required: ['day'] },
              { type: 'object', properties: { night: { type: 'string' } }, required: ['night'] },
            ],
          },
          Leave: { oneOf: [{ type: 'object', properties: { reason: { type: 'string' } } }] },
        },
      };
      const options: RJSFSchema[] = [
        { type: 'object', properties: { entry: { $ref: '#/definitions/Leave' } } },
        { type: 'object', properties: { entry: { $ref: '#/definitions/Shift' } } },
      ];
      expect(
        getClosestMatchingOption({ validator: testValidator }, rootSchema, { entry: { night: 'late' } }, options),
      ).toEqual(1);
      expect(
        getClosestMatchingOption({ validator: testValidator }, rootSchema, { entry: { reason: 'ill' } }, options),
      ).toEqual(0);
    });
    it('scores an option and a property written as a $ref with constraints beside it as the allOf of both', () => {
      const rootSchema: RJSFSchema = {
        definitions: {
          O: { properties: { a: { type: 'string' } } },
          Dog: { type: 'object', properties: { bark: { type: 'string' }, name: { type: 'string' } } },
        },
      };
      const options: RJSFSchema[] = [
        { type: 'object', properties: { a: { type: 'string' } } },
        { $ref: '#/definitions/O', properties: { b: { type: 'string' } } },
      ];
      expect(getClosestMatchingOption({ validator: testValidator }, rootSchema, { b: 'y' }, options)).toEqual(1);
      const pets: RJSFSchema[] = [
        { properties: { pet: { $ref: '#/definitions/Dog', required: ['bark'] } } },
        { properties: { pet: { type: 'object', properties: { meow: { type: 'string' } } } } },
      ];
      expect(
        getClosestMatchingOption(
          { validator: testValidator },
          rootSchema,
          { pet: { bark: 'woof', name: 'Rex' } },
          pets,
        ),
      ).toEqual(0);
    });
    it.each([undefined, 'https://json-schema.org/draft/2020-12/schema'])(
      'under %s, scores an option written as a $ref beside only annotations as its target',
      ($schema) => {
        const rootSchema: RJSFSchema = {
          ...($schema === undefined ? {} : { $schema }),
          $defs: {
            a: { type: 'object', properties: { x: { type: 'string' }, z: { type: 'string' } }, required: ['q'] },
            b: { type: 'object', properties: { y: { type: 'number' }, w: { type: 'string' } }, required: ['q'] },
          },
        };
        const options: RJSFSchema[] = [
          { $ref: '#/$defs/a', title: 'A' },
          { $ref: '#/$defs/b', title: 'B' },
        ];
        expect(getClosestMatchingOption({ validator: testValidator }, rootSchema, { y: 1, w: 'w' }, options)).toEqual(
          1,
        );
      },
    );
    describe('a property merged with one a resource of its own declares, holding a $ref written there', () => {
      const optionsOf = (rootSchema: RJSFSchema): RJSFSchema[] => {
        const field = rootSchema.properties?.p;
        return isSchemaObject(field) && Array.isArray(field.oneOf) ? field.oneOf.filter(isSchemaObject) : [];
      };
      const views = (rootSchema: RJSFSchema, formData: unknown) => {
        const resourceUtils = createSchemaUtils({ validator: testValidator }, rootSchema);
        return optionsOf(rootSchema).map((option) => resourceUtils.retrieveSchema(option, formData));
      };
      it.each<[string, unknown, number]>([
        ['the definition it names', { kind: { a: 'x' } }, 0],
        ['the other option', { kind: 'woof', bark: 5 }, 1],
      ])('scores the $ref in the resource for data matching %s', (_, formData, expected) => {
        const rootSchema = PET_RESOURCE_SCHEMA;
        const context = { validator: testValidator };
        expect(getClosestMatchingOption(context, rootSchema, formData, optionsOf(rootSchema))).toBe(expected);
        expect(getClosestMatchingOption(context, rootSchema, formData, views(rootSchema, formData))).toBe(expected);
      });
      it('scores an extra key of an option retrieved for the data by the schema its additionalProperties give it', () => {
        const rootSchema: RJSFSchema = { definitions: { n: { type: 'number' } } };
        const entry = (x: RJSFSchema): RJSFSchema => ({ type: 'object', properties: { x } });
        const options: RJSFSchema[] = [
          { type: 'object', additionalProperties: entry({ $ref: '#/definitions/n' }) },
          { type: 'object', additionalProperties: entry({ type: 'string' }) },
        ];
        const formData = { k: { x: 5 } };
        const resourceUtils = createSchemaUtils({ validator: testValidator }, rootSchema);
        const retrieved = options.map((option) => resourceUtils.retrieveSchema(option, formData));
        expect(getClosestMatchingOption({ validator: testValidator }, rootSchema, formData, retrieved)).toBe(0);
      });
      it('scores the $ref in the resource a level further down, for the options and for their views', () => {
        const rootSchema = PET_RESOURCE_DEEP_SCHEMA;
        const formData = { info: { kind: 5 } };
        const context = { validator: testValidator };
        expect(getClosestMatchingOption(context, rootSchema, formData, optionsOf(rootSchema))).toBe(0);
        expect(getClosestMatchingOption(context, rootSchema, formData, views(rootSchema, formData))).toBe(0);
      });
      it('scores the options of a list a merge rebuilt in the resource by the $ref each holds there', () => {
        // `k` conjoins the list `l` names with the list beside it, which makes each option of `l` anew; the root defines
        // an `s` of its own and no `t`
        const definitions: Record<string, RJSFSchema> = {
          s: { type: 'object', properties: { q: { type: 'string' } }, required: ['q'] },
          t: { type: 'object', properties: { r: { type: 'string' } }, required: ['r'] },
          l: { anyOf: [{ $ref: '#/$defs/s' }, { $ref: '#/$defs/t' }] },
          w: { type: 'object', properties: { k: { $ref: '#/$defs/l', anyOf: [{ title: 'A' }] } } },
        };
        const rootOf = (inResource: boolean): RJSFSchema => ({
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.com/root.json',
          $defs: inResource ? { s: { type: 'number' }, res: { $id: 'res.json', $defs: definitions } } : definitions,
          type: 'object',
          properties: {
            p: {
              oneOf: [
                { $ref: inResource ? 'res.json#/$defs/w' : '#/$defs/w' },
                { type: 'object', properties: { k: {} } },
              ],
            },
          },
        });
        const formData = { k: { r: 'y' } };
        const context = { validator: testValidator };
        for (const rootSchema of [rootOf(false), rootOf(true)]) {
          expect(getClosestMatchingOption(context, rootSchema, formData, optionsOf(rootSchema))).toBe(0);
        }
      });
    });
    describe("the options an object rendering its own field hands out, by the extra keys each one's own keyword takes (#5886)", () => {
      const rootSchema: RJSFSchema = {
        type: 'object',
        properties: { k: { type: 'string' } },
        oneOf: [
          { type: 'object', properties: { a: { type: 'number' } } },
          { type: 'object', properties: { b: { type: 'number' } }, additionalProperties: true },
        ],
      };
      const handedOut = (context: SchemaContext, formData: unknown) => {
        const utils = createSchemaUtils(context, rootSchema);
        const { oneOf = [] } = utils.retrieveSchema(rootSchema, formData);
        return oneOf.filter(isSchemaObject).map((option) => utils.retrieveSchema(option, formData));
      };
      it.each(['forbid', 'allow'] as const)(
        "picks the option whose additionalProperties takes the data's extra key, extra keys %s",
        (additionalPropertiesWhenAbsent) => {
          const context = { validator: testValidator, additionalPropertiesWhenAbsent };
          const formData = { t: 2 };
          const options = handedOut(context, formData);
          expect(calculateIndexScore(context, rootSchema, options[1], formData)).toBe(1);
          expect(getClosestMatchingOption(context, rootSchema, formData, options)).toBe(1);
        },
      );
      it.each<[string, RJSFSchema]>([
        ['through an allOf', { allOf: [{ properties: { b: { type: 'number' } } }] }],
        ['beside an if', { properties: { b: { type: 'number' } }, if: { required: ['z'] }, then: {} }],
        ['beside dependencies', { properties: { b: { type: 'number' } }, dependencies: { z: {} } }],
      ])("scores the data's extra key an option declaring its properties %s takes", (_, declaring) => {
        const options: RJSFSchema[] = [
          { type: 'object', properties: { a: { type: 'number' } } },
          { type: 'object', ...declaring, additionalProperties: true },
        ];
        expect(getClosestMatchingOption({ validator: testValidator }, rootSchema, { t: 2 }, options)).toBe(1);
      });
      it("stubs a key only a dependencies schema that doesn't apply to the data declares, as the option retrieved for it holds", () => {
        const options: RJSFSchema[] = [
          { type: 'object', properties: { a: { type: 'number' } } },
          {
            type: 'object',
            properties: { a: { type: 'number' } },
            additionalProperties: true,
            dependencies: { z: { properties: { t: { type: 'string' } } } },
          },
        ];
        expect(getClosestMatchingOption({ validator: testValidator }, rootSchema, { a: 1, t: 2 }, options)).toBe(1);
      });
      it('scores no stub for a key a then declares, which retrieval declares through it', () => {
        // A stub would score `t` by the type its value guesses, where the `then` gives it its own
        const option: RJSFSchema = {
          type: 'object',
          properties: { k: { type: 'string' } },
          additionalProperties: true,
          if: { required: ['t'] },
          then: { properties: { t: { type: 'number' } } },
        };
        expect(calculateIndexScore({ validator: testValidator }, rootSchema, option, { t: 'x' })).toBe(0);
      });
      it.each<[string, RJSFSchema]>([
        ['an allOf entry', { allOf: [{ additionalProperties: true }] }],
        ['a then', { if: { required: ['t'] }, then: { additionalProperties: true } }],
      ])("scores the data's extra key the additionalProperties of %s takes, as retrieval merges it", (_, taking) => {
        const options: RJSFSchema[] = [
          { type: 'object', properties: { b: { type: 'number', default: 5 } } },
          { type: 'object', properties: { a: { type: 'string' } }, ...taking },
        ];
        expect(getClosestMatchingOption({ validator: testValidator }, rootSchema, { t: 'x' }, options)).toBe(1);
      });
      it("matches the options retrieved for the data by the keys each declares, not those stubbed for the data's extra keys", () => {
        const options: RJSFSchema[] = [
          { type: 'object', properties: { a: { type: 'number' } }, additionalProperties: true },
          { type: 'object', properties: { b: { type: 'number' } } },
        ];
        const formData = { b: 1, z: 2 };
        const context = { validator: testValidator };
        const utils = createSchemaUtils(context, rootSchema);
        const retrieved = options.map((option) => utils.retrieveSchema(option, formData));
        expect(getClosestMatchingOption(context, rootSchema, formData, options)).toBe(1);
        expect(getClosestMatchingOption(context, rootSchema, formData, retrieved)).toBe(1);
      });
      describe("options a direct call lists as the root declares them, read as the field offering them reads them under 'allow'", () => {
        const options: RJSFSchema[] = [
          { type: 'object', properties: { a: { type: 'number' } } },
          { type: 'object', properties: { b: { type: 'number' } }, additionalProperties: true },
        ];
        const context = { validator: testValidator, additionalPropertiesWhenAbsent: 'allow' as const };
        // Both take `t` beside a field with no type of its own, and only the second beside an object's own field
        it.each<[string, RJSFSchema, number]>([
          ['with no type', {}, 0],
          ['typed object', { type: 'object' }, 1],
        ])('a field %s', (_, field, expected) => {
          const declaring: RJSFSchema = { type: 'object', properties: { p: { ...field, oneOf: options } } };
          expect(getClosestMatchingOption(context, declaring, { t: 2 }, options)).toBe(expected);
        });
        it.each<[string, (declaring: RJSFSchema) => RJSFSchema[]]>([
          ['part of a list', () => options.slice(0, 1).concat({ ...options[1] })],
          [
            'options the root declares elsewhere',
            (declaring) => [getByPath(declaring, ['definitions', 'a']), options[1]],
          ],
          // A boolean option, which the options' type leaves out, declares nothing to read the field from
          ['a list opening with a boolean option', () => [false, options[1]] as unknown as RJSFSchema[]],
        ])('reads %s as forbidding extra keys an absent keyword takes', (_, listed) => {
          const declaring: RJSFSchema = {
            type: 'object',
            definitions: { a: { type: 'object', properties: { a: { type: 'number' } } } },
            properties: { p: { oneOf: options } },
          };
          expect(getClosestMatchingOption(context, declaring, { t: 2 }, listed(declaring))).toBe(1);
        });
        it('reads a copy of the list, which the root declares nowhere, as forbidding extra keys an absent keyword takes', () => {
          const declaring: RJSFSchema = { type: 'object', properties: { p: { oneOf: options } } };
          const copies = options.map((option) => ({ ...option }));
          expect(getClosestMatchingOption(context, declaring, { t: 2 }, copies)).toBe(1);
        });
        // The schema holding the list there merges into the field, which the options sit beside
        const holders: [string, (list: RJSFSchema[]) => RJSFSchema][] = [
          ['an allOf entry', (list) => ({ allOf: [{ oneOf: list }] })],
          ['an allOf entry of an allOf entry', (list) => ({ allOf: [{ allOf: [{ oneOf: list }] }] })],
          ['a then', (list) => ({ if: true, then: { oneOf: list } })],
          ['an else', (list) => ({ if: false, else: { oneOf: list } })],
          ['a dependencies schema', (list) => ({ dependencies: { t: { oneOf: list } } })],
        ];
        // Retrieval merges the option a `dependencies` schema's list matches into the field, which types it as that
        // option's object
        it.each(
          holders.flatMap(([holder, holding]) => [
            { holder, holding, field: 'a typed object', type: { type: 'object' as const }, expected: 1 },
            {
              holder,
              holding,
              field: 'a field with no type',
              type: {},
              expected: holder === 'a dependencies schema' ? 1 : 0,
            },
          ]),
        )('reads a list $holder holds as $field it merges into reads it', ({ holding, type, expected }) => {
          const declaring: RJSFSchema = { type: 'object', properties: { p: { ...type, ...holding(options) } } };
          expect(getClosestMatchingOption(context, declaring, { t: 2 }, options)).toBe(expected);
        });
        // The field is an object rendering its own field once its `then` or `dependencies` schema applies to the data
        it.each<[string, (list: RJSFSchema[]) => RJSFSchema]>([
          ['a then beside the list', (list) => ({ if: true, then: { type: 'object' }, oneOf: list })],
          ['a then holding the list', (list) => ({ if: true, then: { type: 'object', oneOf: list } })],
          ['a dependencies schema', (list) => ({ dependencies: { t: { type: 'object' } }, oneOf: list })],
        ])('reads a list beside a field typed through %s as that field reads it', (_, typed) => {
          const declaring: RJSFSchema = { type: 'object', properties: { p: typed(options) } };
          expect(getClosestMatchingOption(context, declaring, { t: 2 }, options)).toBe(1);
        });
        it('reads a list beside a $ref as the field it resolves to reads it', () => {
          const declaring: RJSFSchema = {
            type: 'object',
            definitions: { base: { type: 'object', properties: { k: { type: 'string' } } } },
            properties: { p: { $ref: '#/definitions/base', oneOf: options } },
          };
          expect(getClosestMatchingOption(context, declaring, { t: 2 }, options)).toBe(1);
        });
        // The root's own `base` is a string, which the `$ref` resolved against the root would read
        it('reads a list beside a $ref in a nested resource as the field it resolves to in that resource reads it', () => {
          const declaring: RJSFSchema = {
            $schema: 'https://json-schema.org/draft/2020-12/schema',
            type: 'object',
            $defs: {
              base: { type: 'string' },
              r: {
                $id: 'https://example.com/r',
                $defs: { base: { type: 'object' } },
                properties: { p: { $ref: '#/$defs/base', oneOf: options } },
              },
            },
            properties: { q: { $ref: 'https://example.com/r' } },
          };
          expect(getClosestMatchingOption(context, declaring, { t: 2 }, options)).toBe(1);
        });
        // A definition is read with its own type, which a `$ref` naming it with no type of its own keeps
        it('reads a list a definition offers, named through a $ref, as the field naming it reads it', () => {
          const declaring: RJSFSchema = {
            type: 'object',
            definitions: { list: { oneOf: options } },
            properties: { p: { $ref: '#/definitions/list' } },
          };
          expect(getClosestMatchingOption(context, declaring, { t: 2 }, options)).toBe(0);
        });
        // A property of a definition has the one type it declares, however many fields name the definition
        it('reads a list a property of a definition offers as that property reads it', () => {
          const declaring: RJSFSchema = {
            $ref: '#/definitions/root',
            definitions: { root: { type: 'object', properties: { p: { oneOf: options } } } },
          };
          expect(getClosestMatchingOption(context, declaring, { t: 2 }, options)).toBe(0);
        });
        // The graph names one place for an option object, which can be another list holding the same object
        it.each<[string, (shared: RJSFSchema[]) => RJSFSchema['properties']]>([
          [
            "an allOf entry's list beside it",
            (list) => ({ p: { allOf: [{ oneOf: [list[0], { properties: { d: {} } }] }], oneOf: list } }),
          ],
          ["another field's list declared first", (list) => ({ q: { oneOf: [list[0]] }, p: { oneOf: list } })],
        ])('reads a list whose first option %s holds too as the field offering it reads it', (_, properties) => {
          const declaring: RJSFSchema = { type: 'object', properties: properties(options) };
          expect(getClosestMatchingOption(context, declaring, { t: 2 }, options)).toBe(0);
        });
        // Only a `then` or `else` keyword merges into the schema holding it, not a property of that name
        it.each(['then', 'else'])('reads a list a property named %s offers as that field reads it', (name) => {
          const declaring: RJSFSchema = { type: 'object', properties: { [name]: { oneOf: options } } };
          expect(getClosestMatchingOption(context, declaring, { t: 2 }, options)).toBe(0);
        });
        describe('named as offeredBy, the field offering them (#5958)', () => {
          const copies = () => options.map((option) => ({ ...option }));
          const fields: [string, RJSFSchema, number][] = [
            ['with no type', {}, 0],
            ['typed object', { type: 'object' }, 1],
          ];
          it.each(fields)('reads a copy of the list as a field %s offering it reads it', (_, type, expected) => {
            const offeredBy: RJSFSchema = { ...type, oneOf: options };
            const declaring: RJSFSchema = { type: 'object', properties: { p: offeredBy } };
            expect(getClosestMatchingOption(context, declaring, { t: 2 }, copies(), -1, undefined, offeredBy)).toBe(
              expected,
            );
          });
          it.each(fields)('reads options built in code as a field %s offering them reads them', (_, type, expected) => {
            const rootSchema: RJSFSchema = { type: 'object' };
            const offeredBy: RJSFSchema = { ...type, oneOf: copies() };
            expect(getClosestMatchingOption(context, rootSchema, { t: 2 }, copies(), -1, undefined, offeredBy)).toBe(
              expected,
            );
          });
          // Several fields can name one definition, each with a type of its own beside the `$ref`
          it.each<[string, string, number]>([
            ['typed', 'typed', 1],
            ['untyped', 'untyped', 0],
          ])('reads a list a definition offers as the %s $ref site naming it reads it', (_, site, expected) => {
            const declaring: RJSFSchema = {
              type: 'object',
              definitions: { list: { oneOf: options } },
              properties: {
                typed: { type: 'object', properties: { z: { type: 'string' } }, $ref: '#/definitions/list' },
                untyped: { $ref: '#/definitions/list' },
              },
            };
            const offeredBy = getByPath<RJSFSchema>(declaring, ['properties', site]);
            expect(getClosestMatchingOption(context, declaring, { t: 2 }, options, -1, undefined, offeredBy)).toBe(
              expected,
            );
          });
          it.each<[string, (list: RJSFSchema) => RJSFSchema]>([
            ['an allOf entry', (list) => ({ type: 'object', allOf: [list] })],
            ['a then', (list) => ({ type: 'object', if: { properties: {} }, then: list })],
          ])('reads %s holding the list as the field it merges into reads it', (_, field) => {
            const offeredBy: RJSFSchema = { oneOf: options };
            const declaring: RJSFSchema = { type: 'object', properties: { p: field(offeredBy) } };
            expect(getClosestMatchingOption(context, declaring, { t: 2 }, options)).toBe(1);
            expect(getClosestMatchingOption(context, declaring, { t: 2 }, options, -1, undefined, offeredBy)).toBe(1);
          });
          // One object in two places could stand for either field, so it is read as it stands whichever comes first
          it.each<[string, (shared: RJSFSchema) => Record<string, RJSFSchema>]>([
            ['merged into another field first', (shared) => ({ q: { type: 'object', allOf: [shared] }, p: shared })],
            ['a field itself first', (shared) => ({ p: shared, q: { type: 'object', allOf: [shared] } })],
          ])('reads an offeredBy the root holds in two places as it stands, %s', (_, fields) => {
            const shared: RJSFSchema = { oneOf: options };
            const declaring: RJSFSchema = { type: 'object', properties: fields(shared) };
            expect(getClosestMatchingOption(context, declaring, { t: 2 }, copies(), -1, undefined, shared)).toBe(0);
          });
          it('reads an offeredBy the root holds under two bases as it stands', () => {
            const shared: RJSFSchema = { oneOf: options };
            const declaring: RJSFSchema = {
              type: 'object',
              $defs: { other: { $id: 'https://example.com/other', type: 'object', allOf: [shared] } },
              properties: { p: shared },
            };
            expect(getClosestMatchingOption(context, declaring, { t: 2 }, copies(), -1, undefined, shared)).toBe(0);
          });
          // The entry has one node, merged into a holder two fields hold, so it could stand for either of them too
          it('reads an offeredBy merging into a schema the root holds in two places as it stands', () => {
            const entry: RJSFSchema = { oneOf: options };
            const holder: RJSFSchema = { allOf: [entry] };
            const declaring: RJSFSchema = {
              type: 'object',
              properties: { q: { type: 'object', allOf: [holder] }, r: holder },
            };
            expect(getClosestMatchingOption(context, declaring, { t: 2 }, copies(), -1, undefined, entry)).toBe(0);
          });
          // What a custom field holds: its schema retrieved for the data, and the options that schema hands out, which
          // are read as retrieval left them, so only copies of them take what `offeredBy` says
          it('reads the options a retrieved field hands out as retrieval left them, whatever offeredBy says', () => {
            const declaring: RJSFSchema = { type: 'object', properties: { p: { oneOf: options } } };
            const field = createSchemaUtils(context, declaring).retrieveSchema({ oneOf: options }, { t: 2 });
            const listed = field.oneOf as RJSFSchema[];
            const listedCopies = listed.map((option) => ({ ...option }));
            expect(getClosestMatchingOption(context, declaring, { t: 2 }, listed, -1, undefined, field)).toBe(1);
            expect(getClosestMatchingOption(context, declaring, { t: 2 }, listedCopies, -1, undefined, field)).toBe(0);
          });
          it('reads a copy of the list as the field it names reads it through SchemaUtils', () => {
            const offeredBy: RJSFSchema = { oneOf: options };
            const declaring: RJSFSchema = { type: 'object', properties: { p: offeredBy } };
            const utils = createSchemaUtils(context, declaring);
            expect(utils.getClosestMatchingOption({ t: 2 }, copies(), -1, undefined, offeredBy)).toBe(0);
          });
        });
      });
      it('scores an option as it stands where the data holds no extra key', () => {
        const context = { validator: testValidator };
        const formData = { b: 1 };
        expect(calculateIndexScore(context, rootSchema, handedOut(context, formData)[1], formData)).toBe(1);
      });
      it('scores an option holding an allOf as it stands, as written', () => {
        const context = { validator: testValidator };
        const withAllOf: RJSFSchema = {
          type: 'object',
          oneOf: [
            { properties: { t: { type: 'string', default: 'y' } } },
            { allOf: [{ properties: { t: { type: 'string', default: 'y' } } }], additionalProperties: true },
          ],
        };
        const formData = { t: 'x' };
        const { oneOf = [] } = createSchemaUtils(context, withAllOf).retrieveSchema(withAllOf, formData);
        expect(getClosestMatchingOption(context, withAllOf, formData, oneOf.filter(isSchemaObject))).toBe(0);
      });
    });
  });
}
