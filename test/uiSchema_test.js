
import {expect} from "chai";
import React from "react";
import {Simulate} from "react-addons-test-utils";

import {createFormComponent, createSandbox} from "./test_utils";


describe("uiSchema", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("custom classNames", () => {
    const schema = {
      type: "object",
      properties: {
        foo: {type: "string"},
        bar: {type: "string"},
      }
    };

    const uiSchema = {
      foo: {classNames: "class-for-foo"},
      bar: {classNames: "class-for-bar another-for-bar"},
    };

    it("should apply custom class names to target widgets", () => {
      const {node} = createFormComponent({schema, uiSchema});
      const [foo, bar] = node.querySelectorAll(".field-string");

      expect(foo.classList.contains("class-for-foo")).eql(true);
      expect(bar.classList.contains("class-for-bar")).eql(true);
      expect(bar.classList.contains("another-for-bar")).eql(true);
    });
  });

  describe("custom widget", () => {
    describe("root widget", () => {
      const schema = {
        type: "string"
      };

      const uiSchema = {
        "ui:widget": (props) => {
          return (
            <input type="text"
              className="custom"
              value={props.value}
              defaultValue={props.defaultValue}
              required={props.required}
              onChange={(event) => props.onChange(event.target.value)}/>
          );
        }
      };

      it("should render a root custom widget", () => {
        const {node} = createFormComponent({schema, uiSchema});

        expect(node.querySelectorAll(".custom")).to.have.length.of(1);
      });
    });

    describe("custom options", () => {
      let widget, widgets, schema, uiSchema;

      beforeEach(() => {
        sandbox.stub(console, "warn");

        widget = ({label, options}) => <div id={label} style={options}></div>;
        widget.defaultProps = {options: {background: "yellow", color: "green"}};

        widgets = {widget};

        // all fields in one schema to catch errors where options passed to one
        // instance of a widget are persistent across all instances
        schema = {
          type: "object",
          properties: {
            funcAll: {type: "string"},
            funcNone: {type: "string"},
            stringAll: {type: "string"},
            stringNone: {type: "string"}
          }
        };

        uiSchema = {
          // pass widget as function
          funcAll: {
            "ui:widget": {
              component: widget,
              options: {
                background: "purple"
              }
            },
            "ui:options": {
              margin: "7px"
            },
            "ui:padding": "42px"
          },
          funcNone: {
            "ui:widget": widget
          },

          // pass widget as string
          stringAll: {
            "ui:widget": {
              component: "widget",
              options: {
                background: "blue"
              }
            },
            "ui:options": {
              margin: "19px"
            },
            "ui:padding": "41px"
          },
          stringNone: {
            "ui:widget": "widget"
          }
        };
      });

      it("should log warning when deprecated ui:widget: {component, options} api is used", () => {
        createFormComponent({
          schema: {type:"string"},
          uiSchema: {"ui:widget": {component: "widget"}},
          widgets
        });
        expect(console.warn.calledWithMatch(/ui:widget object is deprecated/)).to.be.true;
      });

      it("should cache MergedWidget instance", () => {
        expect(widget.MergedWidget).not.to.be.ok;
        createFormComponent({schema: {type:"string"}, uiSchema: {"ui:widget": "widget"}, widgets});
        const cached = widget.MergedWidget;
        expect(cached).to.be.ok;
        createFormComponent({schema: {type:"string"}, uiSchema: {"ui:widget": "widget"}, widgets});
        expect(widget.MergedWidget).to.equal(cached);
      });

      it("should render merged ui:widget options for widget referenced as function", () => {
        const {node} = createFormComponent({schema, uiSchema, widgets});
        const widget = node.querySelector("#funcAll");

        expect(widget.style.background).to.equal("purple");
        expect(widget.style.color).to.equal("green");
        expect(widget.style.margin).to.equal("7px");
        expect(widget.style.padding).to.equal("42px");
      });

      it("should render ui:widget default options for widget referenced as function", () => {
        const {node} = createFormComponent({schema, uiSchema, widgets});
        const widget = node.querySelector("#funcNone");

        expect(widget.style.background).to.equal("yellow");
        expect(widget.style.color).to.equal("green");
        expect(widget.style.margin).to.equal("");
        expect(widget.style.padding).to.equal("");
      });

      it("should render merged ui:widget options for widget referenced as string", () => {
        const {node} = createFormComponent({schema, uiSchema, widgets});
        const widget = node.querySelector("#stringAll");

        expect(widget.style.background).to.equal("blue");
        expect(widget.style.color).to.equal("green");
        expect(widget.style.margin).to.equal("19px");
        expect(widget.style.padding).to.equal("41px");
      });

      it("should render ui:widget default options for widget referenced as string", () => {
        const {node} = createFormComponent({schema, uiSchema, widgets});
        const widget = node.querySelector("#stringNone");

        expect(widget.style.background).to.equal("yellow");
        expect(widget.style.color).to.equal("green");
        expect(widget.style.margin).to.equal("");
        expect(widget.style.padding).to.equal("");
      });
    });

    describe("nested widget", () => {
      const schema = {
        "type": "object",
        "properties": {
          "field": {
            "type": "string"
          }
        }
      };

      const uiSchema = {
        "field": {
          "ui:widget": "custom"
        }
      };

      const CustomWidget = (props) => {
        return (
          <input type="text"
            className="custom"
            value={props.value}
            defaultValue={props.defaultValue}
            required={props.required}
            onChange={(event) => props.onChange(event.target.value)}/>
        );
      };

      const widgets = {
        custom: CustomWidget
      };

      it("should render a nested custom widget", () => {
        const {node} = createFormComponent({schema, uiSchema, widgets});

        expect(node.querySelectorAll(".custom")).to.have.length.of(1);
      });
    });

    describe("options", () => {
      const schema = {
        "type": "object",
        "properties": {
          "field": {
            "type": "string"
          }
        }
      };

      const CustomWidget = (props) => {
        const {value, options} = props;
        return (
          <input type="text" className={options.className} value={value}/>
        );
      };

      describe("direct reference", () => {
        const uiSchema = {
          "field": {
            "ui:widget": CustomWidget,
            "ui:options": {
              className: "custom"
            }
          }
        };

        it("should render a custom widget with options", () => {
          const {node} = createFormComponent({schema, uiSchema});

          expect(node.querySelectorAll(".custom")).to.have.length.of(1);
        });
      });

      describe("string reference", () => {
        const uiSchema = {
          "field": {
            "ui:widget": "custom",
            "ui:options": {
              className: "custom"
            }
          }
        };

        const widgets = {
          custom: CustomWidget
        };

        it("should render a custom widget with options", () => {
          const {node} = createFormComponent({schema, uiSchema, widgets});

          expect(node.querySelectorAll(".custom")).to.have.length.of(1);
        });
      });
    });

    describe("enum fields native options", () => {
      const schema = {
        "type": "object",
        "properties": {
          "field": {
            "type": "string",
            "enum": ["foo", "bar"]
          }
        }
      };

      const CustomWidget = (props) => {
        const {value, options} = props;
        const {enumOptions, className} = options;
        return (
          <select className={className}>{
            enumOptions.map(({label, value}, i) => <option key={i}>{value}</option>)
          }</select>
        );
      };

      const uiSchema = {
        "field": {
          "ui:widget": CustomWidget,
          "ui:options": {
            className: "custom"
          }
        }
      };

      it("should merge enumOptions with custom options", () => {
        const {node} = createFormComponent({schema, uiSchema});
        expect(node.querySelectorAll(".custom option")).to.have.length.of(2);
      });
    });
  });

  describe("ui:help", () => {
    it("should render the provided help text", () => {
      const schema = {type: "string"};
      const uiSchema = {"ui:help": "plop"};

      const {node} = createFormComponent({schema, uiSchema});

      expect(node.querySelector("p.help-block").textContent).eql("plop");
    });
  });

  it("should accept a react element as help", () => {
    const schema = {type: "string"};
    const uiSchema = {"ui:help": (<b>plop</b>)};

    const {node} = createFormComponent({schema, uiSchema});

    expect(node.querySelector("div.help-block").textContent).eql("plop");
  });

  describe("ui:focus", () => {
    const shouldFocus = (schema, uiSchema, selector = "input", formData) => {
      const props = {schema, uiSchema};
      if (typeof formData !== "undefined") {
        props.formData = formData;
      }

      const {node} = createFormComponent(props);
      expect(node.querySelector(selector)).eql(document.activeElement);
    };

    describe("number", () => {
      it("should focus on integer input", () => {
        shouldFocus({type: "integer"}, {"ui:autofocus": true});
      });

      it("should focus on integer input, updown widget", () => {
        shouldFocus({type: "integer"}, {"ui:widget": "updown", "ui:autofocus": true});
      });

      it("should focus on integer input, range widget", () => {
        shouldFocus({type: "integer"}, {"ui:widget": "range", "ui:autofocus": true});
      });

      it("should focus on integer enum input", () => {
        shouldFocus({type: "integer", enum: [1, 2, 3]}, {"ui:autofocus": true}, "select");
      });
    });

    describe("string", () => {
      it("should focus on text input", () => {
        shouldFocus({type: "string"}, {"ui:autofocus": true});
      });

      it("should focus on textarea", () => {
        shouldFocus({type: "string"}, {"ui:widget": "textarea", "ui:autofocus": true}, "textarea");
      });

      it("should focus on password input", () => {
        shouldFocus({type: "string"}, {"ui:widget": "password", "ui:autofocus": true});
      });

      it("should focus on color input", () => {
        shouldFocus({type: "string"}, {"ui:widget": "color", "ui:autofocus": true});
      });

      it("should focus on email input", () => {
        shouldFocus({type: "string", format: "email"}, {"ui:autofocus": true});
      });

      it("should focus on uri input", () => {
        shouldFocus({type: "string", format: "uri"}, {"ui:autofocus": true});
      });

      it("should focus on data-url input", () => {
        shouldFocus({type: "string", format: "data-url"}, {"ui:autofocus": true});
      });
    });

    describe("object", () => {
      it("should focus on date input", () => {
        shouldFocus({type: "string", format: "date"}, {"ui:autofocus": true});
      });

      it("should focus on date-time input", () => {
        shouldFocus({type: "string", format: "date-time"}, {"ui:autofocus": true});
      });

      it("should focus on alt-date input", () => {
        shouldFocus({type: "string", format: "date"}, {"ui:widget": "alt-date",  "ui:autofocus": true}, "select");
      });

      it("should focus on alt-date-time input", () => {
        shouldFocus({type: "string", format: "date-time"}, {"ui:widget": "alt-datetime",  "ui:autofocus": true}, "select");
      });
    });

    describe("array", () => {
      it("should focus on multiple files input", () => {
        shouldFocus({type: "array", items: {type: "string", format: "data-url"}}, {"ui:autofocus": true});
      });

      it("should focus on first item of a list of strings", () => {
        shouldFocus({type: "array", items: {type: "string", default: "foo"}}, {"ui:autofocus": true}, "input", ["foo", "bar"]);
      });

      it("should focus on first item of a multiple choices list", () => {
        shouldFocus(
          {type: "array", items: {type: "string", enum: ["foo", "bar"]}, uniqueItems: true},
          {"ui:widget": "checkboxes", "ui:autofocus": true},
          "input",
          ["bar"]
        );
      });
    });

    describe("boolean", () => {
      it("should focus on checkbox input", () => {
        shouldFocus({type: "boolean"}, {"ui:autofocus": true});
      });

      it("should focus on radio input", () => {
        shouldFocus({type: "boolean"}, {"ui:widget": "radio", "ui:autofocus": true});
      });

      it("should focus on select input", () => {
        shouldFocus({type: "boolean"}, {"ui:widget": "select", "ui:autofocus": true}, "select");
      });
    });
  });

  describe("string", () => {
    const schema = {
      type: "object",
      properties: {
        foo: {
          type: "string",
        }
      }
    };

    describe("file", () => {
      const uiSchema = {
        foo: {
          "ui:widget": "file"
        }
      };

      it("should accept a uiSchema object", () => {
        const {node} = createFormComponent({schema, uiSchema});

        expect(node.querySelectorAll("input[type=file]"))
          .to.have.length.of(1);
      });
    });


    describe("textarea", () => {
      const uiSchema = {
        foo: {
          "ui:widget": "textarea",
          "ui:placeholder": "sample",
        }
      };

      it("should accept a uiSchema object", () => {
        const {node} = createFormComponent({schema, uiSchema});

        expect(node.querySelectorAll("textarea"))
          .to.have.length.of(1);
      });


      it("should support formData", () => {
        const {node} = createFormComponent({schema, uiSchema, formData: {
          foo: "a"
        }});

        expect(node.querySelector("textarea").value)
          .eql("a");
      });

      it("should update state when text is updated", () => {
        const {comp, node} = createFormComponent({schema, uiSchema, formData: {
          foo: "a"
        }});

        Simulate.change(node.querySelector("textarea"), {
          target: {value: "b"}
        });

        expect(comp.state.formData).eql({foo: "b"});
      });

      it("should set a placeholder value", () => {
        const {node} = createFormComponent({schema, uiSchema});

        expect(node.querySelector("textarea").placeholder)
          .eql("sample");
      });
    });

    describe("password", () => {
      const uiSchema = {
        foo: {
          "ui:widget": "password",
          "ui:placeholder": "sample",
        }
      };

      it("should accept a uiSchema object", () => {
        const {node} = createFormComponent({schema, uiSchema});

        expect(node.querySelectorAll("[type=password]"))
          .to.have.length.of(1);
      });

      it("should support formData", () => {
        const {node} = createFormComponent({schema, uiSchema, formData: {
          foo: "a"
        }});

        expect(node.querySelector("[type=password]").value)
          .eql("a");
      });

      it("should update state when text is updated is checked", () => {
        const {comp, node} = createFormComponent({schema, uiSchema, formData: {
          foo: "a"
        }});

        Simulate.change(node.querySelector("[type=password]"), {
          target: {value: "b"}
        });

        expect(comp.state.formData).eql({foo: "b"});
      });

      it("should set a placeholder value", () => {
        const {node} = createFormComponent({schema, uiSchema});

        expect(node.querySelector("[type=password]").placeholder)
          .eql("sample");
      });
    });

    describe("color", () => {
      const uiSchema = {
        foo: {
          "ui:widget": "color"
        }
      };

      it("should accept a uiSchema object", () => {
        const {node} = createFormComponent({schema, uiSchema});

        expect(node.querySelectorAll("[type=color]"))
          .to.have.length.of(1);
      });

      it("should support formData", () => {
        const {node} = createFormComponent({schema, uiSchema, formData: {
          foo: "#151ce6"
        }});

        expect(node.querySelector("[type=color]").value)
          .eql("#151ce6");
      });

      it("should update state when text is updated", () => {
        const {comp, node} = createFormComponent({schema, uiSchema, formData: {
          foo: "#151ce6"
        }});

        Simulate.change(node.querySelector("[type=color]"), {
          target: {value: "#001122"}
        });

        expect(comp.state.formData).eql({foo: "#001122"});
      });
    });

    describe("hidden", () => {
      const uiSchema = {
        foo: {
          "ui:widget": "hidden"
        }
      };

      it("should accept a uiSchema object", () => {
        const {node} = createFormComponent({schema, uiSchema});

        expect(node.querySelectorAll("[type=hidden]"))
          .to.have.length.of(1);
      });

      it("should support formData", () => {
        const {node} = createFormComponent({schema, uiSchema, formData: {
          foo: "a"
        }});

        expect(node.querySelector("[type=hidden]").value)
          .eql("a");
      });

      it("should map widget value to a typed state one", () => {
        const {comp} = createFormComponent({schema, uiSchema, formData: {
          foo: "a"
        }});

        expect(comp.state.formData.foo).eql("a");
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
          "ui:widget": "radio"
        }
      };

      it("should accept a uiSchema object", () => {
        const {node} = createFormComponent({schema, uiSchema});

        expect(node.querySelectorAll("[type=radio]"))
          .to.have.length.of(2);
      });

      it("should support formData", () => {
        const {node} = createFormComponent({schema, uiSchema, formData: {
          foo: "b"
        }});

        expect(node.querySelectorAll("[type=radio]")[1].checked)
          .eql(true);
      });

      it("should update state when value is updated", () => {
        const {comp, node} = createFormComponent({schema, uiSchema, formData: {
          foo: "a"
        }});

        Simulate.change(node.querySelectorAll("[type=radio]")[1], {
          target: {checked: true}
        });

        expect(comp.state.formData).eql({foo: "b"});
      });
    });
  });

  describe("number", () => {
    const schema = {
      type: "object",
      properties: {
        foo: {
          type: "number",
          multipleOf: 1,
          minimum: 10,
          maximum: 100,
        }
      }
    };

    describe("updown", () => {
      const uiSchema = {
        foo: {
          "ui:widget": "updown"
        }
      };

      it("should accept a uiSchema object", () => {
        const {node} = createFormComponent({schema, uiSchema});

        expect(node.querySelectorAll("[type=number]"))
          .to.have.length.of(1);
      });

      it("should support formData", () => {
        const {node} = createFormComponent({schema, uiSchema, formData: {
          foo: 3.14
        }});

        expect(node.querySelector("[type=number]").value)
          .eql("3.14");
      });

      it("should update state when value is updated", () => {
        const {comp, node} = createFormComponent({schema, uiSchema, formData: {
          foo: 3.14
        }});

        Simulate.change(node.querySelector("[type=number]"), {
          target: {value: "6.28"}
        });

        expect(comp.state.formData).eql({foo: 6.28});
      });

      describe("Constraint attributes", () => {
        let input;

        beforeEach(() => {
          const {node} = createFormComponent({schema, uiSchema});
          input = node.querySelector("[type=number]");
        });

        it("should support the minimum constraint", () => {
          expect(input.getAttribute("min")).eql("10");
        });

        it("should support maximum constraint", () => {
          expect(input.getAttribute("max")).eql("100");
        });

        it("should support '0' as minimum and maximum constraints", () => {
          const schema = {
            type: "number",
            minimum: 0,
            maximum: 0,
          };
          const uiSchema = {"ui:widget": "updown"};
          const {node} = createFormComponent({schema, uiSchema});
          input = node.querySelector("[type=number]");

          expect(input.getAttribute("min")).eql("0");
          expect(input.getAttribute("max")).eql("0");
        });

        it("should support the multipleOf constraint", () => {
          expect(input.getAttribute("step")).eql("1");
        });
      });
    });

    describe("range", () => {
      const uiSchema = {
        foo: {
          "ui:widget": "range"
        }
      };

      it("should accept a uiSchema object", () => {
        const {node} = createFormComponent({schema, uiSchema});

        expect(node.querySelectorAll("[type=range]"))
          .to.have.length.of(1);
      });

      it("should support formData", () => {
        const {node} = createFormComponent({schema, uiSchema, formData: {
          foo: 3.14
        }});

        expect(node.querySelector("[type=range]").value)
          .eql("3.14");
      });

      it("should update state when value is updated", () => {
        const {comp, node} = createFormComponent({schema, uiSchema, formData: {
          foo: 3.14
        }});

        Simulate.change(node.querySelector("[type=range]"), {
          target: {value: "6.28"}
        });

        expect(comp.state.formData).eql({foo: 6.28});
      });

      describe("Constraint attributes", () => {
        let input;

        beforeEach(() => {
          const {node} = createFormComponent({schema, uiSchema});
          input = node.querySelector("[type=range]");
        });

        it("should support the minimum constraint", () => {
          expect(input.getAttribute("min")).eql("10");
        });

        it("should support maximum constraint", () => {
          expect(input.getAttribute("max")).eql("100");
        });

        it("should support '0' as minimum and maximum constraints", () => {
          const schema = {
            type: "number",
            minimum: 0,
            maximum: 0,
          };
          const uiSchema = {"ui:widget": "range"};
          const {node} = createFormComponent({schema, uiSchema});
          input = node.querySelector("[type=range]");

          expect(input.getAttribute("min")).eql("0");
          expect(input.getAttribute("max")).eql("0");
        });

        it("should support the multipleOf constraint", () => {
          expect(input.getAttribute("step")).eql("1");
        });
      });
    });

    describe("radio", () => {
      const schema = {
        type: "object",
        properties: {
          foo: {
            type: "number",
            enum: [3.14159, 2.718, 1.4142],
          }
        }
      };

      const uiSchema = {
        foo: {
          "ui:widget": "radio"
        }
      };

      it("should accept a uiSchema object", () => {
        const {node} = createFormComponent({schema, uiSchema});

        expect(node.querySelectorAll("[type=radio]"))
          .to.have.length.of(3);
      });

      it("should support formData", () => {
        const {node} = createFormComponent({schema, uiSchema, formData: {
          foo: 2.718
        }});

        expect(node.querySelectorAll("[type=radio]")[1].checked)
          .eql(true);
      });

      it("should update state when value is updated", () => {
        const {comp, node} = createFormComponent({schema, uiSchema, formData: {
          foo: 1.4142
        }});

        Simulate.change(node.querySelectorAll("[type=radio]")[2], {
          target: {checked: true}
        });

        expect(comp.state.formData).eql({foo: 1.4142});
      });
    });

    describe("hidden", () => {
      const uiSchema = {
        foo: {
          "ui:widget": "hidden"
        }
      };

      it("should accept a uiSchema object", () => {
        const {node} = createFormComponent({schema, uiSchema});

        expect(node.querySelectorAll("[type=hidden]"))
          .to.have.length.of(1);
      });

      it("should support formData", () => {
        const {node} = createFormComponent({schema, uiSchema, formData: {
          foo: 42
        }});

        expect(node.querySelector("[type=hidden]").value)
          .eql("42");
      });

      it("should map widget value to a typed state one", () => {
        const {comp} = createFormComponent({schema, uiSchema, formData: {
          foo: 42
        }});

        expect(comp.state.formData.foo).eql(42);
      });
    });
  });

  describe("integer", () => {
    const schema = {
      type: "object",
      properties: {
        foo: {
          type: "integer",
        }
      }
    };

    describe("updown", () => {
      const uiSchema = {
        foo: {
          "ui:widget": "updown"
        }
      };

      it("should accept a uiSchema object", () => {
        const {node} = createFormComponent({schema, uiSchema});

        expect(node.querySelectorAll("[type=number]"))
          .to.have.length.of(1);
      });

      it("should support formData", () => {
        const {node} = createFormComponent({schema, uiSchema, formData: {
          foo: 3
        }});

        expect(node.querySelector("[type=number]").value)
          .eql("3");
      });

      it("should update state when value is updated", () => {
        const {comp, node} = createFormComponent({schema, uiSchema, formData: {
          foo: 3
        }});

        Simulate.change(node.querySelector("[type=number]"), {
          target: {value: "6"}
        });

        expect(comp.state.formData).eql({foo: 6});
      });
    });

    describe("range", () => {
      const uiSchema = {
        foo: {
          "ui:widget": "range"
        }
      };

      it("should accept a uiSchema object", () => {
        const {node} = createFormComponent({schema, uiSchema});

        expect(node.querySelectorAll("[type=range]"))
          .to.have.length.of(1);
      });

      it("should support formData", () => {
        const {node} = createFormComponent({schema, uiSchema, formData: {
          foo: 3
        }});

        expect(node.querySelector("[type=range]").value)
          .eql("3");
      });

      it("should update state when value is updated", () => {
        const {comp, node} = createFormComponent({schema, uiSchema, formData: {
          foo: 3
        }});

        Simulate.change(node.querySelector("[type=range]"), {
          target: {value: "6"}
        });

        expect(comp.state.formData).eql({foo: 6});
      });
    });

    describe("radio", () => {
      const schema = {
        type: "object",
        properties: {
          foo: {
            type: "integer",
            enum: [1, 2],
          }
        }
      };

      const uiSchema = {
        foo: {
          "ui:widget": "radio"
        }
      };

      it("should accept a uiSchema object", () => {
        const {node} = createFormComponent({schema, uiSchema});

        expect(node.querySelectorAll("[type=radio]"))
          .to.have.length.of(2);
      });

      it("should support formData", () => {
        const {node} = createFormComponent({schema, uiSchema, formData: {
          foo: 2
        }});

        expect(node.querySelectorAll("[type=radio]")[1].checked)
          .eql(true);
      });

      it("should update state when value is updated", () => {
        const {comp, node} = createFormComponent({schema, uiSchema, formData: {
          foo: 1
        }});

        Simulate.change(node.querySelectorAll("[type=radio]")[1], {
          target: {checked: true}
        });

        expect(comp.state.formData).eql({foo: 2});
      });
    });

    describe("hidden", () => {
      const uiSchema = {
        foo: {
          "ui:widget": "hidden"
        }
      };

      it("should accept a uiSchema object", () => {
        const {node} = createFormComponent({schema, uiSchema});

        expect(node.querySelectorAll("[type=hidden]"))
          .to.have.length.of(1);
      });

      it("should support formData", () => {
        const {node} = createFormComponent({schema, uiSchema, formData: {
          foo: 42
        }});

        expect(node.querySelector("[type=hidden]").value)
          .eql("42");
      });

      it("should map widget value to a typed state one", () => {
        const {comp} = createFormComponent({schema, uiSchema, formData: {
          foo: 42
        }});

        expect(comp.state.formData.foo).eql(42);
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
          "ui:widget": "radio"
        }
      };

      it("should accept a uiSchema object", () => {
        const {node} = createFormComponent({schema, uiSchema});

        expect(node.querySelectorAll("[type=radio]"))
          .to.have.length.of(2);
        expect(node.querySelectorAll("[type=radio]")[0])
          .not.eql(null);
        expect(node.querySelectorAll("[type=radio]")[1])
          .not.eql(null);
      });

      it("should render boolean option labels", () => {
        const {node} = createFormComponent({schema, uiSchema});
        const labels = [].map.call(
          node.querySelectorAll(".field-radio-group label"),
          node => node.textContent);

        expect(labels)
          .eql(["yes", "no"]);
      });

      it("should support formData", () => {
        const {node} = createFormComponent({schema, uiSchema, formData: {
          foo: false
        }});

        expect(node.querySelectorAll("[type=radio]")[1].checked)
          .eql(true);
      });

      it("should update state when false is checked", () => {
        const {comp, node} = createFormComponent({schema, uiSchema, formData: {
          foo: true
        }});

        Simulate.change(node.querySelectorAll("[type=radio]")[1], {
          target: {checked: true}
        });

        expect(comp.state.formData).eql({foo: false});
      });

      it("should update state when true is checked", () => {
        const {comp, node} = createFormComponent({schema, uiSchema, formData: {
          foo: false
        }});

        Simulate.change(node.querySelectorAll("[type=radio]")[0], {
          target: {checked: true}
        });

        expect(comp.state.formData).eql({foo: true});
      });
    });

    describe("select", () => {
      const uiSchema = {
        foo: {
          "ui:widget": "select"
        }
      };

      it("should accept a uiSchema object", () => {
        const {node} = createFormComponent({schema, uiSchema});

        expect(node.querySelectorAll("select option"))
          .to.have.length.of(3);
      });

      it("should render boolean option labels", () => {
        const {node} = createFormComponent({schema, uiSchema});

        expect(node.querySelectorAll("option")[1].textContent)
          .eql("yes");
        expect(node.querySelectorAll("option")[2].textContent)
          .eql("no");
      });

      it("should update state when true is selected", () => {
        const {comp, node} = createFormComponent({schema, uiSchema, formData: {
          foo: false
        }});

        Simulate.change(node.querySelector("select"), {
          // DOM option change events always return strings
          target: {value: "true"}
        });

        expect(comp.state.formData).eql({foo: true});
      });

      it("should update state when false is selected", () => {
        const {comp, node} = createFormComponent({schema, uiSchema, formData: {
          foo: false
        }});

        Simulate.change(node.querySelector("select"), {
          // DOM option change events always return strings
          target: {value: "false"}
        });

        expect(comp.state.formData).eql({foo: false});
      });
    });

    describe("hidden", () => {
      const uiSchema = {
        foo: {
          "ui:widget": "hidden"
        }
      };

      it("should accept a uiSchema object", () => {
        const {node} = createFormComponent({schema, uiSchema});

        expect(node.querySelectorAll("[type=hidden]"))
          .to.have.length.of(1);
      });

      it("should support formData", () => {
        const {node} = createFormComponent({schema, uiSchema, formData: {
          foo: true
        }});

        expect(node.querySelector("[type=hidden]").value)
          .eql("true");
      });

      it("should map widget value to a typed state one", () => {
        const {comp} = createFormComponent({schema, uiSchema, formData: {
          foo: true
        }});

        expect(comp.state.formData.foo).eql(true);
      });
    });
  });

  describe("custom root field id", () => {
    it("should use a custom root field id for objects", () => {
      const schema = {
        type: "object",
        properties: {
          foo: {type: "string"},
          bar: {type: "string"},
        }
      };
      const uiSchema = {"ui:rootFieldId": "myform"};
      const {node} = createFormComponent({schema, uiSchema});

      const ids = [].map.call(node.querySelectorAll("input[type=text]"),
                              node => node.id);
      expect(ids).eql(["myform_foo", "myform_bar"]);
    });

    it("should use a custom root field id for arrays", () => {
      const schema = {
        type: "array",
        items: {type: "string"},
      };
      const uiSchema = {"ui:rootFieldId": "myform"};
      const {node} = createFormComponent({schema, uiSchema, formData: [
        "foo",
        "bar"
      ]});

      const ids = [].map.call(node.querySelectorAll("input[type=text]"),
                              node => node.id);
      expect(ids).eql(["myform_0", "myform_1"]);
    });

    it("should use a custom root field id for array of objects", () => {
      const schema = {
        type: "array",
        items: {
          type: "object",
          properties: {
            foo: {type: "string"},
            bar: {type: "string"},
          }
        },
      };
      const uiSchema = {"ui:rootFieldId": "myform"};
      const {node} = createFormComponent({schema, uiSchema, formData: [
        {foo: "foo1", bar: "bar1"},
        {foo: "foo2", bar: "bar2"},
      ]});

      const ids = [].map.call(node.querySelectorAll("input[type=text]"),
                              node => node.id);
      expect(ids).eql([
        "myform_0_foo",
        "myform_0_bar",
        "myform_1_foo",
        "myform_1_bar"
      ]);
    });
  });

  describe("Disabled", () => {
    describe("Fields", () => {
      describe("ArrayField", () => {
        let node;

        beforeEach(() => {
          const schema = {type: "array", items: {type: "string"}};
          const uiSchema = {"ui:disabled": true};
          const formData = ["a", "b"];

          let rendered = createFormComponent({schema, uiSchema, formData});
          node = rendered.node;
        });

        it("should disable an ArrayField", () => {
          const disabled = [].map.call(node.querySelectorAll("[type=text]"),
                                       node => node.disabled);
          expect(disabled).eql([true, true]);
        });

        it("should disable the Add button", () => {
          expect(node.querySelector(".array-item-add button").disabled)
            .eql(true);
        });

        it("should disable the Delete button", () => {
          expect(node.querySelector(".array-item-remove").disabled)
            .eql(true);
        });
      });

      describe("ObjectField", () => {
        let node;

        beforeEach(() => {
          const schema = {
            type: "object",
            properties: {
              foo: {type: "string"},
              bar: {type: "string"},
            }
          };
          const uiSchema = {"ui:disabled": true};

          let rendered = createFormComponent({schema, uiSchema});
          node = rendered.node;
        });

        it("should disable an ObjectField", () => {
          const disabled = [].map.call(node.querySelectorAll("[type=text]"),
                                       node => node.disabled);
          expect(disabled).eql([true, true]);
        });
      });
    });

    describe("Widgets", () => {
      function shouldBeDisabled(selector, schema, uiSchema) {
        const {node} = createFormComponent({schema, uiSchema});
        expect(node.querySelector(selector).disabled).eql(true);
      }

      it("should disable a text widget", () => {
        shouldBeDisabled("input[type=text]",
                         {type: "string"},
                         {"ui:disabled": true});
      });

      it("should disabled a file widget", () => {
        const {node} = createFormComponent({
          schema: {type: "string", format: "data-url"},
          uiSchema: {"ui:disabled": true}});
        expect(node.querySelector("input[type=file]").hasAttribute("disabled"))
          .eql(true);
      });

      it("should disable a textarea widget", () => {
        shouldBeDisabled("textarea",
                         {type: "string"},
                         {"ui:disabled": true, "ui:widget": "textarea"});
      });

      it("should disable a number text widget", () => {
        shouldBeDisabled("input[type=text]",
                         {type: "number"},
                         {"ui:disabled": true});
      });

      it("should disable a number widget", () => {
        shouldBeDisabled("input[type=number]",
                         {type: "number"},
                         {"ui:disabled": true, "ui:widget": "updown"});
      });

      it("should disable a range widget", () => {
        shouldBeDisabled("input[type=range]",
                         {type: "number"},
                         {"ui:disabled": true, "ui:widget": "range"});
      });

      it("should disable a select widget", () => {
        shouldBeDisabled("select",
                         {type: "string", enum: ["a", "b"]},
                         {"ui:disabled": true});
      });

      it("should disable a checkbox widget", () => {
        shouldBeDisabled("input[type=checkbox]",
                         {type: "boolean"},
                         {"ui:disabled": true});
      });

      it("should disable a radio widget", () => {
        shouldBeDisabled("input[type=radio]",
                         {type: "boolean"},
                         {"ui:disabled": true, "ui:widget": "radio"});
      });

      it("should disable a color widget", () => {
        shouldBeDisabled("input[type=color]",
                         {type: "string", format: "color"},
                         {"ui:disabled": true});
      });

      it("should disable a password widget", () => {
        shouldBeDisabled("input[type=password]",
                         {type: "string"},
                         {"ui:disabled": true, "ui:widget": "password"});
      });

      it("should disable an email widget", () => {
        shouldBeDisabled("input[type=email]",
                         {type: "string", format: "email"},
                         {"ui:disabled": true});
      });

      it("should disable a date widget", () => {
        shouldBeDisabled("input[type=date]",
                         {type: "string", format: "date"},
                         {"ui:disabled": true});
      });

      it("should disable a datetime widget", () => {
        shouldBeDisabled("input[type=datetime-local]",
                         {type: "string", format: "date-time"},
                         {"ui:disabled": true});
      });

      it("should disable an alternative date widget", () => {
        const {node} = createFormComponent({
          schema: {type: "string", format: "date"},
          uiSchema: {"ui:disabled": true, "ui:widget": "alt-date"}
        });

        const disabled = [].map.call(node.querySelectorAll("select"),
                                     node => node.disabled);
        expect(disabled).eql([true, true, true]);
      });

      it("should disable an alternative datetime widget", () => {
        const {node} = createFormComponent({
          schema: {type: "string", format: "date-time"},
          uiSchema: {"ui:disabled": true, "ui:widget": "alt-datetime"}
        });

        const disabled = [].map.call(node.querySelectorAll("select"),
                                     node => node.disabled);
        expect(disabled).eql([true, true, true, true, true, true]);
      });
    });
  });

  describe("Readonly", () => {
    describe("Fields", () => {
      describe("ArrayField", () => {
        let node;

        beforeEach(() => {
          const schema = {type: "array", items: {type: "string"}};
          const uiSchema = {"ui:readonly": true};
          const formData = ["a", "b"];

          let rendered = createFormComponent({schema, uiSchema, formData});
          node = rendered.node;
        });

        it("should mark as readonly an ArrayField", () => {
          const disabled = [].map.call(node.querySelectorAll("[type=text]"),
                                       node => node.hasAttribute("readonly"));
          expect(disabled).eql([true, true]);
        });

        it("should disable the Add button", () => {
          expect(node.querySelector(".array-item-add button").disabled)
            .eql(true);
        });

        it("should disable the Delete button", () => {
          expect(node.querySelector(".array-item-remove").disabled)
            .eql(true);
        });
      });

      describe("ObjectField", () => {
        let node;

        beforeEach(() => {
          const schema = {
            type: "object",
            properties: {
              foo: {type: "string"},
              bar: {type: "string"},
            }
          };
          const uiSchema = {"ui:readonly": true};

          let rendered = createFormComponent({schema, uiSchema});
          node = rendered.node;
        });

        it("should mark as readonly an ObjectField", () => {
          const disabled = [].map.call(node.querySelectorAll("[type=text]"),
                                       node => node.hasAttribute("readonly"));
          expect(disabled).eql([true, true]);
        });
      });
    });

    describe("Widgets", () => {
      function shouldBeReadonly(selector, schema, uiSchema) {
        const {node} = createFormComponent({schema, uiSchema});
        expect(node.querySelector(selector).hasAttribute("readonly"))
          .eql(true);
      }

      it("should mark as readonly a text widget", () => {
        shouldBeReadonly("input[type=text]",
                         {type: "string"},
                         {"ui:readonly": true});
      });

      it("should mark as readonly a file widget", () => {
        // We mark a file widget as readonly by disabling it.
        const {node} = createFormComponent({
          schema: {type: "string", format: "data-url"},
          uiSchema: {"ui:readonly": true}});
        expect(node.querySelector("input[type=file]").hasAttribute("disabled"))
          .eql(true);
      });

      it("should mark as readonly a textarea widget", () => {
        shouldBeReadonly("textarea",
                         {type: "string"},
                         {"ui:readonly": true, "ui:widget": "textarea"});
      });

      it("should mark as readonly a number text widget", () => {
        shouldBeReadonly("input[type=text]",
                         {type: "number"},
                         {"ui:readonly": true});
      });

      it("should mark as readonly a number widget", () => {
        shouldBeReadonly("input[type=number]",
                         {type: "number"},
                         {"ui:readonly": true, "ui:widget": "updown"});
      });

      it("should mark as readonly a range widget", () => {
        shouldBeReadonly("input[type=range]",
                         {type: "number"},
                         {"ui:readonly": true, "ui:widget": "range"});
      });

      it("should mark as readonly a select widget", () => {
        shouldBeReadonly("select",
                         {type: "string", enum: ["a", "b"]},
                         {"ui:readonly": true});
      });

      it("should mark as readonly a color widget", () => {
        shouldBeReadonly("input[type=color]",
                         {type: "string", format: "color"},
                         {"ui:readonly": true});
      });

      it("should mark as readonly a password widget", () => {
        shouldBeReadonly("input[type=password]",
                         {type: "string"},
                         {"ui:readonly": true, "ui:widget": "password"});
      });

      it("should mark as readonly a url widget", () => {
        shouldBeReadonly("input[type=url]",
                         {type: "string", format: "uri"},
                         {"ui:readonly": true});
      });

      it("should mark as readonly an email widget", () => {
        shouldBeReadonly("input[type=email]",
                         {type: "string", format: "email"},
                         {"ui:readonly": true});
      });

      it("should mark as readonly a date widget", () => {
        shouldBeReadonly("input[type=date]",
                         {type: "string", format: "date"},
                         {"ui:readonly": true});
      });

      it("should mark as readonly a datetime widget", () => {
        shouldBeReadonly("input[type=datetime-local]",
                         {type: "string", format: "date-time"},
                         {"ui:readonly": true});
      });

      it("should mark as readonly an alternative date widget", () => {
        const {node} = createFormComponent({
          schema: {type: "string", format: "date"},
          uiSchema: {"ui:readonly": true, "ui:widget": "alt-date"}
        });

        const readonly = [].map.call(node.querySelectorAll("select"),
                                     node => node.hasAttribute("readonly"));
        expect(readonly).eql([true, true, true]);
      });

      it("should mark as readonly an alternative datetime widget", () => {
        const {node} = createFormComponent({
          schema: {type: "string", format: "date-time"},
          uiSchema: {"ui:readonly": true, "ui:widget": "alt-datetime"}
        });

        const readonly = [].map.call(node.querySelectorAll("select"),
                                     node => node.hasAttribute("readonly"));
        expect(readonly).eql([true, true, true, true, true, true]);
      });
    });
  });
});
