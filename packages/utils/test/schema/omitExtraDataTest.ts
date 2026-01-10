import { TestValidatorType } from './types';
import { getFieldNames, getUsedFormData } from '../../src/schema/omitExtraData';
import {
  createSchemaUtils,
  omitExtraData,
  PathSchema,
  NAME_KEY,
  RJSF_ADDITIONAL_PROPERTIES_FLAG,
  RJSFSchema,
} from '../../src';

export default function omitExtraDataTest(testValidator: TestValidatorType) {
  describe('omitExtraData()', () => {
    describe('getFieldNames()', () => {
      it('should return an empty array for a single input form', () => {
        const formData = 'foo';
        const pathSchema = {
          [NAME_KEY]: '',
        };

        expect(getFieldNames(pathSchema as PathSchema, formData)).toEqual([]);
      });

      it('should get field names from pathSchema', () => {
        const formData = {
          extra: {
            foo: 'bar',
          },
          level1: {
            level2: 'test',
            anotherThing: {
              anotherThingNested: 'abc',
              extra: 'asdf',
              anotherThingNested2: 0,
            },
            stringArray: ['scobochka'],
          },
          level1a: 1.23,
        };

        const pathSchema = {
          [NAME_KEY]: '',
          level1: {
            [NAME_KEY]: 'level1',
            level2: { [NAME_KEY]: 'level1.level2' },
            anotherThing: {
              [NAME_KEY]: 'level1.anotherThing',
              anotherThingNested: {
                [NAME_KEY]: 'level1.anotherThing.anotherThingNested',
              },
              anotherThingNested2: {
                [NAME_KEY]: 'level1.anotherThing.anotherThingNested2',
              },
            },
            stringArray: {
              [NAME_KEY]: 'level1.stringArray',
            },
          },
          level1a: {
            [NAME_KEY]: 'level1a',
          },
        };

        const fieldNames = getFieldNames(pathSchema as unknown as PathSchema, formData);
        expect(fieldNames.sort()).toEqual(
          [
            ['level1', 'anotherThing', 'anotherThingNested'],
            ['level1', 'anotherThing', 'anotherThingNested2'],
            ['level1', 'level2'],
            ['level1', 'stringArray'],
            ['level1a'],
          ].sort(),
        );
      });

      it('should get field marked as additionalProperties', () => {
        const formData = {
          extra: {
            foo: 'bar',
          },
          level1: {
            level2: 'test',
            extra: 'foo',
            mixedMap: {
              namedField: 'foo',
              key1: 'val1',
            },
          },
          level1a: 1.23,
        };

        const pathSchema = {
          [NAME_KEY]: '',
          level1: {
            [NAME_KEY]: 'level1',
            level2: { [NAME_KEY]: 'level1.level2' },
            mixedMap: {
              [NAME_KEY]: 'level1.mixedMap',
              [RJSF_ADDITIONAL_PROPERTIES_FLAG]: true,
              namedField: {
                // this name should not be returned, as the root object paths should be returned for objects marked with additionalProperties
                [NAME_KEY]: 'level1.mixedMap.namedField',
              },
            },
          },
          level1a: {
            [NAME_KEY]: 'level1a',
          },
        };

        const fieldNames = getFieldNames(pathSchema as unknown as PathSchema, formData);
        expect(fieldNames.sort()).toEqual([['level1', 'level2'], 'level1.mixedMap', ['level1a']].sort());
      });

      it('should get field names from pathSchema with array', () => {
        const formData = {
          address_list: [
            {
              street_address: '21, Jump Street',
              city: 'Babel',
              state: 'Neverland',
            },
            {
              street_address: '1234 Schema Rd.',
              city: 'New York',
              state: 'Arizona',
            },
          ],
        };

        const pathSchema = {
          [NAME_KEY]: '',
          address_list: {
            0: {
              [NAME_KEY]: 'address_list.0',
              city: {
                [NAME_KEY]: 'address_list.0.city',
              },
              state: {
                [NAME_KEY]: 'address_list.0.state',
              },
              street_address: {
                [NAME_KEY]: 'address_list.0.street_address',
              },
            },
            1: {
              [NAME_KEY]: 'address_list.1',
              city: {
                [NAME_KEY]: 'address_list.1.city',
              },
              state: {
                [NAME_KEY]: 'address_list.1.state',
              },
              street_address: {
                [NAME_KEY]: 'address_list.1.street_address',
              },
            },
          },
        };

        const fieldNames = getFieldNames(pathSchema as unknown as PathSchema, formData);
        expect(fieldNames.sort()).toEqual(
          [
            ['address_list', '0', 'city'],
            ['address_list', '0', 'state'],
            ['address_list', '0', 'street_address'],
            ['address_list', '1', 'city'],
            ['address_list', '1', 'state'],
            ['address_list', '1', 'street_address'],
          ].sort(),
        );
      });
    });

    describe('getUsedFormData()', () => {
      it('should just return the single input form value', () => {
        const formData = 'foo';

        expect(getUsedFormData(formData, [])).toEqual('foo');
      });

      it('should return the root level array', () => {
        const formData: [] = [];

        expect(getUsedFormData(formData, [])).toEqual([]);
      });

      it('should call getUsedFormData with data from fields in event', () => {
        const formData = {
          foo: 'bar',
        };

        expect(getUsedFormData(formData, ['foo'])).toEqual({ foo: 'bar' });
      });

      it('unused form values should be omitted', () => {
        const formData = {
          foo: 'bar',
          baz: 'buzz',
          list: [
            { title: 'title0', details: 'details0' },
            { title: 'title1', details: 'details1' },
          ],
        };

        expect(getUsedFormData(formData, ['foo', 'list.0.title', 'list.1.details'])).toEqual({
          foo: 'bar',
          list: [{ title: 'title0' }, { details: 'details1' }],
        });
      });

      it('should handle array formData', () => {
        const formData = ['a', 'b', 'c'];
        const fields = ['0', '2'];
        const result = getUsedFormData(formData, fields);
        expect(result).toEqual(['a', 'c']);
      });
    });

    it('should omit fields not defined in the schema', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: { type: 'string' },
        },
      };
      const formData = {
        foo: 'bar',
        extraField: 'should be omitted',
      };
      const schemaUtils = createSchemaUtils(testValidator, schema);

      expect(schemaUtils.omitExtraData(schema, formData)).toEqual({ foo: 'bar' });
    });

    it('should include nested object fields defined in the schema', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          nested: {
            type: 'object',
            properties: {
              foo: { type: 'string' },
            },
          },
        },
      };
      const formData = {
        nested: {
          foo: 'bar',
          extraField: 'should be omitted',
        },
      };
      const schemaUtils = createSchemaUtils(testValidator, schema);

      expect(schemaUtils.omitExtraData(schema, formData)).toEqual({ nested: { foo: 'bar' } });
    });

    it('should handle arrays according to the schema', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          list: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                foo: { type: 'string' },
              },
            },
          },
        },
      };
      const formData = {
        list: [{ foo: 'bar', extraField: 'should be omitted' }, { foo: 'baz' }],
      };
      const schemaUtils = createSchemaUtils(testValidator, schema);

      expect(schemaUtils.omitExtraData(schema, formData)).toEqual({
        list: [{ foo: 'bar' }, { foo: 'baz' }],
      });
    });

    it('should not omit additional properties if the schema allows them', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          level1: {
            type: 'object',
            properties: {
              level2: { type: 'string' },
              mixedMap: {
                type: 'string',
                additionalProperties: true,
              },
            },
          },
        },
      };
      const formData = {
        level1: {
          level2: 'test',
          mixedMap: {
            namedField: 'foo',
            key1: 'val1',
          },
        },
      };
      const schemaUtils = createSchemaUtils(testValidator, schema);

      expect(schemaUtils.omitExtraData(schema, formData)).toEqual(formData);
    });

    it('No form data or RootSchema returns empty object', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: { type: 'string' },
        },
      };

      expect(omitExtraData(testValidator, schema)).toEqual({});
    });
  });
}
