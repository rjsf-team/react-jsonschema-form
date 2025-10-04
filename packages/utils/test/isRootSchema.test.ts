import { createSchemaUtils, englishStringTranslator, isRootSchema, Registry, RJSFSchema, TemplatesType } from '../src';
import getTestValidator from './testUtils/getTestValidator';
import { GLOBAL_FORM_OPTIONS } from './testUtils/testData';

const TEST_SCHEMA_TO_COMPARE: RJSFSchema = {
  title: 'Sample Schema',
  type: 'object',
  definitions: {
    root_ref_def: {
      type: 'object',
      properties: {
        string_property: { type: 'string', default: 'merge_bams_settings' },
      },
    },
  },
  properties: {
    string_property: { type: 'string', default: 'merge_bams_settings' },
  },
};
const TEST_ROOT_REF_SCHEMA: RJSFSchema = {
  title: 'Sample Schema',
  type: 'object',
  definitions: {
    root_ref_def: {
      type: 'object',
      properties: {
        string_property: { type: 'string', default: 'merge_bams_settings' },
      },
    },
  },
  $ref: '#/definitions/root_ref_def',
};

function getRegistry(rootSchema: RJSFSchema): Registry {
  return {
    formContext: {},
    rootSchema,
    schemaUtils: createSchemaUtils(getTestValidator({}), rootSchema),
    translateString: englishStringTranslator,
    fields: {},
    widgets: {},
    templates: {} as TemplatesType,
    globalFormOptions: GLOBAL_FORM_OPTIONS,
  };
}

describe('isRootSchema', () => {
  it('returns true when passed the same schema objects', () => {
    const registry = getRegistry(TEST_ROOT_REF_SCHEMA);
    expect(isRootSchema(registry, TEST_ROOT_REF_SCHEMA)).toBe(true);
  });
  it('returns true when passed a copy of the root schema object', () => {
    const registry = getRegistry(TEST_ROOT_REF_SCHEMA);
    expect(isRootSchema(registry, { ...TEST_ROOT_REF_SCHEMA })).toBe(true);
  });
  it('returns false when passed different schemas, with ref in rootSchema', () => {
    const registry = getRegistry(TEST_ROOT_REF_SCHEMA);
    expect(isRootSchema(registry, { title: 'will not match' })).toBe(false);
  });
  it('returns false when passed different schemas, without ref in rootSchema', () => {
    const registry = getRegistry(TEST_SCHEMA_TO_COMPARE);
    expect(isRootSchema(registry, { title: 'will not match' })).toBe(false);
  });
  describe('root schema with root $ref', () => {
    let retrieveSchemaSpy: jest.SpyInstance;
    let registry: Registry;
    beforeAll(() => {
      registry = getRegistry(TEST_ROOT_REF_SCHEMA);
      retrieveSchemaSpy = jest.spyOn(registry.schemaUtils, 'retrieveSchema');
    });
    it('returns true when passed the same schema but with a $ref property', () => {
      expect(isRootSchema(registry, TEST_SCHEMA_TO_COMPARE)).toBe(true);
    });
    it('calls resolveSchema with the root schema that was passed', () => {
      expect(retrieveSchemaSpy).toHaveBeenCalledWith(TEST_ROOT_REF_SCHEMA);
    });
    it('returns false when passed a different schema with a $ref property', () => {
      expect(isRootSchema(registry, { ...TEST_SCHEMA_TO_COMPARE, title: 'different' })).toBe(false);
    });
    it('calls resolveSchema again with the root schema that was passed', () => {
      expect(retrieveSchemaSpy).toHaveBeenNthCalledWith(2, TEST_ROOT_REF_SCHEMA);
    });
  });
});
