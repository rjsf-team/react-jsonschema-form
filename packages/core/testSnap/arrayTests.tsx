import { ComponentType } from 'react';
import renderer, { TestRendererOptions } from 'react-test-renderer';
import { RJSFSchema, ErrorSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

import { FormProps } from '../src';

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

export const CHECKBOXES_CUSTOMIZE = 'checkboxes';

export type ArrayRenderCustomOptions = {
  checkboxes?: TestRendererOptions;
};

export default function arrayTests(Form: ComponentType<FormProps>, customOptions: ArrayRenderCustomOptions = {}) {
  describe('array fields', () => {
    test('array', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'string',
        },
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('fixed array', () => {
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
      const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('checkboxes', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'string',
          enum: ['a', 'b', 'c'],
        },
        uniqueItems: true,
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} />, customOptions.checkboxes).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('array icons', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'string',
        },
      };
      const uiSchema: UiSchema = {
        'ui:options': { copyable: true },
      };
      const tree = renderer
        .create(<Form schema={schema} uiSchema={uiSchema} validator={validator} formData={['a', 'b']} />)
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('has errors', () => {
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
      const tree = renderer.create(<Form schema={schema} validator={validator} extraErrors={extraErrors} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('no errors', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
        },
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('empty errors array', () => {
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
      const tree = renderer.create(<Form schema={schema} validator={validator} extraErrors={extraErrors} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
  describe('with title and description', () => {
    test('array', () => {
      const schema: RJSFSchema = {
        type: 'array',
        ...titleAndDesc,
        items: {
          ...itemTitleAndDesc,
          type: 'string',
        },
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('fixed array', () => {
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
      const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('checkboxes', () => {
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
      const tree = renderer.create(<Form schema={schema} validator={validator} />, customOptions.checkboxes).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('array icons', () => {
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
      const tree = renderer
        .create(<Form schema={schema} uiSchema={uiSchema} validator={validator} formData={['a', 'b']} />)
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
  describe('with title and description from uiSchema', () => {
    test('array', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'string',
        },
      };
      const tree = renderer.create(<Form schema={schema} uiSchema={uiTitleAndDesc} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('fixed array', () => {
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
      const tree = renderer.create(<Form schema={schema} uiSchema={uiTitleAndDesc} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('checkboxes', () => {
      const schema: RJSFSchema = {
        type: 'array',
        items: {
          type: 'string',
          enum: ['a', 'b', 'c'],
        },
        uniqueItems: true,
      };
      const tree = renderer
        .create(<Form schema={schema} uiSchema={uiTitleAndDesc} validator={validator} />, customOptions.checkboxes)
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('array icons', () => {
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
      const tree = renderer
        .create(<Form schema={schema} uiSchema={uiSchema} validator={validator} formData={['a', 'b']} />)
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
  describe('with title and description from both', () => {
    test('array', () => {
      const schema: RJSFSchema = {
        type: 'array',
        ...titleAndDesc,
        items: {
          type: 'string',
        },
      };
      const tree = renderer.create(<Form schema={schema} uiSchema={uiTitleAndDesc} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('fixed array', () => {
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
      const tree = renderer.create(<Form schema={schema} uiSchema={uiTitleAndDesc} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('checkboxes', () => {
      const schema: RJSFSchema = {
        type: 'array',
        ...titleAndDesc,
        items: {
          type: 'string',
          enum: ['a', 'b', 'c'],
        },
        uniqueItems: true,
      };
      const tree = renderer
        .create(<Form schema={schema} uiSchema={uiTitleAndDesc} validator={validator} />, customOptions.checkboxes)
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('array icons', () => {
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
      const tree = renderer
        .create(<Form schema={schema} uiSchema={uiSchema} validator={validator} formData={['a', 'b']} />)
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
  describe('with title and description with global label off', () => {
    test('array', () => {
      const schema: RJSFSchema = {
        type: 'array',
        ...titleAndDesc,
        items: {
          ...itemTitleAndDesc,
          type: 'string',
        },
      };
      const tree = renderer.create(<Form schema={schema} uiSchema={labelsOff} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('fixed array', () => {
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
      const tree = renderer.create(<Form schema={schema} uiSchema={labelsOff} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('checkboxes', () => {
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
      const tree = renderer
        .create(<Form schema={schema} uiSchema={labelsOff} validator={validator} />, customOptions.checkboxes)
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('array icons', () => {
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
      const tree = renderer
        .create(<Form schema={schema} uiSchema={uiSchema} validator={validator} formData={['a', 'b']} />)
        .toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
}
