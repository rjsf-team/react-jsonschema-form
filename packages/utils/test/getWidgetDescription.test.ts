import type { ResolvedPresentationDeclaration } from '../src/index.ts';
import { getWidgetDescription, resolveFieldPresentation } from '../src/index.ts';

const SELF: ResolvedPresentationDeclaration = {
  label: 'self',
  description: 'self',
  errors: 'template',
  help: 'template',
  labelledBy: 'for',
};
const props = { id: 'root_done', options: {}, schema: { type: 'boolean' as const, description: 'Schema text' } };

describe('getWidgetDescription()', () => {
  it('draws the ui:description, or the description where it is empty, without a plan, unless hideLabel turns it off', () => {
    expect(getWidgetDescription(props)).toEqual({ text: 'Schema text', id: 'root_done__description' });
    expect(getWidgetDescription({ ...props, options: { description: 'Ui text' } })).toEqual({
      text: 'Ui text',
      id: 'root_done__description',
    });
    // oxlint-disable-next-line typescript/no-deprecated -- exercises the deprecated prop a component without a plan reads
    expect(getWidgetDescription({ ...props, hideLabel: true })).toBeUndefined();
    expect(getWidgetDescription({ ...props, options: { description: '' } })).toEqual({
      text: 'Schema text',
      id: 'root_done__description',
    });
  });

  it('draws the description its plan has it draw, under the id the plan gives it', () => {
    const presentation = resolveFieldPresentation({
      id: 'root_done',
      declaration: SELF,
      label: 'Done',
      description: 'Plan text',
      inherited: resolveFieldPresentation({ id: 'root_done', declaration: SELF, label: 'Done', description: 'Above' }),
    });
    // oxlint-disable-next-line typescript/no-deprecated -- exercises the deprecated prop a component without a plan reads
    expect(getWidgetDescription({ ...props, hideLabel: true, presentation })).toEqual({
      text: 'Plan text',
      id: 'root_done__optionDescription',
    });
  });

  it('draws none where its plan leaves the description to the template or a field above', () => {
    const presentation = resolveFieldPresentation({
      id: 'root_done',
      declaration: { ...SELF, description: 'template' },
      label: 'Done',
      description: 'Plan text',
    });
    expect(getWidgetDescription({ ...props, presentation })).toBeUndefined();
  });
});
