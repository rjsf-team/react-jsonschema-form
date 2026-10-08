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
});
