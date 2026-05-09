import { TestValidatorType } from './types';
import {
  createSchemaUtils,
  getFieldNames,
  getUsedFormData,
  isValueEmpty,
  omitExtraData,
  PathSchema,
  NAME_KEY,
  RJSF_ADDITIONAL_PROPERTIES_FLAG,
  RJSFSchema,
} from '../../src';

export default function omitExtraDataTest(testValidator: TestValidatorType) {
  describe('isValueEmpty()', () => {
    it('returns true for null', () => {
      expect(isValueEmpty(null)).toBe(true);
    });
    it('returns true for undefined', () => {
      expect(isValueEmpty(undefined)).toBe(true);
    });
    it('returns true for empty string', () => {
      expect(isValueEmpty('')).toBe(true);
    });
    it('returns true for empty array', () => {
      expect(isValueEmpty([])).toBe(true);
    });
    it('returns true for empty object', () => {
      expect(isValueEmpty({})).toBe(true);
    });
    it('returns true when every object value is empty', () => {
      expect(isValueEmpty({ a: null, b: '', c: undefined })).toBe(true);
    });
    it('returns true for a deeply nested empty object', () => {
      expect(isValueEmpty({ a: { b: { c: null } } })).toBe(true);
    });
    it('returns false for a non-empty string', () => {
      expect(isValueEmpty('hello')).toBe(false);
    });
    it('returns false for number 0', () => {
      expect(isValueEmpty(0)).toBe(false);
    });
    it('returns false for boolean false', () => {
      expect(isValueEmpty(false)).toBe(false);
    });
    it('returns false for a non-empty array', () => {
      expect(isValueEmpty(['a'])).toBe(false);
    });
    it('returns false when at least one object value is non-empty', () => {
      expect(isValueEmpty({ a: null, b: 'hello' })).toBe(false);
    });
  });

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

    it('should not omit additional properties when root schema has additionalProperties', () => {
      const schema: RJSFSchema = {
        type: 'object',
        additionalProperties: {
          type: 'string',
        },
      };
      const formData = {
        key1: 'val1',
        key2: 'val2',
      };
      const schemaUtils = createSchemaUtils(testValidator, schema);

      expect(schemaUtils.omitExtraData(schema, formData)).toEqual(formData);
    });

    it('should not omit additional properties within oneOf', () => {
      const schema: RJSFSchema = {
        oneOf: [
          {
            type: 'object',
            additionalProperties: {
              type: 'string',
            },
          },
        ],
      };
      const formData = {
        key1: 'val1',
        key2: 'val2',
      };
      const schemaUtils = createSchemaUtils(testValidator, schema);

      expect(schemaUtils.omitExtraData(schema, formData)).toEqual(formData);
    });

    it('should keep additional properties but strip extras from defined properties within oneOf', () => {
      const schema: RJSFSchema = {
        oneOf: [
          {
            type: 'object',
            properties: {
              config: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                },
              },
            },
            additionalProperties: true,
          },
        ],
      };
      const formData = {
        config: { name: 'test', extraField: 'should be stripped' },
        dynamicKey: 'should be kept',
      };
      const expectedFormData = {
        config: { name: 'test' },
        dynamicKey: 'should be kept',
      };
      const schemaUtils = createSchemaUtils(testValidator, schema);

      expect(schemaUtils.omitExtraData(schema, formData)).toEqual(expectedFormData);
    });

    it('should keep or strip additional properties in oneOf based on the matched option', () => {
      const schema: RJSFSchema = {
        oneOf: [
          {
            type: 'object',
            properties: {
              discriminator: { type: 'string', const: 'foo' },
            },
            additionalProperties: true,
          },
          {
            type: 'object',
            properties: {
              discriminator: { type: 'string', const: 'bar' },
            },
            additionalProperties: false,
          },
        ],
      };
      const schemaUtils = createSchemaUtils(testValidator, schema);

      const keptData = { discriminator: 'foo', extra: 'should be kept' };
      expect(schemaUtils.omitExtraData(schema, keptData)).toEqual(keptData);

      const strippedData = { discriminator: 'bar', extra: 'should be stripped' };
      expect(schemaUtils.omitExtraData(schema, strippedData)).toEqual({ discriminator: 'bar' });
    });

    it('should strip extras from within additional property values with strict schemas', () => {
      const schema: RJSFSchema = {
        oneOf: [
          {
            type: 'object',
            additionalProperties: {
              type: 'object',
              properties: {
                name: { type: 'string' },
              },
              additionalProperties: false,
            },
          },
        ],
      };
      const formData = {
        server1: { name: 'prod', secret: 'oops' },
        server2: { name: 'staging' },
      };
      const expectedFormData = {
        server1: { name: 'prod' },
        server2: { name: 'staging' },
      };
      const schemaUtils = createSchemaUtils(testValidator, schema);

      expect(schemaUtils.omitExtraData(schema, formData)).toEqual(expectedFormData);
    });

    it('No form data returns undefined', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: { type: 'string' },
        },
      };

      expect(omitExtraData(testValidator, schema)).toBeUndefined();
    });

    // ---------------------------------------------------------------------------
    // Scenarios adapted from removeOptionalEmptyObjects.test.ts.
    //
    // omitExtraData filters by schema structure AND prunes optional object properties
    // whose schema-filtered content is entirely empty (null / undefined / '' / [] / {}).
    // Scalar properties (string, number, boolean, null) are always kept when schema-defined.
    // Required properties are never pruned regardless of their value.
    // Tests that differ from removeOptionalEmptyObjects are annotated.
    // ---------------------------------------------------------------------------

    describe('basic behavior (removeOptionalEmptyObjects scenarios)', () => {
      it('should return undefined when formData is undefined', () => {
        const schema: RJSFSchema = { type: 'object', properties: {} };
        expect(omitExtraData(testValidator, schema, schema, undefined)).toBeUndefined();
      });

      it('should return non-object formData as-is', () => {
        const schema: RJSFSchema = { type: 'string' };
        // String type falls through without object/array branching, source is returned.
        expect(omitExtraData(testValidator, schema, schema, 'hello' as any)).toEqual('hello');
      });

      it('should return formData as-is when schema is null or undefined', () => {
        const formData = { foo: 'bar' };
        // isEmpty(null) and isEmpty(undefined) are both true, so the schema is treated
        // as a pass-through and source is returned unchanged.
        expect(omitExtraData(testValidator, null as any, undefined, formData)).toEqual({ foo: 'bar' });
        expect(omitExtraData(testValidator, undefined as any, undefined, formData)).toEqual({ foo: 'bar' });
      });

      it('should return formData as-is when schema type is non-object but formData is an object', () => {
        // Schema type 'string' causes omitExtraData to fall through to the scalar branch,
        // where source is returned unchanged — same as removeOptionalEmptyObjects.
        const schema: RJSFSchema = { type: 'string' };
        const formData = { foo: 'bar' };
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual({ foo: 'bar' });
      });

      it('strips all formData keys when schema type is object but defines no properties', () => {
        // removeOptionalEmptyObjects returns formData unchanged here because it only prunes
        // by empty-value detection and does not strip keys absent from the schema.
        // omitExtraData returns {} because there are no schema-defined properties to copy.
        const schema: RJSFSchema = { type: 'object' };
        const formData = { foo: 'bar' };
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual({});
      });

      it('should return formData unchanged when there are no empty optional objects', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
              },
            },
          },
        };
        const formData = {
          name: 'John',
          address: { street: '123 Main St' },
        };
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual(formData);
      });
    });

    describe('the core bug scenario (Issue #4954) — optional empty object pruning', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          test: {
            type: 'object',
            properties: {
              field1: { type: 'string' },
              field2: { type: 'string' },
            },
            required: ['field1', 'field2'],
          },
        },
      };

      it('prunes the optional object when all schema-filtered values are empty', () => {
        const formData = { test: { field1: '', field2: '' } };
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual({});
      });

      it('should keep the optional object when at least one field has a value', () => {
        const formData = { test: { field1: 'hello', field2: '' } };
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual({
          test: { field1: 'hello', field2: '' },
        });
      });

      it('should keep the optional object when both fields have values', () => {
        const formData = { test: { field1: 'hello', field2: 'world' } };
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual(formData);
      });
    });

    describe('required objects — both functions agree they are not removed', () => {
      it('should keep a required object even if its fields are empty strings', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['test'],
          properties: {
            test: {
              type: 'object',
              properties: {
                field1: { type: 'string' },
              },
              required: ['field1'],
            },
          },
        };
        const formData = { test: { field1: '' } };
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual({ test: { field1: '' } });
      });
    });

    describe('nested optional objects', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          outer: {
            type: 'object',
            properties: {
              inner: {
                type: 'object',
                properties: {
                  field1: { type: 'string' },
                },
              },
            },
          },
        },
      };

      it('prunes all optional objects when every nested value is empty', () => {
        // Every value is empty so each optional object is pruned bottom-up, leaving {}.
        const formData = { outer: { inner: { field1: '' } } };
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual({});
      });

      it('should keep outer object if inner object has data', () => {
        const formData = { outer: { inner: { field1: 'hello' } } };
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual(formData);
      });
    });

    describe('mixed required and optional properties', () => {
      const schema: RJSFSchema = {
        type: 'object',
        required: ['required_field'],
        properties: {
          required_field: { type: 'string' },
          optional_object: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              age: { type: 'number' },
            },
            required: ['name', 'age'],
          },
        },
      };

      it('prunes optional_object when all its schema-filtered values are empty', () => {
        // name='' and age=undefined → schema-filtered result is {name:''}, which is all-empty,
        // so the optional optional_object property is pruned entirely.
        const formData = { required_field: 'hello', optional_object: { name: '', age: undefined } };
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual({
          required_field: 'hello',
        });
      });

      it('should keep everything when optional object has data', () => {
        const formData = { required_field: 'hello', optional_object: { name: 'John', age: 30 } };
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual(formData);
      });
    });

    describe('multiple optional objects', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          obj1: { type: 'object', properties: { field: { type: 'string' } } },
          obj2: { type: 'object', properties: { field: { type: 'string' } } },
          obj3: { type: 'object', properties: { field: { type: 'string' } } },
        },
      };

      it('prunes optional objects whose schema-filtered field values are all empty', () => {
        // obj2.field='' is all-empty so obj2 is pruned; obj1 and obj3 have non-empty values.
        const formData = {
          obj1: { field: 'has data' },
          obj2: { field: '' },
          obj3: { field: 'also has data' },
        };
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual({
          obj1: { field: 'has data' },
          obj3: { field: 'also has data' },
        });
      });
    });

    describe('preserves non-object data', () => {
      it('preserves scalars but prunes optional objects whose values are all empty', () => {
        // name and count are scalars kept as-is; optional_obj.value='' is all-empty so optional_obj is pruned.
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
            count: { type: 'number' },
            optional_obj: {
              type: 'object',
              properties: {
                value: { type: 'string' },
              },
            },
          },
        };
        const formData = { name: 'Test', count: 42, optional_obj: { value: '' } };
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual({
          name: 'Test',
          count: 42,
        });
      });
    });

    describe('arrays inside optional objects', () => {
      it('prunes the containing optional object when its only field is an empty array', () => {
        // items=[] is treated as empty, so obj (whose only schema-filtered value is []) is pruned.
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            obj: {
              type: 'object',
              properties: {
                items: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        };
        const formData = { obj: { items: [] } };
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual({});
      });

      it('should keep optional objects with non-empty arrays', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            obj: {
              type: 'object',
              properties: {
                items: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        };
        const formData = { obj: { items: ['a', 'b'] } };
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual(formData);
      });

      it('strips extra keys and prunes optional objects with all-empty values inside array items', () => {
        // item 0: optionalObj.name='' is all-empty so optionalObj is pruned; id:'1' is kept.
        // item 1: optionalObj.name='Test' is non-empty so optionalObj is kept.
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            list: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  optionalObj: {
                    type: 'object',
                    properties: { name: { type: 'string' } },
                  },
                },
              },
            },
          },
        };
        const formData = {
          list: [
            { id: '1', optionalObj: { name: '' } },
            { id: '2', optionalObj: { name: 'Test' } },
          ],
        };
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual({
          list: [{ id: '1' }, { id: '2', optionalObj: { name: 'Test' } }],
        });
      });

      it('prunes optional objects with all-empty values inside root array items', () => {
        // optionalObj.name='' is all-empty so optionalObj is pruned, leaving [{}].
        const schema: RJSFSchema = {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optionalObj: {
                type: 'object',
                properties: { name: { type: 'string' } },
              },
            },
          },
        };
        const formData = [{ optionalObj: { name: '' } }];
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual([{}]);
      });

      it('filters tuple items by their per-index schema; additionalItems schema filters extra elements', () => {
        // removeOptionalEmptyObjects: [{}, {}, {unknown:''}]
        //   (empty-value pruning within each item's schema; index[2] falls back to {} schema so unknown is kept)
        // omitExtraData: [{val:''}, {extra:''}, {}]
        //   items[0] and additionalItems schemas are applied strictly; index[2] has only properties:{extra},
        //   so {unknown:''} is stripped to {}.
        const schema: RJSFSchema = {
          type: 'array',
          items: [{ type: 'object', properties: { val: { type: 'string' } } }],
          additionalItems: { type: 'object', properties: { extra: { type: 'string' } } },
        };
        const formData = [{ val: '' }, { extra: '' }, { unknown: '' }];
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual([{ val: '' }, { extra: '' }, {}]);
      });

      it('drops tuple elements beyond the items array when additionalItems is absent', () => {
        // removeOptionalEmptyObjects: [{}, {unknown:''}] — preserves index[1] as-is (no schema).
        // omitExtraData: [{val:''}] — only the tuple slots covered by items[] are included;
        //   elements beyond the tuple and without additionalItems are not emitted.
        const schema: RJSFSchema = {
          type: 'array',
          items: [{ type: 'object', properties: { val: { type: 'string' } } }],
        };
        const formData = [{ val: '' }, { unknown: '' }];
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual([{ val: '' }]);
      });

      it('should return array as-is if no changes are made', () => {
        const schema: RJSFSchema = { type: 'array', items: { type: 'string' } };
        const formData = ['a', 'b'];
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual(['a', 'b']);
      });

      it('keeps schema-defined content of a required object property', () => {
        // removeOptionalEmptyObjects returns {reqObj: undefined} — the property key is kept because it
        // is required, but its value is set to undefined (the pruned sub-result).
        // omitExtraData returns {reqObj:{foo:''}} — it keeps all schema-defined values.
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            reqObj: {
              type: 'object',
              properties: { foo: { type: 'string' } },
            },
          },
          required: ['reqObj'],
        };
        const formData = { reqObj: { foo: '' } };
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual({ reqObj: { foo: '' } });
      });

      it('returns an empty array when the array schema has no items definition', () => {
        // removeOptionalEmptyObjects returns the array as-is (no items schema → skip processing).
        // omitExtraData returns [] because handleArray finds no items schema and emits nothing.
        const schema: RJSFSchema = { type: 'array' };
        const formData = [{ foo: 'bar' }];
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual([]);
      });
    });

    describe('optional scalar properties', () => {
      it('keeps optional empty scalar fields — only extra keys absent from the schema are stripped', () => {
        // removeOptionalEmptyObjects removes optionalField because it is optional and ''.
        // omitExtraData keeps optionalField:'' because '' is a valid string value per the schema.
        const schema: RJSFSchema = {
          type: 'object',
          required: ['requiredField'],
          properties: {
            requiredField: { type: 'string' },
            optionalField: { type: 'string' },
          },
        };
        const formData = { requiredField: 'hello', optionalField: '' };
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual({
          requiredField: 'hello',
          optionalField: '',
        });
      });
    });

    describe('edge cases', () => {
      it('strips keys not in the schema even when they are non-empty', () => {
        // removeOptionalEmptyObjects preserves extra keys (it only prunes by empty-value, not by schema).
        // omitExtraData strips extra and extraEmptyObj because they are not in schema.properties.
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        };
        const formData = { name: 'Test', extra: 'data', extraEmptyObj: {} };
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual({ name: 'Test' });
      });

      it('prunes optional objects whose schema-filtered content is all empty', () => {
        // obj.field='' means the entire obj value is all-empty so the optional obj property is pruned.
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            obj: {
              type: 'object',
              properties: {
                field: { type: 'string' },
              },
            },
          },
        };
        const formData = { obj: { field: '' } };
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual({});
      });

      it('keeps empty scalar properties but prunes optional objects with all-empty values', () => {
        // name='' is a scalar so it is kept; obj.value='' makes obj all-empty so obj is pruned.
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
            obj: {
              type: 'object',
              properties: {
                value: { type: 'string' },
              },
            },
          },
        };
        const formData = { name: '', obj: { value: '' } };
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual({ name: '' });
      });

      it('returns undefined when schema type is object but source is a non-object scalar', () => {
        const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' } } };
        expect(omitExtraData(testValidator, schema, schema, 'not-an-object' as any)).toBeUndefined();
      });

      it('returns undefined when schema type is array but source is a non-array value', () => {
        const schema: RJSFSchema = { type: 'array', items: { type: 'string' } };
        expect(omitExtraData(testValidator, schema, schema, 'not-an-array' as any)).toBeUndefined();
      });
    });

    describe('$ref and allOf support', () => {
      it('resolves $ref schemas', () => {
        const schema: RJSFSchema = {
          definitions: { Foo: { type: 'object', properties: { bar: { type: 'string' } } } },
          $ref: '#/definitions/Foo',
        };
        const formData = { bar: 'hello', extra: 'drop' };
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual({ bar: 'hello' });
      });

      it('merges allOf schemas and applies the result', () => {
        const schema: RJSFSchema = {
          allOf: [
            { type: 'object', properties: { foo: { type: 'string' } } },
            { properties: { bar: { type: 'number' } } },
          ],
        };
        const formData = { foo: 'hello', bar: 42, extra: 'drop' };
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual({ foo: 'hello', bar: 42 });
      });

      it('uses experimental_customMergeAllOf when provided', () => {
        const schema: RJSFSchema = {
          allOf: [
            { type: 'object', properties: { foo: { type: 'string' } } },
            { properties: { bar: { type: 'number' } } },
          ],
        };
        const merged: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' }, bar: { type: 'number' } } };
        const customMerge = jest.fn().mockReturnValue(merged);
        const formData = { foo: 'hi', bar: 1, extra: 'drop' };
        const result = omitExtraData(testValidator, schema, schema, formData, customMerge as any);
        expect(customMerge).toHaveBeenCalled();
        expect(result).toEqual({ foo: 'hi', bar: 1 });
      });
    });

    describe('patternProperties support', () => {
      it('keeps keys matching a pattern and drops unmatched keys without additionalProperties', () => {
        const schema: RJSFSchema = {
          type: 'object',
          patternProperties: { '^str_': { type: 'string' } },
        };
        const formData = { str_a: 'hello', str_b: 'world', num_c: 42 };
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual({ str_a: 'hello', str_b: 'world' });
      });

      it('delegates rest keys (not matched by pattern) to additionalProperties', () => {
        const schema: RJSFSchema = {
          type: 'object',
          patternProperties: { '^str_': { type: 'string' } },
          additionalProperties: { type: 'number' },
        };
        const formData = { str_a: 'hello', num_b: 99, num_c: 0 };
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual({
          str_a: 'hello',
          num_b: 99,
          num_c: 0,
        });
      });

      it('skips keys already handled by properties when processing patternProperties', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { name: { type: 'string' } },
          patternProperties: { '^name': { type: 'string' } },
        };
        const formData = { name: 'Alice', nameExtra: 'Bob' };
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual({ name: 'Alice', nameExtra: 'Bob' });
      });
    });

    describe('propertyNames support', () => {
      it('keeps all source keys when propertyNames is defined', () => {
        const schema: RJSFSchema = {
          type: 'object',
          propertyNames: { pattern: '^[a-z]+$' },
        };
        const formData = { foo: 'bar', baz: 42 };
        expect(omitExtraData(testValidator, schema, schema, formData)).toEqual(formData);
      });
    });

    describe('if/then/else (conditions) support', () => {
      it('applies then branch when condition is met', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { type: { type: 'string' } },
          if: { properties: { type: { const: 'A' } } },
          then: { properties: { aField: { type: 'string' } } },
          else: { properties: { bField: { type: 'string' } } },
        };
        const formData = { type: 'A', aField: 'hello', bField: 'drop', extra: 'drop' };
        // isValid returns true → condition is met → then branch
        testValidator.setReturnValues({ isValid: [true] });
        const result = omitExtraData(testValidator, schema, schema, formData);
        expect(result).toMatchObject({ type: 'A', aField: 'hello' });
        expect(result).not.toHaveProperty('bField');
        expect(result).not.toHaveProperty('extra');
      });

      it('applies else branch when condition is not met', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { type: { type: 'string' } },
          if: { properties: { type: { const: 'A' } } },
          then: { properties: { aField: { type: 'string' } } },
          else: { properties: { bField: { type: 'string' } } },
        };
        const formData = { type: 'B', aField: 'drop', bField: 'world', extra: 'drop' };
        // isValid returns false → condition not met → else branch
        testValidator.setReturnValues({ isValid: [false] });
        const result = omitExtraData(testValidator, schema, schema, formData);
        expect(result).toMatchObject({ type: 'B', bField: 'world' });
        expect(result).not.toHaveProperty('aField');
      });

      it('handles boolean true condition (always takes then branch without calling isValid)', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { foo: { type: 'string' } },
          if: true as any,
          then: { properties: { bar: { type: 'string' } } },
        };
        const formData = { foo: 'a', bar: 'b', extra: 'drop' };
        // boolean condition bypasses isValid; no setReturnValues needed
        const result = omitExtraData(testValidator, schema, schema, formData);
        expect(result).toMatchObject({ foo: 'a', bar: 'b' });
      });

      it('returns target unchanged when condition is not met and there is no else branch', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { type: { type: 'string' } },
          if: { properties: { type: { const: 'A' } } },
          then: { properties: { aField: { type: 'string' } } },
          // no else branch — branch === undefined when condition fails
        };
        const formData = { type: 'B', aField: 'drop' };
        // isValid returns false → condition not met → else (branch) is undefined → target returned unchanged
        testValidator.setReturnValues({ isValid: [false] });
        const result = omitExtraData(testValidator, schema, schema, formData);
        expect(result).toEqual({ type: 'B' });
      });
    });

    describe('anyOf support', () => {
      it('applies all anyOf branches when source is undefined', () => {
        const schema: RJSFSchema = {
          anyOf: [
            { type: 'object', properties: { foo: { type: 'string' } } },
            { type: 'object', properties: { bar: { type: 'string' } } },
          ],
        };
        expect(omitExtraData(testValidator, schema, schema, undefined)).toBeUndefined();
      });

      it('applies all anyOf branches when source is an empty object', () => {
        const schema: RJSFSchema = {
          type: 'object',
          anyOf: [{ properties: { foo: { type: 'string' } } }, { properties: { bar: { type: 'string' } } }],
          properties: { base: { type: 'string' } },
        };
        expect(omitExtraData(testValidator, schema, schema, {})).toEqual({});
      });

      it('delegates to oneOf matching logic when source is non-empty', () => {
        const schema: RJSFSchema = {
          type: 'object',
          anyOf: [{ properties: { foo: { type: 'string' } } }, { properties: { bar: { type: 'string' } } }],
        };
        const formData = { foo: 'hello', bar: 'world', extra: 'drop' };
        // isValid: first option matches (true for first candidate)
        testValidator.setReturnValues({ isValid: [true] });
        const result = omitExtraData(testValidator, schema, schema, formData);
        expect(result).toBeDefined();
        // Result should only contain keys from the best-matching anyOf branch
        expect(result).not.toHaveProperty('extra');
      });

      it('applies all anyOf branches when source is an empty array', () => {
        // An empty array is an empty collection — all branches are applied so defaults flow through.
        const schema: RJSFSchema = {
          type: 'array',
          anyOf: [{ items: { type: 'string' } }],
          items: { type: 'string' },
        };
        expect(omitExtraData(testValidator, schema, schema, [] as any)).toEqual([]);
      });

      it('reuses an array target already built by anyOf when outer schema is also type:array', () => {
        // anyOf sees [] as empty → applies all branches → returns [] as target.
        // The outer type:'array' branch then runs handleArray with that existing [] as target,
        // hitting the Array.isArray(target) ? target : [] true-branch.
        const schema: RJSFSchema = {
          type: 'array',
          anyOf: [{ items: { type: 'string' } }, { items: { type: 'number' } }],
          items: { type: 'string' },
        };
        expect(omitExtraData(testValidator, schema, schema, [] as any)).toEqual([]);
      });
    });

    describe('oneOf with boolean schema entries', () => {
      it('treats boolean true entry as pass-through schema', () => {
        const schema: RJSFSchema = {
          oneOf: [true as any, { type: 'object', properties: { name: { type: 'string' } } }],
        };
        const formData = { name: 'Alice', extra: 'data' };
        // isValid: first candidate (true→{}) matches
        testValidator.setReturnValues({ isValid: [true] });
        const result = omitExtraData(testValidator, schema, schema, formData);
        expect(result).toBeDefined();
      });

      it('treats boolean false entry as a schema that rejects everything', () => {
        const schema: RJSFSchema = {
          oneOf: [false as any, { type: 'object', properties: { name: { type: 'string' } } }],
        };
        const formData = { name: 'Alice' };
        // isValid: first candidate (false→{not:{}}) does not match, second matches
        testValidator.setReturnValues({ isValid: [false, true] });
        const result = omitExtraData(testValidator, schema, schema, formData);
        expect(result).toEqual({ name: 'Alice' });
      });
    });

    describe('dependencies support', () => {
      it('applies schema dependencies when the trigger key is present', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { name: { type: 'string' } },
          dependencies: {
            name: {
              properties: { age: { type: 'number' } },
            },
          },
        };
        const formData = { name: 'Alice', age: 30, extra: 'drop' };
        const result = omitExtraData(testValidator, schema, schema, formData);
        expect(result).toMatchObject({ name: 'Alice', age: 30 });
        expect(result).not.toHaveProperty('extra');
      });

      it('skips property dependencies (string arrays) and schema dependencies for absent keys', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { name: { type: 'string' }, email: { type: 'string' } },
          dependencies: {
            name: ['email'],
            email: { properties: { domain: { type: 'string' } } },
          },
        };
        const formData = { name: 'Alice' };
        const result = omitExtraData(testValidator, schema, schema, formData);
        expect(result).toEqual({ name: 'Alice' });
      });
    });

    describe('getFieldNames() — array formValue branch', () => {
      it('includes path when formValue is a non-empty array of scalars and the node is not a leaf', () => {
        // isLeaf is false when the pathSchema node has keys beyond NAME_KEY (here '0').
        // For a non-empty scalar array, formValueHasData(array, false) is false (not a non-object,
        // not empty, isLeaf is false), so the Array.isArray branch on line 73 is the only way in.
        const pathSchema = {
          [NAME_KEY]: '',
          tags: {
            [NAME_KEY]: 'tags',
            0: { [NAME_KEY]: 'tags.0' },
          },
        };
        const formData = { tags: ['a', 'b', 'c'] };
        const fieldNames = getFieldNames(pathSchema as unknown as PathSchema, formData);
        expect(fieldNames).toContainEqual(['tags']);
      });
    });
  });
}
