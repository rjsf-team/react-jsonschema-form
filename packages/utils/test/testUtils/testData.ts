import reduce from 'lodash/reduce';

import {
  EnumOptionsType,
  ErrorSchema,
  ErrorSchemaBuilder,
  ONE_OF_KEY,
  RJSFSchema,
  RJSFValidationError,
} from '../../src';

export const oneOfData = {
  name: 'second_option',
  flag: true,
  inner_spec: {
    name: 'inner_spec',
    special_spec: {
      name: 'special_spec',
      cpg_params: 'blah',
    },
  },
};
export const oneOfSchema: RJSFSchema = {
  type: 'object',
  title: 'Testing OneOfs',
  definitions: {
    special_spec_def: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          default: 'special_spec',
          readOnly: true,
        },
        cpg_params: {
          type: 'string',
        },
      },
      required: ['name'],
    },
    inner_first_choice_def: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          default: 'inner_first_choice',
          readOnly: true,
        },
        params: {
          type: 'string',
        },
      },
      required: ['name', 'params'],
      additionalProperties: false,
    },
    inner_second_choice_def: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          default: 'inner_second_choice',
          readOnly: true,
        },
        enumeration: {
          type: 'string',
          enum: ['enum_1', 'enum_2', 'enum_3'],
        },
        params: {
          type: 'string',
          default: '',
        },
      },
      required: ['name', 'enumeration'],
      additionalProperties: false,
    },
    inner_spec_2_def: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          default: 'inner_spec_2',
          readOnly: true,
        },
        inner_one_of: {
          oneOf: [
            {
              $ref: '#/definitions/inner_first_choice_def',
              title: 'inner_first_choice',
            },
            {
              $ref: '#/definitions/inner_second_choice_def',
              title: 'inner_second_choice',
            },
          ],
        },
      },
      required: ['name', 'inner_one_of'],
    },
    first_option_def: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          default: 'first_option',
          readOnly: true,
        },
        flag: {
          type: 'boolean',
          default: false,
        },
        inner_spec: {
          $ref: '#/definitions/inner_spec_2_def',
        },
        unlabeled_options: {
          oneOf: [
            {
              type: 'integer',
            },
            {
              type: 'array',
              items: {
                type: 'integer',
              },
            },
          ],
        },
      },
      required: ['name', 'inner_spec'],
      additionalProperties: false,
    },
    inner_spec_def: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          default: 'inner_spec',
          readOnly: true,
        },
        inner_one_of: {
          oneOf: [
            {
              $ref: '#/definitions/inner_first_choice_def',
              title: 'inner_first_choice',
            },
            {
              $ref: '#/definitions/inner_second_choice_def',
              title: 'inner_second_choice',
            },
          ],
        },
        special_spec: {
          $ref: '#/definitions/special_spec_def',
        },
      },
      required: ['name'],
    },
    second_option_def: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          default: 'second_option',
          readOnly: true,
        },
        flag: {
          type: 'boolean',
          default: false,
        },
        inner_spec: {
          $ref: '#/definitions/inner_spec_def',
        },
        unique_to_second: {
          type: 'integer',
        },
        labeled_options: {
          oneOf: [
            {
              type: 'string',
            },
            {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          ],
        },
      },
      required: ['name', 'inner_spec'],
      additionalProperties: false,
    },
  },
  oneOf: [
    {
      $ref: '#/definitions/first_option_def',
      title: 'first option',
    },
    {
      $ref: '#/definitions/second_option_def',
      title: 'second option',
    },
  ],
};
export const ONE_OF_SCHEMA_OPTIONS = oneOfSchema[ONE_OF_KEY]! as RJSFSchema[];
export const FIRST_ONE_OF: RJSFSchema = ONE_OF_SCHEMA_OPTIONS[0];
export const SECOND_ONE_OF: RJSFSchema = ONE_OF_SCHEMA_OPTIONS[1];
export const OPTIONAL_ONE_OF_SCHEMA: RJSFSchema = {
  oneOf: [
    {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          default: 'first_option',
          readOnly: true,
        },
      },
      additionalProperties: false,
    },
    {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          default: 'second_option',
          readOnly: true,
        },
        flag: {
          type: 'boolean',
          default: false,
        },
      },
      additionalProperties: false,
    },
    {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          default: 'third_option',
          readOnly: true,
        },
        flag: {
          type: 'boolean',
          default: false,
        },
        inner_obj: {
          type: 'object',
          properties: {
            foo: {
              type: 'string',
            },
          },
        },
      },
      additionalProperties: false,
    },
  ],
};
export const OPTIONAL_ONE_OF_SCHEMA_ONEOF = OPTIONAL_ONE_OF_SCHEMA[ONE_OF_KEY] as RJSFSchema[];
export const OPTIONAL_ONE_OF_DATA = { flag: true, inner_obj: { foo: 'bar' } };
export const SIMPLE_ONE_OF_SCHEMA = {
  oneOf: [
    {}, // object with no type should take the type from its parent schema
    { type: 'string' },
    { type: 'array', items: { type: 'string' } },
  ],
} as RJSFSchema;
export const FIRST_OPTION_ONE_OF_DATA = {
  flag: true,
  inner_spec: {
    name: 'inner_spec_2',
    special_spec: undefined,
  },
  name: 'first_option',
  unique_to_second: undefined,
};
export const ONE_OF_SCHEMA_DATA = { ...oneOfData, unique_to_second: 5 };

