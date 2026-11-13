import type { ResolvedPresentationDeclaration } from '../src/index.ts';
import { getArrayDescription, resolveFieldPresentation } from '../src/index.ts';

const SELF: ResolvedPresentationDeclaration = {
  label: 'self',
  description: 'self',
  errors: 'template',
  help: 'template',
  labelledBy: 'aria-labelledby',
};
const schema = { type: 'array' as const, items: { type: 'string' as const }, description: 'Schema text' };

describe('getArrayDescription()', () => {
  it('draws the ui:description, or else the schema description, without a plan', () => {
    expect(getArrayDescription({ schema })).toBe('Schema text');
    expect(getArrayDescription({ schema, uiSchema: { 'ui:description': 'Ui text' } })).toBe('Ui text');
    expect(getArrayDescription({ schema: { type: 'array' } })).toBeUndefined();
  });

  it('draws the description its plan has the array draw', () => {
    const presentation = resolveFieldPresentation({
      id: 'root_tags',
      declaration: SELF,
      label: 'Tags',
      description: 'Plan text',
    });
    expect(getArrayDescription({ schema, uiSchema: { 'ui:description': 'Ui text' }, presentation })).toBe('Plan text');
  });

  it('draws none where its plan hides the description or leaves it to the template', () => {
    const hidden = resolveFieldPresentation({
      id: 'root_tags',
      declaration: SELF,
      label: 'Tags',
      description: 'Plan text',
      showLabel: false,
    });
    expect(getArrayDescription({ schema, presentation: hidden })).toBeUndefined();
    const byTemplate = resolveFieldPresentation({
      id: 'root_tags',
      declaration: { ...SELF, description: 'template' },
      label: 'Tags',
      description: 'Plan text',
    });
    expect(getArrayDescription({ schema, presentation: byTemplate })).toBeUndefined();
  });

  it('draws none where its plan has a field above draw the description', () => {
    const presentation = resolveFieldPresentation({
      id: 'root_tags',
      declaration: SELF,
      label: 'Tags',
      description: 'Plan text',
      inherited: resolveFieldPresentation({
        id: 'root_tags',
        declaration: SELF,
        label: 'Tags',
        description: 'Plan text',
      }),
    });
    expect(presentation.description.by).toBe('above');
    expect(getArrayDescription({ schema, presentation })).toBeUndefined();
  });
});
