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
  it('names the group by its label and describes each control, leaving required to the widget', () => {
    const presentation = plan({ description: 'Describes foo', errors: ['is required'], required: true });
    expect(getGroupAttributes({ id: ID, presentation })).toEqual({
      group: { 'aria-labelledby': `${ID}__label` },
      option: { 'aria-describedby': `${ID}__error ${ID}__description`, 'aria-invalid': true },
    });
  });

  it('leaves a group its plan names some other way without a reference', () => {
    const presentation = plan({ declaration: { ...GROUP, labelledBy: 'for' } });
    expect(getGroupAttributes({ id: ID, presentation })).toEqual({ group: {}, option: {} });
  });

  it('describes each control of a group rendered without a plan by every part id', () => {
    expect(getGroupAttributes({ id: ID })).toEqual({
      group: {},
      option: { 'aria-describedby': ariaDescribedByIds(ID) },
    });
  });
});
