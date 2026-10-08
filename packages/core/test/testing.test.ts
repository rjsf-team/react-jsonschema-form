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
});
