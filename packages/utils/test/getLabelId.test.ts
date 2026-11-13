import type { ResolvedPresentationDeclaration } from '../src/index.ts';
import { getLabelId, resolveFieldPresentation } from '../src/index.ts';

const ID = 'root_foo';
const SELF: ResolvedPresentationDeclaration = {
  label: 'self',
  description: 'template',
  errors: 'template',
  help: 'template',
  labelledBy: 'for',
};

describe('getLabelId()', () => {
  it('is fieldLabelId() of the id without a plan', () => {
    expect(getLabelId({ id: ID })).toBe(`${ID}__label`);
  });

  it('is the id the plan gives the label, numbered beneath a label a field above draws, whoever draws it', () => {
    const above = resolveFieldPresentation({ id: ID, declaration: SELF, label: 'Foo' });
    expect(getLabelId({ id: ID, presentation: above })).toBe(`${ID}__label`);
    const presentation = resolveFieldPresentation({
      id: ID,
      declaration: { ...SELF, label: 'template', labelledBy: 'aria-labelledby' },
      label: 'Bar',
      inherited: above,
    });
    expect(presentation.label.by).toBe('template');
    expect(getLabelId({ id: ID, presentation })).toBe(`${ID}__optionLabel`);
  });
});
