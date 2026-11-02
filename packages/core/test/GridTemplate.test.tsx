import { render } from '@testing-library/react';

import GridTemplate from '../src/components/templates/GridTemplate.tsx';
import { setupConsoleWarnSuppression } from './testUtils.tsx';

describe('GridTemplate', () => {
  const warnings = setupConsoleWarnSuppression();

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

  it('keeps the fieldId it is handed for its warnings off the <div>', () => {
    const { container } = render(<GridTemplate column fieldId='root' />);

    expect(container.firstElementChild).not.toHaveAttribute('fieldid');
  });

  // `rjsf.css` spans whole tracks only, so a half step would fall back to one track without a sign why
  it('warns that a half step is not a whole number', () => {
    render(<GridTemplate column fieldId='root' span={4.5} />);

    expect(warnings.consoleSpy).toHaveBeenCalledWith(
      'A layout grid column\'s `span` of 4.5 in "root" is not a whole number, which this theme\'s grid needs',
    );
  });

  it("doesn't warn about a whole number", () => {
    render(<GridTemplate column fieldId='root' span={6} />);

    expect(warnings.consoleSpy).not.toHaveBeenCalled();
  });
});
