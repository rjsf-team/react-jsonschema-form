import { createElement, forwardRef, lazy, memo } from 'react';

import { setupConsoleWarnSuppression } from '../../../testing/consoleSuppression.ts';
import type { Registry, UIOptionsType } from '../src/index.ts';
import { createSchemaUtils, englishStringTranslator, getTemplate, getTemplates } from '../src/index.ts';
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
    getTemplate('FieldTemplate', registry, invalidOptions);
    getTemplate('FieldTemplate', registry, invalidOptions);
    expect(warnSuppression.consoleSpy).toHaveBeenCalledExactlyOnceWith(
      'ui:FieldTemplate is a React element rather than a component (pass MyTemplate, not <MyTemplate />), so it is ignored.',
    );
  });

  it.each([createElement(FakeTemplate), { arbitrary: true }, 42, true, '', 0, false, null])(
    'falls back and warns when the override is not a component: %s',
    (override) => {
      const invalidOptions: UIOptionsType = Object.fromEntries([['FieldTemplate', override]]);
      expect(getTemplate('FieldTemplate', registry, invalidOptions)).toBe(FakeTemplate);
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
    expect(getTemplate('FieldTemplate', invalidRegistry, options)).toBe(FakeTemplate);
  });

  it('reports separate unknown template names and dedupes the same name', () => {
    ['Typo1', 'Typo2', 'Typo1'].forEach((FieldTemplate) => {
      getTemplate('FieldTemplate', registry, Object.fromEntries([['FieldTemplate', FieldTemplate]]));
    });
    expect(warnSuppression.consoleSpy.mock.calls).toEqual([
      ["ui:FieldTemplate names no registered template ('Typo1'), so it is ignored."],
      ["ui:FieldTemplate names no registered template ('Typo2'), so it is ignored."],
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
      expect(getTemplate<typeof name>(name, registry, { [name]: 'NotRegistered' })).toBe(FakeTemplate);
      expect(warnSuppression.consoleSpy).toHaveBeenCalledWith(
        `ui:${name} names no registered template ('NotRegistered'), so it is ignored.`,
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
  it('returns the registry templates themselves when no uiOptions override one', () => {
    expect(getTemplates(registry)).toBe(registry.templates);
    expect(getTemplates(registry, { label: false })).toBe(registry.templates);
  });
  it('resolves each template uiOptions overrides the same way getTemplate does', () => {
    const registryKeyOverride: UIOptionsType = Object.fromEntries([['DescriptionFieldTemplate', 'FieldTemplate']]);
    const templates = getTemplates(registry, {
      ...uiOptions,
      ...registryKeyOverride,
      label: false,
    });
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
