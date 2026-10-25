import { createElement, forwardRef, lazy, memo } from 'react';

import { setupConsoleWarnSuppression } from '../../../testing/consoleSuppression.ts';
import type { Registry, UIOptionsType } from '../src/index.ts';
import {
  createSchemaUtils,
  englishStringTranslator,
  getTemplate,
  getTemplates,
  mergeThemePresentation,
  pickGlobalUiOptions,
  resetLogOnce,
} from '../src/index.ts';
import getTestValidator from './testUtils/getTestValidator.ts';
import { GLOBAL_FORM_OPTIONS } from './testUtils/testData.ts';

const FakeTemplate = () => null;

const CustomTemplate = () => undefined;

const registry: Registry = {
  formContext: {},
  rootSchema: {},
  schemaUtils: createSchemaUtils({ validator: getTestValidator({}) }, {}),
  translateString: englishStringTranslator,
  templates: {
    ArrayFieldDescriptionTemplate: FakeTemplate,
    ArrayFieldItemTemplate: FakeTemplate,
    ArrayFieldItemButtonsTemplate: FakeTemplate,
    ArrayFieldTemplate: FakeTemplate,
    ArrayFieldTitleTemplate: FakeTemplate,
    BaseInputTemplate: FakeTemplate,
    CyclicSchemaExpandTemplate: FakeTemplate,
    ButtonTemplates: {
      AddButton: FakeTemplate,
      CopyButton: FakeTemplate,
      MoveDownButton: FakeTemplate,
      MoveUpButton: FakeTemplate,
      RemoveButton: FakeTemplate,
      SubmitButton: FakeTemplate,
      ClearButton: FakeTemplate,
    },
    DescriptionFieldTemplate: FakeTemplate,
    ErrorListTemplate: FakeTemplate,
    FallbackFieldTemplate: FakeTemplate,
    FieldErrorTemplate: FakeTemplate,
    FieldHelpTemplate: FakeTemplate,
    FieldTemplate: FakeTemplate,
    GridTemplate: FakeTemplate,
    MarkdownTemplate: FakeTemplate,
    MultiSchemaFieldTemplate: FakeTemplate,
    ObjectFieldTemplate: FakeTemplate,
    OptionalDataControlsTemplate: FakeTemplate,
    TitleFieldTemplate: FakeTemplate,
    UnsupportedFieldTemplate: FakeTemplate,
    WrapIfAdditionalTemplate: FakeTemplate,
  },
  fields: {},
  widgets: {},
  presentation: mergeThemePresentation(),
  globalFormOptions: GLOBAL_FORM_OPTIONS,
};

const uiOptions: UIOptionsType = {
  ArrayFieldDescriptionTemplate: CustomTemplate,
  ArrayFieldItemTemplate: CustomTemplate,
  ArrayFieldItemButtonsTemplate: CustomTemplate,
  ArrayFieldTemplate: CustomTemplate,
  ArrayFieldTitleTemplate: CustomTemplate,
  BaseInputTemplate: CustomTemplate,
  CyclicSchemaExpandTemplate: CustomTemplate,
  DescriptionFieldTemplate: CustomTemplate,
  ErrorListTemplate: CustomTemplate,
  FallbackFieldTemplate: CustomTemplate,
  FieldErrorTemplate: CustomTemplate,
  FieldHelpTemplate: CustomTemplate,
  FieldTemplate: CustomTemplate,
  GridTemplate: CustomTemplate,
  MarkdownTemplate: CustomTemplate,
  MultiSchemaFieldTemplate: CustomTemplate,
  ObjectFieldTemplate: CustomTemplate,
  OptionalDataControlsTemplate: CustomTemplate,
  TitleFieldTemplate: CustomTemplate,
  UnsupportedFieldTemplate: CustomTemplate,
  WrapIfAdditionalTemplate: CustomTemplate,
};

const KEYS = Object.keys(registry.templates).filter((k) => k !== 'ButtonTemplates');

