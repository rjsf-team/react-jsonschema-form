import arrayTests, { CHECKBOXES_CUSTOMIZE } from '@rjsf/core/testSnap/arrayTests';

import '../__mocks__/matchMedia.mock';
import Form from '../src';

arrayTests(Form, {
  [CHECKBOXES_CUSTOMIZE]: {
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