export const ALL_OPTIONS: EnumOptionsType[] = [
  { value: 'foo', label: 'Foo' },
  { value: 'bar', label: 'Bar' },
  { value: 'baz', label: 'Baz' },
  { value: 'boo', label: 'Boo' },
];

export const RECURSIVE_REF_ALLOF: RJSFSchema = {
  definitions: {
    '@enum': {
      type: 'object',
      properties: {
        name: {
          title: 'Name',
          type: 'string',
          default: '',
        },
        _id: {
          title: 'Value',
          type: 'number',
        },
        children: {
          title: 'Subvalues',
          type: 'array',
          items: {
            allOf: [
              {
                $ref: '#/definitions/@enum',
              },
            ],
          },
        },
      },
    },
  },
  type: 'object',
  properties: {
    value: {
      type: 'array',
      items: {
        allOf: [
          {
            $ref: '#/definitions/@enum',
          },
        ],
      },
      minItems: 1,
    },
  },
};

export const RECURSIVE_REF: RJSFSchema = {
  definitions: {
    '@enum': {
      type: 'object',
      properties: {
        name: {
          title: 'Name',
          type: 'string',
          default: '',
        },
        children: {
          $ref: '#/definitions/@enum',
        },
      },
    },
  },
  $ref: '#/definitions/@enum',
};

export const ERROR_MAPPER = {
  '': 'root error',
  foo: 'foo error',
  list: 'list error',
  'list.0': 'list 0 error',
  'list.1': 'list 1 error',
  nested: 'nested error',
  'nested.baz': 'baz error',
  'nested.blah': 'blah error',
};

export const TEST_FORM_DATA = {
  foo: 'bar',
  list: ['a', 'b'],
  nested: {
    baz: 1,
    blah: false,
  },
};

export const TEST_ERROR_SCHEMA: ErrorSchema = reduce(
  ERROR_MAPPER,
  (builder: ErrorSchemaBuilder, value, key) => {
    return builder.addErrors(value, key === '' ? undefined : key);
  },
  new ErrorSchemaBuilder()
).ErrorSchema;

export const TEST_ERROR_LIST: RJSFValidationError[] = reduce(
  ERROR_MAPPER,
  (list: RJSFValidationError[], value, key) => {
    list.push({ property: `.${key}`, message: value, stack: `.${key} ${value}` });
    return list;
  },
  []
);
