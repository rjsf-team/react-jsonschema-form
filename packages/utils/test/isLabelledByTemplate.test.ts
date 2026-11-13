import type { ResolvedPresentationDeclaration } from '../src/index.ts';
import { isLabelledByTemplate, resolveFieldPresentation } from '../src/index.ts';

const TEMPLATE: ResolvedPresentationDeclaration = {
  label: 'template',
  description: 'template',
  errors: 'template',
  help: 'template',
  labelledBy: 'for',
};

describe('isLabelledByTemplate()', () => {
  const field = resolveFieldPresentation({ id: 'root_foo', declaration: TEMPLATE, label: 'Foo' });

  it('is true for a label its template draws, here or for a field above rendering the same id', () => {
    expect(isLabelledByTemplate(field)).toBe(true);
    const option = resolveFieldPresentation({
      id: 'root_foo',
      declaration: { ...TEMPLATE, label: 'self' },
      label: 'Foo',
      inherited: field,
    });
    expect(isLabelledByTemplate(option)).toBe(true);
  });

  it('is false for a label the widget draws, or none', () => {
    expect(
      isLabelledByTemplate(
        resolveFieldPresentation({ id: 'root_foo', declaration: { ...TEMPLATE, label: 'self' }, label: 'Foo' }),
      ),
    ).toBe(false);
    expect(isLabelledByTemplate(resolveFieldPresentation({ id: 'root_foo', declaration: TEMPLATE, label: '' }))).toBe(
      false,
    );
  });
});
