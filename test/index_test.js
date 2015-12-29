/*eslint no-unused-vars: [2, { "varsIgnorePattern": "^d$" }]*/

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

function d(node) {
  console.log(require("html").prettyPrint(node.outerHTML, {indent_size: 2}));
}

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

  describe("NumberField", () => {
    describe("TextWidget", () => {
      it("should render a string field", () => {
        const {node} = createComponent({schema: {
          type: "number"
        }});

        expect(node.querySelectorAll(".field input[type=text]"))
          .to.have.length.of(1);
      });

      it("should render a string field with a label", () => {
        const {node} = createComponent({schema: {
          type: "number",
          title: "foo"
        }});

        expect(node.querySelector(".field label > span").textContent)
          .eql("foo");
      });

      it("should render a string field with a placeholder", () => {
        const {node} = createComponent({schema: {
          type: "number",
          description: "bar",
        }});

        expect(node.querySelector(".field input").getAttribute("placeholder"))
          .eql("bar");
      });

      it("should assign a default value", () => {
        const {node} = createComponent({schema: {
          type: "number",
          default: 2,
        }});

        expect(node.querySelector(".field input").getAttribute("value"))
          .eql("2");
      });

      it("should handle a change event", () => {
        const {comp, node} = createComponent({schema: {
          type: "number",
        }});

        Simulate.change(node.querySelector("input"), {
          target: {value: "2"}
        });

        expect(comp.state.formData).eql(2);
      });

      it("should fill field with data", () => {
        const {node} = createComponent({schema: {
          type: "number",
        }, formData: 2});

        expect(node.querySelector(".field input").getAttribute("value"))
          .eql("2");
      });
    });

    describe("SelectWidget", () => {
      it("should render a number field", () => {
        const {node} = createComponent({schema: {
          type: "number",
          enum: [1, 2]
        }});

        expect(node.querySelectorAll(".field select"))
          .to.have.length.of(1);
      });

      it("should render a string field with a label", () => {
        const {node} = createComponent({schema: {
          type: "number",
          enum: [1, 2],
          title: "foo",
        }});

        expect(node.querySelector(".field label > span").textContent)
          .eql("foo");
      });

      it("should render a select field with a tooltip", () => {
        const {node} = createComponent({schema: {
          type: "number",
          enum: [1, 2],
          description: "baz",
        }});

        expect(node.querySelector(".field select").getAttribute("title"))
          .eql("baz");
      });

      it("should assign a default value", () => {
        const {comp} = createComponent({schema: {
          type: "number",
          enum: [1, 2],
          default: 1,
        }});

        expect(comp.state.formData).eql(1);
      });

      it("should handle a change event", () => {
        const {comp, node} = createComponent({schema: {
          type: "number",
          enum: [1, 2],
        }});

        Simulate.change(node.querySelector("select"), {
          target: {value: "2"}
        });

        expect(comp.state.formData).eql(2);
      });

      it("should fill field with data", () => {
        const {comp} = createComponent({schema: {
          type: "number",
          enum: [1, 2],
        }, formData: 2});

        expect(comp.state.formData).eql(2);
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

    it("should have an add button", () => {
      const {node} = createComponent({schema});

      expect(node.querySelector(".array-item-add button"))
        .not.eql(null);
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

  describe("uiSchema", () => {
    describe("string", () => {
      const schema = {
        type: "object",
        properties: {
          foo: {
            type: "string",
          }
        }
      };

      describe("textarea", () => {
        const uiSchema = {
          foo: {
            widget: "textarea"
          }
        };

        it("should accept a uiSchema object", () => {
          const {node} = createComponent({schema, uiSchema});

          expect(node.querySelectorAll("textarea"))
            .to.have.length.of(1);
        });

        it("should support formData", () => {
          const {node} = createComponent({schema, uiSchema, formData: {
            foo: "a"
          }});

          expect(node.querySelector("textarea").value)
            .eql("a");
        });

        it("should update state when text is updated is checked", () => {
          const {comp, node} = createComponent({schema, uiSchema, formData: {
            foo: "a"
          }});

          Simulate.change(node.querySelector("textarea"), {
            target: {value: "b"}
          });

          expect(comp.state.formData).eql({foo: "b"});
        });
      });
    });

    describe("string (enum)", () => {
      const schema = {
        type: "object",
        properties: {
          foo: {
            type: "string",
            enum: ["a", "b"],
          }
        }
      };

      describe("radio", () => {
        const uiSchema = {
          foo: {
            widget: "radio"
          }
        };

        it("should accept a uiSchema object", () => {
          const {node} = createComponent({schema, uiSchema});

          expect(node.querySelectorAll("[type=radio]"))
            .to.have.length.of(2);
        });

        it("should support formData", () => {
          const {node} = createComponent({schema, uiSchema, formData: {
            foo: "b"
          }});

          expect(node.querySelector("[type=radio][value=b]").checked)
            .eql(true);
        });

        it("should update state when value is updated", () => {
          const {comp, node} = createComponent({schema, uiSchema, formData: {
            foo: "a"
          }});

          Simulate.change(node.querySelector("[type=radio][value=b]"), {
            target: {checked: true}
          });

          expect(comp.state.formData).eql({foo: "b"});
        });
      });
    });

    describe("boolean", () => {
      const schema = {
        type: "object",
        properties: {
          foo: {
            type: "boolean",
          }
        }
      };

      describe("radio", () => {
        const uiSchema = {
          foo: {
            widget: "radio"
          }
        };

        it("should accept a uiSchema object", () => {
          const {node} = createComponent({schema, uiSchema});

          expect(node.querySelectorAll("[type=radio]"))
            .to.have.length.of(2);
          expect(node.querySelector("[type=radio][value=true]"))
            .not.eql(null);
          expect(node.querySelector("[type=radio][value=false]"))
            .not.eql(null);
        });

        it("should render boolean option labels", () => {
          const {node} = createComponent({schema, uiSchema});
          const labels = [].map.call(node.querySelectorAll("label span"),
                                     node => node.textContent);
          expect(labels)
            .eql(["true", "false"]);
        });

        it("should support formData", () => {
          const {node} = createComponent({schema, uiSchema, formData: {
            foo: false
          }});

          expect(node.querySelector("[type=radio][value=false]").checked)
            .eql(true);
        });

        it("should update state when false is checked", () => {
          const {comp, node} = createComponent({schema, uiSchema, formData: {
            foo: true
          }});

          Simulate.change(node.querySelector("[type=radio][value=false]"), {
            target: {checked: true}
          });

          expect(comp.state.formData).eql({foo: false});
        });

        it("should update state when true is checked", () => {
          const {comp, node} = createComponent({schema, uiSchema, formData: {
            foo: false
          }});

          Simulate.change(node.querySelector("[type=radio][value=true]"), {
            target: {checked: true}
          });

          expect(comp.state.formData).eql({foo: true});
        });
      });

      describe("select", () => {
        const uiSchema = {
          foo: {
            widget: "select"
          }
        };

        it("should accept a uiSchema object", () => {
          const {node} = createComponent({schema, uiSchema});

          expect(node.querySelectorAll("select option"))
            .to.have.length.of(2);
        });

        it("should render boolean option labels", () => {
          const {node} = createComponent({schema, uiSchema});

          expect(node.querySelectorAll("option")[0].textContent)
            .eql("true");
          expect(node.querySelectorAll("option")[1].textContent)
            .eql("false");
        });

        it("should update state when true is selected", () => {
          const {comp, node} = createComponent({schema, uiSchema, formData: {
            foo: false
          }});

          Simulate.change(node.querySelector("select"), {
            // DOM option change events always return strings
            target: {value: "true"}
          });

          expect(comp.state.formData).eql({foo: true});
        });

        it("should update state when false is selected", () => {
          const {comp, node} = createComponent({schema, uiSchema, formData: {
            foo: false
          }});

          Simulate.change(node.querySelector("select"), {
            // DOM option change events always return strings
            target: {value: "false"}
          });

          expect(comp.state.formData).eql({foo: false});
        });
      });
    });
  });

  describe("Defaults array items default propagation", () => {
    const schema = {
      type: "object",
      title: "lvl 1 obj",
      properties: {
        object: {
          type: "object",
          title: "lvl 2 obj",
          properties: {
            array: {
              type: "array",
              items: {
                type: "object",
                title: "lvl 3 obj",
                properties: {
                  bool: {
                    type: "boolean",
                    default: true
                  }
                }
              }
            }
          }
        }
      }
    };

    it("should propagate deeply nested defaults to form state", () => {
      const {comp, node} = createComponent({schema});

      Simulate.click(node.querySelector(".array-item-add button"));
      Simulate.submit(node);

      expect(comp.state.formData).eql({
        object: {
          array: [
            {
              bool: true
            }
          ]
        }
      });
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

    it("should not call provided submit handler on validation errors", () => {
      const schema = {
        type: "object",
        properties: {
          foo: {
            type: "string",
            minLength: 1,
          },
        }
      };
      const formData = {
        foo: ""
      };
      const onSubmit = sandbox.spy();
      const onError = sandbox.spy();
      const {node} = createComponent({schema, formData, onSubmit, onError});

      Simulate.submit(node);

      sinon.assert.notCalled(onSubmit);
    });
  });

  describe("Change handler", () => {
    it("should call provided change handler on form state change", () => {
      const schema = {
        type: "object",
        properties: {
          foo: {
            type: "string",
          },
        }
      };
      const formData = {
        foo: ""
      };
      const onChange = sandbox.spy();
      const {node} = createComponent({schema, formData, onChange});

      Simulate.change(node.querySelector("[type=text]"), {
        target: {value: "new"}
      });

      sinon.assert.calledWithMatch(onChange, {
        formData: {
          foo: "new"
        }
      });
    });
  });

  describe("Error handler", () => {
    it("should call provided error handler on validation errors", () => {
      const schema = {
        type: "object",
        properties: {
          foo: {
            type: "string",
            minLength: 1,
          },
        }
      };
      const formData = {
        foo: ""
      };
      const onError = sandbox.spy();
      const {node} = createComponent({schema, formData, onError});

      Simulate.submit(node);

      sinon.assert.calledOnce(onError);
    });
  });

  describe("External formData updates", () => {
    describe("root level", () => {
      it("should update form state from new formData prop value", () => {
        const schema = {type: "string"};
        const {comp} = createComponent({schema});

        comp.componentWillReceiveProps({formData: "yo"});

        expect(comp.state.formData).eql("yo");
      });
    });

    describe("object level", () => {
      it("should update form state from new formData prop value", () => {
        const schema = {
          type: "object",
          properties: {
            foo: {
              type: "string"
            }
          }
        };
        const {comp} = createComponent({schema});

        comp.componentWillReceiveProps({formData: {foo: "yo"}});

        expect(comp.state.formData).eql({foo: "yo"});
      });
    });

    describe("array level", () => {
      it("should update form state from new formData prop value", () => {
        const schema = {
          type: "array",
          items: {
            type: "string"
          }
        };
        const {comp} = createComponent({schema});

        comp.componentWillReceiveProps({formData: ["yo"]});

        expect(comp.state.formData).eql(["yo"]);
      });
    });
  });
});
