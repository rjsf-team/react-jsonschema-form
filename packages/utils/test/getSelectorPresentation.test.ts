import { getSelectorPresentation } from '../src/index.ts';
import { ID, TEMPLATE, planField } from './testUtils/presentation.ts';

const SELECTOR = `${ID}__anyof_select`;

describe('getSelectorPresentation()', () => {
  it("names the selector by the label its field's template draws, and describes it by the field's parts", () => {
    const field = planField({
      description: 'Describes foo',
      errors: ['is required'],
      required: true,
    });
    const selector = getSelectorPresentation(field, SELECTOR);
    expect(selector.label).toEqual({ text: 'Foo', by: 'above', id: `${ID}__label`, requiredMarker: true });
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
    const field = planField({
      declaration: { ...TEMPLATE, label: 'self', description: 'self' },
      description: 'Describes foo',
    });
    const selector = getSelectorPresentation(field, SELECTOR);
    expect(selector.label.by).toBe('self');
    expect(selector.description.by).toBe('self');
    expect(selector.control?.attributes['aria-labelledby']).toBeUndefined();
  });

  it.each(['template', 'self'] as const)(
    'names the selector by the label text a %s-labelled field hides under ui:label false',
    (label) => {
      const field = planField({ declaration: { ...TEMPLATE, label }, showLabel: false });
      expect(getSelectorPresentation(field, SELECTOR).control?.attributes).toEqual({ 'aria-label': 'Foo' });
    },
  );

  it('has no control when its field has none on screen', () => {
    const field = planField({ hasControl: false });
    expect(getSelectorPresentation(field, SELECTOR).control).toBeUndefined();
  });
});
