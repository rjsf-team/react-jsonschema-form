import type { ResolvedPresentationDeclaration } from '../src/index.ts';
import { getSelectorPresentation, resolveFieldPresentation } from '../src/index.ts';

const ID = 'root_foo';
const SELECTOR = `${ID}__anyof_select`;
const TEMPLATE: ResolvedPresentationDeclaration = {
  label: 'template',
  description: 'template',
  errors: 'template',
  help: 'template',
  labelledBy: 'for',
};

describe('getSelectorPresentation()', () => {
  it("names the selector by the label its field's template draws, and describes it by the field's parts", () => {
    const field = resolveFieldPresentation({
      id: ID,
      declaration: TEMPLATE,
      label: 'Foo',
      description: 'Describes foo',
      errors: ['is required'],
      required: true,
    });
    const selector = getSelectorPresentation(field, SELECTOR);
    expect(selector.label).toEqual({ text: 'Foo', by: 'above', id: `${ID}__label`, requiredMarker: false });
    expect(selector.description.by).toBe('above');
    expect(selector.errors.by).toBe('above');
    expect(selector.inherited).toBe(field);
    expect(selector.showLabel).toBe(true);
    expect(selector.control).toEqual({
      id: SELECTOR,
      attributes: {
        'aria-labelledby': `${ID}__label`,
        'aria-describedby': `${ID}__error ${ID}__description`,
        'aria-invalid': true,
      },
    });
  });

  it('draws the parts its field draws itself', () => {
    const field = resolveFieldPresentation({
      id: ID,
      declaration: { ...TEMPLATE, label: 'self', description: 'self' },
      label: 'Foo',
      description: 'Describes foo',
    });
    const selector = getSelectorPresentation(field, SELECTOR);
    expect(selector.label.by).toBe('self');
    expect(selector.description.by).toBe('self');
    expect(selector.control?.attributes['aria-labelledby']).toBeUndefined();
  });

  it('has no control when its field has none on screen', () => {
    const field = resolveFieldPresentation({ id: ID, declaration: TEMPLATE, label: 'Foo', hasControl: false });
    expect(getSelectorPresentation(field, SELECTOR).control).toBeUndefined();
  });
});
