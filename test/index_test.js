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
    describe("TextWidget", () => {
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

    describe("SelectWidget", () => {
      it("should render a string field", () => {
        const {node} = createComponent({schema: {
          type: "string",
          enum: ["foo", "bar"]
        }});

        expect(node.querySelectorAll(".field select"))
          .to.have.length.of(1);
      });

      it("should render a string field with a label", () => {
        const {node} = createComponent({schema: {
          type: "string",
          enum: ["foo", "bar"],
          title: "foo",
        }});

        expect(node.querySelector(".field label > span").textContent)
          .eql("foo");
      });

      it("should render a select field with a tooltip", () => {
        const {node} = createComponent({schema: {
          type: "string",
          enum: ["foo", "bar"],
          description: "baz",
        }});

        expect(node.querySelector(".field select").getAttribute("title"))
          .eql("baz");
      });

      it("should assign a default value", () => {
        const {comp} = createComponent({schema: {
          type: "string",
          enum: ["foo", "bar"],
          default: "bar",
        }});

        expect(comp.state.formData).eql("bar");
      });

      it("should handle a change event", () => {
        const {comp, node} = createComponent({schema: {
          type: "string",
          enum: ["foo", "bar"],
        }});

        Simulate.change(node.querySelector("select"), {
          target: {value: "yo"}
        });

        expect(comp.state.formData).eql("yo");
      });

      it("should fill field with data", () => {
        const {comp} = createComponent({schema: {
          type: "string",
          enum: ["foo", "bar"],
        }, formData: "bar"});

        expect(comp.state.formData).eql("bar");
      });
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
          title: "foo",
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
      expect(node.querySelector(".field label").textContent)
        .eql("foo*");
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

  describe("Validation", () => {
    describe("Required fields", () => {
      const schema = {
        type: "object",
        required: ["foo"],
        properties: {
          foo: {type: "string"},
          bar: {type: "string"},
        }
      };

      var comp, node, onError;

      beforeEach(() => {
        onError = sandbox.spy();
        const compInfo = createComponent({schema, formData: {
          foo: undefined
        }, onError});
        comp = compInfo.comp;
        node = compInfo.node;

        Simulate.submit(node);
      });

      it("should validate a required field", () => {
        expect(comp.state.errors)
          .to.have.length.of(1);
        expect(comp.state.errors[0].message)
          .eql(`requires property "foo"`);
      });

      it("should render errors", () => {
        expect(node.querySelectorAll(".errors li"))
          .to.have.length.of(1);
        expect(node.querySelector(".errors li").textContent)
          .eql(`instance requires property "foo"`);
      });

      it("should trigger the onError handler", () => {
        sinon.assert.calledWith(onError, sinon.match(errors => {
          return errors[0].message === `requires property "foo"`;
        }));
      });
    });

    describe("Min length", () => {
      const schema = {
        type: "object",
        required: ["foo"],
        properties: {
          foo: {
            type: "string",
            minLength: 10,
          },
        }
      };

      var comp, node, onError;

      beforeEach(() => {
        onError = sandbox.spy();
        const compInfo = createComponent({schema, formData: {
          foo: "123456789"
        }, onError});
        comp = compInfo.comp;
        node = compInfo.node;

        Simulate.submit(node);
      });

      it("should validate a minLength field", () => {
        expect(comp.state.errors)
          .to.have.length.of(1);
        expect(comp.state.errors[0].message)
          .eql(`does not meet minimum length of 10`);
      });

      it("should render errors", () => {
        expect(node.querySelectorAll(".errors li"))
          .to.have.length.of(1);
        expect(node.querySelector(".errors li").textContent)
          .eql("instance.foo does not meet minimum length of 10");
      });

      it("should trigger the onError handler", () => {
        sinon.assert.calledWith(onError, sinon.match(errors => {
          return errors[0].message ===
            "does not meet minimum length of 10";
        }));
      });
    });
  });

  describe("Submit handler", () => {
    it("should call provided submit handler with form state", () => {
      const schema = {
        type: "object",
        properties: {
          foo: {type: "string"},
        }
      };
      const formData = {
        foo: "bar"
      };
      const onSubmit = sandbox.spy();
      const {comp, node} = createComponent({schema, formData, onSubmit});

      Simulate.submit(node);

      sinon.assert.calledWithExactly(onSubmit, comp.state);
    });
  });
});
