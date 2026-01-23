import { RJSFSchema, UiSchema } from '@rjsf/utils';
import { render } from '@testing-library/react';
import validator from '@rjsf/validator-ajv8';

import Form from './WrappedForm';

describe('NativeSelectWidget', () => {
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
    const uiSchema: UiSchema = {
      color: {
        'ui:widget': 'NativeSelectWidget',
        'ui:placeholder': 'Pick something',
      },
    };
    const { asFragment } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);
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
    const uiSchema: UiSchema = {
      'ui:widget': 'NativeSelectWidget',
      'ui:placeholder': 'Pick something',
    };
    const { asFragment } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);
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
    const uiSchema: UiSchema = {
      'ui:widget': 'NativeSelectWidget',
      'ui:placeholder': 'Pick something',
    };
    const { asFragment } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
