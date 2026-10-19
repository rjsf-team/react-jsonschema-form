import type { FieldPresentation, ResolvedPresentationDeclaration } from '../src/index.ts';
import { ariaDescribedByIds, examplesId, getControlAttributes, resolveFieldPresentation } from '../src/index.ts';

const ID = 'root_foo';
const TEMPLATE: ResolvedPresentationDeclaration = {
  label: 'template',
  description: 'template',
  errors: 'template',
  help: 'template',
  labelledBy: 'for',
};

function plan(inputs: Partial<Parameters<typeof resolveFieldPresentation>[0]> = {}): FieldPresentation {
  return resolveFieldPresentation({ id: ID, declaration: TEMPLATE, label: 'Foo', ...inputs });
}

describe('getControlAttributes()', () => {
  it('describes a widget rendered without a plan by every part id, then its own', () => {
    expect(getControlAttributes({ id: ID })).toEqual({ 'aria-describedby': ariaDescribedByIds(ID) });
    expect(getControlAttributes({ id: ID }, [examplesId(ID)])).toEqual({
      'aria-describedby': ariaDescribedByIds(ID, true),
    });
  });

  it("gives the control its plan's attributes, leaving required to the widget", () => {
    const presentation = plan({ description: 'Describes foo', errors: ['is required'], required: true });
    expect(getControlAttributes({ id: ID, presentation })).toEqual({
      'aria-describedby': `${ID}__error ${ID}__description`,
      'aria-invalid': true,
    });
  });

  it('appends the ids the widget renders itself, once each', () => {
    const presentation = plan({ description: 'Describes foo' });
    expect(getControlAttributes({ id: ID, presentation }, [examplesId(ID), `${ID}__description`])).toEqual({
      'aria-describedby': `${ID}__description ${examplesId(ID)}`,
    });
  });

  it('leaves aria-describedby off a control nothing describes', () => {
    expect(getControlAttributes({ id: ID, presentation: plan() })).toEqual({});
  });

  it('gives a plan with no control nothing to spread', () => {
    expect(getControlAttributes({ id: ID, presentation: plan({ hasControl: false }) })).toEqual({});
  });

  it('points a control labelled through aria-labelledby at its label', () => {
    const presentation = plan({ declaration: { ...TEMPLATE, labelledBy: 'aria-labelledby' } });
    expect(getControlAttributes({ id: ID, presentation })).toEqual({ 'aria-labelledby': `${ID}__label` });
  });
});
