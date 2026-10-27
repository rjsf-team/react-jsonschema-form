import { render } from '@testing-library/react';

import GridTemplate from '../src/components/templates/GridTemplate.tsx';

describe('GridTemplate', () => {
  it("sets a column's span as --rjsf-span", () => {
    const { container } = render(<GridTemplate column span={6} />);

    expect(container.firstElementChild).toHaveClass('rjsf-grid-column');
    expect(container.firstElementChild?.getAttribute('style')).toContain('--rjsf-span: 6');
  });

  // The custom property inherits, so a row's span would reach its columns that have none
  it("leaves a row's span off", () => {
    const { container } = render(<GridTemplate span={6} />);

    expect(container.firstElementChild).toHaveClass('rjsf-grid-row');
    expect(container.firstElementChild).not.toHaveAttribute('style');
  });
});
