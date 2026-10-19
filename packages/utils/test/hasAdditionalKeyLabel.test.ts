import type { ResolvedPresentationDeclaration } from '../src/index.ts';
import { hasAdditionalKeyLabel, resolveFieldPresentation } from '../src/index.ts';

const SELF: ResolvedPresentationDeclaration = {
  label: 'self',
  description: 'self',
  errors: 'template',
  help: 'template',
  labelledBy: 'for',
};

describe('hasAdditionalKeyLabel()', () => {
  it('follows displayLabel without a plan', () => {
    expect(hasAdditionalKeyLabel({ displayLabel: true })).toBe(true);
    expect(hasAdditionalKeyLabel({})).toBe(false);
  });

  it("labels the key wherever the value's label is drawn, by its own component included", () => {
    const presentation = resolveFieldPresentation({ id: 'root_foo', declaration: SELF, label: 'foo' });
    expect(hasAdditionalKeyLabel({ displayLabel: false, presentation })).toBe(true);
  });

  it('leaves the key unlabelled when the value shows no label', () => {
    const presentation = resolveFieldPresentation({
      id: 'root_foo',
      declaration: SELF,
      label: 'foo',
      showLabel: false,
    });
    expect(hasAdditionalKeyLabel({ displayLabel: true, presentation })).toBe(false);
  });
});
