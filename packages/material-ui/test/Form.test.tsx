import formTests, { SLIDER_CUSTOMIZE } from '@rjsf/core/testSnap/formTests';

import Form from '../src';

// The material-ui Slider is trying to call `findDOMNode()` within a useEffect() hook. Since the hook deals with
// null nodes, we just mock it to always return null.
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  findDOMNode: jest.fn(() => null),
}));

formTests(Form, {
  [SLIDER_CUSTOMIZE]: {
    createNodeMock: (element) => {
      // the `Slider` code expects a ref for a span.root to exist, so use the feature of
      // react-test-renderer to create one
      // See: https://reactjs.org/docs/test-renderer.html#ideas
      if (element.type === 'span' && element.props.id === 'root') {
        // Pretend to be an event listening component inside of an event listening document
        return {
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          ownerDocument: {
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
          },
        };
      }
      return null;
    },
  },
});
