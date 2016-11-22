import {expect} from "chai";
import sinon from "sinon";
import React from "react";
import {renderIntoDocument, Simulate} from "react-addons-test-utils";
import {findDOMNode} from "react-dom";

import Form from "../src";
import {createFormComponent, createSandbox} from "./test_utils";

describe("Form", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
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

  describe("Custom field template", () => {
    const schema = {
      type: "object",
      title: "root object",
      required: ["foo"],
      properties: {
        foo: {
          type: "string",
          description: "this is description",
          minLength: 32,
        }
      }
    };

    const uiSchema = {
      foo: {
        "ui:help": "this is help"
      }
    };

    const formData = {foo: "invalid"};

    function FieldTemplate(props) {
      const {
        id,
        classNames,
        label,
        help,
        rawHelp,
        required,
        description,
        rawDescription,
        errors,
        rawErrors,
        children,
      } = props;
      return (
        <div className={"my-template " + classNames}>
          <label htmlFor={id}>{label}{required ? "*" : null}</label>
          {description}
          {children}
          {errors}
          {help}
          <span className="raw-help">{`${rawHelp} rendered from the raw format`}</span>
          <span className="raw-description">{`${rawDescription} rendered from the raw format`}</span>
          {rawErrors ? (
            <ul>
              {rawErrors.map(
                (error, i) => <li key={i} className="raw-error">{error}</li>
              )}
            </ul>
          ) : null
          }
        </div>
      );
    }

    let node;

    beforeEach(() => {
      node = createFormComponent({
        schema,
        uiSchema,
        formData,
        FieldTemplate,
        liveValidate: true,
      }).node;
    });

    it("should use the provided field template", () => {
      expect(node.querySelector(".my-template")).to.exist;
    });

    it("should use the provided template for labels", () => {
      expect(node.querySelector(".my-template > label").textContent)
        .eql("root object");
      expect(node.querySelector(".my-template .field-string > label").textContent)
        .eql("foo*");
    });

    it("should pass description as the provided React element", () => {
      expect(node.querySelector("#root_foo__description").textContent)
        .eql("this is description");
    });

    it("should pass rawDescription as a string", () => {
      expect(node.querySelector(".raw-description").textContent)
        .eql("this is description rendered from the raw format");
    });

    it("should eventually pass errors as the provided React component", (done) => {
      setTimeout(() => {
        expect(node.querySelectorAll(".error-detail li"))
          .to.have.length.of(1);
        done();
      });
    });

    it("should eventually pass rawErrors as an array of strings", (done) => {
      setTimeout(() => {
        expect(node.querySelectorAll(".raw-error"))
          .to.have.length.of(1);
        done();
      });
    });

    it("should pass help as a the provided React element", () => {
      expect(node.querySelector(".help-block").textContent)
        .eql("this is help");
    });

    it("should pass rawHelp as a string", () => {
      expect(node.querySelector(".raw-help").textContent)
        .eql("this is help rendered from the raw format");
    });
  });

  describe("Custom submit buttons", () => {
    it("should eventually submit the form when clicked", (done) => {
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
      setTimeout(() => {
        sinon.assert.calledTwice(onSubmit);
        done();
      });
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

    it("should priorize definition over schema type property", () => {
      // Refs bug #140
      const schema = {
        type: "object",
        properties: {
          name: {type: "string"},
          childObj: {
            type: "object",
            $ref: "#/definitions/childObj"
          }
        },
        definitions: {
          childObj: {
            type: "object",
            properties: {
              otherName: {type: "string"}
            }
          }
        }
      };

      const {node} = createFormComponent({schema});

      expect(node.querySelectorAll("input[type=text]"))
        .to.have.length.of(2);
    });

    it("should priorize local properties over definition ones", () => {
      // Refs bug #140
      const schema = {
        type: "object",
        properties: {
          foo: {
            title: "custom title",
            $ref: "#/definitions/objectDef"
          }
        },
        definitions: {
          objectDef: {
            type: "object",
            title: "definition title",
            properties: {
              field: {type: "string"}
            }
          }
        }
      };

      const {node} = createFormComponent({schema});

      expect(node.querySelector("legend").textContent)
        .eql("custom title");
    });

    it("should propagate and handle a resolved schema definition", () => {
      const schema = {
        definitions: {
          enumDef: {type: "string", enum: ["a", "b"]}
        },
        type: "object",
        properties: {
          name: {$ref: "#/definitions/enumDef"}
        },
      };

      const {node} = createFormComponent({schema});

      expect(node.querySelectorAll("option"))
        .to.have.length.of(2);
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

    it("should propagate deeply nested defaults to form state", (done) => {
      const {comp, node} = createFormComponent({schema});

      Simulate.click(node.querySelector(".array-item-add button"));
      Simulate.submit(node);

      // For some reason this may take some time to render, hence the safe wait.
      setTimeout(() => {
        expect(comp.state.formData).eql({
          object: {
            array: [
              {
                bool: true
              }
            ]
          }
        });
        done();
      }, 250);
    });
  });

  describe("Submit handler", () => {
    it("should eventually call provided submit handler with form state", (done) => {
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

      setTimeout(() => {
        const actualArgument = onSubmit.firstCall.args[0];
        const expectedArgument = comp.state;
        expectedArgument.status = "submitted"; // actually, external onSubmit called at moment when state.status === "submitted", not "initial"
        expect(actualArgument).to.deep.equal(expectedArgument);
        done();
      });

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
    it("should eventually call provided change handler on form state change", (done) => {
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

      setTimeout(() => {
        sinon.assert.calledWithMatch(onChange, {
          formData: {
            foo: "new"
          }
        });
        done();
      });
    });
  });

  describe("Error handler", () => {
    it("should eventually call provided error handler on validation errors", (done) => {
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

      setTimeout(() => {
        sinon.assert.calledOnce(onError);
        done();
      });
    });
  });

  describe("External formData updates", () => {
    describe("root level", () => {
      const formProps = {
        schema: {type: "string"},
        liveValidate: true,
      };

      it("should update form state from new formData prop value", () => {
        const {comp} = createFormComponent(formProps);

        comp.componentWillReceiveProps({formData: "yo"});

        expect(comp.state.formData).eql("yo");
      });

      it("should eventually validate formData when the schema is updated", (done) => {
        const {comp} = createFormComponent(formProps);

        comp.componentWillReceiveProps({formData: "yo", schema: {type: "number"}});

        setTimeout(() => {
          expect(comp.state.errors).to.have.length.of(1);
          expect(comp.state.errors[0].stack)
            .to.eql("instance is not of a type(s) number");
          done();
        });

      });
    });

    describe("object level", () => {
      it("should eventually update form state from new formData prop value", (done) => {
        const {comp} = createFormComponent({
          schema: {
            type: "object",
            properties: {
              foo: {
                type: "string"
              }
            }
          }
        });

        comp.componentWillReceiveProps({formData: {foo: "yo"}});

        setTimeout(() => {
          expect(comp.state.formData).eql({foo: "yo"});
          done();
        });
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

        it("should eventually clean contextualized errors up when they're fixed", (done) => {
          const altSchema = {
            type: "object",
            properties: {
              field1: {type: "string", minLength: 8},
              field2: {type: "string", minLength: 8},
            }
          };
          const {node} = createFormComponent({schema: altSchema, formData: {
            field1: "short",
            field2: "short",
          }});

          function submit(node) {
            try {
              Simulate.submit(node);
            } catch (err) {
              // Validation is expected to fail and call console.error, which is
              // stubbed to actually throw in createSandbox().
            }
          }

          submit(node);

          new Promise((resolve/*, reject*/) => {
            // Fix the first field
            Simulate.change(node.querySelectorAll("input[type=text]")[0], {
              target: {value: "fixed error"}
            });
            submit(node);

            setTimeout(() => {
              expect(node.querySelectorAll(".field-error"))
                .to.have.length.of(1);
              resolve();
            });
          })
            .then(() => {
              // Fix the second field
              Simulate.change(node.querySelectorAll("input[type=text]")[1], {
                target: {value: "fixed error too"}
              });
              submit(node);

              // No error remaining, shouldn't throw.
              Simulate.submit(node);

              setTimeout(() => {
                expect(node.querySelectorAll(".field-error"))
                  .to.have.length.of(0);
                done();
              });
            });

        });
      });

      describe("Live validation", () => {
        it("should eventually update the errorSchema when the formData changes", (done) => {
          const {comp, node} = createFormComponent({schema, liveValidate: true});

          Simulate.change(node.querySelector("input[type=text]"), {
            target: {value: "short"}
          });

          setTimeout(() => {
            expect(comp.state.errorSchema).eql({
              __errors: ["does not meet minimum length of 8"]
            });
            done();
          });
        });

        it("should eventualy denote the new error in the field", (done) => {
          const {node} = createFormComponent({schema, liveValidate: true});

          Simulate.change(node.querySelector("input[type=text]"), {
            target: {value: "short"}
          });

          setTimeout(() => {
            expect(node.querySelectorAll(".field-error"))
              .to.have.length.of(1);
            expect(node.querySelector(".field-string .error-detail").textContent)
              .eql("does not meet minimum length of 8");
            done();
          });
        });
      });

      describe("Disable validation onChange event", () => {
        it("should not update errorSchema when the formData changes", () => {
          const {comp, node} = createFormComponent({
            schema,
            noValidate: true,
            liveValidate: true
          });

          Simulate.change(node.querySelector("input[type=text]"), {
            target: {value: "short"}
          });

          expect(comp.state.errorSchema).eql({});
        });
      });

      describe("Disable validation onSubmit event", () => {
        it("should not update errorSchema when the formData changes", () => {
          const {comp, node} = createFormComponent({
            schema,
            noValidate: true
          });

          Simulate.change(node.querySelector("input[type=text]"), {
            target: {value: "short"}
          });
          Simulate.submit(node);

          expect(comp.state.errorSchema).eql({});
        });
      });
    });

    describe("on form submitted", () => {
      const schema = {
        type: "string",
        minLength: 8
      };

      it("should eventually update the errorSchema on form submission", (done) => {
        const {comp, node} = createFormComponent({schema, onError: () => {}});

        Simulate.change(node.querySelector("input[type=text]"), {
          target: {value: "short"}
        });
        Simulate.submit(node);

        setTimeout(() => {
          expect(comp.state.errorSchema).eql({
            __errors: ["does not meet minimum length of 8"]
          });
          done();
        });
      });

      it("should eventually call the onError handler", (done) => {
        const onError = sandbox.spy();
        const {node} = createFormComponent({schema, onError});

        Simulate.change(node.querySelector("input[type=text]"), {
          target: {value: "short"}
        });
        Simulate.submit(node);

        setTimeout(() => {
          sinon.assert.calledWithMatch(onError, sinon.match(value => {
            return value.length === 1 &&
                   value[0].message === "does not meet minimum length of 8";
          }));
          done();
        });
      });
    });

    describe("root level", () => {
      const formProps = {
        liveValidate: true,
        schema: {
          type: "string",
          minLength: 8
        },
        formData: "short"
      };

      it("should eventually reflect the contextualized error in state", (done) => {
        const {comp} = createFormComponent(formProps);

        setTimeout(() => {
          expect(comp.state.errorSchema).eql({
            __errors: ["does not meet minimum length of 8"]
          });
          done();
        });
      });

      it("should eventually denote the error in the field", (done) => {
        const {node} = createFormComponent(formProps);

        setTimeout(() => {
          expect(node.querySelectorAll(".field-error"))
            .to.have.length.of(1);
          expect(node.querySelector(".field-string .error-detail").textContent)
            .eql("does not meet minimum length of 8");
          done();
        });
      });
    });

    describe("root level with multiple errors", () => {
      const formProps = {
        liveValidate: true,
        schema: {
          type: "string",
          minLength: 8,
          pattern: "\d+",
        },
        formData: "short"
      };

      it("should eventually reflect the contextualized error in state", (done) => {
        const {comp} = createFormComponent(formProps);
        setTimeout(() => {
          expect(comp.state.errorSchema).eql({
            __errors: [
              "does not meet minimum length of 8",
              "does not match pattern \"\d+\""
            ]
          });
          done();
        });
      });

      it("should eventually denote the error in the field", (done) => {
        const {node} = createFormComponent(formProps);

        setTimeout(() => {
          const liNodes = node.querySelectorAll(".field-string .error-detail li");
          const errors = [].map.call(liNodes, li => li.textContent);

          expect(errors).eql([
            "does not meet minimum length of 8",
            "does not match pattern \"\d+\""
          ]);
          done();
        });
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

      const formProps = {
        schema,
        liveValidate: true,
        formData: {
          level1: {
            level2: "short"
          }
        }
      };

      it("should eventually reflect the contextualized error in state", (done) => {
        const {comp} = createFormComponent(formProps);

        setTimeout(() => {
          expect(comp.state.errorSchema).eql({
            level1: {
              level2: {
                __errors: ["does not meet minimum length of 8"]
              }
            }
          });
          done();
        });
      });

      it("should eventually denote the error in the field", (done) => {
        const {node} = createFormComponent(formProps);
        setTimeout(() => {
          const errorDetail = node.querySelector(
            ".field-object .field-string .error-detail");

          expect(node.querySelectorAll(".field-error"))
            .to.have.length.of(1);
          expect(errorDetail.textContent)
            .eql("does not meet minimum length of 8");
          done();
        });
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

      const formProps = {
        schema,
        liveValidate: true,
        formData: ["good", "bad", "good"]
      };

      it("should eventually contextualize the error for array indices", (done) => {
        const {comp} = createFormComponent(formProps);

        setTimeout(() => {
          expect(comp.state.errorSchema)
            .eql({
              1: {__errors: ["does not meet minimum length of 4"]}
            });
          done();
        });
      });

      it("should eventually denote the error in the item field in error", (done) => {
        const {node} = createFormComponent(formProps);
        setTimeout(() => {
          const fieldNodes = node.querySelectorAll(".field-string");

          const liNodes = fieldNodes[1]
            .querySelectorAll(".field-string .error-detail li");
          const errors = [].map.call(liNodes, li => li.textContent);

          expect(fieldNodes[1].classList.contains("field-error")).eql(true);
          expect(errors)
            .eql(["does not meet minimum length of 4"]);
          done();
        });
      });

      it("should not eventually denote errors on non impacted fields", (done) => {
        const {node} = createFormComponent(formProps);
        setTimeout(() => {
          const fieldNodes = node.querySelectorAll(".field-string");

          expect(fieldNodes[0].classList.contains("field-error")).eql(false);
          expect(fieldNodes[2].classList.contains("field-error")).eql(false);
          done();
        });
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

      const formProps = {schema, liveValidate: true};

      it("should eventually contextualize the error for nested array indices", (done) => {
        const {comp} = createFormComponent({...formProps, formData: {
          level1: ["good", "bad", "good", "bad"]
        }});

        setTimeout(() => {
          expect(comp.state.errorSchema).eql({
            level1: {
              1: {__errors: ["does not meet minimum length of 4"]},
              3: {__errors: ["does not meet minimum length of 4"]},
            }
          });
          done();
        });
      });

      it("should eventually denote the error in the nested item field in error", (done) => {
        const {node} = createFormComponent({...formProps, formData: {
          level1: ["good", "bad", "good"]
        }});

        setTimeout(() => {
          const liNodes = node.querySelectorAll(".field-string .error-detail li");
          const errors = [].map.call(liNodes, li => li.textContent);

          expect(errors)
            .eql(["does not meet minimum length of 4"]);
          done();
        });
      });
    });

    describe("nested arrays", () => {
      const schema = {
        type: "object",
        properties: {
          outer: {
            type: "array",
            items: {
              type: "array",
              items: {
                type: "string",
                minLength: 4
              }
            }
          }
        }
      };

      const formData = {
        outer: [
          ["good", "bad"],
          ["bad", "good"]
        ]
      };

      const formProps = {schema, formData, liveValidate: true};

      it("should eventually contextualize the error for nested array indices", (done) => {
        const {comp} = createFormComponent(formProps);

        setTimeout(() => {
          expect(comp.state.errorSchema).eql({
            outer: {
              0: {
                1: {__errors: ["does not meet minimum length of 4"]}
              },
              1: {
                0: {__errors: ["does not meet minimum length of 4"]}
              }
            }
          });
          done();
        });
      });

      it("should eventually denote the error in the nested item field in error", (done) => {
        const {node} = createFormComponent(formProps);
        setTimeout(() => {
          const fields = node.querySelectorAll(".field-string");
          const errors = [].map.call(fields, field => {
            const li = field.querySelector(".error-detail li");
            return li && li.textContent;
          });

          expect(errors)
            .eql([
              null,
              "does not meet minimum length of 4",
              "does not meet minimum length of 4",
              null
            ]);
          done();
        });
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

      const formProps = {
        schema,
        liveValidate: true,
        formData: [
          {foo: "good"}, {foo: "bad"}, {foo: "good"}
        ]
      };

      it("should eventually contextualize the error for array nested items", (done) => {
        const {comp} = createFormComponent(formProps);

        setTimeout(() => {
          expect(comp.state.errorSchema).eql({
            1: {
              foo: {
                __errors: ["does not meet minimum length of 4"]
              }
            }
          });
          done();
        });
      });

      it("should eventually denote the error in the array nested item", (done) => {
        const {node} = createFormComponent(formProps);
        setTimeout(() => {
          const fieldNodes = node.querySelectorAll(".field-string");

          const liNodes = fieldNodes[1]
            .querySelectorAll(".field-string .error-detail li");
          const errors = [].map.call(liNodes, li => li.textContent);

          expect(fieldNodes[1].classList.contains("field-error")).eql(true);
          expect(errors)
            .eql(["does not meet minimum length of 4"]);
          done();
        });
      });
    });
  });

  describe("Schema and formData updates", () => {
    // https://github.com/mozilla-services/react-jsonschema-form/issues/231
    const schema = {
      type: "object",
      properties: {
        foo: {type: "string"},
        bar: {type: "string"},
      }
    };

    it("should replace state when formData have keys removed", () => {
      const formData = {foo: "foo", bar: "bar"};
      const {comp, node} = createFormComponent({schema, formData});
      comp.componentWillReceiveProps({
        schema: {
          type: "object",
          properties: {
            bar: {type: "string"},
          }
        },
        formData: {bar: "bar"},
      });

      Simulate.change(node.querySelector("#root_bar"), {
        target: {value: "baz"}
      });

      expect(comp.state.formData).eql({bar: "baz"});
    });

    it("should replace state when formData keys have changed", () => {
      const formData = {foo: "foo", bar: "bar"};
      const {comp, node} = createFormComponent({schema, formData});
      comp.componentWillReceiveProps({
        schema: {
          type: "object",
          properties: {
            foo: {type: "string"},
            baz: {type: "string"},
          }
        },
        formData: {foo: "foo", baz: "bar"},
      });

      Simulate.change(node.querySelector("#root_baz"), {
        target: {value: "baz"}
      });

      expect(comp.state.formData).eql({foo: "foo", baz: "baz"});
    });
  });

  describe("Attributes", () => {
    const formProps = {
      schema: {},
      id: "test-form",
      className: "test-class other-class",
      name: "testName",
      method: "post",
      target: "_blank",
      action: "/users/list",
      autocomplete: "off",
      enctype: "multipart/form-data",
      acceptcharset: "ISO-8859-1"
    };

    let node;

    beforeEach(() => {
      node = createFormComponent(formProps).node;
    });

    it("should set attr id of form", () => {
      expect(node.getAttribute("id")).eql(formProps.id);
    });

    it("should set attr class of form", () => {
      expect(node.getAttribute("class")).eql(formProps.className);
    });

    it("should set attr name of form", () => {
      expect(node.getAttribute("name")).eql(formProps.name);
    });

    it("should set attr method of form", () => {
      expect(node.getAttribute("method")).eql(formProps.method);
    });

    it("should set attr target of form", () => {
      expect(node.getAttribute("target")).eql(formProps.target);
    });

    it("should set attr action of form", () => {
      expect(node.getAttribute("action")).eql(formProps.action);
    });

    it("should set attr autoComplete of form", () => {
      expect(node.getAttribute("autocomplete")).eql(formProps.autocomplete);
    });

    it("should set attr enctype of form", () => {
      expect(node.getAttribute("enctype")).eql(formProps.enctype);
    });

    it("should set attr acceptcharset of form", () => {
      expect(node.getAttribute("accept-charset")).eql(formProps.acceptcharset);
    });
  });
});
