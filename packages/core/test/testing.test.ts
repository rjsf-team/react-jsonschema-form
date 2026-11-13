import { createElement } from 'react';
import type { PartialTemplatesType, SubmitButtonProps } from '@rjsf/utils';

import { getTestRegistry } from '../src/testing.ts';

describe('getTestRegistry()', () => {
  it('freezes the registry and its component maps so a mutating test fails loudly', () => {
    const registry = getTestRegistry();

    expect(() => {
      (registry as { formContext: unknown }).formContext = { mutated: true };
    }).toThrow(TypeError);
    expect(() => {
      registry.fields.StringField = () => null;
    }).toThrow(TypeError);
    expect(() => {
      registry.widgets.TextWidget = () => null;
    }).toThrow(TypeError);
    expect(() => {
      registry.templates.FieldTemplate = () => null;
    }).toThrow(TypeError);
    expect(() => {
      registry.templates.ButtonTemplates.SubmitButton = () => null;
    }).toThrow(TypeError);
  });

  it('leaves caller-owned objects unfrozen', () => {
    const formContext = { count: 0 };
    const registry = getTestRegistry({}, undefined, undefined, undefined, formContext);

    formContext.count = 1;

    expect(registry.formContext).toBe(formContext);
    expect(Object.isFrozen(registry.formContext)).toBe(false);
  });

  it("layers a classMap over core's, as a Form's is, and freezes it", () => {
    const registry = getTestRegistry({}, {}, {}, {}, {}, undefined, undefined, {
      input: 'theme-input',
      select: (base) => `${base} wide`,
    });

    expect(registry.classMap.input).toBe('theme-input');
    expect(registry.classMap.select).toBe(' wide');
    expect(Object.isFrozen(registry.classMap)).toBe(true);
  });

  it("takes any subset of templates, as a Form's templates prop does, and fills in the rest", () => {
    const SubmitButton = (_props: SubmitButtonProps) => createElement('button', { type: 'submit' });
    const templates: PartialTemplatesType = { ButtonTemplates: { SubmitButton } };
    const core = getTestRegistry().templates.ButtonTemplates;

    const { ButtonTemplates } = getTestRegistry({}, {}, templates).templates;

    expect(ButtonTemplates.SubmitButton).toBe(SubmitButton);
    expect(ButtonTemplates.AddButton).toBe(core.AddButton);
  });
});
