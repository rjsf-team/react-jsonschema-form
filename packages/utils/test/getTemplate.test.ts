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
    KEYS.forEach((key) => {
      const name = key;
      expect(getTemplate<typeof name>(name, registry, { [name]: 'NotRegistered' })).toBe(FakeTemplate);
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
