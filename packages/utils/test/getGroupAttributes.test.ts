import type { FieldPresentation, Registry, ResolvedPresentationDeclaration } from '../src/index.ts';
import {
  ariaDescribedByIds,
  englishStringTranslator,
  getGroupAttributes,
  resolveFieldPresentation,
} from '../src/index.ts';

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

  it('names a group whose label the template draws with a for by no label the widget would draw', () => {
    const presentation = plan({ declaration: { ...GROUP, labelledBy: 'for' } });
    expect(getGroupAttributes({ id: ID, presentation }, 'group', `${ID}__label`).group).toEqual({ role: 'group' });
  });

  it.each([
    ['template', 'group'],
    ['self', 'radiogroup'],
  ] as const)('names a %s-labelled %s whose label is hidden by its text, rather than each control', (label, role) => {
    const presentation = plan({ declaration: { ...GROUP, label }, showLabel: false });
    expect(getGroupAttributes({ id: ID, presentation }, role, `${ID}__label`)).toEqual({
      group: { role, 'aria-label': 'Foo' },
      option: {},
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

  describe('names a radiogroup no label names, where its caller hands it the registry', () => {
    const registry = { translateString: englishStringTranslator } as Registry;
    const untitled = plan({ label: '' });

    it('by its placeholder, else the translated prompt', () => {
      expect(getGroupAttributes({ id: ID, presentation: untitled, registry }, 'radiogroup').group).toEqual({
        role: 'radiogroup',
        'aria-label': 'Choose an option',
      });
      const placeholderProps = { id: ID, presentation: untitled, placeholder: 'Pick one', registry };
      expect(getGroupAttributes(placeholderProps, 'radiogroup').group['aria-label']).toBe('Pick one');
    });

    it('by its label, rendered without a plan or a label the widget draws', () => {
      expect(getGroupAttributes({ id: ID, label: 'Foo', registry }, 'radiogroup').group['aria-label']).toBe('Foo');
    });

    it('by nothing where a label names it', () => {
      expect(getGroupAttributes({ id: ID, presentation: plan(), registry }, 'radiogroup').group).toEqual({
        role: 'radiogroup',
        'aria-labelledby': `${ID}__label`,
      });
    });

    it('by nothing for a group of another role, or one handed no registry, such as a rating', () => {
      expect(getGroupAttributes({ id: ID, presentation: untitled, registry }, 'group').group).toEqual({
        role: 'group',
      });
      expect(getGroupAttributes({ id: ID, presentation: untitled }, 'radiogroup').group).toEqual({
        role: 'radiogroup',
      });
    });
  });
});
