import { ComponentType } from 'react';
import { render } from '@testing-library/react';
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

export function formTests(Form: ComponentType<FormProps>) {
  describe('single fields', () => {
    describe('string field', () => {
      test('regular', async () => {
        const schema: RJSFSchema = {
          type: 'string',
        };
        const { asFragment } = render(<Form schema={schema} validator={validator} />);
        expect(asFragment()).toMatchSnapshot();
      });
      test('format email', async () => {
        const schema: RJSFSchema = {
          type: 'string',
          format: 'email',
        };
        const { asFragment } = render(<Form schema={schema} validator={validator} />);
        expect(asFragment()).toMatchSnapshot();
      });
      test('format uri', async () => {
        const schema: RJSFSchema = {
          type: 'string',
          format: 'uri',
        };
        const { asFragment } = render(<Form schema={schema} validator={validator} />);
        expect(asFragment()).toMatchSnapshot();
      });
      test('format data-url', async () => {
        const schema: RJSFSchema = {
          type: 'string',
          format: 'data-url',
        };
        const { asFragment } = render(<Form schema={schema} validator={validator} />);
        expect(asFragment()).toMatchSnapshot();
      });
    });
    test('string field with placeholder', async () => {
      const schema: RJSFSchema = {
        type: 'string',
      };
      const uiSchema = {
        'ui:placeholder': 'placeholder',
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} uiSchema={uiSchema} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('number field', async () => {
      const schema: RJSFSchema = {
        type: 'number',
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('number field 0', async () => {
      const schema: RJSFSchema = {
        type: 'number',
      };
      const formData = 0;
      const { asFragment } = render(<Form schema={schema} validator={validator} formData={formData} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('null field', async () => {
      const schema: RJSFSchema = {
        type: 'null',
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('unsupported field', async () => {
      const schema: RJSFSchema = {
        type: undefined,
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('format color', async () => {
      const schema: RJSFSchema = {
        type: 'string',
        format: 'color',
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('format date', async () => {
      const schema: RJSFSchema = {
        type: 'string',
        format: 'date',
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('format datetime', async () => {
      const schema: RJSFSchema = {
        type: 'string',
        format: 'datetime',
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('format time', async () => {
      const schema: RJSFSchema = {
        type: 'string',
        format: 'time',
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('password field', async () => {
      const schema: RJSFSchema = {
        type: 'string',
      };
      const uiSchema = {
        'ui:widget': 'password',
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} uiSchema={uiSchema} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('up/down field', async () => {
      const schema: RJSFSchema = {
        type: 'number',
      };
      const uiSchema = {
        'ui:widget': 'updown',
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} uiSchema={uiSchema} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('textarea field', async () => {
      const schema: RJSFSchema = {
        type: 'string',
      };
      const uiSchema = {
        'ui:widget': 'textarea',
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} uiSchema={uiSchema} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('select field', async () => {
      const schema: RJSFSchema = {
        type: 'string',
        enum: ['foo', 'bar'],
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('select field multiple choice', async () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'string',
          enum: ['foo', 'bar', 'fuzz', 'qux'],
        },
        uniqueItems: true,
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('select field multiple choice with labels', async () => {
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
      const { asFragment } = render(<Form schema={schema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('select field single choice enumDisabled', async () => {
      const schema: RJSFSchema = {
        type: 'string',
        enum: ['foo', 'bar'],
      };
      const uiSchema = {
        'ui:enumDisabled': ['bar'],
      };
      const { asFragment } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('select field single choice enumDisabled using radio widget', async () => {
      const schema: RJSFSchema = {
        type: 'string',
        enum: ['foo', 'bar'],
      };
      const uiSchema = {
        'ui:widget': 'radio',
        'ui:enumDisabled': ['bar'],
      };
      const { asFragment } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('select field single choice uiSchema disabled using radio widget', async () => {
      const schema: RJSFSchema = {
        type: 'string',
        enum: ['foo', 'bar'],
      };
      const uiSchema = {
        'ui:widget': 'radio',
        'ui:disabled': true,
      };
      const { asFragment } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('select field single choice form disabled using radio widget', async () => {
      const schema: RJSFSchema = {
        type: 'string',
        enum: ['foo', 'bar'],
      };
      const uiSchema = {
        'ui:widget': 'radio',
      };
      const { asFragment } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} disabled />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('select field multiple choice enumDisabled', async () => {
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
      const { asFragment } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('select field multiple choice enumDisabled using checkboxes', async () => {
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
      const { asFragment } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('checkboxes widget with custom options and labels', () => {
      const schema: RJSFSchema = {
        type: 'array',
        title: 'Checkbox Group',
        description: 'A group of checkboxes',
        items: {
          type: 'string',
          enum: ['option1', 'option2', 'option3'],
        },
        uniqueItems: true,
      };
      const uiSchema = {
        'ui:widget': 'checkboxes',
        'ui:options': {
          inline: true,
          help: 'Select all that apply',
        },
      };
      const formData = ['option1'];

      const { asFragment } = render(
        <Form schema={schema} uiSchema={uiSchema} formData={formData} validator={validator} />,
      );
      expect(asFragment()).toMatchSnapshot();
    });
    test('checkboxes widget with required field', () => {
      const schema: RJSFSchema = {
        type: 'array',
        title: 'Required Checkbox Group',
        description: 'At least one option must be selected',
        items: {
          type: 'string',
          enum: ['red', 'green', 'blue'],
        },
        minItems: 1,
        uniqueItems: true,
      };
      const uiSchema = {
        'ui:widget': 'checkboxes',
      };

      const { asFragment } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('select field single choice formData', async () => {
      const schema: RJSFSchema = {
        type: 'string',
        enum: ['foo', 'bar'],
      };
      const formData = 'bar';
      const { asFragment } = render(<Form schema={schema} formData={formData} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('select field multiple choice formData', async () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'string',
          enum: ['foo', 'bar', 'fuzz', 'qux'],
        },
        uniqueItems: true,
      };
      const formData = ['foo', 'bar'];
      const { asFragment } = render(<Form schema={schema} formData={formData} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('checkbox field', async () => {
      const schema: RJSFSchema = {
        type: 'boolean',
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('checkbox field with label', async () => {
      const schema: RJSFSchema = {
        type: 'boolean',
        title: 'test',
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('checkbox field with label and description', async () => {
      const schema: RJSFSchema = {
        type: 'boolean',
        title: 'test',
        description: 'test description',
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('checkbox field with label and rich text description', async () => {
      const schema: RJSFSchema = {
        type: 'boolean',
        title: 'test',
        description: '**test** __description__',
      };
      const uiSchema: UiSchema = { 'ui:enableMarkdownInDescription': true };
      const { asFragment } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });

    test('checkbox field with description in schema and FieldTemplate', async () => {
      const schema: RJSFSchema = {
        type: 'boolean',
        title: 'test',
        description: 'This is a checkbox description',
      };
      const uiSchema: UiSchema = {
        'ui:widget': 'checkbox',
      };
      const { asFragment } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });

    test('radio widget with description in schema and FieldTemplate', async () => {
      const schema: RJSFSchema = {
        type: 'boolean',
        title: 'test',
        description: 'This is a radio description',
      };
      const uiSchema: UiSchema = {
        'ui:widget': 'radio',
      };
      const { asFragment } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });

    test('select widget with description in schema and FieldTemplate', async () => {
      const schema: RJSFSchema = {
        type: 'boolean',
        title: 'test',
        description: 'This is a select description',
      };
      const uiSchema: UiSchema = {
        'ui:widget': 'select',
      };
      const { asFragment } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('checkboxes field', async () => {
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
      const { asFragment } = render(<Form schema={schema} validator={validator} uiSchema={uiSchema} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('radio field', async () => {
      const schema: RJSFSchema = {
        type: 'boolean',
      };
      const uiSchema = {
        'ui:widget': 'radio',
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} uiSchema={uiSchema} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('slider field', async () => {
      const schema: RJSFSchema = {
        type: 'integer',
        minimum: 42,
        maximum: 100,
      };
      const uiSchema = {
        'ui:widget': 'range',
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} uiSchema={uiSchema} formData={75} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('hidden field', async () => {
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
      const { asFragment } = render(<Form schema={schema} validator={validator} uiSchema={uiSchema} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('field with description', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          'my-field': {
            type: 'string',
            description: 'some description',
          },
        },
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('field with description in uiSchema', async () => {
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
      const { asFragment } = render(<Form schema={schema} validator={validator} uiSchema={uiSchema} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('field with markdown description', async () => {
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
      const { asFragment } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('field with markdown description in uiSchema', async () => {
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
      const { asFragment } = render(<Form schema={schema} validator={validator} uiSchema={uiSchema} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('title field', async () => {
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
      const { asFragment } = render(<Form schema={schema} validator={validator} uiSchema={uiSchema} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('hidden label', async () => {
      const schema: RJSFSchema = {
        type: 'string',
      };
      const uiSchema = {
        'ui:options': {
          label: false,
        },
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} uiSchema={uiSchema} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('using custom tagName', async () => {
      const schema: RJSFSchema = {
        type: 'string',
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} tagName='div' />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('schema examples', async () => {
      const schema: RJSFSchema = {
        type: 'string',
        examples: ['Firefox', 'Chrome', 'Opera', 'Vivaldi', 'Safari'],
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('help and error display', async () => {
      const schema: RJSFSchema = {
        type: 'string',
      };
      const uiSchema = {
        'ui:help': 'help me!',
      };
      const errors: string[] = ['an error'];
      const extraErrors = { __errors: errors } as ErrorSchema;
      const { asFragment } = render(
        <Form schema={schema} uiSchema={uiSchema} validator={validator} extraErrors={extraErrors} />,
      );
      expect(asFragment()).toMatchSnapshot();
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
      test('does not show optional controls when not turned on in uiSchema and no formData', async () => {
        const formProps: FormProps = {
          schema,
          uiSchema: {},
          validator,
          experimental_defaultFormStateBehavior,
        };
        const { asFragment } = render(<Form {...formProps} />);
        expect(asFragment()).toMatchSnapshot();
      });
      test('shows "add" optional controls when turned on in uiSchema and no formData', async () => {
        const formProps: FormProps = {
          schema,
          uiSchema,
          validator,
          experimental_defaultFormStateBehavior,
        };
        const { asFragment } = render(<Form {...formProps} />);
        expect(asFragment()).toMatchSnapshot();
      });
      test('shows "add" and "remove" optional controls when turned on in uiSchema and formData', async () => {
        const formProps: FormProps = {
          schema,
          uiSchema,
          validator,
          experimental_defaultFormStateBehavior,
          formData,
        };
        const { asFragment } = render(<Form {...formProps} />);
        expect(asFragment()).toMatchSnapshot();
      });
      test('does not show optional controls when not turned on in uiSchema, readonly and no formData', async () => {
        const formProps: FormProps = {
          schema,
          uiSchema: {},
          validator,
          experimental_defaultFormStateBehavior,
          readonly: true,
        };
        const { asFragment } = render(<Form {...formProps} />);
        expect(asFragment()).toMatchSnapshot();
      });
      test('shows "add" optional controls when turned on in uiSchema, disabled and no formData', async () => {
        const formProps: FormProps = {
          schema,
          uiSchema,
          validator,
          experimental_defaultFormStateBehavior,
          disabled: true,
        };
        const { asFragment } = render(<Form {...formProps} />);
        expect(asFragment()).toMatchSnapshot();
      });
      test('shows "add" and "remove" optional controls when turned on in uiSchema, readonly and formData', async () => {
        const formProps: FormProps = {
          schema,
          uiSchema,
          validator,
          experimental_defaultFormStateBehavior,
          formData,
          readonly: true,
        };
        const { asFragment } = render(<Form {...formProps} />);
        expect(asFragment()).toMatchSnapshot();
      });
    });
  });

  describe('nameGenerator', () => {
    describe('bracketNameGenerator', () => {
      test('simple fields', async () => {
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
        const { asFragment } = render(
          <Form schema={schema} validator={validator} nameGenerator={bracketNameGenerator} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });

      test('nested object', async () => {
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
        const { asFragment } = render(
          <Form schema={schema} validator={validator} nameGenerator={bracketNameGenerator} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });

      test('array of strings', async () => {
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
        const { asFragment } = render(
          <Form schema={schema} formData={formData} validator={validator} nameGenerator={bracketNameGenerator} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });

      test('array of objects', async () => {
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
        const { asFragment } = render(
          <Form schema={schema} formData={formData} validator={validator} nameGenerator={bracketNameGenerator} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });

      test('select field with enum', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            color: {
              type: 'string',
              enum: ['red', 'green', 'blue'],
            },
          },
        };
        const { asFragment } = render(
          <Form schema={schema} validator={validator} nameGenerator={bracketNameGenerator} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });

      test('radio field', async () => {
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
        const { asFragment } = render(
          <Form schema={schema} uiSchema={uiSchema} validator={validator} nameGenerator={bracketNameGenerator} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });

      test('checkboxes field', async () => {
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
        const { asFragment } = render(
          <Form schema={schema} uiSchema={uiSchema} validator={validator} nameGenerator={bracketNameGenerator} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });

      test('textarea field', async () => {
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
        const { asFragment } = render(
          <Form schema={schema} uiSchema={uiSchema} validator={validator} nameGenerator={bracketNameGenerator} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });
    });

    describe('dotNotationNameGenerator', () => {
      test('simple fields', async () => {
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
        const { asFragment } = render(
          <Form schema={schema} validator={validator} nameGenerator={dotNotationNameGenerator} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });

      test('nested object', async () => {
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
        const { asFragment } = render(
          <Form schema={schema} validator={validator} nameGenerator={dotNotationNameGenerator} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });

      test('array of strings', async () => {
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
        const { asFragment } = render(
          <Form schema={schema} formData={formData} validator={validator} nameGenerator={dotNotationNameGenerator} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });

      test('array of objects', async () => {
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
        const { asFragment } = render(
          <Form schema={schema} formData={formData} validator={validator} nameGenerator={dotNotationNameGenerator} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });

      test('select field with enum', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            color: {
              type: 'string',
              enum: ['red', 'green', 'blue'],
            },
          },
        };
        const { asFragment } = render(
          <Form schema={schema} validator={validator} nameGenerator={dotNotationNameGenerator} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });
    });
  });
}
