import React from "react";
import { expect } from "chai";
import { Simulate } from "react-addons-test-utils";

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
      },
    };

    it("should render a fieldset", () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll("fieldset")).to.have.length.of(1);
    });

    it("should render a fieldset legend", () => {
      const { node } = createFormComponent({ schema });

      const legend = node.querySelector("fieldset > legend");

      expect(legend.textContent).eql("my object");
      expect(legend.id).eql("root__title");
    });

    it("should render a customized title", () => {
      const CustomTitleField = ({ title }) => <div id="custom">{title}</div>;

      const { node } = createFormComponent({
        schema,
        fields: {
          TitleField: CustomTitleField,
        },
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
        fields: { DescriptionField: CustomDescriptionField },
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
          bar: true,
        },
      });

      expect(node.querySelector(".field input[type=text]").value).eql("hey");
      expect(node.querySelector(".field input[type=checkbox]").checked).eql(
        true
      );
    });

    it("should handle object fields change events", () => {
      const { comp, node } = createFormComponent({ schema });

      Simulate.change(node.querySelector("input[type=text]"), {
        target: { value: "changed" },
      });

      expect(comp.state.formData.foo).eql("changed");
    });

    it("should handle object fields with blur events", () => {
      const onBlur = sandbox.spy();
      const { node } = createFormComponent({ schema, onBlur });

      const input = node.querySelector("input[type=text]");
      Simulate.blur(input, {
        target: { value: "changed" },
      });

      expect(onBlur.calledWith(input.id, "changed")).to.be.true;
    });

    it("should handle object fields with focus events", () => {
      const onFocus = sandbox.spy();
      const { node } = createFormComponent({ schema, onFocus });

      const input = node.querySelector("input[type=text]");
      Simulate.focus(input, {
        target: { value: "changed" },
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
        qux: { type: "string" },
      },
    };

    it("should use provided order", () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          "ui:order": ["baz", "qux", "bar", "foo"],
        },
      });
      const labels = [].map.call(
        node.querySelectorAll(".field > label"),
        l => l.textContent
      );

      expect(labels).eql([]);
    });

    it("should insert unordered properties at wildcard position", () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          "ui:order": ["baz", "*", "foo"],
        },
      });
      const labels = [].map.call(
        node.querySelectorAll(".field > label"),
        l => l.textContent
      );

      expect(labels).eql([]);
    });

    it("should throw when order list contains an extraneous property", () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          "ui:order": ["baz", "qux", "bar", "wut?", "foo", "huh?"],
        },
      });

      expect(node.querySelector(".config-error").textContent).to.match(
        /contains extraneous properties 'wut\?', 'huh\?'/
      );
    });

    it("should throw when order list misses an existing property", () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          "ui:order": ["baz", "bar"],
        },
      });

      expect(node.querySelector(".config-error").textContent).to.match(
        /does not contain properties 'foo', 'qux'/
      );
    });

    it("should throw when more than one wildcard is present", () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          "ui:order": ["baz", "*", "bar", "*"],
        },
      });

      expect(node.querySelector(".config-error").textContent).to.match(
        /contains more than one wildcard/
      );
    });

    it("should order referenced schema definitions", () => {
      const refSchema = {
        definitions: {
          testdef: { type: "string" },
        },
        type: "object",
        properties: {
          foo: { $ref: "#/definitions/testdef" },
          bar: { $ref: "#/definitions/testdef" },
        },
      };

      const { node } = createFormComponent({
        schema: refSchema,
        uiSchema: {
          "ui:order": ["bar", "foo"],
        },
      });
      const labels = [].map.call(
        node.querySelectorAll(".field > label"),
        l => l.textContent
      );

      expect(labels).eql([]);
    });

    it("should order referenced object schema definition properties", () => {
      const refSchema = {
        definitions: {
          testdef: {
            type: "object",
            properties: {
              foo: { type: "string" },
              bar: { type: "string" },
            },
          },
        },
        type: "object",
        properties: {
          root: { $ref: "#/definitions/testdef" },
        },
      };

      const { node } = createFormComponent({
        schema: refSchema,
        uiSchema: {
          root: {
            "ui:order": ["bar", "foo"],
          },
        },
      });
      const labels = [].map.call(
        node.querySelectorAll(".field > label"),
        l => l.textContent
      );

      expect(labels).eql([]);
    });

    it("should render the widget with the expected id", () => {
      const schema = {
        type: "object",
        properties: {
          foo: { type: "string" },
          bar: { type: "string" },
        },
      };

      const { node } = createFormComponent({
        schema,
        uiSchema: {
          "ui:order": ["bar", "foo"],
        },
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
            properties: {},
          },
        },
      };

      const { node } = createFormComponent({ schema, fields });
      expect(node.querySelector("#title-object")).to.not.be.null;
    });

    it("should pass schema title to TitleField", () => {
      const schema = {
        type: "object",
        properties: {},
        title: "test",
      };

      const { node } = createFormComponent({ schema, fields });
      expect(node.querySelector("#title-test")).to.not.be.null;
    });

    it("should pass empty schema title to TitleField", () => {
      const schema = {
        type: "object",
        properties: {},
        title: "",
      };
      const { node } = createFormComponent({ schema, fields });
      expect(node.querySelector("#title-")).to.be.null;
    });
  });

  describe("additionalProperties", () => {
    const schema = {
      type: "object",
      additionalProperties: {
        type: "string",
      },
    };

    it("should automatically add a property field if in formData", () => {
      const { node } = createFormComponent({
        schema,
        formData: { first: 1 },
      });

      expect(node.querySelectorAll(".field-string")).to.have.length.of(1);
    });

    it("should pass through non-schema properties and not throw validation errors if additionalProperties is undefined", () => {
      const undefinedAPSchema = {
        ...schema,
        properties: { second: { type: "string" } },
      };
      delete undefinedAPSchema.additionalProperties;
      const { comp } = createFormComponent({
        schema: undefinedAPSchema,
        formData: { nonschema: 1 },
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
          properties: { second: { type: "string" } },
        },
        formData: { nonschema: 1 },
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
              type: "string",
            },
          },
        },
      });

      expect(node.querySelectorAll(".field-string")).to.have.length.of(1);
    });

    it("should not render a label for the additional property key if additionalProperties is false", () => {
      const { node } = createFormComponent({
        schema: { ...schema, additionalProperties: false },
        formData: { first: 1 },
      });

      expect(node.querySelector("[for='root_first-key']")).eql(null);
    });

    it("should render a text input for the additional property key", () => {
      const { node } = createFormComponent({
        schema,
        formData: { first: 1 },
      });

      expect(node.querySelector("#root_first-key").value).eql("first");
    });

    it("should render a text input for the additional property value", () => {
      const { node } = createFormComponent({
        schema,
        formData: { first: 1 },
      });

      expect(node.querySelector("#root_first").value).eql("1");
    });

    it("should rename formData key if key input is renamed", () => {
      const { comp, node } = createFormComponent({
        schema,
        formData: { first: 1 },
      });

      const textNode = node.querySelector("#root_first-key");
      Simulate.blur(textNode, {
        target: { value: "newFirst" },
      });

      expect(comp.state.formData.newFirst).eql(1);
    });

    it("should attach suffix to formData key if new key already exists when key input is renamed", () => {
      const formData = {
        first: 1,
        second: 2,
      };
      const { comp, node } = createFormComponent({
        schema,
        formData,
      });

      const textNode = node.querySelector("#root_first-key");
      Simulate.blur(textNode, {
        target: { value: "second" },
      });

      expect(comp.state.formData["second"]).eql(1);
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
        "second-6": 2,
      };
      const { comp, node } = createFormComponent({
        schema,
        formData,
      });

      const textNode = node.querySelector("#root_first-key");
      Simulate.blur(textNode, {
        target: { value: "second" },
      });

      expect(comp.state.formData["second"]).eql(1);
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
        uiSchema: { "ui:options": { expandable: false } },
      });

      expect(node.querySelector(".object-property-expand button")).to.be.null;
    });

    it("should add a new property when clicking the expand button", () => {
      const { comp, node } = createFormComponent({ schema });

      Simulate.click(node.querySelector(".object-property-expand button"));

      expect(comp.state.formData["New Key"]).eql("New Value");
    });

    it("should add a new property with suffix when clicking the expand button and 'New Key' already exists", () => {
      const { comp, node } = createFormComponent({
        schema,
        formData: { "New Key": 1 },
      });

      Simulate.click(node.querySelector(".object-property-expand button"));

      expect(comp.state.formData["New Key"]).eql("New Value");
    });

    it("should not provide an expand button if length equals maxProperties", () => {
      const { node } = createFormComponent({
        schema: { maxProperties: 1, ...schema },
        formData: { first: 1 },
      });

      expect(node.querySelector(".object-property-expand button")).to.be.null;
    });

    it("should provide an expand button if length is less than maxProperties", () => {
      const { node } = createFormComponent({
        schema: { maxProperties: 2, ...schema },
        formData: { first: 1 },
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
            expandable: false,
          },
        },
      });

      expect(node.querySelector(".object-property-expand button")).to.be.null;
    });

    it("should ignore expandable value if maxProperties constraint is not satisfied", () => {
      const { node } = createFormComponent({
        schema: { maxProperties: 1, ...schema },
        formData: { first: 1 },
        uiSchema: {
          "ui:options": {
            expandable: true,
          },
        },
      });

      expect(node.querySelector(".object-property-expand button")).to.be.null;
    });
  });
});
