import { isLabelledByTemplate } from '../src/index.ts';
import { TEMPLATE, planField } from './testUtils/presentation.ts';

describe('isLabelledByTemplate()', () => {
  const field = planField();

  it('is true for a label its template draws, here or for a field above rendering the same id', () => {
    expect(isLabelledByTemplate(field)).toBe(true);
    const option = planField({ declaration: { ...TEMPLATE, label: 'self' }, inherited: field });
    expect(isLabelledByTemplate(option)).toBe(true);
  });

  it('is false for a label the widget draws, or none', () => {
    expect(isLabelledByTemplate(planField({ declaration: { ...TEMPLATE, label: 'self' } }))).toBe(false);
    expect(isLabelledByTemplate(planField({ label: '' }))).toBe(false);
  });
});
