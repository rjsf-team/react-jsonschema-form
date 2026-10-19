import { render } from '@testing-library/react';

import BaseInputTemplate from '../src/BaseInputTemplate/index.ts';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

describe('BaseInputTemplate', () => {
  test('keeps the pattern and inputMode extraProps carries on a numeric field', () => {
    const { container } = render(
      <BaseInputTemplate
        {...makeWidgetMockProps({
          schema: { type: 'number' },
          extraProps: { pattern: '[0-9]*[.]?[0-9]{0,2}', inputMode: 'tel' },
        })}
      />,
    );

    const input = container.querySelector('input')!;
    expect(input).toHaveAttribute('pattern', '[0-9]*[.]?[0-9]{0,2}');
    expect(input).toHaveAttribute('inputmode', 'tel');
    // The title names the constraint the derived pattern imposes, so it goes when that pattern is replaced
    expect(input).not.toHaveAttribute('title');
  });

  test('titles a numeric field whose derived pattern extraProps leaves alone', () => {
    const { container } = render(
      <BaseInputTemplate {...makeWidgetMockProps({ schema: { type: 'integer' }, extraProps: { step: 5 } })} />,
    );

    expect(container.querySelector('input')).toHaveAttribute('title', 'Enter a whole number');
  });

  test("keeps Input's focus ring on an invalid input, so it still shows when it takes keyboard focus", () => {
    const { container } = render(
      // oxlint-disable-next-line typescript/no-deprecated -- a template rendered without a plan reads the deprecated prop
      <BaseInputTemplate {...makeWidgetMockProps({ rawErrors: ['too short'] })} />,
    );

    const input = container.querySelector('input')!;
    expect(input).toHaveClass('border-destructive', 'focus-visible:ring-[3px]');
    expect(input).not.toHaveClass('focus-visible:ring-0');
  });
});
