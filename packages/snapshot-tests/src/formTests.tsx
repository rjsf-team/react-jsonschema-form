import { ComponentType } from 'react';
import renderer, { TestRendererOptions } from 'react-test-renderer';
import { FormProps } from '@rjsf/core';
import {
  RJSFSchema,
  ErrorSchema,
  UiSchema,
  Experimental_DefaultFormStateBehavior,
  bracketNameGenerator,
  dotNotationNameGenerator,
} from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

jest.mock('@rjsf/utils', () => ({
  ...jest.requireActual('@rjsf/utils'),
  // Disable the getTestIds within the snapshot tests by returning an empty object
  getTestIds: jest.fn(() => ({})),
}));

export const SELECT_CUSTOMIZE = 'selectMulti';
export const SLIDER_CUSTOMIZE = 'slider';
export const TEXTAREA_CUSTOMIZE = 'textarea';

export type FormRenderCustomOptions = {
  selectMulti?: TestRendererOptions;
  slider?: TestRendererOptions;
  textarea?: TestRendererOptions;
};

export function formTests(Form: ComponentType<FormProps>, customOptions: FormRenderCustomOptions = {}) {
  describe('single fields', () => {
    describe('string field', () => {
      test('regular', () => {
        const schema: RJSFSchema = {
          type: 'string',
        };
        const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
        expect(tree).toMatchSnapshot();
      });
      test('format email', () => {
        const schema: RJSFSchema = {
          type: 'string',
          format: 'email',
        };
        const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
        expect(tree).toMatchSnapshot();
      });
      test('format uri', () => {
        const schema: RJSFSchema = {
          type: 'string',
          format: 'uri',
        };
        const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
        expect(tree).toMatchSnapshot();
      });
      test('format data-url', () => {
        const schema: RJSFSchema = {
          type: 'string',
          format: 'data-url',
        };
        const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
        expect(tree).toMatchSnapshot();
      });
    });
    test('string field with placeholder', () => {
      const schema: RJSFSchema = {
        type: 'string',
      };
      const uiSchema = {
        'ui:placeholder': 'placeholder',
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} uiSchema={uiSchema} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('number field', () => {
      const schema: RJSFSchema = {
        type: 'number',
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('number field 0', () => {
      const schema: RJSFSchema = {
        type: 'number',
      };
      const formData = 0;
      const tree = renderer.create(<Form schema={schema} validator={validator} formData={formData} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('null field', () => {
      const schema: RJSFSchema = {
        type: 'null',
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('unsupported field', () => {
      const schema: RJSFSchema = {
        type: undefined,
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('format color', () => {
      const schema: RJSFSchema = {
        type: 'string',
        format: 'color',
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('format date', () => {
      const schema: RJSFSchema = {
        type: 'string',
        format: 'date',
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('format datetime', () => {
      const schema: RJSFSchema = {
        type: 'string',
        format: 'datetime',
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('format time', () => {
      const schema: RJSFSchema = {
        type: 'string',
        format: 'time',
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('password field', () => {
      const schema: RJSFSchema = {
        type: 'string',
      };
      const uiSchema = {
        'ui:widget': 'password',
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} uiSchema={uiSchema} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('up/down field', () => {
      const schema: RJSFSchema = {
        type: 'number',
      };
      const uiSchema = {
        'ui:widget': 'updown',
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} uiSchema={uiSchema} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('textarea field', () => {
      const schema: RJSFSchema = {
        type: 'string',
      };
      const uiSchema = {
        'ui:widget': 'textarea',
      };
      const tree = renderer
        .create(<Form schema={schema} validator={validator} uiSchema={uiSchema} />, customOptions[TEXTAREA_CUSTOMIZE])
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('select field', () => {
      const schema: RJSFSchema = {
        type: 'string',
        enum: ['foo', 'bar'],
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('select field multiple choice', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'string',
          enum: ['foo', 'bar', 'fuzz', 'qux'],
        },
        uniqueItems: true,
      };
      const tree = renderer
        .create(<Form schema={schema} validator={validator} />, customOptions[SELECT_CUSTOMIZE])
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('select field multiple choice with labels', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'number',
          anyOf: [
            {
              enum: [1],
              title: 'Blue',
            },
            {
              enum: [2],
              title: 'Red',
            },
            {
              enum: [3],
              title: 'Green',
            },
          ],
        },
        uniqueItems: true,
      };
      const tree = renderer
        .create(<Form schema={schema} validator={validator} />, customOptions[SELECT_CUSTOMIZE])
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('select field single choice enumDisabled', () => {
      const schema: RJSFSchema = {
        type: 'string',
        enum: ['foo', 'bar'],
      };
      const uiSchema = {
        'ui:enumDisabled': ['bar'],
      };
      const tree = renderer.create(<Form schema={schema} uiSchema={uiSchema} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('select field single choice enumDisabled using radio widget', () => {
      const schema: RJSFSchema = {
        type: 'string',
        enum: ['foo', 'bar'],
      };
      const uiSchema = {
        'ui:widget': 'radio',
        'ui:enumDisabled': ['bar'],
      };
      const tree = renderer.create(<Form schema={schema} uiSchema={uiSchema} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('select field single choice uiSchema disabled using radio widget', () => {
      const schema: RJSFSchema = {
        type: 'string',
        enum: ['foo', 'bar'],
      };
      const uiSchema = {
        'ui:widget': 'radio',
        'ui:disabled': true,
      };
      const tree = renderer.create(<Form schema={schema} uiSchema={uiSchema} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('select field single choice form disabled using radio widget', () => {
      const schema: RJSFSchema = {
        type: 'string',
        enum: ['foo', 'bar'],
      };
      const uiSchema = {
        'ui:widget': 'radio',
      };
      const tree = renderer
        .create(<Form schema={schema} uiSchema={uiSchema} validator={validator} disabled />)
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('select field multiple choice enumDisabled', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'string',
          enum: ['foo', 'bar', 'fuzz', 'qux'],
        },
        uniqueItems: true,
      };
      const uiSchema = {
        'ui:enumDisabled': ['bar'],
      };
      const tree = renderer
        .create(<Form schema={schema} uiSchema={uiSchema} validator={validator} />, customOptions[SELECT_CUSTOMIZE])
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('select field multiple choice enumDisabled using checkboxes', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'string',
          enum: ['foo', 'bar', 'fuzz', 'qux'],
        },
        uniqueItems: true,
      };
      const uiSchema = {
        'ui:widget': 'checkboxes',
        'ui:enumDisabled': ['bar'],
      };
      const tree = renderer
        .create(<Form schema={schema} uiSchema={uiSchema} validator={validator} />, customOptions[SELECT_CUSTOMIZE])
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('select field single choice formData', () => {
      const schema: RJSFSchema = {
        type: 'string',
        enum: ['foo', 'bar'],
      };
      const formData = 'bar';
      const tree = renderer.create(<Form schema={schema} formData={formData} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('select field multiple choice formData', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'string',
          enum: ['foo', 'bar', 'fuzz', 'qux'],
        },
        uniqueItems: true,
      };
      const formData = ['foo', 'bar'];
      const tree = renderer
        .create(<Form schema={schema} formData={formData} validator={validator} />, customOptions[SELECT_CUSTOMIZE])
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('checkbox field', () => {
      const schema: RJSFSchema = {
        type: 'boolean',
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('checkbox field with label', () => {
      const schema: RJSFSchema = {
        type: 'boolean',
        title: 'test',
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('checkbox field with label and description', () => {
      const schema: RJSFSchema = {
        type: 'boolean',
        title: 'test',
        description: 'test description',
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('checkbox field with label and rich text description', () => {
      const schema: RJSFSchema = {
        type: 'boolean',
        title: 'test',
        description: '**test** __description__',
      };
      const uiSchema: UiSchema = { 'ui:enableMarkdownInDescription': true };
      const tree = renderer.create(<Form schema={schema} uiSchema={uiSchema} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('checkboxes field', () => {
      const schema: RJSFSchema = {
        type: 'array',
        title: 'An enum list rendered as checkboxes',
        items: {
          type: 'string',
          enum: ['foo', 'bar', 'fuzz', 'qux'],
        },
        uniqueItems: true,
      };
      const uiSchema = {
        'ui:widget': 'checkboxes',
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} uiSchema={uiSchema} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('radio field', () => {
      const schema: RJSFSchema = {
        type: 'boolean',
      };
      const uiSchema = {
        'ui:widget': 'radio',
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} uiSchema={uiSchema} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('slider field', () => {
      const schema: RJSFSchema = {
        type: 'integer',
        minimum: 42,
        maximum: 100,
      };
      const uiSchema = {
        'ui:widget': 'range',
      };
      const tree = renderer
        .create(
          <Form schema={schema} validator={validator} uiSchema={uiSchema} formData={75} />,
          customOptions[SLIDER_CUSTOMIZE],
        )
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('hidden field', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          'my-field': {
            type: 'string',
          },
        },
      };
      const uiSchema = {
        'my-field': {
          'ui:widget': 'hidden',
        },
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} uiSchema={uiSchema} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('field with description', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          'my-field': {
            type: 'string',
            description: 'some description',
          },
        },
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('field with description in uiSchema', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          'my-field': {
            type: 'string',
            description: 'some description',
          },
        },
      };
      const uiSchema = {
        'my-field': {
          'ui:description': 'some other description',
        },
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} uiSchema={uiSchema} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('field with markdown description', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          'my-field': {
            type: 'string',
            description: 'some **Rich** description',
          },
        },
      };
      const uiSchema = {
        'my-field': { 'ui:enableMarkdownInDescription': true },
      };
      const tree = renderer.create(<Form schema={schema} uiSchema={uiSchema} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('field with markdown description in uiSchema', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          'my-field': {
            type: 'string',
            description: 'some **Rich** description',
          },
        },
      };
      const uiSchema = {
        'my-field': {
          'ui:description': 'some other description',
          'ui:enableMarkdownInDescription': true,
        },
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} uiSchema={uiSchema} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('title field', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          title: {
            type: 'string',
          },
        },
      };
      const uiSchema = {
        'ui:title': 'Titre 1',
        title: {
          'ui:title': 'Titre 2',
        },
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} uiSchema={uiSchema} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('hidden label', () => {
      const schema: RJSFSchema = {
        type: 'string',
      };
      const uiSchema = {
        'ui:options': {
          label: false,
        },
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} uiSchema={uiSchema} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('using custom tagName', () => {
      const schema: RJSFSchema = {
        type: 'string',
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} tagName='div' />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('schema examples', () => {
      const schema: RJSFSchema = {
        type: 'string',
        examples: ['Firefox', 'Chrome', 'Opera', 'Vivaldi', 'Safari'],
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('help and error display', () => {
      const schema: RJSFSchema = {
        type: 'string',
      };
      const uiSchema = {
        'ui:help': 'help me!',
      };
      const errors: string[] = ['an error'];
      const extraErrors = { __errors: errors } as ErrorSchema;
      const tree = renderer
        .create(<Form schema={schema} uiSchema={uiSchema} validator={validator} extraErrors={extraErrors} />)
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
    describe('optional data controls', () => {
      let schema: RJSFSchema;
      let uiSchema: UiSchema;
      let experimental_defaultFormStateBehavior: Experimental_DefaultFormStateBehavior;
      let formData: any;
      beforeAll(() => {
        schema = {
          title: 'test',
          properties: {
            nestedObjectOptional: {
              type: 'object',
              properties: {
                test: {
                  type: 'string',
                },
                deepObjectOptional: {
                  type: 'object',
                  properties: {
                    deepTest: {
                      type: 'string',
                    },
                  },
                },
                deepObject: {
                  type: 'object',
                  properties: {
                    deepTest: {
                      type: 'string',
                    },
                  },
                },
                deepArrayOptional: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                deepArrayOptional2: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                deepArray: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
              required: ['deepObject', 'deepArray'],
            },
            nestedArrayOptional: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            nestedObject: {
              type: 'object',
              properties: {
                test: {
                  type: 'string',
                },
              },
            },
            nestedArray: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            optionalObjectWithOneofs: {
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
                },
              ],
            },
            optionalArrayWithAnyofs: {
              anyOf: [
                {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                {
                  type: 'array',
                  items: {
                    type: 'number',
                  },
                },
                {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      test: {
                        type: 'string',
                      },
                    },
                  },
                },
              ],
            },
          },
          required: ['nestedObject', 'nestedArray'],
        };
        uiSchema = {
          'ui:globalOptions': {
            enableOptionalDataFieldForType: ['object', 'array'],
          },
          nestedObjectOptional: {
            deepArrayOptional: {
              'ui:enableOptionalDataFieldForType': ['object'],
            },
          },
        };
        experimental_defaultFormStateBehavior = {
          // Set the emptyObjectFields to only populate required defaults to highlight the code working
          emptyObjectFields: 'populateRequiredDefaults',
        };
        formData = {
          nestedObjectOptional: {
            test: 'foo',
          },
          nestedArrayOptional: ['bar'],
        };
      });
      test('does not show optional controls when not turned on in uiSchema and no formData', () => {
        const formProps: FormProps = {
          schema,
          uiSchema: {},
          validator,
          experimental_defaultFormStateBehavior,
        };
        const tree = renderer.create(<Form {...formProps} />).toJSON();
        expect(tree).toMatchSnapshot();
      });
      test('shows "add" optional controls when turned on in uiSchema and no formData', () => {
        const formProps: FormProps = {
          schema,
          uiSchema,
          validator,
          experimental_defaultFormStateBehavior,
        };
        const tree = renderer.create(<Form {...formProps} />).toJSON();
        expect(tree).toMatchSnapshot();
      });
      test('shows "add" and "remove" optional controls when turned on in uiSchema and formData', () => {
        const formProps: FormProps = {
          schema,
          uiSchema,
          validator,
          experimental_defaultFormStateBehavior,
          formData,
        };
        const tree = renderer.create(<Form {...formProps} />).toJSON();
        expect(tree).toMatchSnapshot();
      });
      test('does not show optional controls when not turned on in uiSchema, readonly and no formData', () => {
        const formProps: FormProps = {
          schema,
          uiSchema: {},
          validator,
          experimental_defaultFormStateBehavior,
          readonly: true,
        };
        const tree = renderer.create(<Form {...formProps} />).toJSON();
        expect(tree).toMatchSnapshot();
      });
      test('shows "add" optional controls when turned on in uiSchema, disabled and no formData', () => {
        const formProps: FormProps = {
          schema,
          uiSchema,
          validator,
          experimental_defaultFormStateBehavior,
          disabled: true,
        };
        const tree = renderer.create(<Form {...formProps} />).toJSON();
        expect(tree).toMatchSnapshot();
      });
      test('shows "add" and "remove" optional controls when turned on in uiSchema, readonly and formData', () => {
        const formProps: FormProps = {
          schema,
          uiSchema,
          validator,
          experimental_defaultFormStateBehavior,
          formData,
          readonly: true,
        };
        const tree = renderer.create(<Form {...formProps} />).toJSON();
        expect(tree).toMatchSnapshot();
      });
    });
  });

  describe('nameGenerator', () => {
    describe('bracketNameGenerator', () => {
      test('simple fields', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            firstName: {
              type: 'string',
            },
            age: {
              type: 'number',
            },
            active: {
              type: 'boolean',
            },
          },
        };
        const tree = renderer
          .create(<Form schema={schema} validator={validator} nameGenerator={bracketNameGenerator} />)
          .toJSON();
        expect(tree).toMatchSnapshot();
      });

      test('nested object', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            person: {
              type: 'object',
              properties: {
                firstName: {
                  type: 'string',
                },
                lastName: {
                  type: 'string',
                },
                address: {
                  type: 'object',
                  properties: {
                    street: {
                      type: 'string',
                    },
                    city: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        };
        const tree = renderer
          .create(<Form schema={schema} validator={validator} nameGenerator={bracketNameGenerator} />)
          .toJSON();
        expect(tree).toMatchSnapshot();
      });

      test('array of strings', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        };
        const formData = { tags: ['foo', 'bar'] };
        const tree = renderer
          .create(
            <Form schema={schema} formData={formData} validator={validator} nameGenerator={bracketNameGenerator} />,
          )
          .toJSON();
        expect(tree).toMatchSnapshot();
      });

      test('array of objects', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            tasks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                  },
                  done: {
                    type: 'boolean',
                  },
                },
              },
            },
          },
        };
        const formData = {
          tasks: [
            { title: 'Task 1', done: false },
            { title: 'Task 2', done: true },
          ],
        };
        const tree = renderer
          .create(
            <Form schema={schema} formData={formData} validator={validator} nameGenerator={bracketNameGenerator} />,
          )
          .toJSON();
        expect(tree).toMatchSnapshot();
      });

      test('select field with enum', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            color: {
              type: 'string',
              enum: ['red', 'green', 'blue'],
            },
          },
        };
        const tree = renderer
          .create(<Form schema={schema} validator={validator} nameGenerator={bracketNameGenerator} />)
          .toJSON();
        expect(tree).toMatchSnapshot();
      });

      test('radio field', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            option: {
              type: 'string',
              enum: ['foo', 'bar'],
            },
          },
        };
        const uiSchema = {
          option: {
            'ui:widget': 'radio',
          },
        };
        const tree = renderer
          .create(
            <Form schema={schema} uiSchema={uiSchema} validator={validator} nameGenerator={bracketNameGenerator} />,
          )
          .toJSON();
        expect(tree).toMatchSnapshot();
      });

      test('checkboxes field', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            choices: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['foo', 'bar', 'baz'],
              },
              uniqueItems: true,
            },
          },
        };
        const uiSchema = {
          choices: {
            'ui:widget': 'checkboxes',
          },
        };
        const tree = renderer
          .create(
            <Form schema={schema} uiSchema={uiSchema} validator={validator} nameGenerator={bracketNameGenerator} />,
          )
          .toJSON();
        expect(tree).toMatchSnapshot();
      });

      test('textarea field', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            description: {
              type: 'string',
            },
          },
        };
        const uiSchema = {
          description: {
            'ui:widget': 'textarea',
          },
        };
        const tree = renderer
          .create(
            <Form schema={schema} uiSchema={uiSchema} validator={validator} nameGenerator={bracketNameGenerator} />,
            customOptions[TEXTAREA_CUSTOMIZE],
          )
          .toJSON();
        expect(tree).toMatchSnapshot();
      });
    });

    describe('dotNotationNameGenerator', () => {
      test('simple fields', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            firstName: {
              type: 'string',
            },
            age: {
              type: 'number',
            },
            active: {
              type: 'boolean',
            },
          },
        };
        const tree = renderer
          .create(<Form schema={schema} validator={validator} nameGenerator={dotNotationNameGenerator} />)
          .toJSON();
        expect(tree).toMatchSnapshot();
      });

      test('nested object', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            person: {
              type: 'object',
              properties: {
                firstName: {
                  type: 'string',
                },
                lastName: {
                  type: 'string',
                },
                address: {
                  type: 'object',
                  properties: {
                    street: {
                      type: 'string',
                    },
                    city: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        };
        const tree = renderer
          .create(<Form schema={schema} validator={validator} nameGenerator={dotNotationNameGenerator} />)
          .toJSON();
        expect(tree).toMatchSnapshot();
      });

      test('array of strings', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        };
        const formData = { tags: ['foo', 'bar'] };
        const tree = renderer
          .create(
            <Form schema={schema} formData={formData} validator={validator} nameGenerator={dotNotationNameGenerator} />,
          )
          .toJSON();
        expect(tree).toMatchSnapshot();
      });

      test('array of objects', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            tasks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                  },
                  done: {
                    type: 'boolean',
                  },
                },
              },
            },
          },
        };
        const formData = {
          tasks: [
            { title: 'Task 1', done: false },
            { title: 'Task 2', done: true },
          ],
        };
        const tree = renderer
          .create(
            <Form schema={schema} formData={formData} validator={validator} nameGenerator={dotNotationNameGenerator} />,
          )
          .toJSON();
        expect(tree).toMatchSnapshot();
      });

      test('select field with enum', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            color: {
              type: 'string',
              enum: ['red', 'green', 'blue'],
            },
          },
        };
        const tree = renderer
          .create(<Form schema={schema} validator={validator} nameGenerator={dotNotationNameGenerator} />)
          .toJSON();
        expect(tree).toMatchSnapshot();
      });
    });
  });
}
