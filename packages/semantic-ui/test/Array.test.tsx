import arrayTests from '@rjsf/core/testSnap/arrayTests';

import Form from '../src';

/** Mock the `react-component-ref` component used by semantic-ui to simply render the children, otherwise tests fail */
jest.mock('@fluentui/react-component-ref', () => ({
  ...jest.requireActual('@fluentui/react-component-ref'),
  Ref: jest.fn().mockImplementation(({ children }) => children),
}));

arrayTests(Form);
