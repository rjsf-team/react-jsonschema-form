import { render } from '@testing-library/react';

import TextareaWidget from '../src/TextareaWidget';
import { makeWidgetMockProps } from './helpers/createMocks';

describe('TextareaWidget', () => {
  test('simple without errors', () => {
    const { asFragment } = render(<TextareaWidget {...makeWidgetMockProps({})} />);
    expect(asFragment()).toMatchSnapshot();
  });
  test('simple with errors', () => {
    const { asFragment } = render(
      <TextareaWidget {...makeWidgetMockProps({ rawErrors: ['Invalid 1', 'Invalid 2'] })} />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  test('simple without required', () => {
    const { asFragment } = render(<TextareaWidget {...makeWidgetMockProps({ required: false })} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
