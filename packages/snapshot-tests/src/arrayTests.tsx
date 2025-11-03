import { ComponentType } from 'react';
import { render } from '@testing-library/react';
import { FormProps } from '@rjsf/core';
import { RJSFSchema, ErrorSchema, UiSchema, bracketNameGenerator, dotNotationNameGenerator } from '@rjsf/utils';
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

const itemTitleAndDesc = {
  title: 'Test item',
  description: 'a test item description',
};

const uiTitleAndDesc: UiSchema = {
  'ui:options': {
    title: 'My Field',
    description: 'a fancier description',
  },
  items: {
    'ui:options': {
      title: 'My Item',
      description: 'a fancier item description',
    },
  },
};

const labelsOff: UiSchema = {
  'ui:globalOptions': { label: false },
};

export function arrayTests(Form: ComponentType<FormProps>) {
  describe('array fields', () => {
    test('array', async () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'string',
        },
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('fixed array', async () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: [
          {
            type: 'string',
          },
          {
            type: 'number',
          },
        ],
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('checkboxes', async () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'string',
          enum: ['a', 'b', 'c'],
        },
        uniqueItems: true,
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('array icons', async () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'string',
        },
      };
      const uiSchema: UiSchema = {
        'ui:options': { copyable: true },
      };
      const { asFragment } = render(
        <Form schema={schema} uiSchema={uiSchema} validator={validator} formData={['a', 'b']} />,
      );
      expect(asFragment()).toMatchSnapshot();
    });
    test('has errors', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
        },
      };
      const errors: any[] = ['Bad input'];
      const extraErrors = {
        name: { __errors: errors },
      } as unknown as ErrorSchema;
      const { asFragment } = render(<Form schema={schema} validator={validator} extraErrors={extraErrors} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('no errors', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
        },
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('empty errors array', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
        },
      };
      const errors: any[] = [];
      const extraErrors = {
        name: { __errors: errors },
      } as unknown as ErrorSchema;
      const { asFragment } = render(<Form schema={schema} validator={validator} extraErrors={extraErrors} />);
      expect(asFragment()).toMatchSnapshot();
    });
  });
  describe('with title and description', () => {
    test('array', async () => {
      const schema: RJSFSchema = {
        type: 'array',
        ...titleAndDesc,
        items: {
          ...itemTitleAndDesc,
          type: 'string',
        },
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('fixed array', async () => {
      const schema: RJSFSchema = {
        type: 'array',
        ...titleAndDesc,
        items: [
          {
            ...itemTitleAndDesc,
            type: 'string',
          },
          {
            ...itemTitleAndDesc,
            type: 'number',
          },
        ],
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('checkboxes', async () => {
      const schema: RJSFSchema = {
        type: 'array',
        ...titleAndDesc,
        items: {
          ...itemTitleAndDesc,
          type: 'string',
          enum: ['a', 'b', 'c'],
        },
        uniqueItems: true,
      };
      const { asFragment } = render(<Form schema={schema} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('array icons', async () => {
      const schema: RJSFSchema = {
        type: 'array',
        ...titleAndDesc,
        items: {
          ...itemTitleAndDesc,
          type: 'string',
        },
      };
      const uiSchema: UiSchema = {
        'ui:options': { copyable: true },
      };
      const { asFragment } = render(
        <Form schema={schema} uiSchema={uiSchema} validator={validator} formData={['a', 'b']} />,
      );
      expect(asFragment()).toMatchSnapshot();
    });
  });
  describe('with title and description from uiSchema', () => {
    test('array', async () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'string',
        },
      };
      const { asFragment } = render(<Form schema={schema} uiSchema={uiTitleAndDesc} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('fixed array', async () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: [
          {
            type: 'string',
          },
          {
            type: 'number',
          },
        ],
      };
      const { asFragment } = render(<Form schema={schema} uiSchema={uiTitleAndDesc} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('checkboxes', async () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'string',
          enum: ['a', 'b', 'c'],
        },
        uniqueItems: true,
      };
      const { asFragment } = render(<Form schema={schema} uiSchema={uiTitleAndDesc} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('array icons', async () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'string',
        },
      };
      const uiSchema: UiSchema = {
        'ui:copyable': true,
        ...uiTitleAndDesc,
      };
      const { asFragment } = render(
        <Form schema={schema} uiSchema={uiSchema} validator={validator} formData={['a', 'b']} />,
      );
      expect(asFragment()).toMatchSnapshot();
    });
  });
  describe('with title and description from both', () => {
    test('array', async () => {
      const schema: RJSFSchema = {
        type: 'array',
        ...titleAndDesc,
        items: {
          type: 'string',
        },
      };
      const { asFragment } = render(<Form schema={schema} uiSchema={uiTitleAndDesc} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('fixed array', async () => {
      const schema: RJSFSchema = {
        type: 'array',
        ...titleAndDesc,
        items: [
          {
            type: 'string',
          },
          {
            type: 'number',
          },
        ],
      };
      const { asFragment } = render(<Form schema={schema} uiSchema={uiTitleAndDesc} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('checkboxes', async () => {
      const schema: RJSFSchema = {
        type: 'array',
        ...titleAndDesc,
        items: {
          type: 'string',
          enum: ['a', 'b', 'c'],
        },
        uniqueItems: true,
      };
      const { asFragment } = render(<Form schema={schema} uiSchema={uiTitleAndDesc} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('array icons', async () => {
      const schema: RJSFSchema = {
        type: 'array',
        ...titleAndDesc,
        items: {
          type: 'string',
        },
      };
      const uiSchema: UiSchema = {
        'ui:copyable': true,
        ...uiTitleAndDesc,
      };
      const { asFragment } = render(
        <Form schema={schema} uiSchema={uiSchema} validator={validator} formData={['a', 'b']} />,
      );
      expect(asFragment()).toMatchSnapshot();
    });
  });
  describe('with title and description with global label off', () => {
    test('array', async () => {
      const schema: RJSFSchema = {
        type: 'array',
        ...titleAndDesc,
        items: {
          ...itemTitleAndDesc,
          type: 'string',
        },
      };
      const { asFragment } = render(<Form schema={schema} uiSchema={labelsOff} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('fixed array', async () => {
      const schema: RJSFSchema = {
        type: 'array',
        ...titleAndDesc,
        items: [
          {
            ...itemTitleAndDesc,
            type: 'string',
          },
          {
            ...itemTitleAndDesc,
            type: 'number',
          },
        ],
      };
      const { asFragment } = render(<Form schema={schema} uiSchema={labelsOff} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('checkboxes', async () => {
      const schema: RJSFSchema = {
        type: 'array',
        ...titleAndDesc,
        items: {
          ...itemTitleAndDesc,
          type: 'string',
          enum: ['a', 'b', 'c'],
        },
        uniqueItems: true,
      };
      const { asFragment } = render(<Form schema={schema} uiSchema={labelsOff} validator={validator} />);
      expect(asFragment()).toMatchSnapshot();
    });
    test('array icons', async () => {
      const schema: RJSFSchema = {
        type: 'array',
        ...titleAndDesc,
        items: {
          ...itemTitleAndDesc,
          type: 'string',
        },
      };
      const uiSchema: UiSchema = {
        ...labelsOff,
        'ui:options': { copyable: true },
      };
      const { asFragment } = render(
        <Form schema={schema} uiSchema={uiSchema} validator={validator} formData={['a', 'b']} />,
      );
      expect(asFragment()).toMatchSnapshot();
    });
  });

  describe('nameGenerator', () => {
    describe('bracketNameGenerator', () => {
      test('array of strings', async () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: {
            type: 'string',
          },
        };
        const formData = ['foo', 'bar'];
        const { asFragment } = render(
          <Form schema={schema} formData={formData} validator={validator} nameGenerator={bracketNameGenerator} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });

      test('array of objects', async () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'number' },
            },
          },
        };
        const formData = [
          { name: 'Item 1', value: 10 },
          { name: 'Item 2', value: 20 },
        ];
        const { asFragment } = render(
          <Form schema={schema} formData={formData} validator={validator} nameGenerator={bracketNameGenerator} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });

      test('fixed array', async () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
        };
        const formData = ['text', 42, true];
        const { asFragment } = render(
          <Form schema={schema} formData={formData} validator={validator} nameGenerator={bracketNameGenerator} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });

      test('nested arrays', async () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        };
        const formData = [
          ['a', 'b'],
          ['c', 'd'],
        ];
        const { asFragment } = render(
          <Form schema={schema} formData={formData} validator={validator} nameGenerator={bracketNameGenerator} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });

      test('checkboxes with nameGenerator', async () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: {
            type: 'string',
            enum: ['foo', 'bar', 'baz'],
          },
          uniqueItems: true,
        };
        const { asFragment } = render(
          <Form schema={schema} validator={validator} nameGenerator={bracketNameGenerator} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });
    });

    describe('dotNotationNameGenerator', () => {
      test('array of strings', async () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: {
            type: 'string',
          },
        };
        const formData = ['foo', 'bar'];
        const { asFragment } = render(
          <Form schema={schema} formData={formData} validator={validator} nameGenerator={dotNotationNameGenerator} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });

      test('array of objects', async () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'number' },
            },
          },
        };
        const formData = [
          { name: 'Item 1', value: 10 },
          { name: 'Item 2', value: 20 },
        ];
        const { asFragment } = render(
          <Form schema={schema} formData={formData} validator={validator} nameGenerator={dotNotationNameGenerator} />,
        );
        expect(asFragment()).toMatchSnapshot();
      });
    });
  });
}
