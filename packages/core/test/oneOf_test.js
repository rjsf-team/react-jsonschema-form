import React from "react";
import { expect } from "chai";
import { Simulate } from "react-dom/test-utils";
import sinon from "sinon";

import { createFormComponent, createSandbox, setProps } from "./test_utils";

describe("oneOf", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should not render a select element if the oneOf keyword is not present", () => {
    const schema = {
      type: "object",
      properties: {
        foo: { type: "string" },
      },
    };

    const { node } = createFormComponent({
      schema,
    });

    expect(node.querySelectorAll("select")).to.have.length.of(0);
  });

  it("should render a select element if the oneOf keyword is present", () => {
    const schema = {
      type: "object",
      oneOf: [
        {
          properties: {
            foo: { type: "string" },
          },
        },
        {
          properties: {
            bar: { type: "string" },
          },
        },
      ],
    };

    const { node } = createFormComponent({
      schema,
    });

    expect(node.querySelectorAll("select")).to.have.length.of(1);
    expect(node.querySelector("select").id).eql("root__oneof_select");
  });

  it("should assign a default value and set defaults on option change", () => {
    const { node, onChange } = createFormComponent({
      schema: {
        oneOf: [
          {
            type: "object",
            properties: {
              foo: { type: "string", default: "defaultfoo" },
            },
          },
          {
            type: "object",
            properties: {
              foo: { type: "string", default: "defaultbar" },
            },
          },
        ],
      },
    });

    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: { foo: "defaultfoo" },
    });

    const $select = node.querySelector("select");

    Simulate.change($select, {
      target: { value: $select.options[1].value },
    });

    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: { foo: "defaultbar" },
    });
  });

  it("should assign a default value and set defaults on option change with 'type': 'object' missing", () => {
    const { node, onChange } = createFormComponent({
      schema: {
        type: "object",
        oneOf: [
          {
            properties: {
              foo: { type: "string", default: "defaultfoo" },
            },
          },
          {
            properties: {
              foo: { type: "string", default: "defaultbar" },
            },
          },
        ],
      },
    });

    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: { foo: "defaultfoo" },
    });

    const $select = node.querySelector("select");

    Simulate.change($select, {
      target: { value: $select.options[1].value },
    });

    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: { foo: "defaultbar" },
    });
  });

  it("should render a custom widget", () => {
    const schema = {
      type: "object",
      oneOf: [
        {
          properties: {
            foo: { type: "string" },
          },
        },
        {
          properties: {
            bar: { type: "string" },
          },
        },
      ],
    };
    const widgets = {
      SelectWidget: () => {
        return <section id="CustomSelect">Custom Widget</section>;
      },
    };

    const { node } = createFormComponent({
      schema,
      widgets,
    });

    expect(node.querySelector("#CustomSelect")).to.exist;
  });

  it("should change the rendered form when the select value is changed", () => {
    const schema = {
      type: "object",
      oneOf: [
        {
          properties: {
            foo: { type: "string" },
          },
        },
        {
          properties: {
            bar: { type: "string" },
          },
        },
      ],
    };

    const { node } = createFormComponent({
      schema,
    });

    expect(node.querySelectorAll("#root_foo")).to.have.length.of(1);
    expect(node.querySelectorAll("#root_bar")).to.have.length.of(0);

    const $select = node.querySelector("select");

    Simulate.change($select, {
      target: { value: $select.options[1].value },
    });

    expect(node.querySelectorAll("#root_foo")).to.have.length.of(0);
    expect(node.querySelectorAll("#root_bar")).to.have.length.of(1);
  });

  it("should handle change events", () => {
    const schema = {
      type: "object",
      oneOf: [
        {
          properties: {
            foo: { type: "string" },
          },
        },
        {
          properties: {
            bar: { type: "string" },
          },
        },
      ],
    };

    const { node, onChange } = createFormComponent({
      schema,
    });

    Simulate.change(node.querySelector("input#root_foo"), {
      target: { value: "Lorem ipsum dolor sit amet" },
    });

    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: { foo: "Lorem ipsum dolor sit amet" },
    });
  });

  it("should clear previous data when changing options", () => {
    const schema = {
      type: "object",
      properties: {
        buzz: { type: "string" },
      },
      oneOf: [
        {
          properties: {
            foo: { type: "string" },
          },
        },
        {
          properties: {
            bar: { type: "string" },
          },
        },
      ],
    };

    const { node, onChange } = createFormComponent({
      schema,
    });

    Simulate.change(node.querySelector("input#root_buzz"), {
      target: { value: "Lorem ipsum dolor sit amet" },
    });

    Simulate.change(node.querySelector("input#root_foo"), {
      target: { value: "Consectetur adipiscing elit" },
    });

    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: {
        buzz: "Lorem ipsum dolor sit amet",
        foo: "Consectetur adipiscing elit",
      },
    });

    const $select = node.querySelector("select");

    Simulate.change($select, {
      target: { value: $select.options[1].value },
    });

    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: {
        buzz: "Lorem ipsum dolor sit amet",
        foo: undefined,
      },
    });
  });

  it("should support options with different types", () => {
    const schema = {
      type: "object",
      properties: {
        userId: {
          oneOf: [
            {
              type: "number",
            },
            {
              type: "string",
            },
          ],
        },
      },
    };

    const { node, onChange } = createFormComponent({
      schema,
    });

    Simulate.change(node.querySelector("input#root_userId"), {
      target: { value: 12345 },
    });

    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: {
        userId: 12345,
      },
    });

    const $select = node.querySelector("select");

    Simulate.change($select, {
      target: { value: $select.options[1].value },
    });

    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: {
        userId: undefined,
      },
    });

    Simulate.change(node.querySelector("input#root_userId"), {
      target: { value: "Lorem ipsum dolor sit amet" },
    });
    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: {
        userId: "Lorem ipsum dolor sit amet",
      },
    });
  });

  it("should support custom fields", () => {
    const schema = {
      type: "object",
      properties: {
        userId: {
          oneOf: [
            {
              type: "number",
            },
            {
              type: "string",
            },
          ],
        },
      },
    };

    const CustomField = () => {
      return <div id="custom-oneof-field" />;
    };

    const { node } = createFormComponent({
      schema,
      fields: {
        OneOfField: CustomField,
      },
    });

    expect(node.querySelectorAll("#custom-oneof-field")).to.have.length(1);
  });

  it("should select the correct field when the form is rendered from existing data", () => {
    const schema = {
      type: "object",
      properties: {
        userId: {
          oneOf: [
            {
              type: "number",
            },
            {
              type: "string",
            },
          ],
        },
      },
    };

    const { node } = createFormComponent({
      schema,
      formData: {
        userId: "foobarbaz",
      },
    });

    expect(node.querySelector("select").value).eql("1");
  });

  it("should select the correct field when the formData property is updated", () => {
    const schema = {
      type: "object",
      properties: {
        userId: {
          oneOf: [
            {
              type: "number",
            },
            {
              type: "string",
            },
          ],
        },
      },
    };

    const { comp, node } = createFormComponent({
      schema,
    });

    expect(node.querySelector("select").value).eql("0");

    setProps(comp, {
      schema,
      formData: {
        userId: "foobarbaz",
      },
    });

    expect(node.querySelector("select").value).eql("1");
  });

  it("should not change the selected option when entering values on a subschema with multiple required options", () => {
    const schema = {
      type: "object",
      properties: {
        items: {
          oneOf: [
            {
              type: "string",
            },
            {
              type: "object",
              properties: {
                foo: {
                  type: "integer",
                },
                bar: {
                  type: "string",
                },
              },
              required: ["foo", "bar"],
            },
          ],
        },
      },
    };

    const { node } = createFormComponent({
      schema,
    });

    const $select = node.querySelector("select");

    expect($select.value).eql("0");

    Simulate.change($select, {
      target: { value: $select.options[1].value },
    });

    expect($select.value).eql("1");

    Simulate.change(node.querySelector("input#root_bar"), {
      target: { value: "Lorem ipsum dolor sit amet" },
    });

    expect($select.value).eql("1");
  });

  it("should empty the form data when switching from an option of type 'object'", () => {
    const schema = {
      oneOf: [
        {
          type: "object",
          properties: {
            foo: {
              type: "integer",
            },
            bar: {
              type: "string",
            },
          },
          required: ["foo", "bar"],
        },
        {
          type: "string",
        },
      ],
    };

    const { node } = createFormComponent({
      schema,
      formData: {
        foo: 1,
        bar: "abc",
      },
    });

    const $select = node.querySelector("select");

    Simulate.change($select, {
      target: { value: $select.options[1].value },
    });

    expect($select.value).eql("1");

    expect(node.querySelector("input#root").value).eql("");
  });

  describe("Arrays", () => {
    it("should correctly render mixed types for oneOf inside array items", () => {
      const schema = {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              oneOf: [
                {
                  type: "string",
                },
                {
                  type: "object",
                  properties: {
                    foo: {
                      type: "integer",
                    },
                    bar: {
                      type: "string",
                    },
                  },
                },
              ],
            },
          },
        },
      };

      const { node } = createFormComponent({
        schema,
      });

      expect(node.querySelector(".array-item-add button")).not.eql(null);

      Simulate.click(node.querySelector(".array-item-add button"));

      const $select = node.querySelector("select");
      expect($select).not.eql(null);
      Simulate.change($select, {
        target: { value: $select.options[1].value },
      });

      expect(node.querySelectorAll("input#root_foo")).to.have.length.of(1);
      expect(node.querySelectorAll("input#root_bar")).to.have.length.of(1);
    });
  });

  describe("definitions", () => {
    it("should handle the $ref keyword correctly", () => {
      const schema = {
        definitions: {
          fieldEither: {
            type: "object",
            oneOf: [
              {
                type: "object",
                properties: {
                  value: {
                    type: "string",
                  },
                },
              },
              {
                type: "object",
                properties: {
                  value: {
                    type: "array",
                    items: {
                      $ref: "#/definitions/fieldEither",
                    },
                  },
                },
              },
            ],
          },
        },
        type: "object",
        properties: {
          value: {
            type: "array",
            items: {
              $ref: "#/definitions/fieldEither",
            },
          },
        },
      };

      const { node } = createFormComponent({
        schema,
      });

      expect(node.querySelector(".array-item-add button")).not.eql(null);

      Simulate.click(node.querySelector(".array-item-add button"));

      const $select = node.querySelector("select");
      expect($select).not.eql(null);
      Simulate.change($select, {
        target: { value: $select.options[1].value },
      });

      // This works because the nested "add" button will now be the first to
      // appear in the dom
      Simulate.click(node.querySelector(".array-item-add button"));

      expect($select.value).to.eql($select.options[1].value);
    });
  });
});
