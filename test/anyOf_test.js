import React from "react";
import { expect } from "chai";
import { Simulate } from "react-addons-test-utils";

import { createFormComponent, createSandbox, setProps } from "./test_utils";

describe("anyOf", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should not render a select element if the anyOf keyword is not present", () => {
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

  it("should render a select element if the anyOf keyword is present", () => {
    const schema = {
      type: "object",
      anyOf: [
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
  });

  it("should assign a default value and set defaults on option change", () => {
    const { comp, node } = createFormComponent({
      schema: {
        anyOf: [
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

    expect(comp.state.formData).eql({ foo: "defaultfoo" });

    const $select = node.querySelector("select");

    Simulate.change($select, {
      target: { value: $select.options[1].value },
    });

    expect(comp.state.formData).eql({ foo: "defaultbar" });
  });

  it("should render a custom widget", () => {
    const schema = {
      type: "object",
      anyOf: [
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
      anyOf: [
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
      anyOf: [
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

    const { comp, node } = createFormComponent({
      schema,
    });

    Simulate.change(node.querySelector("input#root_foo"), {
      target: { value: "Lorem ipsum dolor sit amet" },
    });

    expect(comp.state.formData.foo).eql("Lorem ipsum dolor sit amet");
  });

  it("should clear previous data when changing options", () => {
    const schema = {
      type: "object",
      properties: {
        buzz: { type: "string" },
      },
      anyOf: [
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

    const { comp, node } = createFormComponent({
      schema,
    });

    Simulate.change(node.querySelector("input#root_buzz"), {
      target: { value: "Lorem ipsum dolor sit amet" },
    });

    Simulate.change(node.querySelector("input#root_foo"), {
      target: { value: "Consectetur adipiscing elit" },
    });

    expect(comp.state.formData.buzz).eql("Lorem ipsum dolor sit amet");
    expect(comp.state.formData.foo).eql("Consectetur adipiscing elit");

    const $select = node.querySelector("select");

    Simulate.change($select, {
      target: { value: $select.options[1].value },
    });

    expect(comp.state.formData.hasOwnProperty("foo")).to.be.false;
    expect(comp.state.formData.buzz).eql("Lorem ipsum dolor sit amet");
  });

  it("should support options with different types", () => {
    const schema = {
      type: "object",
      properties: {
        userId: {
          anyOf: [
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

    Simulate.change(node.querySelector("input#root_userId"), {
      target: { value: 12345 },
    });

    expect(comp.state.formData).eql({
      userId: 12345,
    });

    const $select = node.querySelector("select");

    Simulate.change($select, {
      target: { value: $select.options[1].value },
    });

    expect(comp.state.formData).eql({
      userId: undefined,
    });

    Simulate.change(node.querySelector("input#root_userId"), {
      target: { value: "Lorem ipsum dolor sit amet" },
    });

    expect(comp.state.formData).eql({
      userId: "Lorem ipsum dolor sit amet",
    });
  });

  it("should support custom fields", () => {
    const schema = {
      type: "object",
      properties: {
        userId: {
          anyOf: [
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
      return <div id="custom-anyof-field" />;
    };

    const { node } = createFormComponent({
      schema,
      fields: {
        AnyOfField: CustomField,
      },
    });

    expect(node.querySelectorAll("#custom-anyof-field")).to.have.length(1);
  });

  it("should select the correct field when the form is rendered from existing data", () => {
    const schema = {
      type: "object",
      properties: {
        userId: {
          anyOf: [
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
          anyOf: [
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

  it("should not change the selected option when entering values", () => {
    const schema = {
      type: "object",
      anyOf: [
        {
          title: "First method of identification",
          properties: {
            firstName: {
              type: "string",
            },
            lastName: {
              type: "string",
            },
          },
        },
        {
          title: "Second method of identification",
          properties: {
            idCode: {
              type: "string",
            },
          },
        },
      ],
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

    Simulate.change(node.querySelector("input#root_idCode"), {
      target: { value: "Lorem ipsum dolor sit amet" },
    });

    expect($select.value).eql("1");
  });

  it("should not change the selected option when entering values and the subschema uses `anyOf`", () => {
    const schema = {
      type: "object",
      anyOf: [
        {
          title: "First method of identification",
          properties: {
            firstName: {
              type: "string",
            },
            lastName: {
              type: "string",
            },
          },
        },
        {
          title: "Second method of identification",
          properties: {
            idCode: {
              type: "string",
            },
          },
          anyOf: [
            {
              properties: {
                foo: {
                  type: "string",
                },
              },
            },
            {
              properties: {
                bar: {
                  type: "string",
                },
              },
            },
          ],
        },
      ],
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

    Simulate.change(node.querySelector("input#root_idCode"), {
      target: { value: "Lorem ipsum dolor sit amet" },
    });

    expect($select.value).eql("1");
  });

  it("should not change the selected option when entering values and the subschema uses `allOf`", () => {
    const schema = {
      type: "object",
      anyOf: [
        {
          title: "First method of identification",
          properties: {
            firstName: {
              type: "string",
            },
            lastName: {
              type: "string",
            },
          },
        },
        {
          title: "Second method of identification",
          properties: {
            idCode: {
              type: "string",
            },
          },
          allOf: [
            {
              properties: {
                foo: {
                  type: "string",
                },
              },
            },
            {
              properties: {
                bar: {
                  type: "string",
                },
              },
            },
          ],
        },
      ],
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

    Simulate.change(node.querySelector("input#root_idCode"), {
      target: { value: "Lorem ipsum dolor sit amet" },
    });

    expect($select.value).eql("1");
  });

  it("should not mutate a schema that contains nested anyOf and allOf", () => {
    const schema = {
      type: "object",
      anyOf: [
        {
          properties: {
            foo: { type: "string" },
          },
          allOf: [
            {
              properties: {
                baz: { type: "string" },
              },
            },
          ],
          anyOf: [
            {
              properties: {
                buzz: { type: "string" },
              },
            },
          ],
        },
      ],
    };

    createFormComponent({
      schema,
    });

    expect(schema).to.eql({
      type: "object",
      anyOf: [
        {
          properties: {
            foo: { type: "string" },
          },
          allOf: [
            {
              properties: {
                baz: { type: "string" },
              },
            },
          ],
          anyOf: [
            {
              properties: {
                buzz: { type: "string" },
              },
            },
          ],
        },
      ],
    });
  });

  describe("Arrays", () => {
    it("should correctly render form inputs for anyOf inside array items", () => {
      const schema = {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              anyOf: [
                {
                  properties: {
                    foo: {
                      type: "string",
                    },
                  },
                },
                {
                  properties: {
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

      expect(node.querySelectorAll("select")).to.have.length.of(1);

      expect(node.querySelectorAll("input#root_foo")).to.have.length.of(1);
    });

    it("should correctly render mixed types for anyOf inside array items", () => {
      const schema = {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              anyOf: [
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
});
