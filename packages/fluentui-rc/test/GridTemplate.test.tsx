import type { ComponentProps } from 'react';
import type * as FluentMigration from '@fluentui/react-migration-v0-v9';
import { render } from '@testing-library/react';

import GridTemplate from '../src/GridTemplate/GridTemplate.tsx';

// jsdom drops a template it can't parse, as a browser does, so the template the grid is given is read from its props
vi.mock('@fluentui/react-migration-v0-v9', async (importOriginal) => {
  const actual = await importOriginal<typeof FluentMigration>();
  return {
    ...actual,
    GridShim: (props: ComponentProps<typeof actual.GridShim>) => (
      <actual.GridShim data-columns={props.style?.gridTemplateColumns} {...props} />
    ),
  };
});

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

  it.each([1.5, '2.5', 'Infinity'])('passes %s through, which is no track count', (columns) => {
    const { container } = render(<GridTemplate columns={columns}>content</GridTemplate>);

    expect(container.firstChild).toHaveAttribute('data-columns', String(columns));
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