describe('getTemplate', () => {
  const warnSuppression = setupConsoleWarnSuppression();

  it('warns once for an invalid override and stays silent when no override is provided', () => {
    getTemplate('FieldTemplate', registry);
    expect(warnSuppression.consoleSpy).not.toHaveBeenCalled();
    const invalidOptions: UIOptionsType = Object.fromEntries([['FieldTemplate', createElement(FakeTemplate)]]);
    const warnSource = { entryLabel: () => '"root"' };
    getTemplate('FieldTemplate', registry, invalidOptions, warnSource);
    getTemplate('FieldTemplate', registry, invalidOptions, warnSource);
    expect(warnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
      'ui:FieldTemplate for "root" is a React element rather than a component (pass MyTemplate, not <MyTemplate />), so it is ignored.',
    );
  });

  it('resolves an invalid override silently without a warnSource', () => {
    const invalidOptions: UIOptionsType = Object.fromEntries([['FieldTemplate', createElement(FakeTemplate)]]);
    expect(getTemplate('FieldTemplate', registry, invalidOptions)).toBe(FakeTemplate);
    expect(getTemplates(registry, invalidOptions)).toBe(registry.templates);
    expect(warnSuppression.consoleSpy).not.toHaveBeenCalled();
  });

  it.each([createElement(FakeTemplate), { arbitrary: true }, 42, true, '', 0, false])(
    'falls back and warns when the override is not a component: %s',
    (override) => {
      const invalidOptions: UIOptionsType = Object.fromEntries([['FieldTemplate', override]]);
      const warnSource = { entryLabel: () => '"root"' };
      expect(getTemplate('FieldTemplate', registry, invalidOptions, warnSource)).toBe(FakeTemplate);
      expect(warnSuppression.consoleSpy).toHaveBeenCalledOnce();
      expect(getTemplates(registry, invalidOptions)).toBe(registry.templates);
    },
  );

  it('renders the registry template silently for an explicit own null', () => {
    const ownOptions: UIOptionsType = Object.fromEntries([['FieldTemplate', null]]);
    const warnSource = { entryLabel: () => '"root"' };
    expect(getTemplate('FieldTemplate', registry, ownOptions, warnSource)).toBe(FakeTemplate);
    expect(warnSuppression.consoleSpy).not.toHaveBeenCalled();
  });

  it.each([memo(FakeTemplate), forwardRef(FakeTemplate), lazy(async () => ({ default: FakeTemplate }))])(
    'accepts an object component override: %s',
    (override) => {
      const options: UIOptionsType = Object.fromEntries([['FieldTemplate', override]]);
      expect(getTemplate('FieldTemplate', registry, options)).toBe(override);
    },
  );

  it('falls back when a named registry override is not a component', () => {
    const invalidRegistry: Registry = {
      ...registry,
      templates: { ...registry.templates },
    };
    const customTemplates: Record<string, unknown> = invalidRegistry.templates;
    customTemplates.Invalid = createElement(FakeTemplate);
    const options: UIOptionsType = Object.fromEntries([['FieldTemplate', 'Invalid']]);
    const warnSource = { entryLabel: () => '"root"' };
    expect(getTemplate('FieldTemplate', invalidRegistry, options, warnSource)).toBe(FakeTemplate);
    expect(warnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
      'ui:FieldTemplate for "root" names a registered template (\'Invalid\') that is a React element rather than a component (pass MyTemplate, not <MyTemplate />), so it is ignored.',
    );
  });

  it('names the field in the warning when given its label', () => {
    const fieldOptions: UIOptionsType = {
      FieldTemplate: 'Typo' as unknown as UIOptionsType['FieldTemplate'],
    };
    getTemplate('FieldTemplate', registry, fieldOptions, {
      entryLabel: () => '"root_a" (a)',
    });
    const objectOptions: UIOptionsType = {
      ObjectFieldTemplate: 'Typo' as unknown as UIOptionsType['ObjectFieldTemplate'],
    };
    getTemplates(registry, objectOptions, {
      entryLabel: () => '"root_b" (b)',
    });
    expect(warnSuppression.consoleSpy.mock.calls).toEqual([
      ['ui:FieldTemplate for "root_a" (a) names no registered template (\'Typo\'), so it is ignored.'],
      ['ui:ObjectFieldTemplate for "root_b" (b) names no registered template (\'Typo\'), so it is ignored.'],
    ]);
  });

  it('drops a template override given to pickGlobalUiOptions, warning once', () => {
    const globals = pickGlobalUiOptions(
      Object.fromEntries([
        ['FieldTemplate', CustomTemplate],
        ['label', false],
      ]),
    );
    expect(globals).toEqual({ label: false });
    expect(warnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
      'ui:globalOptions.FieldTemplate is not read: RJSF reads FieldTemplate per field only.',
    );
  });

  it('warns again after resetLogOnce(), as the playground does on each sample load', () => {
    const invalidOptions: UIOptionsType = Object.fromEntries([['FieldTemplate', createElement(FakeTemplate)]]);
    const warnSource = { entryLabel: () => '"root_name"' };
    getTemplate('FieldTemplate', registry, invalidOptions, warnSource);
    getTemplate('FieldTemplate', registry, invalidOptions, warnSource);
    expect(warnSuppression.consoleSpy).toHaveBeenCalledOnce();
    resetLogOnce();
    getTemplate('FieldTemplate', registry, invalidOptions, warnSource);
    expect(warnSuppression.consoleSpy).toHaveBeenCalledTimes(2);
  });

  it('warns for each kind of invalid value an entry is edited to, and tells a string from an object', () => {
    const warnSource = { entryLabel: () => '"root"' };
    const warnFor = (value: unknown) => {
      const options: UIOptionsType = Object.fromEntries([['FieldTemplate', value]]);
      getTemplate('FieldTemplate', registry, options, warnSource);
    };
    warnFor({});
    warnFor(createElement(FakeTemplate));
    warnFor(42);
    warnFor('object');
    warnFor({});
    expect(warnSuppression.consoleSpy).toHaveBeenCalledTimes(4);
    expect(warnSuppression.consoleSpy.mock.calls[0][0]).toContain('got object');
    expect(warnSuppression.consoleSpy.mock.calls[1][0]).toContain('React element');
    expect(warnSuppression.consoleSpy.mock.calls[2][0]).toContain('got number');
    expect(warnSuppression.consoleSpy.mock.calls[3][0]).toContain("'object'");
  });

  it("returns a custom name's truthy override as given, the way it always has, with no warning", () => {
    const registryGroup = { Save: FakeTemplate };
    const overrideGroup = { Save: CustomTemplate };
    const customRegistry: Registry = { ...registry, templates: { ...registry.templates, MyButtons: registryGroup } };
    const warnSource = { entryLabel: () => '"root"' };
    // A group under a custom name is the override to return, not an invalid value to ignore: the values must differ
    // from the registry's for the assertions to tell which one came back
    expect(getTemplate('MyButtons', customRegistry, { MyButtons: overrideGroup }, warnSource)).toBe(overrideGroup);
    expect(getTemplate('MyButtons', customRegistry, { MyButtons: CustomTemplate }, warnSource)).toBe(CustomTemplate);
    // A string names another registry entry, as it does for the declared templates
    expect(getTemplate('MyButtons', customRegistry, { MyButtons: 'FieldTemplate' }, warnSource)).toBe(FakeTemplate);
    // No override renders the registry's own entry, even one that is a group rather than a component
    expect(getTemplate('MyButtons', customRegistry, undefined, warnSource)).toBe(registryGroup);
    expect(warnSuppression.consoleSpy).not.toHaveBeenCalled();
  });

  it("falls back to the registry entry for a custom name's falsy override, silently", () => {
    const registryGroup = { Save: FakeTemplate };
    const customRegistry: Registry = { ...registry, templates: { ...registry.templates, MyButtons: registryGroup } };
    const warnSource = { entryLabel: () => '"root"' };
    expect(getTemplate('MyButtons', customRegistry, { MyButtons: null }, warnSource)).toBe(registryGroup);
    expect(getTemplate('MyButtons', customRegistry, { MyButtons: '' }, warnSource)).toBe(registryGroup);
    expect(getTemplate('MyButtons', customRegistry, { MyButtons: 'NotRegistered' }, warnSource)).toBe(registryGroup);
    expect(warnSuppression.consoleSpy).not.toHaveBeenCalled();
  });

  it('reports separate unknown template names and dedupes the same name', () => {
    ['Typo1', 'Typo2', 'Typo1'].forEach((FieldTemplate) => {
      const options: UIOptionsType = Object.fromEntries([['FieldTemplate', FieldTemplate]]);
      getTemplate('FieldTemplate', registry, options, { entryLabel: () => '"root"' });
    });
    expect(warnSuppression.consoleSpy.mock.calls).toEqual([
      ['ui:FieldTemplate for "root" names no registered template (\'Typo1\'), so it is ignored.'],
      ['ui:FieldTemplate for "root" names no registered template (\'Typo2\'), so it is ignored.'],
    ]);
  });

  it('returns the ButtonTemplates from the registry', () => {
    expect(getTemplate<'ButtonTemplates'>('ButtonTemplates', registry)).toBe(registry.templates.ButtonTemplates);
  });
  it('returns the ButtonTemplates from the registry even with uiOptions', () => {
    expect(getTemplate<'ButtonTemplates'>('ButtonTemplates', registry, uiOptions)).toBe(
      registry.templates.ButtonTemplates,
    );
  });
  it('returns the template from registry', () => {
    KEYS.forEach((key) => {
      const name = key;
      expect(getTemplate<typeof name>(name, registry)).toBe(FakeTemplate);
    });
  });
  it('returns the template from uiOptions when available', () => {
    KEYS.forEach((key) => {
      const name = key;
      expect(getTemplate<typeof name>(name, registry, uiOptions)).toBe(CustomTemplate);
    });
  });
  it('returns the template from registry using uiOptions key when available', () => {
    KEYS.forEach((key) => {
      const name = key;
      expect(
        getTemplate<typeof name>(
          name,
          registry,
          Object.keys(uiOptions).reduce((acc: Record<string, any>, key) => {
            acc[key] = key;
            return acc;
          }, {}),
        ),
      ).toBe(FakeTemplate);
    });
  });
  it('returns the registry template when uiOptions names a template that is not registered', () => {
    KEYS.forEach((name) => {
      const options: UIOptionsType = { [name]: 'NotRegistered' };
      expect(getTemplate<typeof name>(name, registry, options, { entryLabel: () => '"root"' })).toBe(FakeTemplate);
      expect(warnSuppression.consoleSpy).toHaveBeenCalledWith(
        `ui:${name} for "root" names no registered template ('NotRegistered'), so it is ignored.`,
      );
    });
  });
  it('returns the custom template name from the registry', () => {
    const customTemplateKey = 'CustomTemplate';
    const newRegistry = { ...registry, templates: { ...registry.templates } };

    newRegistry.templates[customTemplateKey] = FakeTemplate;

    expect(getTemplate(customTemplateKey, newRegistry)).toBe(FakeTemplate);
  });

  it('returns undefined when the custom template is not in the registry', () => {
    const customTemplateKey = 'CustomTemplate';

    expect(getTemplate(customTemplateKey, registry)).toBeUndefined();
  });
});

