import React from "react";
import { expect } from "chai";
import { Simulate } from "react-dom/test-utils";
import sinon from "sinon";

import { createFormComponent, createSandbox } from "./test_utils";

describe("BooleanField", () => {
  let sandbox;

  const CustomWidget = () => <div id="custom" />;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should render a boolean field", () => {
    const { node } = createFormComponent({
      schema: {
        type: "boolean"
      }
    });

    expect(
      node.querySelectorAll(".field input[type=checkbox]")
    ).to.have.length.of(1);
  });

  it("should render a boolean field with the expected id", () => {
    const { node } = createFormComponent({
      schema: {
        type: "boolean"
      }
    });

    expect(node.querySelector(".field input[type=checkbox]").id).eql("root");
  });

  it("should render a boolean field with a label", () => {
    const { node } = createFormComponent({
      schema: {
        type: "boolean",
        title: "foo"
      }
    });

    expect(node.querySelector(".field label span").textContent).eql("foo");
  });

  describe("HTML5 required attribute", () => {
    it("should not render a required attribute for simple required fields", () => {
      const { node } = createFormComponent({
        schema: {
          type: "object",
          properties: {
            foo: {
              type: "boolean"
            }
          },
          required: ["foo"]
        }
      });

      expect(node.querySelector("input[type=checkbox]").required).eql(false);
    });

    it("should add a required attribute if the schema uses const with a true value", () => {
      const { node } = createFormComponent({
        schema: {
          type: "object",
          properties: {
            foo: {
              type: "boolean",
              const: true
            }
          }
        }
      });

      expect(node.querySelector("input[type=checkbox]").required).eql(true);
    });

    it("should add a required attribute if the schema uses an enum with a single value of true", () => {
      const { node } = createFormComponent({
        schema: {
          type: "object",
          properties: {
            foo: {
              type: "boolean",
              enum: [true]
            }
          }
        }
      });

      expect(node.querySelector("input[type=checkbox]").required).eql(true);
    });

    it("should add a required attribute if the schema uses an anyOf with a single value of true", () => {
      const { node } = createFormComponent({
        schema: {
          type: "object",
          properties: {
            foo: {
              type: "boolean",
              anyOf: [
                {
                  const: true
                }
              ]
            }
          }
        }
      });

      expect(node.querySelector("input[type=checkbox]").required).eql(true);
    });

    it("should add a required attribute if the schema uses a oneOf with a single value of true", () => {
      const { node } = createFormComponent({
        schema: {
          type: "object",
          properties: {
            foo: {
              type: "boolean",
              oneOf: [
                {
                  const: true
                }
              ]
            }
          }
        }
      });

      expect(node.querySelector("input[type=checkbox]").required).eql(true);
    });

    it("should add a required attribute if the schema uses an allOf with a value of true", () => {
      const { node } = createFormComponent({
        schema: {
          type: "object",
          properties: {
            foo: {
              type: "boolean",
              allOf: [
                {
                  const: true
                }
              ]
            }
          }
        }
      });

      expect(node.querySelector("input[type=checkbox]").required).eql(true);
    });
  });

  it("should render a single label", () => {
    const { node } = createFormComponent({
      schema: {
        type: "boolean",
        title: "foo"
      }
    });

    expect(node.querySelectorAll(".field label")).to.have.length.of(1);
  });

  it("should render a description", () => {
    const { node } = createFormComponent({
      schema: {
        type: "boolean",
        description: "my description"
      }
    });

    const description = node.querySelector(".field-description");
    expect(description.textContent).eql("my description");
  });

  it("should assign a default value", () => {
    const { node } = createFormComponent({
      schema: {
        type: "boolean",
        default: true
      }
    });

    expect(node.querySelector(".field input").checked).eql(true);
  });

  it("should default state value to undefined", () => {
    const { comp } = createFormComponent({ schema: { type: "boolean" } });

    expect(comp.state.formData).eql(undefined);
  });

  it("should handle a change event", () => {
    const { comp, node } = createFormComponent({
      schema: {
        type: "boolean",
        default: false
      }
    });

    Simulate.change(node.querySelector("input"), {
      target: { checked: true }
    });

    expect(comp.state.formData).eql(true);
  });

  it("should fill field with data", () => {
    const { node } = createFormComponent({
      schema: {
        type: "boolean"
      },
      formData: true
    });

    expect(node.querySelector(".field input").checked).eql(true);
  });

  it("should render radio widgets with the expected id", () => {
    const { node } = createFormComponent({
      schema: {
        type: "boolean"
      },
      uiSchema: { "ui:widget": "radio" }
    });

    expect(node.querySelector(".field-radio-group").id).eql("root");
  });

  it("should have default enum option labels for radio widgets", () => {
    const { node } = createFormComponent({
      schema: {
        type: "boolean"
      },
      formData: true,
      uiSchema: { "ui:widget": "radio" }
    });

    const labels = [].map.call(
      node.querySelectorAll(".field-radio-group label"),
      label => label.textContent
    );
    expect(labels).eql(["yes", "no"]);
  });

  it("should support enum option ordering for radio widgets", () => {
    const { node } = createFormComponent({
      schema: {
        type: "boolean",
        enum: [false, true]
      },
      formData: true,
      uiSchema: { "ui:widget": "radio" }
    });

    const labels = [].map.call(
      node.querySelectorAll(".field-radio-group label"),
      label => label.textContent
    );
    expect(labels).eql(["no", "yes"]);
  });

  it("should support enumNames for radio widgets", () => {
    const { node } = createFormComponent({
      schema: {
        type: "boolean",
        enumNames: ["Yes", "No"]
      },
      formData: true,
      uiSchema: { "ui:widget": "radio" }
    });

    const labels = [].map.call(
      node.querySelectorAll(".field-radio-group label"),
      label => label.textContent
    );
    expect(labels).eql(["Yes", "No"]);
  });

  it("should support oneOf titles for radio widgets", () => {
    const { node } = createFormComponent({
      schema: {
        type: "boolean",
        oneOf: [
          {
            const: true,
            title: "Yes"
          },
          {
            const: false,
            title: "No"
          }
        ]
      },
      formData: true,
      uiSchema: { "ui:widget": "radio" }
    });

    const labels = [].map.call(
      node.querySelectorAll(".field-radio-group label"),
      label => label.textContent
    );
    expect(labels).eql(["Yes", "No"]);
  });

  it("should preserve oneOf option ordering for radio widgets", () => {
    const { node } = createFormComponent({
      schema: {
        type: "boolean",
        oneOf: [
          {
            const: false,
            title: "No"
          },
          {
            const: true,
            title: "Yes"
          }
        ]
      },
      formData: true,
      uiSchema: { "ui:widget": "radio" }
    });

    const labels = [].map.call(
      node.querySelectorAll(".field-radio-group label"),
      label => label.textContent
    );
    expect(labels).eql(["No", "Yes"]);
  });

  it("should support inline radio widgets", () => {
    const { node } = createFormComponent({
      schema: { type: "boolean" },
      formData: true,
      uiSchema: {
        "ui:widget": "radio",
        "ui:options": {
          inline: true
        }
      }
    });

    expect(node.querySelectorAll(".radio-inline")).to.have.length.of(2);
  });

  it("should handle a focus event for radio widgets", () => {
    const onFocus = sandbox.spy();
    const { node } = createFormComponent({
      schema: {
        type: "boolean",
        default: false
      },
      uiSchema: {
        "ui:widget": "radio"
      },
      onFocus
    });

    const element = node.querySelector(".field-radio-group");
    Simulate.focus(node.querySelector("input"), {
      target: {
        value: false
      }
    });
    expect(onFocus.calledWith(element.id, false)).to.be.true;
  });

  it("should handle a blur event for radio widgets", () => {
    const onBlur = sandbox.spy();
    const { node } = createFormComponent({
      schema: {
        type: "boolean",
        default: false
      },
      uiSchema: {
        "ui:widget": "radio"
      },
      onBlur
    });

    const element = node.querySelector(".field-radio-group");
    Simulate.blur(node.querySelector("input"), {
      target: {
        value: false
      }
    });
    expect(onBlur.calledWith(element.id, false)).to.be.true;
  });

  it("should support enumNames for select", () => {
    const { node } = createFormComponent({
      schema: {
        type: "boolean",
        enumNames: ["Yes", "No"]
      },
      formData: true,
      uiSchema: { "ui:widget": "select" }
    });

    const labels = [].map.call(
      node.querySelectorAll(".field option"),
      label => label.textContent
    );
    expect(labels).eql(["", "Yes", "No"]);
  });

  it("should handle a focus event with checkbox", () => {
    const onFocus = sandbox.spy();
    const { node } = createFormComponent({
      schema: {
        type: "boolean",
        default: false
      },
      uiSchema: {
        "ui:widget": "select"
      },
      onFocus
    });

    const element = node.querySelector("select");
    Simulate.focus(element, {
      target: {
        value: false
      }
    });
    expect(onFocus.calledWith(element.id, false)).to.be.true;
  });

  it("should handle a blur event with select", () => {
    const onBlur = sandbox.spy();
    const { node } = createFormComponent({
      schema: {
        type: "boolean",
        default: false
      },
      uiSchema: {
        "ui:widget": "select"
      },
      onBlur
    });

    const element = node.querySelector("select");
    Simulate.blur(element, {
      target: {
        value: false
      }
    });
    expect(onBlur.calledWith(element.id, false)).to.be.true;
  });

  it("should render the widget with the expected id", () => {
    const { node } = createFormComponent({
      schema: {
        type: "boolean"
      }
    });

    expect(node.querySelector("input[type=checkbox]").id).eql("root");
  });

  it("should render customized checkbox", () => {
    const { node } = createFormComponent({
      schema: {
        type: "boolean"
      },
      widgets: {
        CheckboxWidget: CustomWidget
      }
    });

    expect(node.querySelector("#custom")).to.exist;
  });

  it("should handle a focus event with checkbox", () => {
    const onFocus = sandbox.spy();
    const { node } = createFormComponent({
      schema: {
        type: "boolean",
        default: false
      },
      uiSchema: {
        "ui:widget": "checkbox"
      },
      onFocus
    });

    const element = node.querySelector("input");
    Simulate.focus(element, {
      target: {
        checked: false
      }
    });
    expect(onFocus.calledWith(element.id, false)).to.be.true;
  });

  it("should handle a blur event with checkbox", () => {
    const onBlur = sandbox.spy();
    const { node } = createFormComponent({
      schema: {
        type: "boolean",
        default: false
      },
      uiSchema: {
        "ui:widget": "checkbox"
      },
      onBlur
    });

    const element = node.querySelector("input");
    Simulate.blur(element, {
      target: {
        checked: false
      }
    });
    expect(onBlur.calledWith(element.id, false)).to.be.true;
  });

  describe("Label", () => {
    const Widget = props => <div id={`label-${props.label}`} />;

    const widgets = { Widget };

    it("should pass field name to widget if there is no title", () => {
      const schema = {
        type: "object",
        properties: {
          boolean: {
            type: "boolean"
          }
        }
      };
      const uiSchema = {
        boolean: {
          "ui:widget": "Widget"
        }
      };

      const { node } = createFormComponent({ schema, widgets, uiSchema });
      expect(node.querySelector("#label-boolean")).to.not.be.null;
    });

    it("should pass schema title to widget", () => {
      const schema = {
        type: "boolean",
        title: "test"
      };
      const uiSchema = {
        "ui:widget": "Widget"
      };

      const { node } = createFormComponent({ schema, widgets, uiSchema });
      expect(node.querySelector("#label-test")).to.not.be.null;
    });

    it("should pass empty schema title to widget", () => {
      const schema = {
        type: "boolean",
        title: ""
      };
      const uiSchema = {
        "ui:widget": "Widget"
      };
      const { node } = createFormComponent({ schema, widgets, uiSchema });
      expect(node.querySelector("#label-")).to.not.be.null;
    });
  });

  describe("SelectWidget", () => {
    it("should render a field that contains an enum of booleans", () => {
      const { node } = createFormComponent({
        schema: {
          enum: [true, false]
        }
      });

      expect(node.querySelectorAll(".field select")).to.have.length.of(1);
    });

    it("should infer the value from an enum on change", () => {
      const spy = sinon.spy();
      const { node } = createFormComponent({
        schema: {
          enum: [true, false]
        },
        onChange: spy
      });

      expect(node.querySelectorAll(".field select")).to.have.length.of(1);
      const $select = node.querySelector(".field select");
      expect($select.value).eql("");

      Simulate.change($select, {
        target: { value: "true" }
      });
      expect($select.value).eql("true");
      expect(spy.lastCall.args[0].formData).eql(true);
    });

    it("should render a string field with a label", () => {
      const { node } = createFormComponent({
        schema: {
          enum: [true, false],
          title: "foo"
        }
      });

      expect(node.querySelector(".field label").textContent).eql("foo");
    });

    it("should assign a default value", () => {
      const { comp } = createFormComponent({
        schema: {
          enum: [true, false],
          default: true
        }
      });

      expect(comp.state.formData).eql(true);
    });

    it("should handle a change event", () => {
      const { comp, node } = createFormComponent({
        schema: {
          enum: [true, false]
        }
      });

      Simulate.change(node.querySelector("select"), {
        target: { value: "false" }
      });

      expect(comp.state.formData).eql(false);
    });

    it("should render the widget with the expected id", () => {
      const { node } = createFormComponent({
        schema: {
          enum: [true, false]
        }
      });

      expect(node.querySelector("select").id).eql("root");
    });
  });
});
