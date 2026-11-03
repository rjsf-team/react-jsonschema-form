import type { GridTemplateProps } from '../src/index.ts';

describe('GridTemplateProps', () => {
  it('takes props typed by an interface, and a literal with props of its own', () => {
    interface MyGridProps {
      gap?: number;
      className?: string;
    }
    const mine: MyGridProps = { gap: 2, className: 'wide' };
    const typed: GridTemplateProps = mine;
    const literal: GridTemplateProps = { column: true, gap: 2 };

    expect(typed.className).toBe('wide');
    expect(literal.column).toBe(true);
  });
});
