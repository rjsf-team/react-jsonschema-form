import { createElement } from 'react';

import type { FieldPresentation, FieldPresentationInputs, ResolvedPresentationDeclaration } from '../src/index.ts';
import { resolveFieldPresentation } from '../src/index.ts';

const ID = 'root_foo';

const TEMPLATE: ResolvedPresentationDeclaration = {
  label: 'template',
  description: 'template',
  errors: 'template',
  help: 'template',
  labelledBy: 'for',
};
const WIDGET_LABEL: ResolvedPresentationDeclaration = { ...TEMPLATE, label: 'self' };

function resolve(inputs: Partial<FieldPresentationInputs> = {}): FieldPresentation {
  return resolveFieldPresentation({ id: ID, declaration: TEMPLATE, label: 'Foo', ...inputs });
}

describe('resolveFieldPresentation()', () => {
  it('plans a field whose template draws every part', () => {
    expect(
      resolve({ description: 'Describes foo', help: 'Helps with foo', errors: ['is required'], required: true }),
    ).toEqual({
      label: { text: 'Foo', by: 'template', id: `${ID}__label` },
      description: { text: 'Describes foo', by: 'template', id: `${ID}__description` },
      help: { text: 'Helps with foo', by: 'template', id: `${ID}__help` },
      errors: { messages: ['is required'], by: 'template', id: `${ID}__error` },
      describedBy: [`${ID}__error`, `${ID}__description`, `${ID}__help`],
      control: {
        id: ID,
        attributes: {
          'aria-describedby': `${ID}__error ${ID}__description ${ID}__help`,
          'aria-invalid': true,
          required: true,
        },
        requiredMarker: true,
      },
    });
  });

  it('plans a field with nothing to show', () => {
    expect(resolve({ label: '' })).toEqual({
      label: { text: '', by: 'none', id: `${ID}__label` },
      description: { text: '', by: 'none', id: `${ID}__description` },
      help: { text: undefined, by: 'none', id: `${ID}__help` },
      errors: { messages: [], by: 'none', id: `${ID}__error` },
      describedBy: [],
      control: { id: ID, attributes: {}, requiredMarker: false },
    });
  });

  it('places each part with the owner its declaration names', () => {
    const plan = resolve({
      declaration: { label: 'self', description: 'self', errors: 'self', help: 'self', labelledBy: 'for' },
      description: 'Describes foo',
      help: 'Helps with foo',
      errors: ['is required'],
    });
    expect([plan.label.by, plan.description.by, plan.help.by, plan.errors.by]).toEqual([
      'self',
      'self',
      'self',
      'self',
    ]);
    expect(plan.describedBy).toEqual([`${ID}__error`, `${ID}__description`, `${ID}__help`]);
  });

  describe('label', () => {
    it('hides the label and the description under ui:label false, but not the help', () => {
      const plan = resolve({ showLabel: false, description: 'Describes foo', help: 'Helps with foo' });
      expect(plan.label.by).toBe('none');
      expect(plan.description).toEqual({ text: 'Describes foo', by: 'none', id: `${ID}__description` });
      expect(plan.help.by).toBe('template');
      expect(plan.describedBy).toEqual([`${ID}__help`]);
    });

    // An opted-out optional field has no control on screen for a `<label for>` to name
    it('draws no template label with no control to name', () => {
      const plan = resolve({ hasControl: false, description: 'Describes foo', errors: ['is required'] });
      expect(plan.label.by).toBe('none');
      expect(plan.description.by).toBe('template');
      expect(plan.errors.by).toBe('template');
      expect(plan.control).toBeUndefined();
    });

    it("keeps a container's own heading with no control", () => {
      expect(resolve({ declaration: WIDGET_LABEL, hasControl: false }).label.by).toBe('self');
    });

    it('points a group of controls at the label the template draws', () => {
      const plan = resolve({ declaration: { ...TEMPLATE, labelledBy: 'aria-labelledby' } });
      expect(plan.control?.attributes['aria-labelledby']).toBe(`${ID}__label`);
    });

    it('points a group at no label when none is drawn', () => {
      const declaration: ResolvedPresentationDeclaration = { ...TEMPLATE, labelledBy: 'aria-labelledby' };
      expect(resolve({ declaration, label: '' }).control?.attributes['aria-labelledby']).toBeUndefined();
      expect(
        resolve({ declaration: { ...declaration, label: 'self' } }).control?.attributes['aria-labelledby'],
      ).toBeUndefined();
    });
  });

  describe('errors', () => {
    it('shows no errors under hideError, and leaves the control valid', () => {
      const plan = resolve({ errors: ['is required'], hideError: true });
      expect(plan.errors).toEqual({ messages: [], by: 'none', id: `${ID}__error` });
      expect(plan.control?.attributes).toEqual({});
    });
  });

  it('describes the control by the elements it renders to describe itself, after its parts', () => {
    const controlDescribedBy = [`${ID}__selectedOptionDescription`, `${ID}__examples`];
    const plan = resolve({ description: 'Describes foo', controlDescribedBy });
    expect(plan.describedBy).toEqual([`${ID}__description`]);
    expect(plan.control?.attributes['aria-describedby']).toBe(
      `${ID}__description ${ID}__selectedOptionDescription ${ID}__examples`,
    );
  });

  it('carries the native required attribute apart from the marker', () => {
    const plan = resolve({ required: true, requiredAttribute: false });
    expect(plan.control?.requiredMarker).toBe(true);
    expect(plan.control?.attributes.required).toBeUndefined();
  });

  describe('under a field above rendering the same id', () => {
    const above = resolve({
      description: 'Describes the field',
      help: 'Helps with the field',
      errors: ['should match exactly one schema'],
    });

    it("doesn't draw the template label again, but points a group at it", () => {
      const plan = resolve({ inherited: above, declaration: { ...TEMPLATE, labelledBy: 'aria-labelledby' } });
      expect(plan.label.by).toBe('above');
      expect(plan.control?.attributes['aria-labelledby']).toBe(`${ID}__label`);
    });

    it("doesn't draw a label its widget draws beneath the template label that already names the control", () => {
      const widgetLabelled = resolve({ inherited: above, declaration: WIDGET_LABEL });
      expect(widgetLabelled.label.by).toBe('above');
      expect(widgetLabelled.control?.attributes['aria-labelledby']).toBeUndefined();
      expect(resolve({ inherited: widgetLabelled }).label.by).toBe('above');
    });

    it('points a control with another id at the template label above, which its for does not name', () => {
      const selector = resolveFieldPresentation({
        id: `${ID}__oneof_select`,
        declaration: TEMPLATE,
        label: 'Foo',
        inherited: above,
      });
      expect(selector.label).toEqual({ text: 'Foo', by: 'above', id: `${ID}__label` });
      expect(selector.control?.attributes['aria-labelledby']).toBe(`${ID}__label`);
    });

    it('chains a template label through a level that drew none', () => {
      const middle = resolve({ inherited: above });
      expect(resolve({ inherited: middle }).label.by).toBe('above');
    });

    it('draws its template label when the field above draws none', () => {
      const unlabelled = resolve({ label: '' });
      expect(unlabelled.label.by).toBe('none');
      expect(resolve({ inherited: unlabelled }).label.by).toBe('template');
    });

    // What a component above draws names that component's own control, such as a selector, not this one
    it('draws its template label beneath a field whose component draws its own', () => {
      const componentLabelled = resolve({ declaration: WIDGET_LABEL });
      expect(componentLabelled.label.by).toBe('self');
      expect(resolve({ inherited: componentLabelled }).label.by).toBe('template');
    });

    it("doesn't draw a description or help the field above shows", () => {
      const plan = resolve({ inherited: above, description: 'Describes the field', help: 'Helps with the field' });
      expect(plan.description).toEqual({ text: 'Describes the field', by: 'above', id: `${ID}__description` });
      expect(plan.help).toEqual({ text: 'Helps with the field', by: 'above', id: `${ID}__help` });
    });

    it('draws a description and help of its own under their option ids', () => {
      const plan = resolve({ inherited: above, description: 'Describes the option', help: 'Helps with the option' });
      expect(plan.description).toEqual({
        text: 'Describes the option',
        by: 'template',
        id: `${ID}__optionDescription`,
      });
      expect(plan.help).toEqual({ text: 'Helps with the option', by: 'template', id: `${ID}__optionHelp` });
      expect(plan.describedBy).toEqual([
        `${ID}__error`,
        `${ID}__description`,
        `${ID}__help`,
        `${ID}__optionDescription`,
        `${ID}__optionHelp`,
      ]);
    });

    it('draws a description of its own under the usual id when the field above shows none', () => {
      const plan = resolve({ inherited: resolve(), description: 'Describes the option' });
      expect(plan.description.id).toBe(`${ID}__description`);
    });

    it('chains a description and help through a level that has none of its own', () => {
      const middle = resolve({ inherited: above });
      expect(middle.description).toEqual({ text: 'Describes the field', by: 'above', id: `${ID}__description` });
      expect(middle.help).toEqual({ text: 'Helps with the field', by: 'above', id: `${ID}__help` });
      expect(middle.describedBy).toEqual([`${ID}__error`, `${ID}__description`, `${ID}__help`]);
      expect(resolve({ inherited: middle, description: 'Describes the field' }).description.by).toBe('above');
      const own = resolve({ inherited: middle, description: 'Describes the option', help: 'Helps with the option' });
      expect(own.description.id).toBe(`${ID}__optionDescription`);
      expect(own.help.id).toBe(`${ID}__optionHelp`);
    });

    it("isn't described by the elements the control above renders to describe itself", () => {
      const withExamples = resolve({ description: 'Describes the field', controlDescribedBy: [`${ID}__examples`] });
      const plan = resolve({ inherited: withExamples });
      expect(plan.describedBy).toEqual([`${ID}__description`]);
      expect(plan.control?.attributes['aria-describedby']).toBe(`${ID}__description`);
    });

    it('links the plan to the one it was built under', () => {
      expect(resolve({ inherited: above }).inherited).toBe(above);
    });

    it('draws the text of its own at each nesting level under an id of its own', () => {
      const middle = resolve({ inherited: above, description: 'Describes the option', help: 'Helps with the option' });
      const bottom = resolve({ inherited: middle, description: 'Describes the inner option', help: 'Helps inside' });
      expect(bottom.description).toEqual({
        text: 'Describes the inner option',
        by: 'template',
        id: `${ID}__optionDescription2`,
      });
      expect(bottom.help).toEqual({ text: 'Helps inside', by: 'template', id: `${ID}__optionHelp2` });
      expect(bottom.describedBy).toEqual([
        `${ID}__error`,
        `${ID}__description`,
        `${ID}__help`,
        `${ID}__optionDescription`,
        `${ID}__optionHelp`,
        `${ID}__optionDescription2`,
        `${ID}__optionHelp2`,
      ]);
    });

    it("doesn't draw again a description a field further above shows", () => {
      const middle = resolve({ inherited: above, description: 'Describes the option' });
      const plan = resolve({ inherited: middle, description: 'Describes the field' });
      expect(plan.description).toEqual({ text: 'Describes the field', by: 'above', id: `${ID}__description` });
    });

    it('keeps hidden a description the field above hides', () => {
      const hidden = resolve({ showLabel: false, description: 'Describes the field' });
      const plan = resolve({ inherited: hidden, description: 'Describes the field' });
      expect(plan.description.by).toBe('none');
      expect(plan.describedBy).toEqual([]);
    });

    it('carries the description a field above shows past a level that keeps a hidden one hidden', () => {
      const hidden = resolve({ showLabel: false, description: 'Describes the field' });
      const shown = resolve({ inherited: hidden, description: 'Describes the option' });
      const kept = resolve({ inherited: shown, description: 'Describes the field' });
      expect(kept.description.by).toBe('none');
      expect(resolve({ inherited: kept }).description).toEqual({
        text: 'Describes the option',
        by: 'above',
        id: `${ID}__description`,
      });
    });

    it('leaves the errors to the field above, and is described by them and invalid', () => {
      const plan = resolve({ inherited: above, errors: ['is required'] });
      expect(plan.errors).toEqual({
        messages: ['should match exactly one schema'],
        by: 'above',
        id: `${ID}__error`,
      });
      expect(plan.control?.attributes['aria-invalid']).toBe(true);
      expect(plan.describedBy[0]).toBe(`${ID}__error`);
    });

    it('is valid when the field above shows no errors', () => {
      const plan = resolve({ inherited: resolve({ errors: ['hidden'], hideError: true }), errors: ['is required'] });
      expect(plan.errors.by).toBe('none');
      expect(plan.control?.attributes['aria-invalid']).toBeUndefined();
    });

    it('compares a help element by identity', () => {
      const help = createElement('b', null, 'Helps');
      const withElement = resolve({ help });
      expect(resolve({ inherited: withElement, help }).help.by).toBe('above');
      expect(resolve({ inherited: withElement, help: createElement('b', null, 'Helps') }).help.by).toBe('template');
    });
  });
});
