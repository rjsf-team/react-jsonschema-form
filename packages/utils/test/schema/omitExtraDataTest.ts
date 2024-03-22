import { TestValidatorType } from './types';
import { getFieldNames } from '../../src/schema/omitExtraData';
import { omitExtraData, PathSchema, RJSFSchema } from '../../lib';
import { getUsedFormData } from '../../lib/schema/omitExtraData';

export default function omitExtraDataTest(testValidator: TestValidatorType) {
  describe('omitExtraData()', () => {
    describe('getFieldNames()', () => {
      it('should return an empty array for a single input form', () => {
        const formData = 'foo';
        const pathSchema = {
          $name: '',
        };

        expect(getFieldNames(pathSchema as PathSchema<any>, formData)).toEqual([]);
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
          $name: '',
          level1: {
            $name: 'level1',
            level2: { $name: 'level1.level2' },
            anotherThing: {
              $name: 'level1.anotherThing',
              anotherThingNested: {
                $name: 'level1.anotherThing.anotherThingNested',
              },
              anotherThingNested2: {
                $name: 'level1.anotherThing.anotherThingNested2',
              },
            },
            stringArray: {
              $name: 'level1.stringArray',
            },
          },
          level1a: {
            $name: 'level1a',
          },
        };

        const fieldNames = getFieldNames(pathSchema as unknown as PathSchema<any>, formData);
        expect(fieldNames.sort()).toEqual(
          [
            ['level1', 'anotherThing', 'anotherThingNested'],
            ['level1', 'anotherThing', 'anotherThingNested2'],
            ['level1', 'level2'],
            ['level1', 'stringArray'],
            ['level1a'],
          ].sort()
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
          $name: '',
          level1: {
            $name: 'level1',
            level2: { $name: 'level1.level2' },
            mixedMap: {
              $name: 'level1.mixedMap',
              __rjsf_additionalProperties: true,
              namedField: { $name: 'level1.mixedMap.namedField' }, // this name should not be returned, as the root object paths should be returned for objects marked with additionalProperties
            },
          },
          level1a: {
            $name: 'level1a',
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
          $name: '',
          address_list: {
            0: {
              $name: 'address_list.0',
              city: {
                $name: 'address_list.0.city',
              },
              state: {
                $name: 'address_list.0.state',
              },
              street_address: {
                $name: 'address_list.0.street_address',
              },
            },
            1: {
              $name: 'address_list.1',
              city: {
                $name: 'address_list.1.city',
              },
              state: {
                $name: 'address_list.1.state',
              },
              street_address: {
                $name: 'address_list.1.street_address',
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
          ].sort()
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

        expect(getUsedFormData(formData, [['foo']])).toEqual({ foo: 'bar' });
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

        expect(getUsedFormData(formData, [['foo'], ['list', '0', 'title'], ['list', '1', 'details']])).toEqual({
          foo: 'bar',
          list: [{ title: 'title0' }, { details: 'details1' }],
        });
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

      expect(omitExtraData(testValidator, schema, schema, formData)).toEqual({ foo: 'bar' });
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

      expect(omitExtraData(testValidator, schema, schema, formData)).toEqual({ nested: { foo: 'bar' } });
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

      expect(omitExtraData(testValidator, schema, schema, formData)).toEqual({
        list: [{ foo: 'bar' }, { foo: 'baz' }],
      });
    });

    it('should not omit additional properties if the schema allows them', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: { type: 'string' },
        },
        additionalProperties: true,
      };
      const formData = {
        foo: 'bar',
        extraField: 'should not be omitted',
      };

      expect(omitExtraData(testValidator, schema, schema, formData)).toEqual(formData);
    });
  });
}
