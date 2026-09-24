import type { DefaultFormStateBehavior, RJSFSchema, SchemaUtilsType, ValidatorType } from '../src/index.ts';
import {
  createSchemaUtils,
  ID_KEY,
  JSON_SCHEMA_DRAFT_2020_12,
  PROPERTIES_KEY,
  REF_KEY,
  SCHEMA_KEY,
} from '../src/index.ts';
import getTestValidator from './testUtils/getTestValidator.ts';

describe('createSchemaUtils()', () => {
  const testValidator: ValidatorType = getTestValidator({});
  const rootSchema: RJSFSchema = { type: 'object' };
  const defaultFormStateBehavior: DefaultFormStateBehavior = {
    arrayMinItems: { populate: 'requiredOnly' },
  };
  const schemaUtils: SchemaUtilsType = createSchemaUtils(
    { validator: testValidator, defaultFormStateBehavior },
    rootSchema,
  );

  it('getRootSchema()', () => {
    expect(schemaUtils.getRootSchema()).toEqual(rootSchema);
  });

  it('getValidator()', () => {
    expect(schemaUtils.getValidator()).toBe(testValidator);
  });

  it('getSchemaContext()', () => {
    expect(schemaUtils.getSchemaContext()).toEqual({ validator: testValidator, defaultFormStateBehavior });
  });

  it('getUiRequiredErrorSchema()', () => {
    const requiredSchema: RJSFSchema = { type: 'object', properties: { nick: { type: 'string' } } };
    const requiredUtils = createSchemaUtils({ validator: testValidator }, requiredSchema);
    const errorSchema = requiredUtils.getUiRequiredErrorSchema({ nick: { 'ui:required': true } }, {});
    expect(errorSchema).toEqual({ nick: { __errors: ["must have required property 'nick'"] } });
  });

  describe('2020-12 schema', () => {
    const rootSchema2020: RJSFSchema = {
      [SCHEMA_KEY]: JSON_SCHEMA_DRAFT_2020_12,
      [ID_KEY]: 'https://example.com/2020-12.json',
      type: 'object',
      $defs: {
        example: {
          type: 'integer',
        },
      },
      [PROPERTIES_KEY]: {
        ref: {
          [REF_KEY]: '#/$defs/example',
        },
      },
    };
    const schemaUtils2020: SchemaUtilsType = createSchemaUtils(
      { validator: testValidator, defaultFormStateBehavior },
      rootSchema2020,
    );

    it('getRootSchema()', () => {
      expect(schemaUtils2020.getRootSchema()).toEqual({
        ...rootSchema2020,
        [PROPERTIES_KEY]: {
          ref: {
            [REF_KEY]: 'https://example.com/2020-12.json#/$defs/example',
          },
        },
      });
    });

    it('getRootSchema() falls back to `#` as the base URI when the schema has no $id', () => {
      const noIdSchema: RJSFSchema = {
        [SCHEMA_KEY]: JSON_SCHEMA_DRAFT_2020_12,
        type: 'object',
        $defs: { example: { type: 'integer' } },
        [PROPERTIES_KEY]: { ref: { [REF_KEY]: '#/$defs/example' } },
      };
      const schemaUtilsNoId: SchemaUtilsType = createSchemaUtils(
        { validator: testValidator, defaultFormStateBehavior },
        noIdSchema,
      );
      expect(schemaUtilsNoId.getRootSchema()).toEqual(noIdSchema);
    });
  });

  describe('doesSchemaUtilsDiffer()', () => {
    describe('constructed without defaultFormStateBehavior', () => {
      const schemaUtils: SchemaUtilsType = createSchemaUtils({ validator: testValidator }, rootSchema);

      it('returns false when not passing defaultFormStateBehavior', () => {
        expect(schemaUtils.doesSchemaUtilsDiffer({ validator: testValidator }, rootSchema)).toBe(false);
      });
      it('returns true when passing different defaultFormStateBehavior', () => {
        expect(
          schemaUtils.doesSchemaUtilsDiffer(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'requiredOnly' } } },
            rootSchema,
          ),
        ).toBe(true);
      });
    });

    describe('constructed with defaultFormStateBehavior', () => {
      it('returns false when passing same validator, rootSchema, and defaultFormStateBehavior', () => {
        expect(
          schemaUtils.doesSchemaUtilsDiffer({ validator: testValidator, defaultFormStateBehavior }, rootSchema),
        ).toBe(false);
      });
      it('returns false when passing falsy validator', () => {
        expect(
          schemaUtils.doesSchemaUtilsDiffer(
            { validator: null as unknown as ValidatorType, defaultFormStateBehavior },
            {},
          ),
        ).toBe(false);
      });
      it('returns false when passing falsy rootSchema', () => {
        expect(
          schemaUtils.doesSchemaUtilsDiffer(
            { validator: testValidator, defaultFormStateBehavior },
            null as unknown as RJSFSchema,
          ),
        ).toBe(false);
      });
      it('returns true when passing different validator', () => {
        expect(
          schemaUtils.doesSchemaUtilsDiffer({ validator: getTestValidator({}), defaultFormStateBehavior }, {}),
        ).toBe(true);
      });
      it('returns true when passing different rootSchema', () => {
        expect(schemaUtils.doesSchemaUtilsDiffer({ validator: testValidator, defaultFormStateBehavior }, {})).toBe(
          true,
        );
      });
      it('returns true when passing different defaultFormStateBehavior', () => {
        expect(
          schemaUtils.doesSchemaUtilsDiffer(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'all' } } },
            rootSchema,
          ),
        ).toBe(true);
      });
    });

    describe('constructed from a context that is later mutated', () => {
      it('returns true, having snapshotted the context it was constructed with', () => {
        const context = { validator: testValidator, defaultFormStateBehavior };
        const mutatedUtils = createSchemaUtils(context, rootSchema);

        context.defaultFormStateBehavior = { arrayMinItems: { populate: 'all' } };

        expect(mutatedUtils.doesSchemaUtilsDiffer(context, rootSchema)).toBe(true);
      });
    });
  });
  describe('retrieveSchema() identity retention', () => {
    const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' } } };

    it('returns the same instance for a repeated call with the same inputs', () => {
      const utils = createSchemaUtils({ validator: testValidator }, rootSchema);
      const first = utils.retrieveSchema(schema, {});
      expect(utils.retrieveSchema(schema, {})).toBe(first);
    });

    it('retains the previous instance when a recomputation is deeply equal', () => {
      const utils = createSchemaUtils({ validator: testValidator }, rootSchema);
      const first = utils.retrieveSchema(schema, {});
      expect(utils.retrieveSchema(schema, { foo: 'bar' })).toBe(first);
    });

    it('re-resolves against form data that was mutated in place', () => {
      const conditional: RJSFSchema = {
        type: 'object',
        properties: { k: { type: 'string' } },
        dependencies: { k: { properties: { extra: { type: 'string' } } } },
      };
      const utils = createSchemaUtils({ validator: testValidator }, rootSchema);
      const data: { k?: string } = {};
      expect(utils.retrieveSchema(conditional, data).properties).not.toHaveProperty('extra');
      data.k = 'a';
      expect(utils.retrieveSchema(conditional, data).properties).toHaveProperty('extra');
    });

    it('keeps a stable result per resolveAnyOfOrOneOfRefs value when callers alternate', () => {
      const withRefs: RJSFSchema = {
        definitions: { s: { type: 'string' } },
        oneOf: [{ $ref: '#/definitions/s' }, { type: 'number' }],
      };
      const utils = createSchemaUtils({ validator: testValidator }, withRefs);
      const plain = utils.retrieveSchema(withRefs, {});
      const resolved = utils.retrieveSchema(withRefs, {}, true);
      expect(resolved).not.toEqual(plain);
      expect(utils.retrieveSchema(withRefs, {})).toBe(plain);
      expect(utils.retrieveSchema(withRefs, {}, true)).toBe(resolved);
    });

    it('resolves a non-object schema, which cannot be a cache key, afresh each time', () => {
      const utils = createSchemaUtils({ validator: testValidator }, rootSchema);
      const first = utils.retrieveSchema(true as unknown as RJSFSchema, {});
      expect(first).toEqual({});
      expect(utils.retrieveSchema(true as unknown as RJSFSchema, {})).not.toBe(first);
    });
  });

  // NOTE: the rest of the functions are tested in the tests defined in the `schema` directory
});
