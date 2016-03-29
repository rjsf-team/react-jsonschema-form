/*eslint no-unused-vars: [2, { "varsIgnorePattern": "^d$" }]*/

import { expect } from "chai";
import sinon from "sinon";
import React from "react";
import { Simulate, renderIntoDocument } from "react-addons-test-utils";
import { findDOMNode } from "react-dom";

import Form from "../src";
import { createFormComponent, d } from "./test_utils";

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
      const {node} = createFormComponent({schema: {}});

      expect(node.tagName).eql("FORM");
    });

    it("should render a submit button", () => {
      const {node} = createFormComponent({schema: {}});

      expect(node.querySelectorAll("button[type=submit]"))
        .to.have.length.of(1);
    });

    it("should render children buttons", () => {
      const props = {schema: {}};
      const comp = renderIntoDocument(
        <Form {...props}>
          <button type="submit">Submit</button>
          <button type="submit">Another submit</button>
        </Form>
      );
      const node = findDOMNode(comp);
      expect(node.querySelectorAll("button[type=submit]"))
        .to.have.length.of(2);
    });
  });

  describe("Custom submit buttons", () => {
    it("should submit the form when clicked", () => {
      const onSubmit = sandbox.spy();
      const comp = renderIntoDocument(
        <Form onSubmit={ onSubmit } schema={ {} }>
          <button type="submit">Submit</button>
          <button type="submit">Another submit</button>
        </Form>
      );
      const node = findDOMNode(comp);
      const buttons = node.querySelectorAll("button[type=submit]");
      buttons[0].click();
      buttons[1].click();
      sinon.assert.calledTwice(onSubmit);
    });
  });

  describe("Schema definitions", () => {
    it("should use a single schema definition reference", () => {
      const schema = {
        definitions: {
          testdef: {type: "string"}
        },
        $ref: "#/definitions/testdef"
      };

      const {node} = createFormComponent({schema});

      expect(node.querySelectorAll("input[type=text]"))
        .to.have.length.of(1);
    });

    it("should handle multiple schema definition references", () => {
      const schema = {
        definitions: {
          testdef: {type: "string"}
        },
        type: "object",
        properties: {
          foo: {$ref: "#/definitions/testdef"},
          bar: {$ref: "#/definitions/testdef"},
        }
      };

      const {node} = createFormComponent({schema});

      expect(node.querySelectorAll("input[type=text]"))
        .to.have.length.of(2);
    });

    it("should handle deeply referenced schema definitions", () => {
      const schema = {
        definitions: {
          testdef: {type: "string"}
        },
        type: "object",
        properties: {
          foo: {
            type: "object",
            properties: {
              bar: {$ref: "#/definitions/testdef"},
            }
          }
        }
      };

      const {node} = createFormComponent({schema});

      expect(node.querySelectorAll("input[type=text]"))
        .to.have.length.of(1);
    });

    it("should handle referenced definitions for array items", () => {
      const schema = {
        definitions: {
          testdef: {type: "string"}
        },
        type: "object",
        properties: {
          foo: {
            type: "array",
            items: {$ref: "#/definitions/testdef"}
          }
        }
      };

      const {node} = createFormComponent({schema, formData: {
        foo: ["blah"]
      }});

      expect(node.querySelectorAll("input[type=text]"))
        .to.have.length.of(1);
    });

    it("should raise for non-existent definitions referenced", () => {
      const schema = {
        type: "object",
        properties: {
          foo: {$ref: "#/definitions/nonexistent"},
        }
      };

      expect(() => createFormComponent({schema}))
        .to.Throw(Error, /#\/definitions\/nonexistent/);
    });

    it("should propagate referenced definition defaults", () => {
      const schema = {
        definitions: {
          testdef: {type: "string", default: "hello"}
        },
        $ref: "#/definitions/testdef"
      };

      const {node} = createFormComponent({schema});

      expect(node.querySelector("input[type=text]").value)
        .eql("hello");
    });

    it("should propagate nested referenced definition defaults", () => {
      const schema = {
        definitions: {
          testdef: {type: "string", default: "hello"}
        },
        type: "object",
        properties: {
          foo: {$ref: "#/definitions/testdef"}
        }
      };

      const {node} = createFormComponent({schema});

      expect(node.querySelector("input[type=text]").value)
        .eql("hello");
    });

    it("should propagate referenced definition defaults for array items", () => {
      const schema = {
        definitions: {
          testdef: {type: "string", default: "hello"}
        },
        type: "array",
        items: {
          $ref: "#/definitions/testdef"
        }
      };

      const {node} = createFormComponent({schema});

      Simulate.click(node.querySelector(".array-item-add button"));

      expect(node.querySelector("input[type=text]").value)
        .eql("hello");
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
      const {comp, node} = createFormComponent({schema});

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
        const compInfo = createFormComponent({schema, formData: {
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
        const compInfo = createFormComponent({schema, formData: {
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
      const {comp, node} = createFormComponent({schema, formData, onSubmit});

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
      const {node} = createFormComponent({schema, formData, onSubmit, onError});

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
      const {node} = createFormComponent({schema, formData, onChange});

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
      const {node} = createFormComponent({schema, formData, onError});

      Simulate.submit(node);

      sinon.assert.calledOnce(onError);
    });
  });

  describe("External formData updates", () => {
    describe("root level", () => {
      it("should update form state from new formData prop value", () => {
        const schema = {type: "string"};
        const {comp} = createFormComponent({schema});

        comp.componentWillReceiveProps({formData: "yo"});

        expect(comp.state.formData).eql("yo");
      });

      it("should validate formData when the schema is updated", () => {
        const {comp} = createFormComponent({schema: {type: "string"}});

        comp.componentWillReceiveProps({formData: "yo", schema: {type: "number"}});

        expect(comp.state.errors).to.have.length.of(1);
        expect(comp.state.errors[0].stack)
          .to.eql("instance is not of a type(s) number");
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
        const {comp} = createFormComponent({schema});

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
        const {comp} = createFormComponent({schema});

        comp.componentWillReceiveProps({formData: ["yo"]});

        expect(comp.state.formData).eql(["yo"]);
      });
    });
  });

  describe("Error contextualization", () => {
    describe("on form state updated", () => {
      const schema = {
        type: "string",
        minLength: 8
      };

      describe("Lazy validation", () => {
        it("should not update the errorSchema when the formData changes", () => {
          const {comp, node} = createFormComponent({schema});

          Simulate.change(node.querySelector("input[type=text]"), {
            target: {value: "short"}
          });

          expect(comp.state.errorSchema).eql({});
        });

        it("should not denote an error in the field", () => {
          const {node} = createFormComponent({schema});

          Simulate.change(node.querySelector("input[type=text]"), {
            target: {value: "short"}
          });

          expect(node.querySelectorAll(".field-error"))
            .to.have.length.of(0);
        });
      });

      describe("Live validation", () => {
        it("should update the errorSchema when the formData changes", () => {
          const {comp, node} = createFormComponent({schema, liveValidate: true});

          Simulate.change(node.querySelector("input[type=text]"), {
            target: {value: "short"}
          });

          expect(comp.state.errorSchema).eql({
            errors: ["does not meet minimum length of 8"]
          });
        });

        it("should denote the new error in the field", () => {
          const {node} = createFormComponent({schema, liveValidate: true});

          Simulate.change(node.querySelector("input[type=text]"), {
            target: {value: "short"}
          });

          expect(node.querySelectorAll(".field-error"))
            .to.have.length.of(1);
          expect(node.querySelector(".field-string .error-detail").textContent)
            .eql("does not meet minimum length of 8");
        });
      });
    });

    describe("on form submitted", () => {
      const schema = {
        type: "string",
        minLength: 8
      };

      it("should update the errorSchema on form submission", () => {
        const {comp, node} = createFormComponent({schema});

        Simulate.change(node.querySelector("input[type=text]"), {
          target: {value: "short"}
        });

        Simulate.submit(node);

        expect(comp.state.errorSchema).eql({
          errors: ["does not meet minimum length of 8"]
        });
      });
    });

    describe("root level", () => {
      const schema = {
        type: "string",
        minLength: 8
      };

      it("should reflect the contextualized error in state", () => {
        const {comp} = createFormComponent({schema, formData: "short"});

        expect(comp.state.errorSchema).eql({
          errors: ["does not meet minimum length of 8"]
        });
      });

      it("should denote the error in the field", () => {
        const {node} = createFormComponent({schema, formData: "short"});

        expect(node.querySelectorAll(".field-error"))
          .to.have.length.of(1);
        expect(node.querySelector(".field-string .error-detail").textContent)
          .eql("does not meet minimum length of 8");
      });
    });

    describe("root level with multiple errors", () => {
      const schema = {
        type: "string",
        minLength: 8,
        pattern: "\d+"
      };

      it("should reflect the contextualized error in state", () => {
        const {comp} = createFormComponent({schema, formData: "short"});
        expect(comp.state.errorSchema).eql({
          errors: [
            "does not meet minimum length of 8",
            `does not match pattern "\d+"`
          ]
        });
      });

      it("should denote the error in the field", () => {
        const {node} = createFormComponent({schema, formData: "short"});

        const liNodes = node.querySelectorAll(".field-string .error-detail li");
        const errors = [].map.call(liNodes, li => li.textContent);

        expect(errors).eql([
          "does not meet minimum length of 8",
          `does not match pattern "\d+"`
        ]);
      });
    });

    describe("nested field level", () => {
      const schema = {
        type: "object",
        properties: {
          level1: {
            type: "object",
            properties: {
              level2: {
                type: "string",
                minLength: 8
              }
            }
          }
        }
      };

      it("should reflect the contextualized error in state", () => {
        const {comp} = createFormComponent({schema, formData: {
          level1: {
            level2: "short"
          }
        }});

        expect(comp.state.errorSchema).eql({
          level1: {
            level2: {
              errors: ["does not meet minimum length of 8"]
            }
          }
        });
      });

      it("should denote the error in the field", () => {
        const {node} = createFormComponent({schema, formData: {
          level1: {
            level2: "short"
          }
        }});
        const errorDetail = node.querySelector(
          ".field-object .field-string .error-detail");

        expect(node.querySelectorAll(".field-error"))
          .to.have.length.of(1);
        expect(errorDetail.textContent)
          .eql("does not meet minimum length of 8");
      });
    });

    describe("array indices", () => {
      const schema = {
        type: "array",
        items: {
          type: "string",
          minLength: 4
        }
      };

      it("should contextualize the error for array indices", () => {
        const {comp} = createFormComponent({schema, formData: [
          "good", "bad", "good"
        ]});

        expect(comp.state.errorSchema)
          .eql({
            1: {errors: ["does not meet minimum length of 4"]}
          });
      });

      it("should denote the error in the item field in error", () => {
        const {node} = createFormComponent({schema, formData: [
          "good", "bad", "good"
        ]});
        const fieldNodes = node.querySelectorAll(".field-string");

        const liNodes = fieldNodes[1]
          .querySelectorAll(".field-string .error-detail li");
        const errors = [].map.call(liNodes, li => li.textContent);

        expect(fieldNodes[1].classList.contains("field-error")).eql(true);
        expect(errors)
          .eql(["does not meet minimum length of 4"]);
      });

      it("should not denote errors on non impacted fields", () => {
        const {node} = createFormComponent({schema, formData: [
          "good", "bad", "good"
        ]});
        const fieldNodes = node.querySelectorAll(".field-string");

        expect(fieldNodes[0].classList.contains("field-error")).eql(false);
        expect(fieldNodes[2].classList.contains("field-error")).eql(false);
      });
    });

    describe("nested array indices", () => {
      const schema = {
        type: "object",
        properties: {
          level1: {
            type: "array",
            items: {
              type: "string",
              minLength: 4
            }
          }
        }
      };

      it("should contextualize the error for nested array indices", () => {
        const {comp} = createFormComponent({schema, formData: {
          level1: ["good", "bad", "good", "bad"]
        }});

        expect(comp.state.errorSchema).eql({
          level1: {
            1: {errors: ["does not meet minimum length of 4"]},
            3: {errors: ["does not meet minimum length of 4"]},
          }
        });
      });

      it("should denote the error in the nested item field in error", () => {
        const {node} = createFormComponent({schema, formData: {
          level1: ["good", "bad", "good"]
        }});

        const liNodes = node.querySelectorAll(".field-string .error-detail li");
        const errors = [].map.call(liNodes, li => li.textContent);

        expect(errors)
          .eql(["does not meet minimum length of 4"]);
      });
    });

    describe("array nested items", () => {
      const schema = {
        type: "array",
        items: {
          type: "object",
          properties: {
            foo: {
              type: "string",
              minLength: 4
            }
          }
        }
      };

      it("should contextualize the error for array nested items", () => {
        const {comp} = createFormComponent({schema, formData: [
          {foo: "good"}, {foo: "bad"}, {foo: "good"}
        ]});

        expect(comp.state.errorSchema).eql({
          1: {
            foo: {
              errors: ["does not meet minimum length of 4"]
            }
          }
        });
      });

      it("should denote the error in the array nested item", () => {
        const {node} = createFormComponent({schema, formData: [
          {foo: "good"}, {foo: "bad"}, {foo: "good"}
        ]});
        const fieldNodes = node.querySelectorAll(".field-string");

        const liNodes = fieldNodes[1]
          .querySelectorAll(".field-string .error-detail li");
        const errors = [].map.call(liNodes, li => li.textContent);

        expect(fieldNodes[1].classList.contains("field-error")).eql(true);
        expect(errors)
          .eql(["does not meet minimum length of 4"]);
      });
    });
  });
});
