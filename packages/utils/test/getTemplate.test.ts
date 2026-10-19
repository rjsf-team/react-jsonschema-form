import { createElement, forwardRef, lazy, memo } from 'react';

import { setupConsoleWarnSuppression } from '../../../testing/consoleSuppression.ts';
import type { Registry, UIOptionsType } from '../src/index.ts';
import { createSchemaUtils, englishStringTranslator, getTemplate, getTemplates, resetLogOnce } from '../src/index.ts';
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
    const warnSource = { entryLabel: () => '"root"', ownUiOptions: invalidOptions };
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

  it.each([createElement(FakeTemplate), { arbitrary: true }, 42, true, '', 0, false, null])(
    'falls back and warns when the override is not a component: %s',
    (override) => {
      const invalidOptions: UIOptionsType = Object.fromEntries([['FieldTemplate', override]]);
      const warnSource = { entryLabel: () => '"root"', ownUiOptions: invalidOptions };
      expect(getTemplate('FieldTemplate', registry, invalidOptions, warnSource)).toBe(FakeTemplate);
      expect(warnSuppression.consoleSpy).toHaveBeenCalledOnce();
      expect(getTemplates(registry, invalidOptions)).toBe(registry.templates);
    },
  );

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
    const warnSource = { entryLabel: () => '"root"', ownUiOptions: options };
    expect(getTemplate('FieldTemplate', invalidRegistry, options, warnSource)).toBe(FakeTemplate);
    expect(warnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
      'ui:FieldTemplate for "root" names a registered template (\'Invalid\') that is a React element rather than a component (pass MyTemplate, not <MyTemplate />), so it is ignored.',
    );
  });

  it('describes a string registry entry as the value it is, not as a name to look up', () => {
    const invalidRegistry: Registry = { ...registry, templates: { ...registry.templates } };
    const customTemplates: Record<string, unknown> = invalidRegistry.templates;
    customTemplates.FieldTemplate = 'Foo';
    expect(getTemplate('FieldTemplate', invalidRegistry)).toBe('Foo');
    expect(warnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
      "The registry's FieldTemplate is not a component (got string).",
    );
  });

  it('warns when the registry template is not a component either', () => {
    const invalidRegistry: Registry = { ...registry, templates: { ...registry.templates } };
    const customTemplates: Record<string, unknown> = invalidRegistry.templates;
    customTemplates.FieldTemplate = createElement(FakeTemplate);
    const options: UIOptionsType = { FieldTemplate: 42 as unknown as UIOptionsType['FieldTemplate'] };
    const warnSource = { entryLabel: () => '"root"', ownUiOptions: options };
    getTemplate('FieldTemplate', invalidRegistry, options, warnSource);
    expect(warnSuppression.consoleSpy.mock.calls).toEqual([
      ['ui:FieldTemplate for "root" is not a component (got number), so it is ignored.'],
      [
        "The registry's FieldTemplate is a React element rather than a component (pass MyTemplate, not <MyTemplate />).",
      ],
    ]);
  });

  it('names the field in the warning when given its label', () => {
    const fieldOptions: UIOptionsType = {
      FieldTemplate: 'Typo' as unknown as UIOptionsType['FieldTemplate'],
    };
    getTemplate('FieldTemplate', registry, fieldOptions, {
      entryLabel: () => '"root_a" (a)',
      ownUiOptions: fieldOptions,
    });
    const objectOptions: UIOptionsType = {
      ObjectFieldTemplate: 'Typo' as unknown as UIOptionsType['ObjectFieldTemplate'],
    };
    getTemplates(registry, objectOptions, {
      entryLabel: () => '"root_b" (b)',
      ownUiOptions: objectOptions,
    });
    expect(warnSuppression.consoleSpy.mock.calls).toEqual([
      ['ui:FieldTemplate for "root_a" (a) names no registered template (\'Typo\'), so it is ignored.'],
      ['ui:ObjectFieldTemplate for "root_b" (b) names no registered template (\'Typo\'), so it is ignored.'],
    ]);
  });

  it('says so when the invalid override came from ui:globalOptions', () => {
    const globalRegistry: Registry = {
      ...registry,
      globalUiOptions: { FieldTemplate: 'Typo' as unknown as UIOptionsType['FieldTemplate'] },
    };
    // The merged options carry the global value, while the field's own options do not set it
    getTemplate('FieldTemplate', globalRegistry, globalRegistry.globalUiOptions, {
      entryLabel: () => '"root_a" (a)',
      ownUiOptions: {},
    });
    expect(warnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
      "ui:globalOptions.FieldTemplate names no registered template ('Typo'), so it is ignored.",
    );
  });

  it('blames the field, not ui:globalOptions, when both set the same invalid value', () => {
    const globalRegistry: Registry = {
      ...registry,
      globalUiOptions: { FieldTemplate: 'Typo' as unknown as UIOptionsType['FieldTemplate'] },
    };
    const ownOptions: UIOptionsType = {
      FieldTemplate: 'Typo' as unknown as UIOptionsType['FieldTemplate'],
    };
    getTemplate('FieldTemplate', globalRegistry, ownOptions, {
      entryLabel: () => '"root_a" (a)',
      ownUiOptions: ownOptions,
    });
    expect(warnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
      'ui:FieldTemplate for "root_a" (a) names no registered template (\'Typo\'), so it is ignored.',
    );
  });

  it('falls back to a ui:globalOptions template named by string when the field-level override is invalid', () => {
    const globalRegistry: Registry = {
      ...registry,
      templates: { ...registry.templates, MyTemplate: CustomTemplate },
      globalUiOptions: { FieldTemplate: 'MyTemplate' },
    };
    const ownOptions: UIOptionsType = Object.fromEntries([['FieldTemplate', createElement(FakeTemplate)]]);
    expect(
      getTemplate('FieldTemplate', globalRegistry, ownOptions, {
        entryLabel: () => '"root_a" (a)',
        ownUiOptions: ownOptions,
      }),
    ).toBe(CustomTemplate);
    expect(warnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
      'ui:FieldTemplate for "root_a" (a) is a React element rather than a component (pass MyTemplate, not <MyTemplate />), so it is ignored.',
    );
  });

  it('falls back to the registry template when the ui:globalOptions template names no registered template', () => {
    const globalRegistry: Registry = {
      ...registry,
      globalUiOptions: { FieldTemplate: 'NotRegistered' },
    };
    const ownOptions: UIOptionsType = Object.fromEntries([['FieldTemplate', createElement(FakeTemplate)]]);
    expect(
      getTemplate('FieldTemplate', globalRegistry, ownOptions, {
        entryLabel: () => '"root_a" (a)',
        ownUiOptions: ownOptions,
      }),
    ).toBe(FakeTemplate);
    expect(warnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
      'ui:FieldTemplate for "root_a" (a) is a React element rather than a component (pass MyTemplate, not <MyTemplate />), so it is ignored.',
    );
  });

  it('warns once when several fields inherit the same invalid ui:globalOptions template', () => {
    const globalRegistry: Registry = {
      ...registry,
      globalUiOptions: { FieldTemplate: 'Typo' as unknown as UIOptionsType['FieldTemplate'] },
    };
    const options = globalRegistry.globalUiOptions as UIOptionsType;
    const warnSource = { entryLabel: () => '"root"', ownUiOptions: {} };
    getTemplate('FieldTemplate', globalRegistry, options, warnSource);
    getTemplate('FieldTemplate', globalRegistry, options, warnSource);
    expect(warnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
      "ui:globalOptions.FieldTemplate names no registered template ('Typo'), so it is ignored.",
    );
  });

  it('warns again after resetLogOnce(), as the playground does on each sample load', () => {
    const invalidOptions: UIOptionsType = Object.fromEntries([['FieldTemplate', createElement(FakeTemplate)]]);
    const warnSource = { entryLabel: () => '"root_name"', ownUiOptions: invalidOptions };
    getTemplate('FieldTemplate', registry, invalidOptions, warnSource);
    getTemplate('FieldTemplate', registry, invalidOptions, warnSource);
    expect(warnSuppression.consoleSpy).toHaveBeenCalledOnce();
    resetLogOnce();
    getTemplate('FieldTemplate', registry, invalidOptions, warnSource);
    expect(warnSuppression.consoleSpy).toHaveBeenCalledTimes(2);
  });

  it('warns for each kind of invalid value an entry is edited to, and tells a string from an object', () => {
    const warnSource = (options: UIOptionsType) => ({ entryLabel: () => '"root"', ownUiOptions: options });
    const warnFor = (value: unknown) => {
      const options: UIOptionsType = Object.fromEntries([['FieldTemplate', value]]);
      getTemplate('FieldTemplate', registry, options, warnSource(options));
    };
    warnFor({});
    warnFor(createElement(FakeTemplate));
    warnFor(null);
    warnFor('object');
    warnFor({});
    expect(warnSuppression.consoleSpy).toHaveBeenCalledTimes(4);
    expect(warnSuppression.consoleSpy.mock.calls[0][0]).toContain('got object');
    expect(warnSuppression.consoleSpy.mock.calls[1][0]).toContain('React element');
    expect(warnSuppression.consoleSpy.mock.calls[2][0]).toContain('got null');
    expect(warnSuppression.consoleSpy.mock.calls[3][0]).toContain("'object'");
  });

  it('stays silent about a custom-named registry entry that is not a component', () => {
    const customRegistry: Registry = { ...registry, templates: { ...registry.templates, myThing: {} } };
    const options: UIOptionsType = { myThing: {} };
    const warnSource = { entryLabel: () => '"root"', ownUiOptions: options };
    expect(getTemplate('myThing', customRegistry)).toEqual({});
    expect(getTemplate('myThing', customRegistry, options)).toEqual({});
    expect(getTemplate('myThing', customRegistry, options, warnSource)).toEqual({});
    expect(warnSuppression.consoleSpy).not.toHaveBeenCalled();
  });

  it('falls back to a valid ui:globalOptions template when the field-level override is invalid', () => {
    const globalRegistry: Registry = {
      ...registry,
      globalUiOptions: { FieldTemplate: CustomTemplate },
    };
    const ownOptions: UIOptionsType = Object.fromEntries([['FieldTemplate', createElement(FakeTemplate)]]);
    expect(
      getTemplate('FieldTemplate', globalRegistry, ownOptions, {
        entryLabel: () => '"root_a" (a)',
        ownUiOptions: ownOptions,
      }),
    ).toBe(CustomTemplate);
    expect(warnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
      'ui:FieldTemplate for "root_a" (a) is a React element rather than a component (pass MyTemplate, not <MyTemplate />), so it is ignored.',
    );
  });

  it('reports separate unknown template names and dedupes the same name', () => {
    ['Typo1', 'Typo2', 'Typo1'].forEach((FieldTemplate) => {
      const options: UIOptionsType = Object.fromEntries([['FieldTemplate', FieldTemplate]]);
      getTemplate('FieldTemplate', registry, options, { entryLabel: () => '"root"', ownUiOptions: options });
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
      expect(
        getTemplate<typeof name>(name, registry, options, { entryLabel: () => '"root"', ownUiOptions: options }),
      ).toBe(FakeTemplate);
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
