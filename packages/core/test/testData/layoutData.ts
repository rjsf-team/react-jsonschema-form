import { EnumOptionsType, RJSFSchema, UiSchema } from '@rjsf/utils';

export const SIMPLE_ONEOF: RJSFSchema = {
  title: 'Simple',
  type: 'object',
  discriminator: {
    propertyName: 'answer',
  },
  oneOf: [
    {
      title: 'Choice 1',
      type: 'object',
      properties: {
        answer: {
          type: 'string',
          default: '1',
          readOnly: true,
        },
      },
      required: ['answer'],
    },
    {
      title: 'Choice 2',
      type: 'object',
      properties: {
        answer: {
          type: 'string',
          default: '2',
          readOnly: true,
        },
      },
    },
  ],
};
export const SAMPLE_SCHEMA: RJSFSchema = {
  title: 'My Title',
  description: 'a storybook Material UI form',
  type: 'object',
  definitions: {
    str: {
      type: 'string',
      default: null,
    },
    int: {
      type: 'integer',
      default: null,
    },
    float: {
      type: 'number',
      default: null,
    },
  },
  properties: {
    simpleString: {
      $ref: '#/definitions/str',
    },
    simpleInt: {
      $ref: '#/definitions/int',
    },
    ranges: {
      type: 'object',
      properties: {
        int: {
          $ref: '#/definitions/int',
          default: 1000,
          minimum: 1000,
          maximum: 10000,
          multipleOf: 1000,
        },
        float: {
          $ref: '#/definitions/float',
          default: 100.0,
          minimum: 100.0,
          maximum: 1000.0,
          multipleOf: 100.0,
        },
      },
    },
  },
  required: ['ranges'],
};
export const sampleUISchema: UiSchema = {
  simpleString: {
    'ui:placeholder': 'Enter a string',
  },
};
export const SIMPLE_ONEOF_OPTIONS: EnumOptionsType[] = [
  { label: 'Choice 1', value: '1' },
  { label: 'Choice 2', value: '2' },
];
