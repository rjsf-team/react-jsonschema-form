import { expect } from "chai";
import sinon from "sinon";
import React from "react";
import { Simulate, renderIntoDocument } from "react-addons-test-utils";
import { findDOMNode } from "react-dom";

import Form from "../src";

function createComponent(props) {
  const comp = renderIntoDocument(<Form {...props} />);
  const node = findDOMNode(comp);
  return {comp, node};
}

// function d(node) {
//   console.log(node.outerHTML);
// }

describe("Form", () => {
  var sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("Empty schema", () => {
    it("should render a form tag", () => {
      const {node} = createComponent({schema: {}});

      expect(node.tagName).eql("FORM");
    });

    it("should render a submit button", () => {
      const {node} = createComponent({schema: {}});

      expect(node.querySelectorAll("button[type=submit]"))
        .to.have.length.of(1);
    });
  });

  describe("StringField", () => {
    it("should render a string field", () => {
      const {node} = createComponent({schema: {
        type: "string"
      }});

      expect(node.querySelectorAll(".field input[type=text]"))
        .to.have.length.of(1);
    });

    it("should render a string field with a label", () => {
      const {node} = createComponent({schema: {
        type: "string",
        title: "foo"
      }});

      expect(node.querySelector(".field label > span").textContent)
        .eql("foo");
    });

    it("should render a string field with a placeholder", () => {
      const {node} = createComponent({schema: {
        type: "string",
        description: "bar",
      }});

      expect(node.querySelector(".field input").getAttribute("placeholder"))
        .eql("bar");
    });

    it("should assign a default value", () => {
      const {node} = createComponent({schema: {
        type: "string",
        default: "plop",
      }});

      expect(node.querySelector(".field input").getAttribute("value"))
        .eql("plop");
    });

    it("should handle a change event", () => {
      const {comp, node} = createComponent({schema: {
        type: "string",
      }});

      Simulate.change(node.querySelector("input"), {
        target: {value: "yo"}
      });

      expect(comp.state.formData).eql("yo");
    });

    it("should fill field with data", () => {
      const {node} = createComponent({schema: {
        type: "string",
      }, formData: "plip"});

      expect(node.querySelector(".field input").getAttribute("value"))
        .eql("plip");
    });
  });

  describe("BooleanField", () => {
    it("should render a boolean field", () => {
      const {node} = createComponent({schema: {
        type: "boolean"
      }});

      expect(node.querySelectorAll(".field input[type=checkbox]"))
        .to.have.length.of(1);
    });

    it("should render a boolean field with a label", () => {
      const {node} = createComponent({schema: {
        type: "boolean",
        title: "foo"
      }});

      expect(node.querySelector(".field label > span").textContent)
        .eql("foo");
    });

    it("should assign a default value", () => {
      const {node} = createComponent({schema: {
        type: "boolean",
        default: true,
      }});

      expect(node.querySelector(".field input").checked)
        .eql(true);
    });

    it("should handle a change event", () => {
      const {comp, node} = createComponent({schema: {
        type: "boolean",
        default: false,
      }});

      Simulate.change(node.querySelector("input"), {
        target: {checked: true}
      });

      expect(comp.state.formData).eql(true);
    });

    it("should fill field with data", () => {
      const {node} = createComponent({schema: {
        type: "boolean",
      }, formData: true});

      expect(node.querySelector(".field input").checked)
        .eql(true);
    });
  });

  describe("ArrayField", () => {
    const schema = {
      type: "array",
      title: "my list",
      items: {type: "string"}
    };

    it("should render a fieldset", () => {
      const {node} = createComponent({schema});

      expect(node.querySelectorAll("fieldset"))
        .to.have.length.of(1);
    });

    it("should render a fieldset legend", () => {
      const {node} = createComponent({schema});

      expect(node.querySelector("fieldset > legend").textContent)
        .eql("my list");
    });

    it("should contain no field in the list by default", () => {
      const {node} = createComponent({schema});

      expect(node.querySelectorAll(".field-string"))
        .to.have.length.of(0);
    });

    it("should add an add button", () => {
      const {node} = createComponent({schema});

      expect(node.querySelector(".array-item-add button"))
        .to.be.truthy;
    });

    it("should add a new field when clicking the add button", () => {
      const {node} = createComponent({schema});

      Simulate.click(node.querySelector(".array-item-add button"));

      expect(node.querySelectorAll(".field-string"))
        .to.have.length.of(1);
    });

    it("should fill an array field with data", () => {
      const {node} = createComponent({schema, formData: ["foo", "bar"]});
      const inputs = node.querySelectorAll(".field-string input[type=text]");

      expect(inputs).to.have.length.of(2);
      expect(inputs[0].value).eql("foo");
      expect(inputs[1].value).eql("bar");
    });

    it("should remove a field from the list", () => {
      const {node} = createComponent({schema, formData: ["foo", "bar"]});
      const dropBtns = node.querySelectorAll(".array-item-remove button");

      Simulate.click(dropBtns[0]);

      const inputs = node.querySelectorAll(".field-string input[type=text]");
      expect(inputs).to.have.length.of(1);
      expect(inputs[0].value).eql("bar");
    });
  });

  describe("ObjectField", () => {
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
          type: "string",
        },
        bar: {
          type: "boolean",
        }
      }
    };

    it("should render an fieldset", () => {
      const {node} = createComponent({schema});

      expect(node.querySelectorAll("fieldset"))
        .to.have.length.of(1);
    });

    it("should render an fieldset legend", () => {
      const {node} = createComponent({schema});

      expect(node.querySelector("fieldset > legend").textContent)
        .eql("my object");
    });

    it("should render a string property", () => {
      const {node} = createComponent({schema});

      expect(node.querySelectorAll(".field input[type=text]"))
        .to.have.length.of(1);
    });

    it("should render a boolean property", () => {
      const {node} = createComponent({schema});

      expect(node.querySelectorAll(".field input[type=checkbox]"))
        .to.have.length.of(1);
    });

    it("should handle a default object value", () => {
      const {node} = createComponent({schema});

      expect(node.querySelector(".field input[type=text]").value)
        .eql("hey");
      expect(node.querySelector(".field input[type=checkbox]").checked)
        .eql(true);
    });

    it("should handle required values", () => {
      const {node} = createComponent({schema});

      // Required field is <input type="text" required="">
      expect(node.querySelector("input[type=text]").getAttribute("required"))
        .eql("");
    });

    it("should fill fields with form data", () => {
      const {node} = createComponent({schema, formData: {
        foo: "hey",
        bar: true,
      }});

      expect(node.querySelector(".field input[type=text]").value)
        .eql("hey");
      expect(node.querySelector(".field input[type=checkbox]").checked)
        .eql(true);
    });

    it("should handle object fields change events", () => {
      const {comp, node} = createComponent({schema});

      Simulate.change(node.querySelector("input[type=text]"), {
        target: {value: "changed"}
      });

      expect(comp.state.formData.foo).eql("changed");
    });
  });
});
