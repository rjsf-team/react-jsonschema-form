import renderer from 'react-test-renderer';
import validator from '@rjsf/validator-ajv8';
import { RJSFSchema } from '@rjsf/utils';
import formTests, { SELECT_CUSTOMIZE } from '@rjsf/core/testSnap/formTests';

import '../__mocks__/matchMedia.mock';
import Form from '../src';

formTests(Form, {
  [SELECT_CUSTOMIZE]: {
    createNodeMock: (element) => {
      if (element.type === 'span' && element.props['aria-hidden']) {
        // the `rc-select` MultipleSelector code expects a ref for this span to exist, so use the feature of
        // react-test-renderer to create one
        // See: https://reactjs.org/docs/test-renderer.html#ideas
        return { scrollWidth: 100 };
      }
      return null;
    },
  },
});

describe('antd specific tests', () => {
  test('descriptionLocation tooltip in formContext', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        'my-field': {
          type: 'string',
          description: 'some description',
        },
      },
    };
    const formContext = { descriptionLocation: 'tooltip' };
    const tree = renderer.create(<Form schema={schema} validator={validator} formContext={formContext} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
