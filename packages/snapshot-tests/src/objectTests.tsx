import { ComponentType } from 'react';
import { render } from '@testing-library/react';
import { FormProps } from '@rjsf/core';
import { RJSFSchema, UiSchema, bracketNameGenerator, dotNotationNameGenerator } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

jest.mock('@rjsf/utils', () => ({
  ...jest.requireActual('@rjsf/utils'),
  // Disable the getTestIds within the snapshot tests by returning an empty object
  getTestIds: jest.fn(() => ({})),
}));

const titleAndDesc = {
  title: 'Test field',
  description: 'a test description',
};

const uiTitleAndDesc: UiSchema = {
  'ui:options': {
    title: 'My Field',
    description: 'a fancier description',
  },
  a: {
    'ui:options': {
      title: 'My Item A',
      description: 'a fancier item A description',
    },
  },
  b: {
    'ui:options': {
      title: 'My Item B',
      description: 'a fancier item B description',
    },
  },
};

const labelsOff: UiSchema = {
  'ui:globalOptions': { label: false },
};

export function objectTests(Form: ComponentType<FormProps>) {
  describe('object fields', () => {
    test('object', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          a: { type: 'string', title: 'A' },
          b: { type: 'number', title: 'B' },
        },
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('additionalProperties', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        additionalProperties: true,
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} formData={{ foo: 'foo' }} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('additionalProperties, label off', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        additionalProperties: true,
      };
      const uiSchema: UiSchema = {
        'ui:label': false,
      };
      const { asFragment } = render(
        <Form schema={schema} uiSchema={uiSchema} validator={validator} formData={{ foo: 'foo' }} />,
      );
      expect(asFragment()).toMatchSnapshot();
    });
    test('additionalProperties, description', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        additionalProperties: {
          type: 'string',
          description: 'item description',
        },
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} formData={{ foo: 'foo' }} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('additionalProperties, object type', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            foo: {
              type: 'string',
            },
          },
        },
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} formData={{ foo: 'foo' }} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('additionalProperties, array type', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        additionalProperties: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} formData={{ foo: 'foo' }} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('show add button and fields if additionalProperties is true and not an object', async () => {
      const schema: RJSFSchema = {
        additionalProperties: true,
      };
      const formData: any = {
        additionalProperty: 'should appear',
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} formData={formData} />);
      expect(asFragment()).toMatchSnapshot();
    });
    describe('with title and description', () => {
      test('object', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          ...titleAndDesc,
          properties: {
            a: { type: 'string', title: 'A', description: 'A description' },
            b: { type: 'number', title: 'B', description: 'B description' },
          },
        };
        const { asFragment } = render(<Form schema={schema} validator={validator} />);
        expect(asFragment()).toMatchSnapshot();
      });
      test('additionalProperties', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          ...titleAndDesc,
          additionalProperties: true,
        };
        const { asFragment } = render(<Form schema={schema} validator={validator} formData={{ foo: 'foo' }} />);
        expect(asFragment()).toMatchSnapshot();
      });
      test('show add button and fields if additionalProperties is true and not an object', async () => {
        const schema: RJSFSchema = {
          ...titleAndDesc,
          additionalProperties: true,
        };
        const formData: any = {
          additionalProperty: 'should appear',
        };
        const { asFragment } = render(<Form schema={schema} validator={validator} formData={formData} />);
        expect(asFragment()).toMatchSnapshot();
      });
    });
    describe('with title and description from uiSchema', () => {
      test('object', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            a: { type: 'string', title: 'A' },
            b: { type: 'number', title: 'B' },
          },
        };
        const { asFragment } = render(<Form schema={schema} uiSchema={uiTitleAndDesc} validator={validator} />);
        expect(asFragment()).toMatchSnapshot();
      });
      test('additionalProperties', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          additionalProperties: true,
        };
        const { asFragment } = render(
          <Form schema={schema} uiSchema={uiTitleAndDesc} validator={validator} formData={{ foo: 'foo' }} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });
      test('show add button and fields if additionalProperties is true and not an object', async () => {
        const schema: RJSFSchema = {
          additionalProperties: true,
        };
        const formData: any = {
          additionalProperty: 'should appear',
        };
        const { asFragment } = render(
          <Form schema={schema} uiSchema={uiTitleAndDesc} validator={validator} formData={formData} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });
    });
    describe('with title and description from both', () => {
      test('object', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          ...titleAndDesc,
          properties: {
            a: { type: 'string', title: 'A', description: 'A description' },
            b: { type: 'number', title: 'B', description: 'B description' },
          },
        };
        const { asFragment } = render(<Form schema={schema} uiSchema={uiTitleAndDesc} validator={validator} />);
        expect(asFragment()).toMatchSnapshot();
      });
      test('additionalProperties', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          ...titleAndDesc,
          additionalProperties: true,
        };
        const { asFragment } = render(
          <Form schema={schema} uiSchema={uiTitleAndDesc} validator={validator} formData={{ foo: 'foo' }} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });
    });
    describe('with title and description with global label off', () => {
      test('object', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          ...titleAndDesc,
          properties: {
            a: { type: 'string', title: 'A', description: 'A description' },
            b: { type: 'number', title: 'B', description: 'B description' },
          },
        };
        const { asFragment } = render(<Form schema={schema} uiSchema={labelsOff} validator={validator} />);
        expect(asFragment()).toMatchSnapshot();
      });
      test('additionalProperties', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          ...titleAndDesc,
          additionalProperties: true,
        };
        const { asFragment } = render(
          <Form schema={schema} uiSchema={labelsOff} validator={validator} formData={{ foo: 'foo' }} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });
      test('show add button and fields if additionalProperties is true and not an object', async () => {
        const schema: RJSFSchema = {
          ...titleAndDesc,
          additionalProperties: true,
        };
        const formData: any = {
          additionalProperty: 'should appear',
        };
        const { asFragment } = render(
          <Form schema={schema} uiSchema={labelsOff} validator={validator} formData={formData} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });
    });
  });

  describe('nameGenerator', () => {
    describe('bracketNameGenerator', () => {
      test('simple object', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            age: { type: 'number' },
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
                name: { type: 'string' },
                address: {
                  type: 'object',
                  properties: {
                    street: { type: 'string' },
                    city: { type: 'string' },
                    country: { type: 'string' },
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

      test('object with additionalProperties', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
          additionalProperties: true,
        };
        const formData = {
          name: 'John',
          customField: 'customValue',
        };
        const { asFragment } = render(
          <Form schema={schema} formData={formData} validator={validator} nameGenerator={bracketNameGenerator} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });

      test('object with mixed types', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
            active: { type: 'boolean' },
            tags: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        };
        const formData = {
          name: 'Alice',
          age: 30,
          active: true,
          tags: ['developer', 'designer'],
        };
        const { asFragment } = render(
          <Form schema={schema} formData={formData} validator={validator} nameGenerator={bracketNameGenerator} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });
    });

    describe('dotNotationNameGenerator', () => {
      test('simple object', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            age: { type: 'number' },
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
                name: { type: 'string' },
                address: {
                  type: 'object',
                  properties: {
                    street: { type: 'string' },
                    city: { type: 'string' },
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

      test('object with mixed types', async () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
            count: { type: 'number' },
            items: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        };
        const formData = {
          name: 'Test',
          count: 5,
          items: ['a', 'b'],
        };
        const { asFragment } = render(
          <Form schema={schema} formData={formData} validator={validator} nameGenerator={dotNotationNameGenerator} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });
    });
  });
}
