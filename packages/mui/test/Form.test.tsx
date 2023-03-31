import formTests, { SLIDER_CUSTOMIZE, TEXTAREA_CUSTOMIZE } from '@rjsf/core/testSnap/formTests';

import Form from '../src';

// The `TextareaAutosize` code reads the following data from the `getComputedStyle()` function in a useEffect hook
jest.spyOn(window, 'getComputedStyle').mockImplementation(() => {
  return {
    width: 100,
    'box-sizing': 10,
    'padding-bottom': 1,
    'padding-top': 1,
    'border-bottom-width': 1,
    'border-top-width': 1,
  } as unknown as CSSStyleDeclaration;
});

formTests(Form, {
  [TEXTAREA_CUSTOMIZE]: {
    createNodeMock: (element) => {
      if (element.type === 'textarea') {
        // the `TextareaAutosize` code expects a ref for two textareas to exist, so use the feature of
        // react-test-renderer to create one
        // See: https://reactjs.org/docs/test-renderer.html#ideas
        if (element.props['aria-hidden']) {
          // The hidden one reads the following values
          return {
            style: { width: 10 },
            scrollHeight: 100,
          };
        }
        // The other one only really needs an empty object
        return {};
      }
      return null;
    },
  },
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
