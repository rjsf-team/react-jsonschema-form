import { toPathSchema, RJSFSchema, createSchemaUtils } from '../../src';
import { RECURSIVE_REF, RECURSIVE_REF_ALLOF } from '../testUtils/testData';
import { TestValidatorType } from './types';

export default function toPathSchemaTest(testValidator: TestValidatorType) {
  describe('toPathSchema()', () => {
    it('should return a pathSchema for root field', () => {
      const schema: RJSFSchema = { type: 'string' };

      expect(toPathSchema(testValidator, schema)).toEqual({ $name: '' });
    });
    it('should return a pathSchema for root field, with additional properties', () => {
      const schema: RJSFSchema = { type: 'string', additionalProperties: true };

      expect(toPathSchema(testValidator, schema)).toEqual({
        $name: '',
        __rjsf_additionalProperties: true,
      });
    });
    it('should return a pathSchema for root field, without additional properties', () => {
      const schema: RJSFSchema = {
        type: 'string',
        additionalProperties: false,
      };

      expect(toPathSchema(testValidator, schema)).toEqual({ $name: '' });
    });
    it('should return a pathSchema for nested objects', () => {
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

      expect(toPathSchema(testValidator, schema)).toEqual({
        $name: '',
        level1: {
          $name: 'level1',
          level2: { $name: 'level1.level2' },
        },
      });
    });
    it('should return a pathSchema for a schema with dependencies', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          list: {
            title: 'list',
            type: 'array',
            items: {
              type: 'object',
              properties: {
                a: { type: 'string' },
                b: { type: 'string' },
              },
              dependencies: {
                b: {
                  properties: {
                    c: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      };

      const formData = {
        list: [
          {
            a: 'a1',
            b: 'b1',
            c: 'c1',
          },
          {
            a: 'a2',
          },
          {
            a: 'a2',
            c: 'c2',
          },
        ],
      };

      expect(toPathSchema(testValidator, schema, '', schema, formData)).toEqual({
        $name: '',
        list: {
          $name: 'list',
          '0': {
            $name: 'list.0',
            a: {
              $name: 'list.0.a',
            },
            b: {
              $name: 'list.0.b',
            },
            c: {
              $name: 'list.0.c',
            },
          },
          '1': {
            $name: 'list.1',
            a: {
              $name: 'list.1.a',
            },
            b: {
              $name: 'list.1.b',
            },
          },
          '2': {
            $name: 'list.2',
            a: {
              $name: 'list.2.a',
            },
            b: {
              $name: 'list.2.b',
            },
          },
        },
      });
    });
    it('should return a pathSchema for a schema with references', () => {
      const schema: RJSFSchema = {
        definitions: {
          address: {
            type: 'object',
            properties: {
              street_address: {
                type: 'string',
              },
              city: {
                type: 'string',
              },
              state: {
                type: 'string',
              },
            },
            required: ['street_address', 'city', 'state'],
          },
        },
        type: 'object',
        properties: {
          billing_address: {
            title: 'Billing address',
            $ref: '#/definitions/address',
          },
        },
      };

      const formData = {
        billing_address: {
          street_address: '21, Jump Street',
          city: 'Babel',
          state: 'Neverland',
        },
      };

      expect(toPathSchema(testValidator, schema, '', schema, formData)).toEqual({
        $name: '',
        billing_address: {
          $name: 'billing_address',
          city: {
            $name: 'billing_address.city',
          },
          state: {
            $name: 'billing_address.state',
          },
          street_address: {
            $name: 'billing_address.street_address',
          },
        },
      });
    });
    it('should return a pathSchema for a schema with references in an array item', () => {
      const schema: RJSFSchema = {
        definitions: {
          address: {
            type: 'object',
            properties: {
              street_address: {
                type: 'string',
              },
              city: {
                type: 'string',
              },
              state: {
                type: 'string',
              },
            },
            required: ['street_address', 'city', 'state'],
          },
        },
        type: 'object',
        properties: {
          address_list: {
            title: 'Address list',
            type: 'array',
            items: {
              $ref: '#/definitions/address',
            },
          },
        },
      };

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

      expect(toPathSchema(testValidator, schema, '', schema, formData)).toEqual({
        $name: '',
        address_list: {
          $name: 'address_list',
          '0': {
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
          '1': {
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
      });
    });
    it('should return an pathSchema with different types of arrays', () => {
      const schema: RJSFSchema = {
        definitions: {
          Thing: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                default: 'Default name',
              },
            },
          },
        },
        type: 'object',
        properties: {
          listOfStrings: {
            type: 'array',
            title: 'A list of strings',
            items: {
              type: 'string',
              default: 'bazinga',
            },
          },
          multipleChoicesList: {
            type: 'array',
            title: 'A multiple choices list',
            items: {
              type: 'string',
              enum: ['foo', 'bar', 'fuzz', 'qux'],
            },
            uniqueItems: true,
          },
          fixedItemsList: {
            type: 'array',
            title: 'A list of fixed items',
            items: [
              {
                title: 'A string value',
                type: 'string',
                default: 'lorem ipsum',
              },
              {
                title: 'a boolean value',
                type: 'boolean',
              },
            ],
            additionalItems: {
              title: 'Additional item',
              type: 'number',
            },
          },
          minItemsList: {
            type: 'array',
            title: 'A list with a minimal number of items',
            minItems: 3,
            items: {
              $ref: '#/definitions/Thing',
            },
          },
          defaultsAndMinItems: {
            type: 'array',
            title: 'List and item level defaults',
            minItems: 5,
            default: ['carp', 'trout', 'bream'],
            items: {
              type: 'string',
              default: 'unidentified',
            },
          },
          nestedList: {
            type: 'array',
            title: 'Nested list',
            items: {
              type: 'array',
              title: 'Inner list',
              items: {
                type: 'string',
                default: 'lorem ipsum',
              },
            },
          },
          listOfObjects: {
            type: 'array',
            title: 'List of objects',
            items: {
              type: 'object',
              title: 'Object in list',
              properties: {
                name: {
                  type: 'string',
                  default: 'Default name',
                },
                id: {
                  type: 'number',
                  default: 'an id',
                },
              },
            },
          },
          unorderable: {
            title: 'Unorderable items',
            type: 'array',
            items: {
              type: 'string',
              default: 'lorem ipsum',
            },
          },
          unremovable: {
            title: 'Unremovable items',
            type: 'array',
            items: {
              type: 'string',
              default: 'lorem ipsum',
            },
          },
          noToolbar: {
            title: 'No add, remove and order buttons',
            type: 'array',
            items: {
              type: 'string',
              default: 'lorem ipsum',
            },
          },
          fixedNoToolbar: {
            title: 'Fixed array without buttons',
            type: 'array',
            items: [
              {
                title: 'A number',
                type: 'number',
                default: 42,
              },
              {
                title: 'A boolean',
                type: 'boolean',
                default: false,
              },
            ],
            additionalItems: {
              title: 'A string',
              type: 'string',
              default: 'lorem ipsum',
            },
          },
        },
      };

      const formData = {
        listOfStrings: ['foo', 'bar'],
        multipleChoicesList: ['foo', 'bar'],
        fixedItemsList: ['Some text', true, 123],
        minItemsList: [
          {
            name: 'Default name',
          },
          {
            name: 'Default name',
          },
          {
            name: 'Default name',
          },
        ],
        defaultsAndMinItems: ['carp', 'trout', 'bream', 'unidentified', 'unidentified'],
        nestedList: [['lorem', 'ipsum'], ['dolor']],
        listOfObjects: [{ name: 'name1', id: 123 }, { name: 'name2', id: 1234 }, { id: 12345 }],
        unorderable: ['one', 'two'],
        unremovable: ['one', 'two'],
        noToolbar: ['one', 'two'],
        fixedNoToolbar: [42, true, 'additional item one', 'additional item two'],
      };

      const schemaUtils = createSchemaUtils(testValidator, schema);
      expect(schemaUtils.toPathSchema(schema, '', formData)).toEqual({
        $name: '',
        defaultsAndMinItems: {
          $name: 'defaultsAndMinItems',
          '0': {
            $name: 'defaultsAndMinItems.0',
          },
          '1': {
            $name: 'defaultsAndMinItems.1',
          },
          '2': {
            $name: 'defaultsAndMinItems.2',
          },
          '3': {
            $name: 'defaultsAndMinItems.3',
          },
          '4': {
            $name: 'defaultsAndMinItems.4',
          },
        },
        fixedItemsList: {
          $name: 'fixedItemsList',
          '0': {
            $name: 'fixedItemsList.0',
          },
          '1': {
            $name: 'fixedItemsList.1',
          },
          '2': {
            $name: 'fixedItemsList.2',
          },
        },
        fixedNoToolbar: {
          $name: 'fixedNoToolbar',
          '0': {
            $name: 'fixedNoToolbar.0',
          },
          '1': {
            $name: 'fixedNoToolbar.1',
          },
          '2': {
            $name: 'fixedNoToolbar.2',
          },
          '3': {
            $name: 'fixedNoToolbar.3',
          },
        },
        listOfObjects: {
          $name: 'listOfObjects',
          '0': {
            $name: 'listOfObjects.0',
            id: {
              $name: 'listOfObjects.0.id',
            },
            name: {
              $name: 'listOfObjects.0.name',
            },
          },
          '1': {
            $name: 'listOfObjects.1',
            id: {
              $name: 'listOfObjects.1.id',
            },
            name: {
              $name: 'listOfObjects.1.name',
            },
          },
          '2': {
            $name: 'listOfObjects.2',
            id: {
              $name: 'listOfObjects.2.id',
            },
            name: {
              $name: 'listOfObjects.2.name',
            },
          },
        },
        listOfStrings: {
          $name: 'listOfStrings',
          '0': {
            $name: 'listOfStrings.0',
          },
          '1': {
            $name: 'listOfStrings.1',
          },
        },
        minItemsList: {
          $name: 'minItemsList',
          '0': {
            $name: 'minItemsList.0',
            name: {
              $name: 'minItemsList.0.name',
            },
          },
          '1': {
            $name: 'minItemsList.1',
            name: {
              $name: 'minItemsList.1.name',
            },
          },
          '2': {
            $name: 'minItemsList.2',
            name: {
              $name: 'minItemsList.2.name',
            },
          },
        },
        multipleChoicesList: {
          $name: 'multipleChoicesList',
          '0': {
            $name: 'multipleChoicesList.0',
          },
          '1': {
            $name: 'multipleChoicesList.1',
          },
        },
        nestedList: {
          $name: 'nestedList',
          '0': {
            $name: 'nestedList.0',
            '0': {
              $name: 'nestedList.0.0',
            },
            '1': {
              $name: 'nestedList.0.1',
            },
          },
          '1': {
            $name: 'nestedList.1',
            '0': {
              $name: 'nestedList.1.0',
            },
          },
        },
        noToolbar: {
          $name: 'noToolbar',
          '0': {
            $name: 'noToolbar.0',
          },
          '1': {
            $name: 'noToolbar.1',
          },
        },
        unorderable: {
          $name: 'unorderable',
          '0': {
            $name: 'unorderable.0',
          },
          '1': {
            $name: 'unorderable.1',
          },
        },
        unremovable: {
          $name: 'unremovable',
          '0': {
            $name: 'unremovable.0',
          },
          '1': {
            $name: 'unremovable.1',
          },
        },
      });
    });
    it('should return a pathSchema for a schema with oneOf', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          str: { type: 'string' },
        },
        oneOf: [
          {
            properties: {
              lorem: {
                type: 'string',
              },
            },
          },
          {
            properties: {
              ipsum: {
                type: 'string',
              },
            },
          },
        ],
      };

      const formData = {
        str: 'string',
        lorem: 'loremValue',
      };

      // Two options per getClosestMatchingOption, the first one is false, the second one makes the lorem value true
      testValidator.setReturnValues({ isValid: [false, true] });

      expect(toPathSchema(testValidator, schema, '', schema, formData)).toEqual({
        $name: '',
        lorem: {
          $name: 'lorem',
        },
        str: {
          $name: 'str',
        },
      });
    });
    it('should return a pathSchema for a schema with anyOf', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          str: { type: 'string' },
        },
        anyOf: [
          {
            properties: {
              lorem: {
                type: 'string',
              },
            },
          },
          {
            properties: {
              ipsum: {
                type: 'string',
              },
            },
          },
        ],
      };

      const formData = {
        str: 'string',
        ipsum: 'ipsumValue',
      };
      // Two per option using getClosestMatchingOption, the first ones are both false
      // the second ones make the ipsum value true
      testValidator.setReturnValues({ isValid: [false, false, false, true] });

      expect(toPathSchema(testValidator, schema, '', schema, formData)).toEqual({
        $name: '',
        ipsum: {
          $name: 'ipsum',
        },
        str: {
          $name: 'str',
        },
      });
    });
    it('should handle recursive ref to one level', () => {
      const result = toPathSchema(testValidator, RECURSIVE_REF, undefined, RECURSIVE_REF);
      expect(result).toEqual({
        $name: '',
        name: {
          $name: 'name',
        },
        children: {
          $name: 'children',
          name: {
            $name: 'children.name',
          },
          children: {
            $name: 'children.children',
          },
        },
      });
    });
    it('should handle recursive allof ref to one level, based on formData', () => {
      const result = toPathSchema(testValidator, RECURSIVE_REF_ALLOF, undefined, RECURSIVE_REF_ALLOF);
      expect(result).toEqual({
        $name: '',
        value: {
          $name: 'value',
        },
      });
    });
  });
}
