import type { FieldPresentation, ResolvedPresentationDeclaration } from '../src/index.ts';
import { ariaDescribedByIds, getGroupAttributes, resolveFieldPresentation } from '../src/index.ts';

const ID = 'root_foo';
const GROUP: ResolvedPresentationDeclaration = {
  label: 'template',
  description: 'template',
  errors: 'template',
  help: 'template',
  labelledBy: 'aria-labelledby',
};

function plan(inputs: Partial<Parameters<typeof resolveFieldPresentation>[0]> = {}): FieldPresentation {
  return resolveFieldPresentation({ id: ID, declaration: GROUP, label: 'Foo', ...inputs });
}

describe('getGroupAttributes()', () => {
  it('names a checkbox group by its label and marks and describes each checkbox, leaving required to the widget', () => {
    const presentation = plan({ description: 'Describes foo', errors: ['is required'], required: true });
    expect(getGroupAttributes({ id: ID, presentation }, 'group')).toEqual({
      group: { role: 'group', 'aria-labelledby': `${ID}__label` },
      option: { 'aria-describedby': `${ID}__error ${ID}__description`, 'aria-invalid': true },
    });
  });

  it('marks a radiogroup invalid rather than its radios, which ARIA gives no aria-invalid', () => {
    const presentation = plan({ description: 'Describes foo', errors: ['is required'] });
    expect(getGroupAttributes({ id: ID, presentation }, 'radiogroup')).toEqual({
      group: { role: 'radiogroup', 'aria-labelledby': `${ID}__label`, 'aria-invalid': true },
      option: { 'aria-describedby': `${ID}__error ${ID}__description` },
    });
  });

  it.each(['group', 'radiogroup'] as const)('marks no %s or control invalid without errors', (role) => {
    const presentation = plan({ description: 'Describes foo' });
    expect(getGroupAttributes({ id: ID, presentation }, role)).toEqual({
      group: { role, 'aria-labelledby': `${ID}__label` },
      option: { 'aria-describedby': `${ID}__description` },
    });
  });

  it('leaves a group its plan names some other way without a reference', () => {
    const presentation = plan({ declaration: { ...GROUP, labelledBy: 'for' } });
    expect(getGroupAttributes({ id: ID, presentation }, 'group')).toEqual({ group: { role: 'group' }, option: {} });
  });

  it('names a group its plan names no other way by the label the widget draws', () => {
    const presentation = plan({ declaration: { ...GROUP, label: 'self' } });
    expect(getGroupAttributes({ id: ID, presentation }, 'radiogroup', `${ID}__label`)).toEqual({
      group: { role: 'radiogroup', 'aria-labelledby': `${ID}__label` },
      option: {},
    });
  });

  it.each([
    ['whose label is hidden', { declaration: { ...GROUP, label: 'self' as const }, showLabel: false }],
    ['whose label the template draws with a for', { declaration: { ...GROUP, labelledBy: 'for' as const } }],
  ])('names a group %s by no label the widget would draw', (_, inputs) => {
    expect(getGroupAttributes({ id: ID, presentation: plan(inputs) }, 'group', `${ID}__label`).group).toEqual({
      role: 'group',
    });
  });

  it('names a group by the label its plan points at over the one the widget draws', () => {
    expect(getGroupAttributes({ id: ID, presentation: plan() }, 'group', 'drawn').group).toEqual({
      role: 'group',
      'aria-labelledby': `${ID}__label`,
    });
  });

  it('names a group rendered without a plan by the label the widget draws', () => {
    expect(getGroupAttributes({ id: ID }, 'group', `${ID}__label`).group).toEqual({
      role: 'group',
      'aria-labelledby': `${ID}__label`,
    });
  });

  it('describes each control of a group rendered without a plan by every part id', () => {
    expect(getGroupAttributes({ id: ID }, 'radiogroup')).toEqual({
      group: { role: 'radiogroup' },
      option: { 'aria-describedby': ariaDescribedByIds(ID) },
    });
  });
});
