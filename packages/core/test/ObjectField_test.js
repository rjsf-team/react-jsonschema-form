import React from "react";
import { expect } from "chai";
import { Simulate } from "react-dom/test-utils";

import { createFormComponent, createSandbox } from "./test_utils";
import validateFormData from "../src/validate";

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
        bar: true
      },
      properties: {
        foo: {
          title: "Foo",
          type: "string"
        },
        bar: {
          type: "boolean"
        }
      }
    };

    it("should render a fieldset", () => {
      const { node } = createFormComponent({ schema });

      const fieldset = node.querySelectorAll("fieldset");
      expect(fieldset).to.have.length.of(1);
      expect(fieldset[0].id).eql("root");
    });

    it("should render a fieldset legend", () => {
      const { node } = createFormComponent({ schema });

      const legend = node.querySelector("fieldset > legend");

      expect(legend.textContent).eql("my object");
      expect(legend.id).eql("root__title");
    });

    it("should render a hidden object", () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          "ui:widget": "hidden"
        }
      });
      expect(node.querySelector("div.hidden > fieldset")).to.exist;
    });

    it("should render a customized title", () => {
      const CustomTitleField = ({ title }) => <div id="custom">{title}</div>;

      const { node } = createFormComponent({
        schema,
        fields: {
          TitleField: CustomTitleField
        }
      });
      expect(node.querySelector("fieldset > #custom").textContent).to.eql(
        "my object"
      );
    });

    it("should render a customized description", () => {
      const CustomDescriptionField = ({ description }) => (
        <div id="custom">{description}</div>
      );

      const { node } = createFormComponent({
        schema,
        fields: { DescriptionField: CustomDescriptionField }
      });
      expect(node.querySelector("fieldset > #custom").textContent).to.eql(
        "my description"
      );
    });

    it("should render a default property label", () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelector(".field-boolean label").textContent).eql("bar");
    });

    it("should render a string property", () => {
      const { node } = createFormComponent({ schema });

      expect(
        node.querySelectorAll(".field input[type=text]")
      ).to.have.length.of(1);
    });

    it("should render a boolean property", () => {
      const { node } = createFormComponent({ schema });

      expect(
        node.querySelectorAll(".field input[type=checkbox]")
      ).to.have.length.of(1);
    });

    it("should handle a default object value", () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelector(".field input[type=text]").value).eql("hey");
      expect(node.querySelector(".field input[type=checkbox]").checked).eql(
        true
      );
    });

    it("should handle required values", () => {
      const { node } = createFormComponent({ schema });

      // Required field is <input type="text" required="">
      expect(
        node.querySelector("input[type=text]").getAttribute("required")
      ).eql("");
      expect(node.querySelector(".field-string label").textContent).eql("Foo*");
    });

    it("should fill fields with form data", () => {
      const { node } = createFormComponent({
        schema,
        formData: {
          foo: "hey",
          bar: true
        }
      });

      expect(node.querySelector(".field input[type=text]").value).eql("hey");
      expect(node.querySelector(".field input[type=checkbox]").checked).eql(
        true
      );
    });

    it("should handle object fields change events", () => {
      const { comp, node } = createFormComponent({ schema });

      Simulate.change(node.querySelector("input[type=text]"), {
        target: { value: "changed" }
      });

      expect(comp.state.formData.foo).eql("changed");
    });

    it("should handle object fields with blur events", () => {
      const onBlur = sandbox.spy();
      const { node } = createFormComponent({ schema, onBlur });

      const input = node.querySelector("input[type=text]");
      Simulate.blur(input, {
        target: { value: "changed" }
      });

      expect(onBlur.calledWith(input.id, "changed")).to.be.true;
    });

    it("should handle object fields with focus events", () => {
      const onFocus = sandbox.spy();
      const { node } = createFormComponent({ schema, onFocus });

      const input = node.querySelector("input[type=text]");
      Simulate.focus(input, {
        target: { value: "changed" }
      });

      expect(onFocus.calledWith(input.id, "changed")).to.be.true;
    });

    it("should render the widget with the expected id", () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelector("input[type=text]").id).eql("root_foo");
      expect(node.querySelector("input[type=checkbox]").id).eql("root_bar");
    });
  });

  describe("fields ordering", () => {
    const schema = {
      type: "object",
      properties: {
        foo: { type: "string" },
        bar: { type: "string" },
        baz: { type: "string" },
        qux: { type: "string" }
      }
    };

    it("should use provided order", () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          "ui:order": ["baz", "qux", "bar", "foo"]
        }
      });
      const labels = [].map.call(
        node.querySelectorAll(".field > label"),
        l => l.textContent
      );

      expect(labels).eql(["baz", "qux", "bar", "foo"]);
    });

    it("should insert unordered properties at wildcard position", () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          "ui:order": ["baz", "*", "foo"]
        }
      });
      const labels = [].map.call(
        node.querySelectorAll(".field > label"),
        l => l.textContent
      );

      expect(labels).eql(["baz", "bar", "qux", "foo"]);
    });

    it("should use provided order also if order list contains extraneous properties", () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          "ui:order": ["baz", "qux", "bar", "wut?", "foo", "huh?"]
        }
      });

      const labels = [].map.call(
        node.querySelectorAll(".field > label"),
        l => l.textContent
      );

      expect(labels).eql(["baz", "qux", "bar", "foo"]);
    });

    it("should throw when order list misses an existing property", () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          "ui:order": ["baz", "bar"]
        }
      });

      expect(node.querySelector(".config-error").textContent).to.match(
        /does not contain properties 'foo', 'qux'/
      );
    });

    it("should throw when more than one wildcard is present", () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          "ui:order": ["baz", "*", "bar", "*"]
        }
      });

      expect(node.querySelector(".config-error").textContent).to.match(
        /contains more than one wildcard/
      );
    });

    it("should order referenced schema definitions", () => {
      const refSchema = {
        definitions: {
          testdef: { type: "string" }
        },
        type: "object",
        properties: {
          foo: { $ref: "#/definitions/testdef" },
          bar: { $ref: "#/definitions/testdef" }
        }
      };

      const { node } = createFormComponent({
        schema: refSchema,
        uiSchema: {
          "ui:order": ["bar", "foo"]
        }
      });
      const labels = [].map.call(
        node.querySelectorAll(".field > label"),
        l => l.textContent
      );

      expect(labels).eql(["bar", "foo"]);
    });

    it("should order referenced object schema definition properties", () => {
      const refSchema = {
        definitions: {
          testdef: {
            type: "object",
            properties: {
              foo: { type: "string" },
              bar: { type: "string" }
            }
          }
        },
        type: "object",
        properties: {
          root: { $ref: "#/definitions/testdef" }
        }
      };

      const { node } = createFormComponent({
        schema: refSchema,
        uiSchema: {
          root: {
            "ui:order": ["bar", "foo"]
          }
        }
      });
      const labels = [].map.call(
        node.querySelectorAll(".field > label"),
        l => l.textContent
      );

      expect(labels).eql(["bar", "foo"]);
    });

    it("should render the widget with the expected id", () => {
      const schema = {
        type: "object",
        properties: {
          foo: { type: "string" },
          bar: { type: "string" }
        }
      };

      const { node } = createFormComponent({
        schema,
        uiSchema: {
          "ui:order": ["bar", "foo"]
        }
      });

      const ids = [].map.call(
        node.querySelectorAll("input[type=text]"),
        node => node.id
      );
      expect(ids).eql(["root_bar", "root_foo"]);
    });
  });

  describe("Title", () => {
    const TitleField = props => <div id={`title-${props.title}`} />;

    const fields = { TitleField };

    it("should pass field name to TitleField if there is no title", () => {
      const schema = {
        type: "object",
        properties: {
          object: {
            type: "object",
            properties: {}
          }
        }
      };

      const { node } = createFormComponent({ schema, fields });
      expect(node.querySelector("#title-object")).to.not.be.null;
    });

    it("should pass schema title to TitleField", () => {
      const schema = {
        type: "object",
        properties: {},
        title: "test"
      };

      const { node } = createFormComponent({ schema, fields });
      expect(node.querySelector("#title-test")).to.not.be.null;
    });

    it("should pass empty schema title to TitleField", () => {
      const schema = {
        type: "object",
        properties: {},
        title: ""
      };
      const { node } = createFormComponent({ schema, fields });
      expect(node.querySelector("#title-")).to.be.null;
    });
  });

  describe("additionalProperties", () => {
    const schema = {
      type: "object",
      additionalProperties: {
        type: "string"
      }
    };

    it("should automatically add a property field if in formData", () => {
      const { node } = createFormComponent({
        schema,
        formData: { first: 1 }
      });

      expect(node.querySelectorAll(".field-string")).to.have.length.of(1);
    });

    it("should apply uiSchema to additionalProperties", () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          additionalProperties: {
            "ui:title": "CustomName"
          }
        },
        formData: {
          property1: "test"
        }
      });
      const labels = node.querySelectorAll("label.control-label");
      expect(labels[0].textContent).eql("CustomName Key");
      expect(labels[1].textContent).eql("CustomName");
    });

    it("should pass through non-schema properties and not throw validation errors if additionalProperties is undefined", () => {
      const undefinedAPSchema = {
        ...schema,
        properties: { second: { type: "string" } }
      };
      delete undefinedAPSchema.additionalProperties;
      const { comp } = createFormComponent({
        schema: undefinedAPSchema,
        formData: { nonschema: 1 }
      });

      expect(comp.state.formData.nonschema).eql(1);

      const result = validateFormData(comp.state.formData, comp.state.schema);
      expect(result.errors).eql([]);
    });

    it("should pass through non-schema properties but throw a validation error if additionalProperties is false", () => {
      const { comp } = createFormComponent({
        schema: {
          ...schema,
          additionalProperties: false,
          properties: { second: { type: "string" } }
        },
        formData: { nonschema: 1 }
      });

      expect(comp.state.formData.nonschema).eql(1);

      const result = validateFormData(comp.state.formData, comp.state.schema);
      expect(result.errors[0].name).eql("additionalProperties");
    });

    it("should still obey properties if additionalProperties is defined", () => {
      const { node } = createFormComponent({
        schema: {
          ...schema,
          properties: {
            definedProperty: {
              type: "string"
            }
          }
        }
      });

      expect(node.querySelectorAll(".field-string")).to.have.length.of(1);
    });

    it("should render a label for the additional property key", () => {
      const { node } = createFormComponent({
        schema,
        formData: { first: 1 }
      });

      expect(node.querySelector("[for='root_first-key']").textContent).eql(
        "first Key"
      );
    });

    it("should render a label for the additional property key if additionalProperties is true", () => {
      const { node } = createFormComponent({
        schema: { ...schema, additionalProperties: true },
        formData: { first: 1 }
      });

      expect(node.querySelector("[for='root_first-key']").textContent).eql(
        "first Key"
      );
    });

    it("should not render a label for the additional property key if additionalProperties is false", () => {
      const { node } = createFormComponent({
        schema: { ...schema, additionalProperties: false },
        formData: { first: 1 }
      });

      expect(node.querySelector("[for='root_first-key']")).eql(null);
    });

    it("should render a text input for the additional property key", () => {
      const { node } = createFormComponent({
        schema,
        formData: { first: 1 }
      });

      expect(node.querySelector("#root_first-key").value).eql("first");
    });

    it("should render a label for the additional property value", () => {
      const { node } = createFormComponent({
        schema,
        formData: { first: 1 }
      });

      expect(node.querySelector("[for='root_first']").textContent).eql("first");
    });

    it("should render a text input for the additional property value", () => {
      const { node } = createFormComponent({
        schema,
        formData: { first: 1 }
      });

      expect(node.querySelector("#root_first").value).eql("1");
    });

    it("should rename formData key if key input is renamed", () => {
      const { comp, node } = createFormComponent({
        schema,
        formData: { first: 1 }
      });

      const textNode = node.querySelector("#root_first-key");
      Simulate.blur(textNode, {
        target: { value: "newFirst" }
      });

      expect(comp.state.formData.newFirst).eql(1);
    });

    it("should retain user-input data if key-value pair has a title present in the schema", () => {
      const { comp, node } = createFormComponent({
        schema: {
          type: "object",
          additionalProperties: {
            title: "Custom title",
            type: "string"
          }
        },
        formData: { "Custom title": 1 }
      });

      const textNode = node.querySelector("#root_Custom\\ title-key");
      Simulate.blur(textNode, {
        target: { value: "Renamed custom title" }
      });

      expect(comp.state.formData["Renamed custom title"]).eql(1);
    });

    it("should keep order of renamed key-value pairs while renaming key", () => {
      const { comp, node } = createFormComponent({
        schema,
        formData: { first: 1, second: 2, third: 3 }
      });

      const textNode = node.querySelector("#root_second-key");
      Simulate.blur(textNode, {
        target: { value: "newSecond" }
      });

      expect(Object.keys(comp.state.formData)).eql([
        "first",
        "newSecond",
        "third"
      ]);
    });

    it("should attach suffix to formData key if new key already exists when key input is renamed", () => {
      const formData = {
        first: 1,
        second: 2
      };
      const { comp, node } = createFormComponent({
        schema,
        formData
      });

      const textNode = node.querySelector("#root_first-key");
      Simulate.blur(textNode, {
        target: { value: "second" }
      });

      expect(comp.state.formData["second-1"]).eql(1);
    });

    it("should not attach suffix when input is only clicked", () => {
      const formData = {
        first: 1
      };
      const { comp, node } = createFormComponent({
        schema,
        formData
      });

      const textNode = node.querySelector("#root_first-key");
      Simulate.blur(textNode);

      expect(comp.state.formData.hasOwnProperty("first")).to.be.true;
    });

    it("should continue incrementing suffix to formData key until that key name is unique after a key input collision", () => {
      const formData = {
        first: 1,
        second: 2,
        "second-1": 2,
        "second-2": 2,
        "second-3": 2,
        "second-4": 2,
        "second-5": 2,
        "second-6": 2
      };
      const { comp, node } = createFormComponent({
        schema,
        formData
      });

      const textNode = node.querySelector("#root_first-key");
      Simulate.blur(textNode, {
        target: { value: "second" }
      });

      expect(comp.state.formData["second-7"]).eql(1);
    });

    it("should have an expand button", () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelector(".object-property-expand button")).not.eql(
        null
      );
    });

    it("should not have an expand button if expandable is false", () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: { "ui:options": { expandable: false } }
      });

      expect(node.querySelector(".object-property-expand button")).to.be.null;
    });

    it("should add a new property when clicking the expand button", () => {
      const { comp, node } = createFormComponent({ schema });

      Simulate.click(node.querySelector(".object-property-expand button"));

      expect(comp.state.formData.newKey).eql("New Value");
    });

    it("should add a new property with suffix when clicking the expand button and 'newKey' already exists", () => {
      const { comp, node } = createFormComponent({
        schema,
        formData: { newKey: 1 }
      });

      Simulate.click(node.querySelector(".object-property-expand button"));

      expect(comp.state.formData["newKey-1"]).eql("New Value");
    });

    it("should not provide an expand button if length equals maxProperties", () => {
      const { node } = createFormComponent({
        schema: { maxProperties: 1, ...schema },
        formData: { first: 1 }
      });

      expect(node.querySelector(".object-property-expand button")).to.be.null;
    });

    it("should provide an expand button if length is less than maxProperties", () => {
      const { node } = createFormComponent({
        schema: { maxProperties: 2, ...schema },
        formData: { first: 1 }
      });

      expect(node.querySelector(".object-property-expand button")).not.eql(
        null
      );
    });

    it("should not provide an expand button if expandable is expliclty false regardless of maxProperties value", () => {
      const { node } = createFormComponent({
        schema: { maxProperties: 2, ...schema },
        formData: { first: 1 },
        uiSchema: {
          "ui:options": {
            expandable: false
          }
        }
      });

      expect(node.querySelector(".object-property-expand button")).to.be.null;
    });

    it("should ignore expandable value if maxProperties constraint is not satisfied", () => {
      const { node } = createFormComponent({
        schema: { maxProperties: 1, ...schema },
        formData: { first: 1 },
        uiSchema: {
          "ui:options": {
            expandable: true
          }
        }
      });

      expect(node.querySelector(".object-property-expand button")).to.be.null;
    });

    it("should not have delete button if expand button has not been clicked", () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelector(".form-group > .btn-danger")).eql(null);
    });

    it("should have delete button if expand button has been clicked", () => {
      const { node } = createFormComponent({
        schema
      });

      expect(
        node.querySelector(
          ".form-group > .form-additional > .form-additional + .col-xs-2 .btn-danger"
        )
      ).eql(null);

      Simulate.click(node.querySelector(".object-property-expand button"));

      expect(
        node.querySelector(
          ".form-group > .row > .form-additional + .col-xs-2 > .btn-danger"
        )
      ).to.not.be.null;
    });

    it("delete button should delete key-value pair", () => {
      const { node } = createFormComponent({
        schema,
        formData: { first: 1 }
      });
      expect(node.querySelector("#root_first-key").value).to.eql("first");
      Simulate.click(
        node.querySelector(
          ".form-group > .row > .form-additional + .col-xs-2 > .btn-danger"
        )
      );
      expect(node.querySelector("#root_first-key")).to.not.exist;
    });

    it("delete button should delete correct pair", () => {
      const { node } = createFormComponent({
        schema,
        formData: { first: 1, second: 2, third: 3 }
      });
      const selector =
        ".form-group > .row > .form-additional + .col-xs-2 > .btn-danger";
      expect(node.querySelectorAll(selector).length).to.eql(3);
      Simulate.click(node.querySelectorAll(selector)[1]);
      expect(node.querySelector("#root_second-key")).to.not.exist;
      expect(node.querySelectorAll(selector).length).to.eql(2);
    });

    it("deleting content of value input should not delete pair", () => {
      const { comp, node } = createFormComponent({
        schema,
        formData: { first: 1 }
      });

      Simulate.change(node.querySelector("#root_first"), {
        target: { value: "" }
      });
      expect(comp.state.formData["first"]).eql("");
    });
  });
});
