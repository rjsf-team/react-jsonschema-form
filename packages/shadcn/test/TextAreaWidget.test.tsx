import { render, screen } from '@testing-library/react';

import TextareaWidget from '../src/TextareaWidget/index.ts';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

describe('TextareaWidget', () => {
  test('simple without errors', () => {
    const { asFragment } = render(<TextareaWidget {...makeWidgetMockProps({})} />);
    expect(screen.getByRole('textbox')).not.toHaveClass('border-destructive');
    expect(asFragment()).toMatchSnapshot();
  });
  test('simple with errors', () => {
    const { asFragment } = render(
      // oxlint-disable-next-line typescript/no-deprecated -- exercises the deprecated prop a component without a plan reads
      <TextareaWidget {...makeWidgetMockProps({ rawErrors: ['Invalid 1', 'Invalid 2'] })} />,
    );
    expect(screen.getByRole('textbox')).toHaveClass('border-destructive');
    expect(asFragment()).toMatchSnapshot();
  });

  test('simple without required', () => {
    const { asFragment } = render(<TextareaWidget {...makeWidgetMockProps({ required: false })} />);
    expect(screen.getByRole('textbox')).not.toHaveClass('border-destructive');
    expect(asFragment()).toMatchSnapshot();
  });
});
