import { toIdSchema, RJSFSchema, createSchemaUtils } from '../../src';
import { RECURSIVE_REF, RECURSIVE_REF_ALLOF } from '../testUtils/testData';
import { TestValidatorType } from './types';

export default function toIdSchemaTest(testValidator: TestValidatorType) {
  describe('toIdSchema()', () => {
    it('should return an idSchema for root field', () => {
      const schema: RJSFSchema = { type: 'string' };

      expect(toIdSchema(testValidator, schema)).toEqual({ $id: 'root' });
    });
    it('should return an idSchema for nested objects without a proper field', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          level1: {
            type: 'object',
            properties: {
              level2: false,
            },
          },
        },
      };

      expect(toIdSchema(testValidator, schema)).toEqual({
        $id: 'root',
        level1: {
          $id: 'root_level1',
          level2: { $id: 'root_level1_level2' },
        },
      });
    });
    it('should return ids for multiple types with null', () => {
      const schema: RJSFSchema = {
        type: ['object', 'null'],
        properties: {
          names: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
      };
      expect(toIdSchema(testValidator, schema)).toEqual({
        $id: 'root',
        names: {
          $id: 'root_names',
        },
      });
    });
    it('should return an idSchema for nested objects', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          level1: {
            type: 'object',
            properties: {
              level2: { type: 'string' },
            },
          },
        },
      };

      expect(toIdSchema(testValidator, schema)).toEqual({
        $id: 'root',
        level1: {
          $id: 'root_level1',
          level2: { $id: 'root_level1_level2' },
        },
      });
    });
    it('should return an idSchema for multiple nested objects', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          level1a: {
            type: 'object',
            properties: {
              level1a2a: { type: 'string' },
              level1a2b: { type: 'string' },
            },
          },
          level1b: {
            type: 'object',
            properties: {
              level1b2a: { type: 'string' },
              level1b2b: { type: 'string' },
            },
          },
        },
      };

      expect(toIdSchema(testValidator, schema)).toEqual({
        $id: 'root',
        level1a: {
          $id: 'root_level1a',
          level1a2a: { $id: 'root_level1a_level1a2a' },
          level1a2b: { $id: 'root_level1a_level1a2b' },
        },
        level1b: {
          $id: 'root_level1b',
          level1b2a: { $id: 'root_level1b_level1b2a' },
          level1b2b: { $id: 'root_level1b_level1b2b' },
        },
      });
    });
    it('schema with an id property must not corrupt the idSchema', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          metadata: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
            },
            required: ['id'],
          },
        },
      };
      expect(toIdSchema(testValidator, schema)).toEqual({
        $id: 'root',
        metadata: {
          $id: 'root_metadata',
          id: { $id: 'root_metadata_id' },
        },
      });
    });
    it('should return an idSchema for array item objects', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            foo: { type: 'string' },
          },
        },
      };

      expect(toIdSchema(testValidator, schema)).toEqual({
        $id: 'root',
        foo: { $id: 'root_foo' },
      });
    });
    it('should retrieve referenced schema definitions', () => {
      const schema: RJSFSchema = {
        definitions: {
          testdef: {
            type: 'object',
            properties: {
              foo: { type: 'string' },
              bar: { type: 'string' },
            },
          },
        },
        $ref: '#/definitions/testdef',
      };

      const schemaUtils = createSchemaUtils(testValidator, schema);
      expect(schemaUtils.toIdSchema(schema, undefined)).toEqual({
        $id: 'root',
        foo: { $id: 'root_foo' },
        bar: { $id: 'root_bar' },
      });
    });
    it('should return an idSchema for property dependencies', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: { type: 'string' },
        },
        dependencies: {
          foo: {
            properties: {
              bar: { type: 'string' },
            },
          },
        },
      };
      const formData = {
        foo: 'test',
      };

      expect(toIdSchema(testValidator, schema, undefined, schema, formData)).toEqual({
        $id: 'root',
        foo: { $id: 'root_foo' },
        bar: { $id: 'root_bar' },
      });
    });
    it('should return an idSchema for nested property dependencies', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          obj: {
            type: 'object',
            properties: {
              foo: { type: 'string' },
            },
            dependencies: {
              foo: {
                properties: {
                  bar: { type: 'string' },
                },
              },
            },
          },
        },
      };
      const formData = {
        obj: {
          foo: 'test',
        },
      };

      expect(toIdSchema(testValidator, schema, undefined, schema, formData)).toEqual({
        $id: 'root',
        obj: {
          $id: 'root_obj',
          foo: { $id: 'root_obj_foo' },
          bar: { $id: 'root_obj_bar' },
        },
      });
    });
    it('should return an idSchema for unmet property dependencies', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: { type: 'string' },
        },
        dependencies: {
          foo: {
            properties: {
              bar: { type: 'string' },
            },
          },
        },
      };

      const formData = {};

      expect(toIdSchema(testValidator, schema, undefined, schema, formData)).toEqual({
        $id: 'root',
        foo: { $id: 'root_foo' },
      });
    });
    it('should handle idPrefix parameter', () => {
      const schema: RJSFSchema = {
        definitions: {
          testdef: {
            type: 'object',
            properties: {
              foo: { type: 'string' },
              bar: { type: 'string' },
            },
          },
        },
        $ref: '#/definitions/testdef',
      };

      expect(toIdSchema(testValidator, schema, undefined, schema, {}, 'rjsf')).toEqual({
        $id: 'rjsf',
        foo: { $id: 'rjsf_foo' },
        bar: { $id: 'rjsf_bar' },
      });
    });
    it('should handle idSeparator parameter', () => {
      const schema: RJSFSchema = {
        definitions: {
          testdef: {
            type: 'object',
            properties: {
              foo: { type: 'string' },
              bar: { type: 'string' },
            },
          },
        },
        $ref: '#/definitions/testdef',
      };

      expect(toIdSchema(testValidator, schema, undefined, schema, {}, 'rjsf', '/')).toEqual({
        $id: 'rjsf',
        foo: { $id: 'rjsf/foo' },
        bar: { $id: 'rjsf/bar' },
      });
    });
    it('should handle null form data for object schemas', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: { type: 'string' },
          bar: { type: 'string' },
        },
      };
      const formData = null;
      const result = toIdSchema(testValidator, schema, undefined, {}, formData, 'rjsf');

      expect(result).toEqual({
        $id: 'rjsf',
        foo: { $id: 'rjsf_foo' },
        bar: { $id: 'rjsf_bar' },
      });
    });
    it('should handle recursive ref to two levels', () => {
      const result = toIdSchema(testValidator, RECURSIVE_REF, undefined, RECURSIVE_REF);
      expect(result).toEqual({
        $id: 'root',
        name: {
          $id: 'root_name',
        },
        children: {
          $id: 'root_children',
          name: {
            $id: 'root_children_name',
          },
          children: {
            $id: 'root_children_children',
          },
        },
      });
    });
    it('should handle recursive allof ref to one level', () => {
      const result = toIdSchema(testValidator, RECURSIVE_REF_ALLOF, null, RECURSIVE_REF_ALLOF);
      expect(result).toEqual({
        $id: 'root',
        value: {
          $id: 'root_value',
          _id: {
            $id: 'root_value__id',
          },
          children: {
            $id: 'root_value_children',
          },
          name: {
            $id: 'root_value_name',
          },
        },
      });
    });
  });
}
