import { render } from '@testing-library/react';

import GridTemplate from '../src/GridTemplate/GridTemplate.tsx';

describe('GridTemplate', () => {
  it('turns a number of tracks into equal tracks', () => {
    const { container } = render(
      <GridTemplate columns={3} rows='2'>
        content
      </GridTemplate>,
    );

    expect(container.firstChild).toHaveStyle({
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridTemplateRows: 'repeat(2, 1fr)',
    });
  });

  it.each(['1e1', '0xa'])('writes a track count given as %s as a plain number', (columns) => {
    const { container } = render(<GridTemplate columns={columns}>content</GridTemplate>);

    expect(container.firstChild).toHaveStyle({ gridTemplateColumns: 'repeat(10, 1fr)' });
  });

  it('passes a CSS template through', () => {
    const { container } = render(<GridTemplate columns='100px auto'>content</GridTemplate>);

    expect(container.firstChild).toHaveStyle({ gridTemplateColumns: '100px auto' });
  });

  it('keeps the style it was given alongside the templates', () => {
    const { container } = render(
      <GridTemplate columns={2} style={{ columnGap: '5px' }}>
        content
      </GridTemplate>,
    );

    expect(container.firstChild).toHaveStyle({ columnGap: '5px', gridTemplateColumns: 'repeat(2, 1fr)' });
  });
});
