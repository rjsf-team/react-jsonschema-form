import type { FieldPresentation, ResolvedPresentationDeclaration } from '../src/index.ts';
import {
  hasTemplateErrors,
  resolveFieldPresentation,
  templateDrawsDescription,
  templateDrawsLabel,
  templateLabelFor,
  widgetDrawsLabel,
} from '../src/index.ts';

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

describe('templateDrawsLabel()', () => {
  it('follows the plan, whatever displayLabel says', () => {
    expect(templateDrawsLabel({ presentation: plan(), displayLabel: false })).toBe(true);
    expect(templateDrawsLabel({ presentation: plan({ showLabel: false }), displayLabel: true })).toBe(false);
  });

  it('follows displayLabel without a plan', () => {
    expect(templateDrawsLabel({ displayLabel: true })).toBe(true);
    expect(templateDrawsLabel({})).toBe(false);
  });
});

describe('templateDrawsDescription()', () => {
  it('follows the plan, whatever displayLabel says', () => {
    expect(templateDrawsDescription({ presentation: plan({ description: 'Bar' }), displayLabel: false })).toBe(true);
    const selfDrawn = plan({ declaration: { ...TEMPLATE, description: 'self' }, description: 'Bar' });
    expect(templateDrawsDescription({ presentation: selfDrawn, displayLabel: true })).toBe(false);
  });

  it('follows displayLabel without a plan, as the label does', () => {
    expect(templateDrawsDescription({ displayLabel: true })).toBe(true);
    expect(templateDrawsDescription({ displayLabel: false })).toBe(false);
  });
});

describe('hasTemplateErrors()', () => {
  it("follows the plan's messages, which have ui:hideError applied", () => {
    expect(hasTemplateErrors({ presentation: plan({ errors: ['bad'] }) })).toBe(true);
    expect(hasTemplateErrors({ presentation: plan({ errors: ['bad'], hideError: true }), rawErrors: ['bad'] })).toBe(
      false,
    );
  });

  it('follows rawErrors and hideError without a plan', () => {
    expect(hasTemplateErrors({ rawErrors: ['bad'] })).toBe(true);
    expect(hasTemplateErrors({ rawErrors: ['bad'], hideError: true })).toBe(false);
    expect(hasTemplateErrors({})).toBe(false);
  });
});

describe('widgetDrawsLabel()', () => {
  it('follows the plan, whatever hideLabel says', () => {
    expect(
      widgetDrawsLabel({ presentation: plan({ declaration: { ...TEMPLATE, label: 'self' } }), hideLabel: true }),
    ).toBe(true);
    expect(widgetDrawsLabel({ presentation: plan(), hideLabel: false })).toBe(false);
  });

  it('follows hideLabel without a plan', () => {
    expect(widgetDrawsLabel({})).toBe(true);
    expect(widgetDrawsLabel({ hideLabel: true })).toBe(false);
  });
});

describe('templateLabelFor()', () => {
  it("points the label at the field's id where the plan names the control through the label's for", () => {
    expect(templateLabelFor({ id: ID, presentation: plan() })).toBe(ID);
  });

  it('gives the label no for where the plan names the control through aria-labelledby', () => {
    const presentation = plan({ declaration: { ...TEMPLATE, labelledBy: 'aria-labelledby' } });
    expect(templateLabelFor({ id: ID, presentation })).toBeUndefined();
  });

  it("points the label at the field's id where the plan has no control, and without a plan", () => {
    expect(templateLabelFor({ id: ID, presentation: plan({ hasControl: false }) })).toBe(ID);
    expect(templateLabelFor({ id: ID })).toBe(ID);
  });
});
