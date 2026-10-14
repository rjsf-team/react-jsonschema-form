import type { ResolvedPresentationDeclaration } from '../src/index.ts';
import { ariaDescribedByIds, examplesId, getControlDescribedBy, resolveFieldPresentation } from '../src/index.ts';

const ID = 'root_foo';
const TEMPLATE: ResolvedPresentationDeclaration = {
  label: 'template',
  description: 'template',
  errors: 'template',
  help: 'template',
  labelledBy: 'for',
};

describe('getControlDescribedBy()', () => {
  it('describes a widget rendered without a plan by every part id, then its own', () => {
    expect(getControlDescribedBy({ id: ID })).toBe(ariaDescribedByIds(ID));
    expect(getControlDescribedBy({ id: ID }, [examplesId(ID)])).toBe(ariaDescribedByIds(ID, true));
  });

  it("follows the plan's describers with the widget's own, once each", () => {
    const presentation = resolveFieldPresentation({
      id: ID,
      declaration: TEMPLATE,
      label: 'Foo',
      description: 'Describes foo',
    });
    expect(getControlDescribedBy({ id: ID, presentation }, [examplesId(ID), `${ID}__description`])).toBe(
      `${ID}__description ${examplesId(ID)}`,
    );
  });

  it("keeps a widget's own id once when the plan already lists it among several", () => {
    const presentation = resolveFieldPresentation({
      id: ID,
      declaration: TEMPLATE,
      label: 'Foo',
      description: 'Describes foo',
      errors: ['is required'],
    });
    expect(getControlDescribedBy({ id: ID, presentation }, [`${ID}__description`])).toBe(
      `${ID}__error ${ID}__description`,
    );
  });

  it('is undefined for a control nothing describes, or a plan with no control', () => {
    const presentation = resolveFieldPresentation({ id: ID, declaration: TEMPLATE, label: 'Foo' });
    expect(getControlDescribedBy({ id: ID, presentation })).toBeUndefined();
    const noControl = resolveFieldPresentation({ id: ID, declaration: TEMPLATE, label: 'Foo', hasControl: false });
    expect(getControlDescribedBy({ id: ID, presentation: noControl })).toBeUndefined();
  });
});