describe('getTemplates', () => {
  const warnSuppression = setupConsoleWarnSuppression();
  it('does not warn about an ordinary option that shares its name with a custom template', () => {
    const customRegistry: Registry = { ...registry, templates: { ...registry.templates, help: FakeTemplate } };
    const options: UIOptionsType = { help: 'Enter your name' };
    expect(getTemplates(customRegistry, options)).toBe(customRegistry.templates);
    expect(warnSuppression.consoleSpy).not.toHaveBeenCalled();
  });
  it('returns the registry templates themselves when no uiOptions override one', () => {
    expect(getTemplates(registry)).toBe(registry.templates);
    expect(getTemplates(registry, { label: false })).toBe(registry.templates);
  });
  it('resolves each template uiOptions overrides the same way getTemplate does', () => {
    const registryKeyOverride: UIOptionsType = Object.fromEntries([['DescriptionFieldTemplate', 'FieldTemplate']]);
    const templates = getTemplates(registry, { ...uiOptions, ...registryKeyOverride, label: false });
    KEYS.forEach((name) => {
      expect(templates[name]).toBe(name === 'DescriptionFieldTemplate' ? FakeTemplate : CustomTemplate);
    });
    expect(templates.ButtonTemplates).toBe(registry.templates.ButtonTemplates);
    expect(templates).not.toHaveProperty('label');
  });
  it('leaves out an override for a template the registry lacks, unlike getTemplate', () => {
    expect(getTemplates(registry, { CustomTemplate })).toBe(registry.templates);
    expect(getTemplate('CustomTemplate', registry, { CustomTemplate })).toBe(CustomTemplate);
  });
});
