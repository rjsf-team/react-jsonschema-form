import {
  createSchemaUtils,
  getTemplate,
  Registry,
  TemplatesType,
  UIOptionsType,
} from "../src";
import getTestValidator from "./testUtils/getTestValidator";

const FakeTemplate = () => null;

const CustomTemplate = () => undefined;

const registry: Registry = {
  formContext: {},
  rootSchema: {},
  schemaUtils: createSchemaUtils(getTestValidator({}), {}),
  templates: {
    ArrayFieldDescriptionTemplate: FakeTemplate,
    ArrayFieldItemTemplate: FakeTemplate,
    ArrayFieldTemplate: FakeTemplate,
    ArrayFieldTitleTemplate: FakeTemplate,
    BaseInputTemplate: FakeTemplate,
    DescriptionFieldTemplate: FakeTemplate,
    ErrorListTemplate: FakeTemplate,
    FieldTemplate: FakeTemplate,
    ObjectFieldTemplate: FakeTemplate,
    TitleFieldTemplate: FakeTemplate,
    UnsupportedFieldTemplate: FakeTemplate,
  },
  fields: {},
  widgets: {},
};

const uiOptions: UIOptionsType = {
  ArrayFieldDescriptionTemplate:
    CustomTemplate as unknown as UIOptionsType["ArrayFieldDescriptionTemplate"],
  ArrayFieldItemTemplate:
    CustomTemplate as unknown as UIOptionsType["ArrayFieldItemTemplate"],
  ArrayFieldTemplate:
    CustomTemplate as unknown as UIOptionsType["ArrayFieldTemplate"],
  ArrayFieldTitleTemplate:
    CustomTemplate as unknown as UIOptionsType["ArrayFieldTitleTemplate"],
  BaseInputTemplate:
    CustomTemplate as unknown as UIOptionsType["BaseInputTemplate"],
  DescriptionFieldTemplate:
    CustomTemplate as unknown as UIOptionsType["DescriptionFieldTemplate"],
  ErrorListTemplate:
    CustomTemplate as unknown as UIOptionsType["ErrorListTemplate"],
  FieldTemplate: CustomTemplate as unknown as UIOptionsType["FieldTemplate"],
  ObjectFieldTemplate:
    CustomTemplate as unknown as UIOptionsType["ObjectFieldTemplate"],
  TitleFieldTemplate:
    CustomTemplate as unknown as UIOptionsType["TitleFieldTemplate"],
  UnsupportedFieldTemplate:
    CustomTemplate as unknown as UIOptionsType["UnsupportedFieldTemplate"],
};

const KEYS = Object.keys(registry.templates);

describe("getTemplate", () => {
  it("returns the template from registry", () => {
    KEYS.forEach((key) => {
      const name = key as keyof TemplatesType;
      expect(getTemplate<typeof name>(name, registry)).toBe(FakeTemplate);
    });
  });
  it("returns the template from uiOptions when available", () => {
    KEYS.forEach((key) => {
      const name = key as keyof TemplatesType;
      expect(getTemplate<typeof name>(name, registry, uiOptions)).toBe(
        CustomTemplate
      );
    });
  });
});
