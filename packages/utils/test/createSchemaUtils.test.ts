import type { MockInstance } from 'vitest';

import type {
  DefaultFormStateBehavior,
  RJSFSchema,
  SchemaContext,
  SchemaUtilsType,
  ValidatorType,
} from '../src/index.ts';
import {
  createSchemaUtils,
  ID_KEY,
  JSON_SCHEMA_DRAFT_2020_12,
  noop,
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

  describe('constructed with a validator where a SchemaContext belongs', () => {
    // Spreading a validator leaves `validator` undefined, so the first schema function would fail with a `TypeError`
    // from inside `retrieveSchema()` naming nothing. A v6 caller gets told what changed instead
    let consoleWarnSpy: MockInstance;
    beforeAll(() => {
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);
    });
    afterAll(() => {
      consoleWarnSpy.mockRestore();
    });

    it('warns naming the SchemaContext', () => {
      createSchemaUtils(testValidator as unknown as SchemaContext, rootSchema);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/createSchemaUtils\(\) takes a SchemaContext rather than a validator/),
      );
    });
    it('does not warn for a real context', () => {
      consoleWarnSpy.mockClear();
      createSchemaUtils({ validator: testValidator }, rootSchema);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
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
      it('returns false when passing a falsy context, rather than throwing from a destructure', () => {
        expect(schemaUtils.doesSchemaUtilsDiffer(undefined as unknown as SchemaContext, rootSchema)).toBe(false);
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

    describe('constructed from a draft 2020-12 root schema with an $id', () => {
      // The constructor stores the root with every relative `$ref` rewritten against the `$id`, so comparing that
      // rewritten copy against the schema a caller passes back would never match and `Form` would rebuild its
      // `SchemaUtils` on every render, discarding the `retrieveSchema()` caches and re-validating a `liveValidate` form
      const schema2020: RJSFSchema = {
        $schema: JSON_SCHEMA_DRAFT_2020_12,
        $id: 'https://example.com/root',
        $defs: { a: { type: 'string' } },
        properties: { x: { $ref: '#/$defs/a' } },
      };

      it('returns false when passed the same root schema back', () => {
        const utils2020 = createSchemaUtils({ validator: testValidator }, schema2020);
        expect(utils2020.doesSchemaUtilsDiffer({ validator: testValidator }, schema2020)).toBe(false);
      });
      it('still returns true for a genuinely different root schema', () => {
        const utils2020 = createSchemaUtils({ validator: testValidator }, schema2020);
        expect(utils2020.doesSchemaUtilsDiffer({ validator: testValidator }, { ...schema2020, title: 'changed' })).toBe(
          true,
        );
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
