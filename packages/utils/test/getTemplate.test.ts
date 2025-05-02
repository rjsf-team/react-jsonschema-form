import {
  createSchemaUtils,
  englishStringTranslator,
  getTemplate,
  RJSFSchema,
  Registry,
  TemplatesType,
  UIOptionsType,
} from '../src';
import getTestValidator from './testUtils/getTestValidator';
import cloneDeep from 'lodash/cloneDeep';

const FakeTemplate = () => null;

const CustomTemplate = () => undefined;

const registry: Registry = {
  formContext: {},
  rootSchema: {} as RJSFSchema,
  schemaUtils: createSchemaUtils(getTestValidator({}), {}),
  translateString: englishStringTranslator,
  templates: {
    ArrayFieldDescriptionTemplate: FakeTemplate,
    ArrayFieldItemTemplate: FakeTemplate,
    ArrayFieldItemButtonsTemplate: FakeTemplate,
    ArrayFieldTemplate: FakeTemplate,
    ArrayFieldTitleTemplate: FakeTemplate,
    BaseInputTemplate: FakeTemplate,
    ButtonTemplates: {
      AddButton: FakeTemplate,
      CopyButton: FakeTemplate,
      MoveDownButton: FakeTemplate,
      MoveUpButton: FakeTemplate,
      RemoveButton: FakeTemplate,
      SubmitButton: FakeTemplate,
    },
    DescriptionFieldTemplate: FakeTemplate,
    ErrorListTemplate: FakeTemplate,
    FieldErrorTemplate: FakeTemplate,
    FieldHelpTemplate: FakeTemplate,
    FieldTemplate: FakeTemplate,
    GridTemplate: FakeTemplate,
    ObjectFieldTemplate: FakeTemplate,
    TitleFieldTemplate: FakeTemplate,
    UnsupportedFieldTemplate: FakeTemplate,
    WrapIfAdditionalTemplate: FakeTemplate,
  },
  fields: {},
  widgets: {},
};

const uiOptions: UIOptionsType = {
  ArrayFieldDescriptionTemplate: CustomTemplate as unknown as UIOptionsType['ArrayFieldDescriptionTemplate'],
  ArrayFieldItemTemplate: CustomTemplate as unknown as UIOptionsType['ArrayFieldItemTemplate'],
  ArrayFieldItemButtonsTemplate: CustomTemplate as unknown as UIOptionsType['ArrayFieldItemButtonsTemplate'],
  ArrayFieldTemplate: CustomTemplate as unknown as UIOptionsType['ArrayFieldTemplate'],
  ArrayFieldTitleTemplate: CustomTemplate as unknown as UIOptionsType['ArrayFieldTitleTemplate'],
  BaseInputTemplate: CustomTemplate as unknown as UIOptionsType['BaseInputTemplate'],
  DescriptionFieldTemplate: CustomTemplate as unknown as UIOptionsType['DescriptionFieldTemplate'],
  ErrorListTemplate: CustomTemplate as unknown as UIOptionsType['ErrorListTemplate'],
  FieldErrorTemplate: CustomTemplate as unknown as UIOptionsType['FieldErrorTemplate'],
  FieldHelpTemplate: CustomTemplate as unknown as UIOptionsType['FieldHelpTemplate'],
  FieldTemplate: CustomTemplate as unknown as UIOptionsType['FieldTemplate'],
  GridTemplate: CustomTemplate as unknown as UIOptionsType['GridTemplate'],
  ObjectFieldTemplate: CustomTemplate as unknown as UIOptionsType['ObjectFieldTemplate'],
  TitleFieldTemplate: CustomTemplate as unknown as UIOptionsType['TitleFieldTemplate'],
  UnsupportedFieldTemplate: CustomTemplate as unknown as UIOptionsType['UnsupportedFieldTemplate'],
  WrapIfAdditionalTemplate: CustomTemplate as unknown as UIOptionsType['WrapIfAdditionalTemplate'],
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
      const name = key as keyof TemplatesType;
      expect(getTemplate<typeof name>(name, registry)).toBe(FakeTemplate);
    });
  });
  it('returns the template from uiOptions when available', () => {
    KEYS.forEach((key) => {
      const name = key as keyof TemplatesType;
      expect(getTemplate<typeof name>(name, registry, uiOptions)).toBe(CustomTemplate);
    });
  });
  it('returns the template from registry using uiOptions key when available', () => {
    KEYS.forEach((key) => {
      const name = key as keyof TemplatesType;
      expect(
        getTemplate<typeof name>(
          name,
          registry,
          Object.keys(uiOptions).reduce((uiOptions, key) => {
            (uiOptions as Record<string, any>)[key] = key;
            return uiOptions;
          }, {}),
        ),
      ).toBe(FakeTemplate);
    });
  });
  it('returns the custom template name from the registry', () => {
    const customTemplateKey = 'CustomTemplate';
    const newRegistry = cloneDeep(registry);

    newRegistry.templates[customTemplateKey] = FakeTemplate;

    expect(getTemplate(customTemplateKey, newRegistry)).toBe(FakeTemplate);
  });

  it('returns undefined when the custom template is not in the registry', () => {
    const customTemplateKey = 'CustomTemplate';

    expect(getTemplate(customTemplateKey, registry)).toBeUndefined();
  });
});
