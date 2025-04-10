import { SELECT_CUSTOMIZE } from '@rjsf/snapshot-tests';

export const FORM_RENDER_OPTIONS = {
  [SELECT_CUSTOMIZE]: {
    createNodeMock: (element: any) => {
      if (element.type === 'span' && element.props['aria-hidden']) {
        // the `rc-select` MultipleSelector code expects a ref for this span to exist, so use the feature of
        // react-test-renderer to create one
        // See: https://reactjs.org/docs/test-renderer.html#ideas
        return { scrollWidth: 100 };
      }
      return null;
    },
  },
};
