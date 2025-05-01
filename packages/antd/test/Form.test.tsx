import renderer from 'react-test-renderer';
import validator from '@rjsf/validator-ajv8';
import { RJSFSchema } from '@rjsf/utils';
import { formTests } from '@rjsf/snapshot-tests';

import '../__mocks__/matchMedia.mock';
import Form from '../src';
import { FORM_RENDER_OPTIONS } from './snapshotConstants';

formTests(Form, FORM_RENDER_OPTIONS);

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
