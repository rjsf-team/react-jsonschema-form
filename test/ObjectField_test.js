import React from "react";
import { expect } from "chai";
import { Simulate } from "react-addons-test-utils";

import { createFormComponent, createSandbox } from "./test_utils";


describe("ObjectField", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("schema", () => {
    const schema = {
      type: "object",
      title: "my object",
      description: "my description",
      required: ["foo"],
      default: {
        foo: "hey",
        bar: true,
      },
      properties: {
        foo: {
          title: "Foo",
          type: "string",
        },
        bar: {
          type: "boolean",
        },
        baz: {
          type: "string",
        }
      }
    };

    it("should render a fieldset", () => {
      const {node} = createFormComponent({schema});

      expect(node.querySelectorAll("fieldset"))
        .to.have.length.of(1);
    });

    it("should render a fieldset legend", () => {
      const {node} = createFormComponent({schema});

      const legend = node.querySelector("fieldset > legend");

      expect(legend.querySelector(".label-text").textContent).eql("my object");
      expect(legend.id).eql("root__title");
    });

    it("should render a customized title", () => {
      const CustomTitleField = ({title}) => <div id="custom">{title}</div>;

      const {node} = createFormComponent({schema, fields: {
        TitleField: CustomTitleField
      }});
      expect(node.querySelector("fieldset > #custom").textContent)
      .to.eql("my object");
    });

    it("should render a customized description", () => {
      const CustomDescriptionField = ({description}) => <div id="custom">{description}</div>;

      const {node} = createFormComponent({schema, DescriptionField: CustomDescriptionField});
      expect(node.querySelector("fieldset > #custom").textContent)
      .to.eql("my description");
    });

    it("should render a default property label", () => {
      const {node} = createFormComponent({schema});

      expect(node.querySelector(".field-boolean label").textContent)
        .eql("bar");
    });

    it("should render string fields", () => {
      const {node} = createFormComponent({schema});

      expect(node.querySelectorAll(".field input[type=text]"))
        .to.have.length.of(2);
    });

    it("should render a boolean property", () => {
      const {node} = createFormComponent({schema});

      expect(node.querySelectorAll(".field input[type=checkbox]"))
        .to.have.length.of(1);
    });

    it("should handle a default object value", () => {
      const {node} = createFormComponent({schema});

      expect(node.querySelector(".field input[type=text]").value)
        .eql("hey");
      expect(node.querySelector(".field input[type=checkbox]").checked)
        .eql(true);
    });

    it("should handle required values", () => {
      const {node} = createFormComponent({schema});

      // Required field is <input type="text" required="">
      expect(node.querySelector("input[type=text]").getAttribute("required"))
        .eql("");
    });

    it("should handle optional values", () => {
      const {node} = createFormComponent({schema});

      expect(node.querySelector("[for=root_baz] .field-optional").textContent)
        .eql("Optional");
    });

    it("should fill fields with form data", () => {
      const {node} = createFormComponent({schema, formData: {
        foo: "hey",
        bar: true,
      }});

      expect(node.querySelector(".field input[type=text]").value)
        .eql("hey");
      expect(node.querySelector(".field input[type=checkbox]").checked)
        .eql(true);
    });

    it("should handle object fields change events", () => {
      const {comp, node} = createFormComponent({schema});

      Simulate.change(node.querySelector("input[type=text]"), {
        target: {value: "changed"}
      });

      expect(comp.state.formData.foo).eql("changed");
    });

    it("should render the widget with the expected id", () => {
      const {node} = createFormComponent({schema});

      expect(node.querySelector("input[type=text]").id).eql("root_foo");
      expect(node.querySelector("input[type=checkbox]").id).eql("root_bar");
    });
  });

  describe("fields ordering", () => {
    const schema = {
      type: "object",
      properties: {
        foo: {type: "string"},
        bar: {type: "string"}
      }
    };

    it("should use provided order", () => {
      const {node} = createFormComponent({schema, uiSchema: {
        "ui:order": ["bar", "foo"]
      }});
      const labels = [].map.call(
        node.querySelectorAll(".field .label-text"), l => l.textContent);

      expect(labels).eql(["bar", "foo"]);
    });

    it("should throw when order list length mismatches", () => {
      const {node} = createFormComponent({schema, uiSchema: {
        "ui:order": ["bar", "foo", "baz?"]
      }});

      expect(node.querySelector(".config-error").textContent)
        .to.match(/should match object properties length/);
    });

    it("should throw when order and properties lists differs", () => {
      const {node} = createFormComponent({schema, uiSchema: {
        "ui:order": ["bar", "wut?"]
      }});

      expect(node.querySelector(".config-error").textContent)
        .to.match(/does not match object properties list/);
    });

    it("should order referenced schema definitions", () => {
      const refSchema = {
        definitions: {
          testdef: {type: "string"}
        },
        type: "object",
        properties: {
          foo: {$ref: "#/definitions/testdef"},
          bar: {$ref: "#/definitions/testdef"}
        }
      };

      const {node} = createFormComponent({schema: refSchema, uiSchema: {
        "ui:order": ["bar", "foo"]
      }});
      const labels = [].map.call(
        node.querySelectorAll(".field .label-text"), l => l.textContent);

      expect(labels).eql(["bar", "foo"]);
    });

    it("should order referenced object schema definition properties", () => {
      const refSchema = {
        definitions: {
          testdef: {
            type: "object",
            properties: {
              foo: {type: "string"},
              bar: {type: "string"},
            }
          }
        },
        type: "object",
        properties: {
          root: {$ref: "#/definitions/testdef"},
        }
      };

      const {node} = createFormComponent({schema: refSchema, uiSchema: {
        root: {
          "ui:order": ["bar", "foo"]
        }
      }});
      const labels = [].map.call(
        node.querySelectorAll(".field label .label-text"), l => l.textContent);

      expect(labels).eql(["bar", "foo"]);
    });

    it("should render the widget with the expected id", () => {
      const {node} = createFormComponent({schema, uiSchema: {
        "ui:order": ["bar", "foo"]
      }});

      const ids = [].map.call(node.querySelectorAll("input[type=text]"),
        (node) => node.id);
      expect(ids).eql(["root_bar", "root_foo"]);
    });
  });
});
