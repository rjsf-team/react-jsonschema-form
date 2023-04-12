import { ComponentType } from 'react';
import renderer from 'react-test-renderer';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

import { FormProps } from '../src';

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

export default function arrayTests(Form: ComponentType<FormProps>) {
  describe('object fields', () => {
    test('object', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          a: { type: 'string', title: 'A' },
          b: { type: 'number', title: 'B' },
        },
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('additionalProperties', () => {
      const schema: RJSFSchema = {
        type: 'object',
        additionalProperties: true,
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} formData={{ foo: 'foo' }} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    test('show add button and fields if additionalProperties is true and not an object', () => {
      const schema: RJSFSchema = {
        additionalProperties: true,
      };
      const formData: any = {
        additionalProperty: 'should appear',
      };
      const tree = renderer.create(<Form schema={schema} validator={validator} formData={formData} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
    describe('with title and description', () => {
      test('object', () => {
        const schema: RJSFSchema = {
          type: 'object',
          ...titleAndDesc,
          properties: {
            a: { type: 'string', title: 'A', description: 'A description' },
            b: { type: 'number', title: 'B', description: 'B description' },
          },
        };
        const tree = renderer.create(<Form schema={schema} validator={validator} />).toJSON();
        expect(tree).toMatchSnapshot();
      });
      test('additionalProperties', () => {
        const schema: RJSFSchema = {
          type: 'object',
          ...titleAndDesc,
          additionalProperties: true,
        };
        const tree = renderer.create(<Form schema={schema} validator={validator} formData={{ foo: 'foo' }} />).toJSON();
        expect(tree).toMatchSnapshot();
      });
      test('show add button and fields if additionalProperties is true and not an object', () => {
        const schema: RJSFSchema = {
          ...titleAndDesc,
          additionalProperties: true,
        };
        const formData: any = {
          additionalProperty: 'should appear',
        };
        const tree = renderer.create(<Form schema={schema} validator={validator} formData={formData} />).toJSON();
        expect(tree).toMatchSnapshot();
      });
    });
    describe('with title and description from uiSchema', () => {
      test('object', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            a: { type: 'string', title: 'A' },
            b: { type: 'number', title: 'B' },
          },
        };
        const tree = renderer.create(<Form schema={schema} uiSchema={uiTitleAndDesc} validator={validator} />).toJSON();
        expect(tree).toMatchSnapshot();
      });
      test('additionalProperties', () => {
        const schema: RJSFSchema = {
          type: 'object',
          additionalProperties: true,
        };
        const tree = renderer
          .create(<Form schema={schema} uiSchema={uiTitleAndDesc} validator={validator} formData={{ foo: 'foo' }} />)
          .toJSON();
        expect(tree).toMatchSnapshot();
      });
      test('show add button and fields if additionalProperties is true and not an object', () => {
        const schema: RJSFSchema = {
          additionalProperties: true,
        };
        const formData: any = {
          additionalProperty: 'should appear',
        };
        const tree = renderer
          .create(<Form schema={schema} uiSchema={uiTitleAndDesc} validator={validator} formData={formData} />)
          .toJSON();
        expect(tree).toMatchSnapshot();
      });
    });
    describe('with title and description from both', () => {
      test('object', () => {
        const schema: RJSFSchema = {
          type: 'object',
          ...titleAndDesc,
          properties: {
            a: { type: 'string', title: 'A', description: 'A description' },
            b: { type: 'number', title: 'B', description: 'B description' },
          },
        };
        const tree = renderer.create(<Form schema={schema} uiSchema={uiTitleAndDesc} validator={validator} />).toJSON();
        expect(tree).toMatchSnapshot();
      });
      test('additionalProperties', () => {
        const schema: RJSFSchema = {
          type: 'object',
          ...titleAndDesc,
          additionalProperties: true,
        };
        const tree = renderer
          .create(<Form schema={schema} uiSchema={uiTitleAndDesc} validator={validator} formData={{ foo: 'foo' }} />)
          .toJSON();
        expect(tree).toMatchSnapshot();
      });
    });
    describe('with title and description with global label off', () => {
      test('object', () => {
        const schema: RJSFSchema = {
          type: 'object',
          ...titleAndDesc,
          properties: {
            a: { type: 'string', title: 'A', description: 'A description' },
            b: { type: 'number', title: 'B', description: 'B description' },
          },
        };
        const tree = renderer.create(<Form schema={schema} uiSchema={labelsOff} validator={validator} />).toJSON();
        expect(tree).toMatchSnapshot();
      });
      test('additionalProperties', () => {
        const schema: RJSFSchema = {
          type: 'object',
          ...titleAndDesc,
          additionalProperties: true,
        };
        const tree = renderer
          .create(<Form schema={schema} uiSchema={labelsOff} validator={validator} formData={{ foo: 'foo' }} />)
          .toJSON();
        expect(tree).toMatchSnapshot();
      });
      test('show add button and fields if additionalProperties is true and not an object', () => {
        const schema: RJSFSchema = {
          ...titleAndDesc,
          additionalProperties: true,
        };
        const formData: any = {
          additionalProperty: 'should appear',
        };
        const tree = renderer
          .create(<Form schema={schema} uiSchema={labelsOff} validator={validator} formData={formData} />)
          .toJSON();
        expect(tree).toMatchSnapshot();
      });
    });
  });
}
