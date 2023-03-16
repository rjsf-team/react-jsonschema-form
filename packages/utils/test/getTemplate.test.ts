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
  ArrayFieldTemplate: CustomTemplate as unknown as UIOptionsType['ArrayFieldTemplate'],
  ArrayFieldTitleTemplate: CustomTemplate as unknown as UIOptionsType['ArrayFieldTitleTemplate'],
  BaseInputTemplate: CustomTemplate as unknown as UIOptionsType['BaseInputTemplate'],
  DescriptionFieldTemplate: CustomTemplate as unknown as UIOptionsType['DescriptionFieldTemplate'],
  ErrorListTemplate: CustomTemplate as unknown as UIOptionsType['ErrorListTemplate'],
  FieldErrorTemplate: CustomTemplate as unknown as UIOptionsType['FieldErrorTemplate'],
  FieldHelpTemplate: CustomTemplate as unknown as UIOptionsType['FieldHelpTemplate'],
  FieldTemplate: CustomTemplate as unknown as UIOptionsType['FieldTemplate'],
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
      registry.templates.ButtonTemplates
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
});
