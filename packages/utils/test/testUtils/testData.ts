import reduce from 'lodash/reduce';

import {
  EnumOptionsType,
  ErrorSchema,
  ErrorSchemaBuilder,
  ONE_OF_KEY,
  ID_KEY,
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

export const FALSY_OPTIONS: EnumOptionsType[] = [
  { value: '', label: 'Empty String' },
  { value: 0, label: 'Zero' },
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

export const SUPER_SCHEMA: RJSFSchema = {
  [ID_KEY]: 'super-schema',
  definitions: {
    foo: {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    },
    price: {
      title: 'Price per task ($)',
      type: 'number',
      multipleOf: 0.03,
      minimum: 0,
    },
    passwords: {
      type: 'object',
      properties: {
        pass1: { type: 'string' },
        pass2: { type: 'string' },
      },
      required: ['pass1', 'pass2'],
    },
    list: {
      type: 'array',
      items: { type: 'string' },
    },
    choice1: {
      type: 'object',
      properties: {
        choice: {
          type: 'string',
          const: 'one',
        },
        other: {
          type: 'number',
        },
      },
    },
    choice2: {
      type: 'object',
      properties: {
        choice: {
          type: 'string',
          const: 'two',
        },
        more: {
          type: 'string',
        },
      },
    },
  },
  type: 'object',
  properties: {
    foo: { type: 'string' },
    price: { $ref: '#/definitions/price' },
    passwords: { $ref: '#/definitions/passwords' },
    dataUrlWithName: { type: 'string', format: 'data-url' },
    multi: {
      anyOf: [{ $ref: '#/definitions/foo' }],
    },
    list: { $ref: '#/definitions/list' },
    single: {
      oneOf: [{ $ref: '#/definitions/choice1' }, { $ref: '#/definitions/choice2' }],
    },
    anything: {
      type: 'object',
      additionalProperties: {
        type: 'string',
      },
    },
  },
};

export const PROPERTY_DEPENDENCIES: RJSFSchema = {
  type: 'object',
  properties: {
    a: { type: 'string' },
    b: { type: 'integer' },
  },
  required: ['a'],
  dependencies: {
    a: ['b'],
  },
};

export const SCHEMA_DEPENDENCIES: RJSFSchema = {
  type: 'object',
  properties: {
    a: { type: 'string' },
  },
  dependencies: {
    a: {
      properties: {
        b: { type: 'integer' },
      },
    },
  },
};

export const SCHEMA_AND_ONEOF_REF_DEPENDENCIES: RJSFSchema = {
  type: 'object',
  definitions: {
    needsA: {
      properties: {
        a: { enum: ['int'] },
        b: { type: 'integer' },
      },
    },
    needsB: {
      properties: {
        a: { enum: ['bool'] },
        b: { type: 'boolean' },
      },
    },
  },
  properties: {
    a: { type: 'string', enum: ['int', 'bool'] },
  },
  dependencies: {
    a: {
      oneOf: [{ $ref: '#/definitions/needsA' }, { $ref: '#/definitions/needsB' }],
    },
  },
};

export const SCHEMA_AND_REQUIRED_DEPENDENCIES: RJSFSchema = {
  type: 'object',
  properties: {
    a: { type: 'string' },
    b: { type: 'integer' },
  },
  required: ['a'],
  dependencies: {
    a: {
      properties: {
        a: { type: 'string' },
      },
      required: ['b'],
    },
  },
};

export const SCHEMA_WITH_ONEOF_NESTED_DEPENDENCIES: RJSFSchema = {
  type: 'object',
  dependencies: {
    employee_accounts: {
      oneOf: [
        {
          properties: {
            employee_accounts: {
              const: true,
            },
            update_absences: {
              title: 'Update Absences',
              type: 'string',
              oneOf: [
                {
                  title: 'Both',
                  const: 'BOTH',
                },
              ],
            },
          },
        },
      ],
    },
    update_absences: {
      oneOf: [
        {
          properties: {
            permitted_extension: {
              title: 'Permitted Extension',
              type: 'integer',
            },
            update_absences: {
              const: 'BOTH',
            },
          },
        },
        {
          properties: {
            permitted_extension: {
              title: 'Permitted Extension',
              type: 'integer',
            },
            update_absences: {
              const: 'MEDICAL_ONLY',
            },
          },
        },
        {
          properties: {
            permitted_extension: {
              title: 'Permitted Extension',
              type: 'integer',
            },
            update_absences: {
              const: 'NON_MEDICAL_ONLY',
            },
          },
        },
      ],
    },
  },
  properties: {
    employee_accounts: {
      type: 'boolean',
      title: 'Employee Accounts',
    },
  },
};

export const SCHEMA_WITH_SINGLE_CONDITION: RJSFSchema = {
  type: 'object',
  properties: {
    country: {
      default: 'United States of America',
      enum: ['United States of America', 'Canada'],
    },
  },
  if: {
    properties: { country: { const: 'United States of America' } },
  },
  then: {
    properties: { postal_code: { pattern: '[0-9]{5}(-[0-9]{4})?' } },
  },
  else: {
    properties: {
      postal_code: { pattern: '[A-Z][0-9][A-Z] [0-9][A-Z][0-9]' },
    },
  },
};

export const SCHEMA_WITH_MULTIPLE_CONDITIONS: RJSFSchema = {
  type: 'object',
  properties: {
    Animal: {
      default: 'Cat',
      enum: ['Cat', 'Dog'],
      title: 'Animal',
      type: 'string',
    },
  },
  allOf: [
    {
      if: {
        required: ['Animal'],
        properties: {
          Animal: {
            const: 'Cat',
          },
        },
      },
      then: {
        properties: {
          Tail: {
            default: 'Long',
            enum: ['Long', 'Short', 'None'],
            title: 'Tail length',
            type: 'string',
          },
        },
        required: ['Tail'],
      },
    },
    {
      if: {
        required: ['Animal'],
        properties: {
          Animal: {
            const: 'Dog',
          },
        },
      },
      then: {
        properties: {
          Breed: {
            title: 'Breed',
            properties: {
              BreedName: {
                default: 'Alsatian',
                enum: ['Alsatian', 'Dalmation'],
                title: 'Breed name',
                type: 'string',
              },
            },
            allOf: [
              {
                if: {
                  required: ['BreedName'],
                  properties: {
                    BreedName: {
                      const: 'Alsatian',
                    },
                  },
                },
                then: {
                  properties: {
                    Fur: {
                      default: 'brown',
                      enum: ['black', 'brown'],
                      title: 'Fur',
                      type: 'string',
                    },
                  },
                  required: ['Fur'],
                },
              },
              {
                if: {
                  required: ['BreedName'],
                  properties: {
                    BreedName: {
                      const: 'Dalmation',
                    },
                  },
                },
                then: {
                  properties: {
                    Spots: {
                      default: 'small',
                      enum: ['large', 'small'],
                      title: 'Spots',
                      type: 'string',
                    },
                  },
                  required: ['Spots'],
                },
              },
            ],
            required: ['BreedName'],
          },
        },
      },
    },
  ],
  required: ['Animal'],
};

export const SCHEMA_WITH_NESTED_CONDITIONS: RJSFSchema = {
  type: 'object',
  properties: {
    country: {
      enum: ['USA'],
    },
  },
  required: ['country'],
  if: {
    properties: {
      country: {
        const: 'USA',
      },
    },
    required: ['country'],
  },
  then: {
    properties: {
      state: {
        type: 'string',
        enum: ['California', 'New York'],
      },
    },
    required: ['state'],
    if: {
      properties: {
        state: {
          const: 'New York',
        },
      },
      required: ['state'],
    },
    then: {
      properties: {
        city: {
          type: 'string',
          enum: ['New York City', 'Buffalo', 'Rochester'],
        },
      },
    },
    else: {
      if: {
        properties: {
          state: {
            const: 'California',
          },
        },
        required: ['state'],
      },
      then: {
        properties: {
          city: {
            type: 'string',
            enum: ['Los Angeles', 'San Diego', 'San Jose'],
          },
        },
      },
    },
  },
};

export const SCHEMA_WITH_ARRAY_CONDITION: RJSFSchema = {
  type: 'object',
  properties: {
    list: {
      type: 'array',
      items: SCHEMA_WITH_SINGLE_CONDITION,
    },
  },
};

export const SCHEMA_WITH_ALLOF_CANNOT_MERGE: RJSFSchema = {
  type: 'object',
  properties: {
    animal: {
      enum: ['Cat', 'Fish'],
    },
  },
  allOf: [
    {
      if: {
        properties: {
          animal: {
            const: 'Cat',
          },
        },
      },
      then: {
        properties: {
          food: {
            type: 'string',
            enum: ['meat', 'grass', 'fish'],
          },
        },
        required: ['food'],
      },
    },
    {
      if: {
        properties: {
          animal: {
            const: 'Fish',
          },
        },
      },
      then: {
        properties: {
          food: {
            type: 'string',
            enum: ['insect', 'worms'],
          },
          water: {
            type: 'string',
            enum: ['lake', 'sea'],
          },
        },
        required: ['food', 'water'],
      },
    },
    {
      required: ['animal'],
    },
  ],
};
