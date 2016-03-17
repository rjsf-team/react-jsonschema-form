import React from "react";
import { expect } from "chai";
import { Simulate } from "react-addons-test-utils";

import { createFormComponent } from "./test_utils";

describe("ObjectField", () => {
  describe("schema", () => {
    const schema = {
      type: "object",
      title: "my object",
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

      expect(node.querySelector("fieldset > legend").textContent)
        .eql("my object");
    });

    it("should render a customized title", () => {
      const CustomTitleField = ({title}) => <div id="custom">{title}</div>;

      const {node} = createFormComponent({schema, TitleField: CustomTitleField});
      expect(node.querySelector("fieldset > #custom").textContent)
      .to.eql("my object");
    });

    it("should render a default property label", () => {
      const {node} = createFormComponent({schema});

      expect(node.querySelector(".field-boolean label > span").textContent)
        .eql("bar");
    });

    it("should render a string property", () => {
      const {node} = createFormComponent({schema});

      expect(node.querySelectorAll(".field input[type=text]"))
        .to.have.length.of(1);
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
      expect(node.querySelector(".field-string label").textContent)
        .eql("Foo*");
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
        node.querySelectorAll(".field > label"), l => l.textContent);

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
        node.querySelectorAll(".field > label"), l => l.textContent);

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
        node.querySelectorAll(".field > label"), l => l.textContent);

      expect(labels).eql(["bar", "foo"]);
    });
  });
});
