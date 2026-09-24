import type { DefaultFormStateBehavior, RJSFSchema, SchemaContext, SchemaUtilsType } from '../src/index.ts';
import {
  createSchemaUtils,
  findFieldInSchema,
  findSelectedOptionInXxxOf,
  getDefaultFormState,
  getDisplayLabel,
  getFromSchema,
  getUiRequiredErrorSchema,
  isFilesArray,
  isMultiSelect,
  isSelect,
  omitExtraData,
  retrieveSchema,
  sanitizeDataForNewSchema,
} from '../src/index.ts';
import { calculateIndexScore } from '../src/schema/getClosestMatchingOption.ts';
import shallowAllOfMerge from '../src/schema/shallowAllOfMerge.ts';
import getTestValidator from './testUtils/getTestValidator.ts';

/** Each case reaches an `allOf` merge somewhere down its call chain, so a `customMergeAllOf` that is dropped anywhere
 * along the way leaves the spy uncalled.
 */
interface PropagationCase {
  name: string;
  rootSchema: RJSFSchema;
  callFunction: (context: SchemaContext, rootSchema: RJSFSchema) => unknown;
  /** Omitted for an internal function that has no `SchemaUtils` counterpart */
  callSchemaUtils?: (schemaUtils: SchemaUtilsType) => unknown;
}

const stringAllOf: RJSFSchema = { allOf: [{ type: 'string' }] };
const enumAllOf: RJSFSchema = { allOf: [{ type: 'string', enum: ['a', 'b'] }] };
const objectAllOfDefinitions: RJSFSchema = {
  definitions: { A: { allOf: [{ type: 'object', properties: { b: { type: 'string' } } }] } },
};
const oldObjectSchema: RJSFSchema = { type: 'object', properties: { a: { type: 'string' } } };

const CASES: PropagationCase[] = [
  {
    name: 'retrieveSchema',
    rootSchema: stringAllOf,
    callFunction: (context, rootSchema) => retrieveSchema(context, rootSchema, rootSchema),
    callSchemaUtils: (schemaUtils) => schemaUtils.retrieveSchema(schemaUtils.getRootSchema()),
  },
  {
    name: 'retrieveSchema through a $ref oneOf inside dependencies',
    rootSchema: {
      type: 'object',
      properties: { a: { type: 'string' } },
      dependencies: { a: { oneOf: [{ $ref: '#/definitions/WithA' }] } },
      definitions: {
        WithA: { allOf: [{ properties: { a: { enum: ['x'] }, b: { type: 'string' } } }] },
      },
    },
    callFunction: (context, rootSchema) => retrieveSchema(context, rootSchema, rootSchema, { a: 'x' }),
    callSchemaUtils: (schemaUtils) => schemaUtils.retrieveSchema(schemaUtils.getRootSchema(), { a: 'x' }),
  },
  {
    name: 'isSelect',
    rootSchema: enumAllOf,
    callFunction: (context, rootSchema) => isSelect(context, rootSchema, rootSchema),
    callSchemaUtils: (schemaUtils) => schemaUtils.isSelect(schemaUtils.getRootSchema()),
  },
  {
    name: 'isMultiSelect',
    rootSchema: { type: 'array', uniqueItems: true, items: enumAllOf },
    callFunction: (context, rootSchema) => isMultiSelect(context, rootSchema, rootSchema),
    callSchemaUtils: (schemaUtils) => schemaUtils.isMultiSelect(schemaUtils.getRootSchema()),
  },
  {
    name: 'isFilesArray',
    rootSchema: { type: 'array', items: { allOf: [{ type: 'string', format: 'data-url' }] } },
    callFunction: (context, rootSchema) => isFilesArray(context, rootSchema, undefined, rootSchema),
    callSchemaUtils: (schemaUtils) => schemaUtils.isFilesArray(schemaUtils.getRootSchema()),
  },
  {
    name: 'getDisplayLabel',
    rootSchema: { type: 'array', uniqueItems: true, items: enumAllOf },
    callFunction: (context, rootSchema) => getDisplayLabel(context, rootSchema, undefined, rootSchema),
    callSchemaUtils: (schemaUtils) => schemaUtils.getDisplayLabel(schemaUtils.getRootSchema()),
  },
  {
    name: 'findSelectedOptionInXxxOf',
    rootSchema: { oneOf: [{ allOf: [{ properties: { kind: { const: 'a' } } }] }] },
    callFunction: (context, rootSchema) =>
      findSelectedOptionInXxxOf(context, rootSchema, rootSchema, 'kind', 'oneOf', { kind: 'a' }),
    callSchemaUtils: (schemaUtils) =>
      schemaUtils.findSelectedOptionInXxxOf(schemaUtils.getRootSchema(), 'kind', 'oneOf', { kind: 'a' }),
  },
  {
    name: 'getFromSchema',
    rootSchema: { ...objectAllOfDefinitions, properties: { a: { $ref: '#/definitions/A' } } },
    callFunction: (context, rootSchema) =>
      getFromSchema(context, rootSchema, rootSchema, 'properties.a', {} as RJSFSchema),
    callSchemaUtils: (schemaUtils) =>
      schemaUtils.getFromSchema(schemaUtils.getRootSchema(), 'properties.a', {} as RJSFSchema),
  },
  {
    name: 'findFieldInSchema',
    rootSchema: { ...objectAllOfDefinitions, properties: { a: { $ref: '#/definitions/A' } } },
    callFunction: (context, rootSchema) => findFieldInSchema(context, rootSchema, rootSchema, 'a.b'),
    callSchemaUtils: (schemaUtils) => schemaUtils.findFieldInSchema(schemaUtils.getRootSchema(), 'a.b'),
  },
  {
    // `getClosestMatchingOption()` resolves the `$ref`s of every option before scoring it, so it is the scoring of an
    // option that still holds a `$ref` that reaches the merge
    name: 'calculateIndexScore',
    rootSchema: objectAllOfDefinitions,
    callFunction: (context, rootSchema) =>
      calculateIndexScore(context, rootSchema, { properties: { a: { $ref: '#/definitions/A' } } }, { a: { b: 'x' } }),
  },
  {
    name: 'omitExtraData',
    rootSchema: { allOf: [oldObjectSchema] },
    callFunction: (context, rootSchema) => omitExtraData(context, rootSchema, rootSchema, { a: 'x', b: 'y' }),
    callSchemaUtils: (schemaUtils) => schemaUtils.omitExtraData(schemaUtils.getRootSchema(), { a: 'x', b: 'y' }),
  },
  {
    name: 'sanitizeDataForNewSchema',
    rootSchema: { type: 'object', properties: { a: stringAllOf } },
    callFunction: (context, rootSchema) =>
      sanitizeDataForNewSchema(context, rootSchema, rootSchema, oldObjectSchema, { a: 'x' }),
    callSchemaUtils: (schemaUtils) =>
      schemaUtils.sanitizeDataForNewSchema(schemaUtils.getRootSchema(), oldObjectSchema, { a: 'x' }),
  },
  {
    name: 'getUiRequiredErrorSchema',
    rootSchema: { allOf: [oldObjectSchema] },
    callFunction: (context, rootSchema) =>
      getUiRequiredErrorSchema(context, rootSchema, { a: { 'ui:required': true } }, {}),
    callSchemaUtils: (schemaUtils) => schemaUtils.getUiRequiredErrorSchema({ a: { 'ui:required': true } }, {}),
  },
  {
    name: 'getDefaultFormState',
    rootSchema: { allOf: [{ type: 'object', properties: { a: { type: 'string', default: 'x' } } }] },
    callFunction: (context, rootSchema) => getDefaultFormState(context, { schema: rootSchema, rootSchema }),
    callSchemaUtils: (schemaUtils) => schemaUtils.getDefaultFormState(schemaUtils.getRootSchema()),
  },
];

