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
  getValidationTarget,
  ID_KEY,
  JSON_SCHEMA_DRAFT_2020_12,
  noop,
  PROPERTIES_KEY,
  REF_KEY,
  SCHEMA_KEY,
} from '../src/index.ts';
import { miniValidator } from './schema/graph/miniValidator.ts';
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

  describe('allowsAdditionalProperties() and canExpand()', () => {
    const objectSchema: RJSFSchema = { type: 'object', properties: { a: { type: 'string' } } };
    it('read an absent additionalProperties as the context says', () => {
      const allowing = createSchemaUtils(
        { validator: testValidator, additionalPropertiesWhenAbsent: 'allow' },
        rootSchema,
      );
      expect(schemaUtils.allowsAdditionalProperties(objectSchema)).toBe(false);
      expect(schemaUtils.canExpand(objectSchema)).toBe(false);
      expect(allowing.allowsAdditionalProperties(objectSchema)).toBe(true);
      expect(allowing.canExpand(objectSchema)).toBe(true);
      expect(allowing.canExpand(objectSchema, { 'ui:options': { expandable: false } })).toBe(false);
      expect(allowing.canExpand({ ...objectSchema, maxProperties: 1 }, {}, { a: 'x' })).toBe(false);
    });
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

    it('getRootSchema() returns the root as the caller passed it, its $refs as written (#5529)', () => {
      expect(schemaUtils2020.getRootSchema()).toBe(rootSchema2020);
    });

    it('resolves a $ref under a relative root $id against that $id once', () => {
      const c: RJSFSchema = { [REF_KEY]: 'child.json' };
      const relativeRoot: RJSFSchema = {
        [SCHEMA_KEY]: JSON_SCHEMA_DRAFT_2020_12,
        [ID_KEY]: 'nested/root.json',
        $defs: { c: { [ID_KEY]: 'child.json', type: 'object', [PROPERTIES_KEY]: { v: { type: 'string' } } } },
        [PROPERTIES_KEY]: { c },
      };
      const schemaUtilsRelative = createSchemaUtils({ validator: testValidator }, relativeRoot);
      expect(schemaUtilsRelative.retrieveSchema(c)).toMatchObject({ [ID_KEY]: 'child.json', type: 'object' });
    });

    // A key under `properties` names a property of the data, so a property named `$ref` is not a reference
    describe('a property named $ref (#5457)', () => {
      it('keeps the property of the schema from the issue under an absolute root $id', () => {
        const schema: RJSFSchema = {
          [SCHEMA_KEY]: JSON_SCHEMA_DRAFT_2020_12,
          [ID_KEY]: 'https://example.com/root.json',
          type: 'object',
          [PROPERTIES_KEY]: { [REF_KEY]: { type: 'object' } },
        };
        const schemaUtilsWithRefProperty = createSchemaUtils({ validator: testValidator }, schema);
        expect(schemaUtilsWithRefProperty.getRootSchema()).toEqual(schema);
        expect(schemaUtilsWithRefProperty.retrieveSchema(schemaUtilsWithRefProperty.getRootSchema())).toEqual(schema);
      });

      it('resolves a reference to a definition that has a property named $ref', () => {
        const node: RJSFSchema = {
          type: 'object',
          [PROPERTIES_KEY]: { [REF_KEY]: { type: 'object', [PROPERTIES_KEY]: { nodeId: { type: 'string' } } } },
        };
        const schema: RJSFSchema = {
          [SCHEMA_KEY]: JSON_SCHEMA_DRAFT_2020_12,
          [ID_KEY]: 'https://example.com/graph.json',
          type: 'object',
          [PROPERTIES_KEY]: { link: { [REF_KEY]: '#/$defs/node' } },
          $defs: { node },
        };
        const schemaUtilsWithRefProperty = createSchemaUtils({ validator: testValidator }, schema);
        const link = schemaUtilsWithRefProperty.getRootSchema()[PROPERTIES_KEY]?.link;
        expect(link).toBeTypeOf('object');
        expect(typeof link === 'object' && schemaUtilsWithRefProperty.retrieveSchema(link)[PROPERTIES_KEY]).toEqual(
          node[PROPERTIES_KEY],
        );
      });
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
      it('returns true when passing an additionalPropertiesWhenAbsent of allow', () => {
        expect(
          schemaUtils.doesSchemaUtilsDiffer(
            { validator: testValidator, additionalPropertiesWhenAbsent: 'allow' },
            rootSchema,
          ),
        ).toBe(true);
      });
      it('returns false when passing an additionalPropertiesWhenAbsent of forbid, the default', () => {
        expect(
          schemaUtils.doesSchemaUtilsDiffer(
            { validator: testValidator, additionalPropertiesWhenAbsent: 'forbid' },
            rootSchema,
          ),
        ).toBe(false);
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
      // A difference reported for the root a caller passes back would make `Form` rebuild its `SchemaUtils` on every
      // render, discarding the `retrieveSchema()` caches and re-validating a `liveValidate` form
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

    it('keeps a result that shares subtrees with the previous one standing for the subschema it was retrieved from', () => {
      const option: RJSFSchema = {
        type: 'object',
        allOf: [{ required: ['kind'] }],
        required: ['id'],
        properties: { kind: { type: 'string' }, id: { type: 'string' } },
        if: { properties: { kind: { const: 'a' } } },
        then: { properties: { extra: { type: 'string' } } },
      };
      const root: RJSFSchema = { type: 'object', properties: { pet: { oneOf: [option, { type: 'object' }] } } };
      const utils = createSchemaUtils({ validator: miniValidator() }, root);
      const first = utils.retrieveSchema(option, { kind: 'a' });
      const second = utils.retrieveSchema(option, { kind: 'x' });
      expect(second.required).toBe(first.required);
      expect(second.properties).not.toHaveProperty('extra');
      expect(getValidationTarget(first, root)).toEqual({ $ref: '#/properties/pet/oneOf/0' });
      expect(getValidationTarget(second, root)).toEqual({ $ref: '#/properties/pet/oneOf/0' });
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
