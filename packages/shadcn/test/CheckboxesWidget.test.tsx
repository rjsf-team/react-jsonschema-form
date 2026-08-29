import { render } from '@testing-library/react';

import CheckboxesWidget from '../src/CheckboxesWidget/index.js';
import { makeWidgetMockProps } from './helpers/createMocks.js';

describe('CheckboxesWidget', () => {
  test('simple', () => {
    const { asFragment } = render(
      <CheckboxesWidget
        {...makeWidgetMockProps({
          options: {
            enumOptions: [{ label: 'A', value: 'a' }],
          },
        })}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });
  test('inline', () => {
    const { asFragment } = render(
      <CheckboxesWidget
        {...makeWidgetMockProps({
          options: {
            enumOptions: [{ label: 'A', value: 'a' }],
            inline: true,
          },
        })}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