describe('SchemaContext propagation', () => {
  const validator = getTestValidator({});

  describe('customMergeAllOf', () => {
    function makeContext() {
      const customMergeAllOf = vi.fn((schema: RJSFSchema) => shallowAllOfMerge(schema) as RJSFSchema);
      const context: SchemaContext = { validator, customMergeAllOf };
      return { context, customMergeAllOf };
    }

    it.each(CASES)('reaches customMergeAllOf when $name is called directly', ({ rootSchema, callFunction }) => {
      const { context, customMergeAllOf } = makeContext();
      callFunction(context, rootSchema);
      expect(customMergeAllOf).toHaveBeenCalled();
    });
    it.each(CASES.filter(({ callSchemaUtils }) => callSchemaUtils))(
      'reaches customMergeAllOf when $name is called through SchemaUtils',
      ({ rootSchema, callSchemaUtils }) => {
        const { context, customMergeAllOf } = makeContext();
        callSchemaUtils!(createSchemaUtils(context, rootSchema));
        expect(customMergeAllOf).toHaveBeenCalled();
      },
    );
  });

  describe('computeSkipPopulate', () => {
    const rootSchema: RJSFSchema = { type: 'array', minItems: 1, items: { type: 'string' } };

    it('receives the SchemaContext, the array schema and the root schema when called directly', () => {
      const computeSkipPopulate = vi.fn(() => false);
      const context: SchemaContext = {
        validator,
        defaultFormStateBehavior: { arrayMinItems: { computeSkipPopulate } },
      };
      getDefaultFormState(context, { schema: rootSchema, rootSchema });
      expect(computeSkipPopulate).toHaveBeenCalledWith(context, rootSchema, rootSchema);
    });
    it('receives the SchemaContext, the array schema and the root schema when called through SchemaUtils', () => {
      const computeSkipPopulate = vi.fn(() => false);
      const schemaUtils = createSchemaUtils(
        { validator, defaultFormStateBehavior: { arrayMinItems: { computeSkipPopulate } } },
        rootSchema,
      );
      schemaUtils.getDefaultFormState(rootSchema);
      expect(computeSkipPopulate).toHaveBeenCalledWith(schemaUtils.getSchemaContext(), rootSchema, rootSchema);
    });
  });

  describe('defaultFormStateBehavior', () => {
    const rootSchema: RJSFSchema = {
      type: 'object',
      properties: { outer: { type: 'object', properties: { inner: { type: 'string', const: 'fixed' } } } },
    };
    const defaultFormStateBehavior: DefaultFormStateBehavior = { constAsDefaults: 'never' };

    it('uses the const as a nested default when no behavior overrides it', () => {
      expect(getDefaultFormState({ validator }, { schema: rootSchema, rootSchema })).toEqual({
        outer: { inner: 'fixed' },
      });
    });
    it('reaches the nested defaults when called directly', () => {
      expect(getDefaultFormState({ validator, defaultFormStateBehavior }, { schema: rootSchema, rootSchema })).toEqual(
        {},
      );
    });
    it('reaches the nested defaults when called through SchemaUtils', () => {
      const schemaUtils = createSchemaUtils({ validator, defaultFormStateBehavior }, rootSchema);
      expect(schemaUtils.getDefaultFormState(rootSchema)).toEqual({});
    });
  });
});
