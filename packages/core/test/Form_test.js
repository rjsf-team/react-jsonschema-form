import { expect } from "chai";
import sinon from "sinon";
import React from "react";
import { renderIntoDocument, Simulate } from "react-dom/test-utils";
import { render, findDOMNode } from "react-dom";
import { Portal } from "react-portal";
import { createRef } from "create-react-ref";

import Form from "../src";
import {
  createComponent,
  createFormComponent,
  createSandbox,
  setProps,
  describeRepeated,
  submitForm,
} from "./test_utils";

describeRepeated("Form common", createFormComponent => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("Empty schema", () => {
    it("should render a form tag", () => {
      const { node } = createFormComponent({ schema: {} });

      expect(node.tagName).eql("FORM");
    });

    it("should render a submit button", () => {
      const { node } = createFormComponent({ schema: {} });

      expect(node.querySelectorAll("button[type=submit]")).to.have.length.of(1);
    });

    it("should render children buttons", () => {
      const props = { schema: {} };
      const comp = renderIntoDocument(
        <Form {...props}>
          <button type="submit">Submit</button>
          <button type="submit">Another submit</button>
        </Form>
      );
      const node = findDOMNode(comp);
      expect(node.querySelectorAll("button[type=submit]")).to.have.length.of(2);
    });

    it("should render errors if schema isn't object", () => {
      const props = {
        schema: {
          type: "object",
          title: "object",
          properties: {
            firstName: "some mame",
            address: {
              $ref: "#/definitions/address",
            },
          },
          definitions: {
            address: {
              street: "some street",
            },
          },
        },
      };
      const comp = renderIntoDocument(
        <Form {...props}>
          <button type="submit">Submit</button>
        </Form>
      );
      const node = findDOMNode(comp);
      expect(node.querySelector(".unsupported-field").textContent).to.contain(
        "Unknown field type undefined"
      );
    });
  });

  describe("on component creation", () => {
    let onChangeProp;
    let formData;
    let schema;

    function createComponent() {
      renderIntoDocument(
        <Form schema={schema} onChange={onChangeProp} formData={formData}>
          <button type="submit">Submit</button>
          <button type="submit">Another submit</button>
        </Form>
      );
    }

    beforeEach(() => {
      onChangeProp = sinon.spy();
      schema = {
        type: "object",
        title: "root object",
        required: ["count"],
        properties: {
          count: {
            type: "number",
            default: 789,
          },
        },
      };
    });

    describe("when props.formData does not equal the default values", () => {
      beforeEach(() => {
        formData = {
          foo: 123,
        };
        createComponent();
      });

      it("should call props.onChange with current state", () => {
        sinon.assert.calledOnce(onChangeProp);
        sinon.assert.calledWith(onChangeProp, {
          formData: { ...formData, count: 789 },
          schema,
          errorSchema: {},
          errors: [],
          edit: true,
          uiSchema: {},
          idSchema: { $id: "root", count: { $id: "root_count" } },
          additionalMetaSchemas: undefined,
        });
      });
    });

    describe("when props.formData equals the default values", () => {
      beforeEach(() => {
        formData = {
          count: 789,
        };
        createComponent();
      });

      it("should not call props.onChange", () => {
        sinon.assert.notCalled(onChangeProp);
      });
    });
  });

  describe("Option idPrefix", function() {
    it("should change the rendered ids", function() {
      const schema = {
        type: "object",
        title: "root object",
        required: ["foo"],
        properties: {
          count: {
            type: "number",
          },
        },
      };
      const comp = renderIntoDocument(<Form schema={schema} idPrefix="rjsf" />);
      const node = findDOMNode(comp);
      const inputs = node.querySelectorAll("input");
      const ids = [];
      for (var i = 0, len = inputs.length; i < len; i++) {
        const input = inputs[i];
        ids.push(input.getAttribute("id"));
      }
      expect(ids).to.eql(["rjsf_count"]);
      expect(node.querySelector("fieldset").id).to.eql("rjsf");
    });
  });

  describe("Changing idPrefix", function() {
    it("should work with simple example", function() {
      const schema = {
        type: "object",
        title: "root object",
        required: ["foo"],
        properties: {
          count: {
            type: "number",
          },
        },
      };
      const comp = renderIntoDocument(<Form schema={schema} idPrefix="rjsf" />);
      const node = findDOMNode(comp);
      const inputs = node.querySelectorAll("input");
      const ids = [];
      for (var i = 0, len = inputs.length; i < len; i++) {
        const input = inputs[i];
        ids.push(input.getAttribute("id"));
      }
      expect(ids).to.eql(["rjsf_count"]);
      expect(node.querySelector("fieldset").id).to.eql("rjsf");
    });

    it("should work with oneOf", function() {
      const schema = {
        $schema: "http://json-schema.org/draft-06/schema#",
        type: "object",
        properties: {
          connector: {
            type: "string",
            enum: ["aws", "gcp"],
            title: "Provider",
            default: "aws",
          },
        },
        dependencies: {
          connector: {
            oneOf: [
              {
                type: "object",
                properties: {
                  connector: {
                    type: "string",
                    enum: ["aws"],
                  },
                  key_aws: {
                    type: "string",
                  },
                },
              },
              {
                type: "object",
                properties: {
                  connector: {
                    type: "string",
                    enum: ["gcp"],
                  },
                  key_gcp: {
                    type: "string",
                  },
                },
              },
            ],
          },
        },
      };

      const comp = renderIntoDocument(<Form schema={schema} idPrefix="rjsf" />);
      const node = findDOMNode(comp);
      const inputs = node.querySelectorAll("input");
      const ids = [];
      for (var i = 0, len = inputs.length; i < len; i++) {
        const input = inputs[i];
        ids.push(input.getAttribute("id"));
      }
      expect(ids).to.eql(["rjsf_key_aws"]);
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
        },
      },
    };

    const uiSchema = {
      foo: {
        "ui:help": "this is help",
      },
    };

    const formData = { foo: "invalid" };

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
          <label htmlFor={id}>
            {label}
            {required ? "*" : null}
          </label>
          {description}
          {children}
          {errors}
          {help}
          <span className="raw-help">
            {`${rawHelp} rendered from the raw format`}
          </span>
          <span className="raw-description">
            {`${rawDescription} rendered from the raw format`}
          </span>
          {rawErrors ? (
            <ul>
              {rawErrors.map((error, i) => (
                <li key={i} className="raw-error">
                  {error}
                </li>
              ))}
            </ul>
          ) : null}
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
      expect(node.querySelector(".my-template > label").textContent).eql(
        "root object"
      );
      expect(
        node.querySelector(".my-template .field-string > label").textContent
      ).eql("foo*");
    });

    it("should pass description as the provided React element", () => {
      expect(node.querySelector("#root_foo__description").textContent).eql(
        "this is description"
      );
    });

    it("should pass rawDescription as a string", () => {
      expect(node.querySelector(".raw-description").textContent).eql(
        "this is description rendered from the raw format"
      );
    });

    it("should pass errors as the provided React component", () => {
      expect(node.querySelectorAll(".error-detail li")).to.have.length.of(1);
    });

    it("should pass rawErrors as an array of strings", () => {
      expect(node.querySelectorAll(".raw-error")).to.have.length.of(1);
    });

    it("should pass help as a the provided React element", () => {
      expect(node.querySelector(".help-block").textContent).eql("this is help");
    });

    it("should pass rawHelp as a string", () => {
      expect(node.querySelector(".raw-help").textContent).eql(
        "this is help rendered from the raw format"
      );
    });
  });

  describe("Custom submit buttons", () => {
    // Submit events on buttons are not fired on disconnected forms
    // So we need to add the DOM tree to the body in this case.
    // See: https://github.com/jsdom/jsdom/pull/1865
    // https://developer.mozilla.org/en-US/docs/Web/API/Node/isConnected
    const domNode = document.createElement("div");
    beforeEach(() => {
      document.body.appendChild(domNode);
    });
    afterEach(() => {
      document.body.removeChild(domNode);
    });
    it("should submit the form when clicked", done => {
      let submitCount = 0;
      const onSubmit = () => {
        submitCount++;
        if (submitCount === 2) {
          done();
        }
      };

      const comp = render(
        <Form onSubmit={onSubmit} schema={{}}>
          <button type="submit" value="Submit button" />
          <button type="submit" value="Another submit button" />
        </Form>,
        domNode
      );
      const node = findDOMNode(comp);
      const buttons = node.querySelectorAll("button[type=submit]");
      buttons[0].click();
      buttons[1].click();
    });
  });

  describe("Schema definitions", () => {
    it("should use a single schema definition reference", () => {
      const schema = {
        definitions: {
          testdef: { type: "string" },
        },
        $ref: "#/definitions/testdef",
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll("input[type=text]")).to.have.length.of(1);
    });

    it("should handle multiple schema definition references", () => {
      const schema = {
        definitions: {
          testdef: { type: "string" },
        },
        type: "object",
        properties: {
          foo: { $ref: "#/definitions/testdef" },
          bar: { $ref: "#/definitions/testdef" },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll("input[type=text]")).to.have.length.of(2);
    });

    it("should handle deeply referenced schema definitions", () => {
      const schema = {
        definitions: {
          testdef: { type: "string" },
        },
        type: "object",
        properties: {
          foo: {
            type: "object",
            properties: {
              bar: { $ref: "#/definitions/testdef" },
            },
          },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll("input[type=text]")).to.have.length.of(1);
    });

    it("should handle references to deep schema definitions", () => {
      const schema = {
        definitions: {
          testdef: {
            type: "object",
            properties: {
              bar: { type: "string" },
            },
          },
        },
        type: "object",
        properties: {
          foo: { $ref: "#/definitions/testdef/properties/bar" },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll("input[type=text]")).to.have.length.of(1);
    });

    it("should handle referenced definitions for array items", () => {
      const schema = {
        definitions: {
          testdef: { type: "string" },
        },
        type: "object",
        properties: {
          foo: {
            type: "array",
            items: { $ref: "#/definitions/testdef" },
          },
        },
      };

      const { node } = createFormComponent({
        schema,
        formData: {
          foo: ["blah"],
        },
      });

      expect(node.querySelectorAll("input[type=text]")).to.have.length.of(1);
    });

    it("should raise for non-existent definitions referenced", () => {
      const schema = {
        type: "object",
        properties: {
          foo: { $ref: "#/definitions/nonexistent" },
        },
      };

      expect(() => createFormComponent({ schema })).to.Throw(
        Error,
        /#\/definitions\/nonexistent/
      );
    });

    it("should propagate referenced definition defaults", () => {
      const schema = {
        definitions: {
          testdef: { type: "string", default: "hello" },
        },
        $ref: "#/definitions/testdef",
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelector("input[type=text]").value).eql("hello");
    });

    it("should propagate nested referenced definition defaults", () => {
      const schema = {
        definitions: {
          testdef: { type: "string", default: "hello" },
        },
        type: "object",
        properties: {
          foo: { $ref: "#/definitions/testdef" },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelector("input[type=text]").value).eql("hello");
    });

    it("should propagate referenced definition defaults for array items", () => {
      const schema = {
        definitions: {
          testdef: { type: "string", default: "hello" },
        },
        type: "array",
        items: {
          $ref: "#/definitions/testdef",
        },
      };

      const { node } = createFormComponent({ schema });

      Simulate.click(node.querySelector(".array-item-add button"));

      expect(node.querySelector("input[type=text]").value).eql("hello");
    });

    it("should propagate referenced definition defaults in objects with additionalProperties", () => {
      const schema = {
        definitions: {
          testdef: { type: "string" },
        },
        type: "object",
        additionalProperties: {
          $ref: "#/definitions/testdef",
        },
      };

      const { node } = createFormComponent({ schema });

      Simulate.click(node.querySelector(".btn-add"));

      expect(node.querySelector("input[type=text]").value).eql("newKey");
    });

    it("should propagate referenced definition defaults in objects with additionalProperties that have a type present", () => {
      // Though `additionalProperties` has a `type` present here, it also has a `$ref` so that
      // referenced schema should override it.
      const schema = {
        definitions: {
          testdef: { type: "number" },
        },
        type: "object",
        additionalProperties: {
          type: "string",
          $ref: "#/definitions/testdef",
        },
      };

      const { node } = createFormComponent({ schema });

      Simulate.click(node.querySelector(".btn-add"));

      expect(node.querySelector("input[type=number]").value).eql("0");
    });

    it("should recursively handle referenced definitions", () => {
      const schema = {
        $ref: "#/definitions/node",
        definitions: {
          node: {
            type: "object",
            properties: {
              name: { type: "string" },
              children: {
                type: "array",
                items: {
                  $ref: "#/definitions/node",
                },
              },
            },
          },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelector("#root_children_0_name")).to.not.exist;

      Simulate.click(node.querySelector(".array-item-add button"));

      expect(node.querySelector("#root_children_0_name")).to.exist;
    });

    it("should follow recursive references", () => {
      const schema = {
        definitions: {
          bar: { $ref: "#/definitions/qux" },
          qux: { type: "string" },
        },
        type: "object",
        required: ["foo"],
        properties: {
          foo: { $ref: "#/definitions/bar" },
        },
      };
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll("input[type=text]")).to.have.length.of(1);
    });

    it("should follow multiple recursive references", () => {
      const schema = {
        definitions: {
          bar: { $ref: "#/definitions/bar2" },
          bar2: { $ref: "#/definitions/qux" },
          qux: { type: "string" },
        },
        type: "object",
        required: ["foo"],
        properties: {
          foo: { $ref: "#/definitions/bar" },
        },
      };
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll("input[type=text]")).to.have.length.of(1);
    });

    it("should priorize definition over schema type property", () => {
      // Refs bug #140
      const schema = {
        type: "object",
        properties: {
          name: { type: "string" },
          childObj: {
            type: "object",
            $ref: "#/definitions/childObj",
          },
        },
        definitions: {
          childObj: {
            type: "object",
            properties: {
              otherName: { type: "string" },
            },
          },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll("input[type=text]")).to.have.length.of(2);
    });

    it("should priorize local properties over definition ones", () => {
      // Refs bug #140
      const schema = {
        type: "object",
        properties: {
          foo: {
            title: "custom title",
            $ref: "#/definitions/objectDef",
          },
        },
        definitions: {
          objectDef: {
            type: "object",
            title: "definition title",
            properties: {
              field: { type: "string" },
            },
          },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelector("legend").textContent).eql("custom title");
    });

    it("should propagate and handle a resolved schema definition", () => {
      const schema = {
        definitions: {
          enumDef: { type: "string", enum: ["a", "b"] },
        },
        type: "object",
        properties: {
          name: { $ref: "#/definitions/enumDef" },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll("option")).to.have.length.of(3);
    });
  });

  describe("Default value handling on clear", () => {
    const schema = {
      type: "string",
      default: "foo",
    };

    it("should not set default when a text field is cleared", () => {
      const { node } = createFormComponent({ schema, formData: "bar" });

      Simulate.change(node.querySelector("input"), {
        target: { value: "" },
      });

      expect(node.querySelector("input").value).eql("");
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
                    default: true,
                  },
                },
              },
            },
          },
        },
      },
    };

    it("should propagate deeply nested defaults to submit handler", () => {
      const { node, onSubmit } = createFormComponent({ schema });

      Simulate.click(node.querySelector(".array-item-add button"));
      Simulate.submit(node);

      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        formData: {
          object: {
            array: [
              {
                bool: true,
              },
            ],
          },
        },
      });
    });
  });

  describe("Submit handler", () => {
    it("should call provided submit handler with form state", () => {
      const schema = {
        type: "object",
        properties: {
          foo: { type: "string" },
        },
      };
      const formData = {
        foo: "bar",
      };
      const onSubmit = sandbox.spy();
      const event = { type: "submit" };
      const { node } = createFormComponent({
        schema,
        formData,
        onSubmit,
      });

      Simulate.submit(node, event);
      sinon.assert.calledWithMatch(onSubmit, { formData, schema }, event);
    });

    it("should not call provided submit handler on validation errors", () => {
      const schema = {
        type: "object",
        properties: {
          foo: {
            type: "string",
            minLength: 1,
          },
        },
      };
      const formData = {
        foo: "",
      };
      const onSubmit = sandbox.spy();
      const onError = sandbox.spy();
      const { node } = createFormComponent({
        schema,
        formData,
        onSubmit,
        onError,
      });

      Simulate.submit(node);

      sinon.assert.notCalled(onSubmit);
    });
  });

  describe("Change handler", () => {
    it("should call provided change handler on form state change with schema and uiSchema", () => {
      const schema = {
        type: "object",
        properties: {
          foo: {
            type: "string",
          },
        },
      };
      const uiSchema = {
        foo: { "ui:field": "textarea" },
      };

      const formData = {
        foo: "",
      };
      const onChange = sandbox.spy();
      const { node } = createFormComponent({
        schema,
        uiSchema,
        formData,
        onChange,
      });

      Simulate.change(node.querySelector("[type=text]"), {
        target: { value: "new" },
      });

      sinon.assert.calledWithMatch(onChange, {
        formData: {
          foo: "new",
        },
        schema,
        uiSchema,
      });
    });
  });
  describe("Blur handler", () => {
    it("should call provided blur handler on form input blur event", () => {
      const schema = {
        type: "object",
        properties: {
          foo: {
            type: "string",
          },
        },
      };
      const formData = {
        foo: "",
      };
      const onBlur = sandbox.spy();
      const { node } = createFormComponent({ schema, formData, onBlur });

      const input = node.querySelector("[type=text]");
      Simulate.blur(input, {
        target: { value: "new" },
      });

      sinon.assert.calledWithMatch(onBlur, input.id, "new");
    });
  });

  describe("Focus handler", () => {
    it("should call provided focus handler on form input focus event", () => {
      const schema = {
        type: "object",
        properties: {
          foo: {
            type: "string",
          },
        },
      };
      const formData = {
        foo: "",
      };
      const onFocus = sandbox.spy();
      const { node } = createFormComponent({ schema, formData, onFocus });

      const input = node.querySelector("[type=text]");
      Simulate.focus(input, {
        target: { value: "new" },
      });

      sinon.assert.calledWithMatch(onFocus, input.id, "new");
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
        },
      };
      const formData = {
        foo: "",
      };
      const onError = sandbox.spy();
      const { node } = createFormComponent({ schema, formData, onError });

      Simulate.submit(node);

      sinon.assert.calledOnce(onError);
    });
  });

  describe("Schema and external formData updates", () => {
    let comp;
    let onChangeProp;
    let formProps;

    beforeEach(() => {
      onChangeProp = sinon.spy();
      formProps = {
        schema: {
          type: "string",
          default: "foobar",
        },
        formData: "some value",
        onChange: onChangeProp,
      };
      comp = createFormComponent(formProps).comp;
    });

    describe("when the form data is set to null", () => {
      beforeEach(() =>
        setProps(comp, {
          ...formProps,
          formData: null,
        })
      );

      it("should call onChange", () => {
        sinon.assert.calledOnce(onChangeProp);
        sinon.assert.calledWith(onChangeProp, {
          additionalMetaSchemas: undefined,
          edit: true,
          errorSchema: {},
          errors: [],
          formData: "foobar",
          idSchema: { $id: "root" },
          schema: formProps.schema,
          uiSchema: {},
        });
      });
    });

    describe("when the schema default is changed but formData is not changed", () => {
      const newSchema = {
        type: "string",
        default: "the new default",
      };

      beforeEach(() =>
        setProps(comp, {
          ...formProps,
          schema: newSchema,
          formData: "some value",
        })
      );

      it("should not call onChange", () => {
        sinon.assert.notCalled(onChangeProp);
      });
    });

    describe("when the schema default is changed and formData is changed", () => {
      const newSchema = {
        type: "string",
        default: "the new default",
      };

      beforeEach(() =>
        setProps(comp, {
          ...formProps,
          schema: newSchema,
          formData: "something else",
        })
      );

      it("should not call onChange", () => {
        sinon.assert.notCalled(onChangeProp);
      });
    });

    describe("when the schema default is changed and formData is nulled", () => {
      const newSchema = {
        type: "string",
        default: "the new default",
      };

      beforeEach(() =>
        setProps(comp, {
          ...formProps,
          schema: newSchema,
          formData: null,
        })
      );

      it("should call onChange", () => {
        sinon.assert.calledOnce(onChangeProp);
        sinon.assert.calledWithMatch(onChangeProp, {
          schema: newSchema,
          formData: "the new default",
        });
      });
    });

    describe("when the onChange prop sets formData to a falsey value", () => {
      class TestForm extends React.Component {
        constructor() {
          super();

          this.state = {
            formData: {},
          };
        }

        onChange = () => {
          this.setState({ formData: this.props.falseyValue });
        };

        render() {
          const schema = {
            type: "object",
            properties: {
              value: {
                type: "string",
              },
            },
          };
          return (
            <Form
              onChange={this.onChange}
              schema={schema}
              formData={this.state.formData}
            />
          );
        }
      }

      const falseyValues = [0, false, null, undefined, NaN];

      falseyValues.forEach(falseyValue => {
        it("Should not crash due to 'Maximum call stack size exceeded...'", () => {
          // It is expected that this will throw an error due to non-matching propTypes,
          // so the error message needs to be inspected
          try {
            createComponent(TestForm, { falseyValue });
          } catch (e) {
            expect(e.message).to.not.equal("Maximum call stack size exceeded");
          }
        });
      });
    });
  });

  describe("External formData updates", () => {
    describe("root level", () => {
      const formProps = {
        schema: { type: "string" },
        liveValidate: true,
      };

      it("should call submit handler with new formData prop value", () => {
        const { comp, node, onSubmit } = createFormComponent(formProps);

        setProps(comp, {
          ...formProps,
          onSubmit,
          formData: "yo",
        });
        submitForm(node);
        sinon.assert.calledWithMatch(onSubmit.lastCall, {
          formData: "yo",
        });
      });

      it("should validate formData when the schema is updated", () => {
        const { comp, node, onError } = createFormComponent(formProps);

        setProps(comp, {
          ...formProps,
          onError,
          formData: "yo",
          schema: { type: "number" },
        });
        submitForm(node);
        sinon.assert.calledWithMatch(onError.lastCall, [
          {
            message: "should be number",
            name: "type",
            params: { type: "number" },
            property: "",
            schemaPath: "#/type",
            stack: "should be number",
          },
        ]);
      });
    });

    describe("object level", () => {
      it("should call submit handler with new formData prop value", () => {
        const formProps = {
          schema: { type: "object", properties: { foo: { type: "string" } } },
        };
        const { comp, onSubmit, node } = createFormComponent(formProps);

        setProps(comp, {
          ...formProps,
          onSubmit,
          formData: { foo: "yo" },
        });

        submitForm(node);
        sinon.assert.calledWithMatch(onSubmit.lastCall, {
          formData: { foo: "yo" },
        });
      });
    });

    describe("array level", () => {
      it("should call submit handler with new formData prop value", () => {
        const schema = {
          type: "array",
          items: {
            type: "string",
          },
        };
        const { comp, node, onSubmit } = createFormComponent({ schema });

        setProps(comp, { schema, onSubmit, formData: ["yo"] });

        submitForm(node);
        sinon.assert.calledWithMatch(onSubmit.lastCall, {
          formData: ["yo"],
        });
      });
    });
  });

  describe("Internal formData updates", () => {
    it("root", () => {
      const formProps = {
        schema: { type: "string" },
        liveValidate: true,
      };
      const { node, onChange } = createFormComponent(formProps);

      Simulate.change(node.querySelector("input[type=text]"), {
        target: { value: "yo" },
      });

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: "yo",
      });
    });
    it("object", () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: "object",
          properties: {
            foo: {
              type: "string",
            },
          },
        },
      });

      Simulate.change(node.querySelector("input[type=text]"), {
        target: { value: "yo" },
      });

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: { foo: "yo" },
      });
    });
    it("array of strings", () => {
      const schema = {
        type: "array",
        items: {
          type: "string",
        },
      };
      const { node, onChange } = createFormComponent({ schema });

      Simulate.click(node.querySelector(".array-item-add button"));

      Simulate.change(node.querySelector("input[type=text]"), {
        target: { value: "yo" },
      });
      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: ["yo"],
      });
    });
    it("array of objects", () => {
      const schema = {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
          },
        },
      };
      const { node, onChange } = createFormComponent({ schema });

      Simulate.click(node.querySelector(".array-item-add button"));

      Simulate.change(node.querySelector("input[type=text]"), {
        target: { value: "yo" },
      });

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: [{ name: "yo" }],
      });
    });
    it("dependency with array of objects", () => {
      const schema = {
        definitions: {},
        type: "object",
        properties: {
          show: {
            type: "boolean",
          },
        },
        dependencies: {
          show: {
            oneOf: [
              {
                properties: {
                  show: {
                    const: true,
                  },
                  participants: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: {
                          type: "string",
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      };
      const { node, onChange } = createFormComponent({ schema });

      Simulate.change(node.querySelector("[type=checkbox]"), {
        target: { checked: true },
      });

      Simulate.click(node.querySelector(".array-item-add button"));

      Simulate.change(node.querySelector("input[type=text]"), {
        target: { value: "yo" },
      });

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: {
          show: true,
          participants: [{ name: "yo" }],
        },
      });
    });
  });

  describe("Error contextualization", () => {
    describe("on form state updated", () => {
      const schema = {
        type: "string",
        minLength: 8,
      };

      describe("Lazy validation", () => {
        it("should not update the errorSchema when the formData changes", () => {
          const { node, onChange } = createFormComponent({ schema });

          Simulate.change(node.querySelector("input[type=text]"), {
            target: { value: "short" },
          });
          sinon.assert.calledWithMatch(onChange.lastCall, {
            errorSchema: {},
          });
        });

        it("should not denote an error in the field", () => {
          const { node } = createFormComponent({ schema });

          Simulate.change(node.querySelector("input[type=text]"), {
            target: { value: "short" },
          });

          expect(node.querySelectorAll(".field-error")).to.have.length.of(0);
        });

        it("should clean contextualized errors up when they're fixed", () => {
          const altSchema = {
            type: "object",
            properties: {
              field1: { type: "string", minLength: 8 },
              field2: { type: "string", minLength: 8 },
            },
          };
          const { node } = createFormComponent({
            schema: altSchema,
            formData: {
              field1: "short",
              field2: "short",
            },
          });

          Simulate.submit(node);

          // Fix the first field
          Simulate.change(node.querySelectorAll("input[type=text]")[0], {
            target: { value: "fixed error" },
          });
          Simulate.submit(node);

          expect(node.querySelectorAll(".field-error")).to.have.length.of(1);

          // Fix the second field
          Simulate.change(node.querySelectorAll("input[type=text]")[1], {
            target: { value: "fixed error too" },
          });
          Simulate.submit(node);

          // No error remaining, shouldn't throw.
          Simulate.submit(node);

          expect(node.querySelectorAll(".field-error")).to.have.length.of(0);
        });
      });

      describe("Live validation", () => {
        it("should update the errorSchema when the formData changes", () => {
          const { node, onChange } = createFormComponent({
            schema,
            liveValidate: true,
          });

          Simulate.change(node.querySelector("input[type=text]"), {
            target: { value: "short" },
          });

          sinon.assert.calledWithMatch(onChange.lastCall, {
            errorSchema: {
              __errors: ["should NOT be shorter than 8 characters"],
            },
          });
        });

        it("should denote the new error in the field", () => {
          const { node } = createFormComponent({
            schema,
            liveValidate: true,
          });

          Simulate.change(node.querySelector("input[type=text]"), {
            target: { value: "short" },
          });

          expect(node.querySelectorAll(".field-error")).to.have.length.of(1);
          expect(
            node.querySelector(".field-string .error-detail").textContent
          ).eql("should NOT be shorter than 8 characters");
        });
      });

      describe("Disable validation onChange event", () => {
        it("should not update errorSchema when the formData changes", () => {
          const { node, onChange } = createFormComponent({
            schema,
            noValidate: true,
            liveValidate: true,
          });

          Simulate.change(node.querySelector("input[type=text]"), {
            target: { value: "short" },
          });

          sinon.assert.calledWithMatch(onChange.lastCall, {
            errorSchema: {},
          });
        });
      });

      describe("Disable validation onSubmit event", () => {
        it("should not update errorSchema when the formData changes", () => {
          const { node, onSubmit } = createFormComponent({
            schema,
            noValidate: true,
          });

          Simulate.change(node.querySelector("input[type=text]"), {
            target: { value: "short" },
          });
          Simulate.submit(node);

          sinon.assert.calledWithMatch(onSubmit.lastCall, {
            errorSchema: {},
          });
        });
      });
    });

    describe("on form submitted", () => {
      const schema = {
        type: "string",
        minLength: 8,
      };

      it("should call the onError handler", () => {
        const onError = sandbox.spy();
        const { node } = createFormComponent({ schema, onError });

        Simulate.change(node.querySelector("input[type=text]"), {
          target: { value: "short" },
        });
        Simulate.submit(node);

        sinon.assert.calledWithMatch(
          onError,
          sinon.match(value => {
            return (
              value.length === 1 &&
              value[0].message === "should NOT be shorter than 8 characters"
            );
          })
        );
      });

      it("should reset errors and errorSchema state to initial state after correction and resubmission", () => {
        const { node, onError, onSubmit } = createFormComponent({
          schema,
        });

        Simulate.change(node.querySelector("input[type=text]"), {
          target: { value: "short" },
        });
        Simulate.submit(node);

        sinon.assert.calledWithMatch(onError.lastCall, [
          {
            message: "should NOT be shorter than 8 characters",
            name: "minLength",
            params: { limit: 8 },
            property: "",
            schemaPath: "#/minLength",
            stack: "should NOT be shorter than 8 characters",
          },
        ]);
        sinon.assert.calledOnce(onError);
        sinon.resetHistory(onError);

        Simulate.change(node.querySelector("input[type=text]"), {
          target: { value: "long enough" },
        });
        Simulate.submit(node);
        sinon.assert.notCalled(onError);
        sinon.assert.calledWithMatch(onSubmit.lastCall, {
          errors: [],
          errorSchema: {},
          schemaValidationErrors: [],
          schemaValidationErrorSchema: {},
        });
      });

      it("should reset errors from UI after correction and resubmission", () => {
        const { node } = createFormComponent({
          schema,
        });

        Simulate.change(node.querySelector("input[type=text]"), {
          target: { value: "short" },
        });
        Simulate.submit(node);

        const errorListHTML =
          '<li class="text-danger">should NOT be shorter than 8 characters</li>';
        const errors = node.querySelectorAll(".error-detail");
        // Check for errors attached to the field
        expect(errors).to.have.lengthOf(1);
        expect(errors[0]).to.have.property("innerHTML");
        expect(errors[0].innerHTML).to.be.eql(errorListHTML);

        Simulate.change(node.querySelector("input[type=text]"), {
          target: { value: "long enough" },
        });
        Simulate.submit(node);
        expect(node.querySelectorAll(".error-detail")).to.have.lengthOf(0);
      });
    });

    describe("root level", () => {
      const formProps = {
        liveValidate: true,
        schema: {
          type: "string",
          minLength: 8,
        },
        formData: "short",
      };

      it("should reflect the contextualized error in state", () => {
        const { node, onError } = createFormComponent(formProps);
        submitForm(node);
        sinon.assert.calledWithMatch(onError.lastCall, [
          {
            message: "should NOT be shorter than 8 characters",
            name: "minLength",
            params: { limit: 8 },
            property: "",
            schemaPath: "#/minLength",
            stack: "should NOT be shorter than 8 characters",
          },
        ]);
      });

      it("should denote the error in the field", () => {
        const { node } = createFormComponent(formProps);

        expect(node.querySelectorAll(".field-error")).to.have.length.of(1);
        expect(
          node.querySelector(".field-string .error-detail").textContent
        ).eql("should NOT be shorter than 8 characters");
      });
    });

    describe("root level with multiple errors", () => {
      const formProps = {
        liveValidate: true,
        schema: {
          type: "string",
          minLength: 8,
          pattern: "d+",
        },
        formData: "short",
      };

      it("should reflect the contextualized error in state", () => {
        const { node, onError } = createFormComponent(formProps);
        submitForm(node);
        sinon.assert.calledWithMatch(onError.lastCall, [
          {
            message: "should NOT be shorter than 8 characters",
            name: "minLength",
            params: { limit: 8 },
            property: "",
            schemaPath: "#/minLength",
            stack: "should NOT be shorter than 8 characters",
          },
          {
            message: 'should match pattern "d+"',
            name: "pattern",
            params: { pattern: "d+" },
            property: "",
            schemaPath: "#/pattern",
            stack: 'should match pattern "d+"',
          },
        ]);
      });

      it("should denote the error in the field", () => {
        const { node } = createFormComponent(formProps);

        const liNodes = node.querySelectorAll(".field-string .error-detail li");
        const errors = [].map.call(liNodes, li => li.textContent);

        expect(errors).eql([
          "should NOT be shorter than 8 characters",
          'should match pattern "d+"',
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
                minLength: 8,
              },
            },
          },
        },
      };

      const formProps = {
        schema,
        liveValidate: true,
        formData: {
          level1: {
            level2: "short",
          },
        },
      };

      it("should reflect the contextualized error in state", () => {
        const { node, onError } = createFormComponent(formProps);

        submitForm(node);
        sinon.assert.calledWithMatch(onError.lastCall, [
          {
            message: "should NOT be shorter than 8 characters",
            name: "minLength",
            params: { limit: 8 },
            property: ".level1.level2",
            schemaPath: "#/properties/level1/properties/level2/minLength",
            stack: ".level1.level2 should NOT be shorter than 8 characters",
          },
        ]);
      });

      it("should denote the error in the field", () => {
        const { node } = createFormComponent(formProps);
        const errorDetail = node.querySelector(
          ".field-object .field-string .error-detail"
        );

        expect(node.querySelectorAll(".field-error")).to.have.length.of(1);
        expect(errorDetail.textContent).eql(
          "should NOT be shorter than 8 characters"
        );
      });
    });

    describe("array indices", () => {
      const schema = {
        type: "array",
        items: {
          type: "string",
          minLength: 4,
        },
      };

      const formProps = {
        schema,
        liveValidate: true,
        formData: ["good", "bad", "good"],
      };

      it("should contextualize the error for array indices", () => {
        const { node, onError } = createFormComponent(formProps);

        submitForm(node);
        sinon.assert.calledWithMatch(onError.lastCall, [
          {
            message: "should NOT be shorter than 4 characters",
            name: "minLength",
            params: { limit: 4 },
            property: "[1]",
            schemaPath: "#/items/minLength",
            stack: "[1] should NOT be shorter than 4 characters",
          },
        ]);
      });

      it("should denote the error in the item field in error", () => {
        const { node } = createFormComponent(formProps);
        const fieldNodes = node.querySelectorAll(".field-string");

        const liNodes = fieldNodes[1].querySelectorAll(
          ".field-string .error-detail li"
        );
        const errors = [].map.call(liNodes, li => li.textContent);

        expect(fieldNodes[1].classList.contains("field-error")).eql(true);
        expect(errors).eql(["should NOT be shorter than 4 characters"]);
      });

      it("should not denote errors on non impacted fields", () => {
        const { node } = createFormComponent(formProps);
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
              minLength: 4,
            },
          },
        },
      };

      const formProps = { schema, liveValidate: true };

      it("should contextualize the error for nested array indices", () => {
        const { node, onError } = createFormComponent({
          ...formProps,
          formData: {
            level1: ["good", "bad", "good", "bad"],
          },
        });
        submitForm(node);
        sinon.assert.calledWithMatch(onError.lastCall, [
          {
            message: "should NOT be shorter than 4 characters",
            name: "minLength",
            params: { limit: 4 },
            property: ".level1[1]",
            schemaPath: "#/properties/level1/items/minLength",
            stack: ".level1[1] should NOT be shorter than 4 characters",
          },
          {
            message: "should NOT be shorter than 4 characters",
            name: "minLength",
            params: { limit: 4 },
            property: ".level1[3]",
            schemaPath: "#/properties/level1/items/minLength",
            stack: ".level1[3] should NOT be shorter than 4 characters",
          },
        ]);
      });

      it("should denote the error in the nested item field in error", () => {
        const { node } = createFormComponent({
          ...formProps,
          formData: {
            level1: ["good", "bad", "good"],
          },
        });

        const liNodes = node.querySelectorAll(".field-string .error-detail li");
        const errors = [].map.call(liNodes, li => li.textContent);

        expect(errors).eql(["should NOT be shorter than 4 characters"]);
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
                minLength: 4,
              },
            },
          },
        },
      };

      const formData = {
        outer: [["good", "bad"], ["bad", "good"]],
      };

      const formProps = { schema, formData, liveValidate: true };

      it("should contextualize the error for nested array indices", () => {
        const { node, onError } = createFormComponent(formProps);

        submitForm(node);
        sinon.assert.calledWithMatch(onError.lastCall, [
          {
            message: "should NOT be shorter than 4 characters",
            name: "minLength",
            params: { limit: 4 },
            property: ".outer[0][1]",
            schemaPath: "#/properties/outer/items/items/minLength",
            stack: ".outer[0][1] should NOT be shorter than 4 characters",
          },
          {
            message: "should NOT be shorter than 4 characters",
            name: "minLength",
            params: { limit: 4 },
            property: ".outer[1][0]",
            schemaPath: "#/properties/outer/items/items/minLength",
            stack: ".outer[1][0] should NOT be shorter than 4 characters",
          },
        ]);
      });

      it("should denote the error in the nested item field in error", () => {
        const { node } = createFormComponent(formProps);
        const fields = node.querySelectorAll(".field-string");
        const errors = [].map.call(fields, field => {
          const li = field.querySelector(".error-detail li");
          return li && li.textContent;
        });

        expect(errors).eql([
          null,
          "should NOT be shorter than 4 characters",
          "should NOT be shorter than 4 characters",
          null,
        ]);
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
              minLength: 4,
            },
          },
        },
      };

      const formProps = {
        schema,
        liveValidate: true,
        formData: [{ foo: "good" }, { foo: "bad" }, { foo: "good" }],
      };

      it("should contextualize the error for array nested items", () => {
        const { node, onError } = createFormComponent(formProps);

        submitForm(node);
        sinon.assert.calledWithMatch(onError.lastCall, [
          {
            message: "should NOT be shorter than 4 characters",
            name: "minLength",
            params: { limit: 4 },
            property: "[1].foo",
            schemaPath: "#/items/properties/foo/minLength",
            stack: "[1].foo should NOT be shorter than 4 characters",
          },
        ]);
      });

      it("should denote the error in the array nested item", () => {
        const { node } = createFormComponent(formProps);
        const fieldNodes = node.querySelectorAll(".field-string");

        const liNodes = fieldNodes[1].querySelectorAll(
          ".field-string .error-detail li"
        );
        const errors = [].map.call(liNodes, li => li.textContent);

        expect(fieldNodes[1].classList.contains("field-error")).eql(true);
        expect(errors).eql(["should NOT be shorter than 4 characters"]);
      });
    });

    describe("schema dependencies", () => {
      const schema = {
        type: "object",
        properties: {
          branch: {
            type: "number",
            enum: [1, 2, 3],
            default: 1,
          },
        },
        required: ["branch"],
        dependencies: {
          branch: {
            oneOf: [
              {
                properties: {
                  branch: {
                    enum: [1],
                  },
                  field1: {
                    type: "number",
                  },
                },
                required: ["field1"],
              },
              {
                properties: {
                  branch: {
                    enum: [2],
                  },
                  field1: {
                    type: "number",
                  },
                  field2: {
                    type: "number",
                  },
                },
                required: ["field1", "field2"],
              },
            ],
          },
        },
      };

      it("should only show error for property in selected branch", () => {
        const { node, onChange } = createFormComponent({
          schema,
          liveValidate: true,
        });

        Simulate.change(node.querySelector("input[type=number]"), {
          target: { value: "not a number" },
        });

        sinon.assert.calledWithMatch(onChange.lastCall, {
          errorSchema: { field1: { __errors: ["should be number"] } },
        });
      });

      it("should only show errors for properties in selected branch", () => {
        const { node, onChange } = createFormComponent({
          schema,
          liveValidate: true,
          formData: { branch: 2 },
        });

        Simulate.change(node.querySelector("input[type=number]"), {
          target: { value: "not a number" },
        });

        sinon.assert.calledWithMatch(onChange.lastCall, {
          errorSchema: {
            field1: {
              __errors: ["should be number"],
            },
            field2: {
              __errors: ["is a required property"],
            },
          },
        });
      });

      it("should not show any errors when branch is empty", () => {
        const { node, onChange } = createFormComponent({
          schema,
          liveValidate: true,
          formData: { branch: 3 },
        });

        Simulate.change(node.querySelector("select"), {
          target: { value: 3 },
        });

        sinon.assert.calledWithMatch(onChange.lastCall, {
          errorSchema: {},
        });
      });
    });
  });

  describe("Schema and formData updates", () => {
    // https://github.com/rjsf-team/react-jsonschema-form/issues/231
    const schema = {
      type: "object",
      properties: {
        foo: { type: "string" },
        bar: { type: "string" },
      },
    };

    it("should replace state when props remove formData keys", () => {
      const formData = { foo: "foo", bar: "bar" };
      const { comp, node, onChange } = createFormComponent({
        schema,
        formData,
      });

      setProps(comp, {
        onChange,
        schema: {
          type: "object",
          properties: {
            bar: { type: "string" },
          },
        },
        formData: { bar: "bar" },
      });

      Simulate.change(node.querySelector("#root_bar"), {
        target: { value: "baz" },
      });

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: { bar: "baz" },
      });
    });

    it("should replace state when props change formData keys", () => {
      const formData = { foo: "foo", bar: "bar" };
      const { comp, node, onChange } = createFormComponent({
        schema,
        formData,
      });

      setProps(comp, {
        onChange,
        schema: {
          type: "object",
          properties: {
            foo: { type: "string" },
            baz: { type: "string" },
          },
        },
        formData: { foo: "foo", baz: "bar" },
      });

      Simulate.change(node.querySelector("#root_baz"), {
        target: { value: "baz" },
      });

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: { foo: "foo", baz: "baz" },
      });
    });
  });

  describe("idSchema updates based on formData", () => {
    const schema = {
      type: "object",
      properties: {
        a: { type: "string", enum: ["int", "bool"] },
      },
      dependencies: {
        a: {
          oneOf: [
            {
              properties: {
                a: { enum: ["int"] },
              },
            },
            {
              properties: {
                a: { enum: ["bool"] },
                b: { type: "boolean" },
              },
            },
          ],
        },
      },
    };

    it("should not update idSchema for a falsey value", () => {
      const formData = { a: "int" };
      const { comp, node, onSubmit } = createFormComponent({
        schema,
        formData,
      });

      setProps(comp, {
        onSubmit,
        schema: {
          type: "object",
          properties: {
            a: { type: "string", enum: ["int", "bool"] },
          },
          dependencies: {
            a: {
              oneOf: [
                {
                  properties: {
                    a: { enum: ["int"] },
                  },
                },
                {
                  properties: {
                    a: { enum: ["bool"] },
                    b: { type: "boolean" },
                  },
                },
              ],
            },
          },
        },
        formData: { a: "int" },
      });

      submitForm(node);
      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        idSchema: { $id: "root", a: { $id: "root_a" } },
      });
    });

    it("should update idSchema based on truthy value", () => {
      const formData = {
        a: "int",
      };
      const { comp, node, onSubmit } = createFormComponent({
        schema,
        formData,
      });
      setProps(comp, {
        onSubmit,
        schema: {
          type: "object",
          properties: {
            a: { type: "string", enum: ["int", "bool"] },
          },
          dependencies: {
            a: {
              oneOf: [
                {
                  properties: {
                    a: { enum: ["int"] },
                  },
                },
                {
                  properties: {
                    a: { enum: ["bool"] },
                    b: { type: "boolean" },
                  },
                },
              ],
            },
          },
        },
        formData: { a: "bool" },
      });
      submitForm(node);
      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        idSchema: {
          $id: "root",
          a: { $id: "root_a" },
          b: { $id: "root_b" },
        },
      });
    });
  });

  describe("Form disable prop", () => {
    const schema = {
      type: "object",
      properties: {
        foo: { type: "string" },
        bar: { type: "string" },
      },
    };
    const formData = { foo: "foo", bar: "bar" };

    it("should enable all items", () => {
      const { node } = createFormComponent({ schema, formData });

      expect(node.querySelectorAll("input:disabled")).to.have.length.of(0);
    });

    it("should disable all items", () => {
      const { node } = createFormComponent({
        schema,
        formData,
        disabled: true,
      });

      expect(node.querySelectorAll("input:disabled")).to.have.length.of(2);
    });
  });

  describe("Form readonly prop", () => {
    const schema = {
      type: "object",
      properties: {
        foo: { type: "string" },
        bar: { type: "object", properties: { baz: { type: "string" } } },
      },
    };
    const formData = { foo: "foo", bar: { baz: "baz" } };

    it("should not have any readonly items", () => {
      const { node } = createFormComponent({ schema, formData });

      expect(node.querySelectorAll("input:read-only")).to.have.length.of(0);
    });

    it("should readonly all items", () => {
      const { node } = createFormComponent({
        schema,
        formData,
        readonly: true,
      });

      expect(node.querySelectorAll("input:read-only")).to.have.length.of(2);
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
      autoComplete: "off",
      enctype: "multipart/form-data",
      acceptcharset: "ISO-8859-1",
      noHtml5Validate: true,
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

    it("should set attr autocomplete of form", () => {
      expect(node.getAttribute("autocomplete")).eql(formProps.autoComplete);
    });

    it("should set attr enctype of form", () => {
      expect(node.getAttribute("enctype")).eql(formProps.enctype);
    });

    it("should set attr acceptcharset of form", () => {
      expect(node.getAttribute("accept-charset")).eql(formProps.acceptcharset);
    });

    it("should set attr novalidate of form", () => {
      expect(node.getAttribute("novalidate")).not.to.be.null;
    });
  });

  describe("Deprecated autocomplete attribute", () => {
    it("should set attr autocomplete of form", () => {
      const formProps = {
        schema: {},
        autocomplete: "off",
      };
      const node = createFormComponent(formProps).node;
      expect(node.getAttribute("autocomplete")).eql(formProps.autocomplete);
    });

    it("should log deprecation warning when it is used", () => {
      sandbox.stub(console, "warn");
      createFormComponent({
        schema: {},
        autocomplete: "off",
      });
      expect(
        console.warn.calledWithMatch(
          /Using autocomplete property of Form is deprecated/
        )
      ).to.be.true;
    });

    it("should use autoComplete value if both autocomplete and autoComplete are used", () => {
      const formProps = {
        schema: {},
        autocomplete: "off",
        autoComplete: "on",
      };
      const node = createFormComponent(formProps).node;
      expect(node.getAttribute("autocomplete")).eql(formProps.autoComplete);
    });
  });

  describe("Custom format updates", () => {
    it("Should update custom formats when customFormats is changed", () => {
      const formProps = {
        liveValidate: true,
        formData: {
          areaCode: "123455",
        },
        schema: {
          type: "object",
          properties: {
            areaCode: {
              type: "string",
              format: "area-code",
            },
          },
        },
        uiSchema: {
          areaCode: {
            "ui:widget": "area-code",
          },
        },
        widgets: {
          "area-code": () => <div id="custom" />,
        },
      };

      const { comp, node, onError } = createFormComponent(formProps);

      submitForm(node);
      sinon.assert.notCalled(onError);

      setProps(comp, {
        ...formProps,
        onError,
        customFormats: {
          "area-code": /^\d{3}$/,
        },
      });

      submitForm(node);
      sinon.assert.calledWithMatch(onError.lastCall, [
        {
          message: 'should match format "area-code"',
          name: "format",
          params: { format: "area-code" },
          property: ".areaCode",
          schemaPath: "#/properties/areaCode/format",
          stack: '.areaCode should match format "area-code"',
        },
      ]);
    });
  });

  describe("Meta schema updates", () => {
    it("Should update allowed meta schemas when additionalMetaSchemas is changed", () => {
      const formProps = {
        liveValidate: true,
        schema: {
          $schema: "http://json-schema.org/draft-04/schema#",
          type: "string",
          minLength: 8,
          pattern: "d+",
        },
        formData: "short",
        additionalMetaSchemas: [],
      };

      const { comp, node, onError } = createFormComponent(formProps);
      submitForm(node);
      sinon.assert.calledWithMatch(onError.lastCall, [
        {
          stack:
            'no schema with key or ref "http://json-schema.org/draft-04/schema#"',
        },
      ]);

      setProps(comp, {
        ...formProps,
        onError,
        additionalMetaSchemas: [
          require("ajv/lib/refs/json-schema-draft-04.json"),
        ],
      });

      submitForm(node);
      sinon.assert.calledWithMatch(onError.lastCall, [
        {
          message: "should NOT be shorter than 8 characters",
          name: "minLength",
          params: { limit: 8 },
          property: "",
          schemaPath: "#/minLength",
          stack: "should NOT be shorter than 8 characters",
        },
        {
          message: 'should match pattern "d+"',
          name: "pattern",
          params: { pattern: "d+" },
          property: "",
          schemaPath: "#/pattern",
          stack: 'should match pattern "d+"',
        },
      ]);

      setProps(comp, { ...formProps, onError });

      submitForm(node);
      sinon.assert.calledWithMatch(onError.lastCall, [
        {
          stack:
            'no schema with key or ref "http://json-schema.org/draft-04/schema#"',
        },
      ]);
    });
  });

  describe("Changing the tagName", () => {
    it("should render the component using the custom tag name", () => {
      const tagName = "span";
      const { node } = createFormComponent({ schema: {}, tagName });
      expect(node.tagName).eql(tagName.toUpperCase());
    });

    it("should render the component using a ComponentType", () => {
      const Component = props => <div {...props} id="test" />;
      const { node } = createFormComponent({ schema: {}, tagName: Component });
      expect(node.id).eql("test");
    });
  });

  describe("Nested forms", () => {
    it("should call provided submit handler with form state", () => {
      const innerOnSubmit = sandbox.spy();
      const outerOnSubmit = sandbox.spy();
      let innerRef;

      class ArrayTemplateWithForm extends React.Component {
        constructor(props) {
          super(props);
          innerRef = createRef();
        }

        render() {
          const innerFormProps = {
            schema: {},
            onSubmit: innerOnSubmit,
          };

          return (
            <Portal>
              <div className="array" ref={innerRef}>
                <Form {...innerFormProps}>
                  <button className="array-form-submit" type="submit">
                    Submit
                  </button>
                </Form>
              </div>
            </Portal>
          );
        }
      }

      const outerFormProps = {
        schema: {
          type: "array",
          title: "my list",
          description: "my description",
          items: { type: "string" },
        },
        formData: ["foo", "bar"],
        ArrayFieldTemplate: ArrayTemplateWithForm,
        onSubmit: outerOnSubmit,
      };
      createFormComponent(outerFormProps);
      const arrayForm = innerRef.current.querySelector("form");
      const arraySubmit = arrayForm.querySelector(".array-form-submit");

      arraySubmit.click();
      sinon.assert.calledOnce(innerOnSubmit);
      sinon.assert.notCalled(outerOnSubmit);
    });
  });

  describe("Dependencies", () => {
    it("should not give a validation error by duplicating enum values in dependencies", () => {
      const schema = {
        title: "A registration form",
        description: "A simple form example.",
        type: "object",
        properties: {
          type1: {
            type: "string",
            title: "Type 1",
            enum: ["FOO", "BAR", "BAZ"],
          },
          type2: {
            type: "string",
            title: "Type 2",
            enum: ["GREEN", "BLUE", "RED"],
          },
        },
        dependencies: {
          type1: {
            properties: {
              type1: {
                enum: ["FOO"],
              },
              type2: {
                enum: ["GREEN"],
              },
            },
          },
        },
      };
      const formData = {
        type1: "FOO",
      };
      const { node, onError } = createFormComponent({ schema, formData });
      Simulate.submit(node);
      sinon.assert.notCalled(onError);
    });
    it("should show dependency defaults for uncontrolled components", () => {
      const schema = {
        type: "object",
        properties: {
          firstName: { type: "string" },
        },
        dependencies: {
          firstName: {
            properties: {
              lastName: { type: "string", default: "Norris" },
            },
          },
        },
      };
      const { node } = createFormComponent({ schema });

      Simulate.change(node.querySelector("#root_firstName"), {
        target: { value: "Chuck" },
      });
      expect(node.querySelector("#root_lastName").value).eql("Norris");
    });
  });
});

describe("Form omitExtraData and liveOmit", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should call getUsedFormData when the omitExtraData prop is true and liveOmit is true", () => {
    const schema = {
      type: "object",
      properties: {
        foo: {
          type: "string",
        },
      },
    };
    const formData = {
      foo: "bar",
    };
    const onChange = sandbox.spy();
    const omitExtraData = true;
    const liveOmit = true;
    const { node, comp } = createFormComponent({
      schema,
      formData,
      onChange,
      omitExtraData,
      liveOmit,
    });

    sandbox.stub(comp, "getUsedFormData").returns({
      foo: "",
    });

    Simulate.change(node.querySelector("[type=text]"), {
      target: { value: "new" },
    });

    sinon.assert.calledOnce(comp.getUsedFormData);
  });

  it("should not call getUsedFormData when the omitExtraData prop is true and liveOmit is unspecified", () => {
    const schema = {
      type: "object",
      properties: {
        foo: {
          type: "string",
        },
      },
    };
    const formData = {
      foo: "bar",
    };
    const onChange = sandbox.spy();
    const omitExtraData = true;
    const { node, comp } = createFormComponent({
      schema,
      formData,
      onChange,
      omitExtraData,
    });

    sandbox.stub(comp, "getUsedFormData").returns({
      foo: "",
    });

    Simulate.change(node.querySelector("[type=text]"), {
      target: { value: "new" },
    });

    sinon.assert.notCalled(comp.getUsedFormData);
  });

  describe("getUsedFormData", () => {
    it("should call getUsedFormData when the omitExtraData prop is true", () => {
      const schema = {
        type: "object",
        properties: {
          foo: {
            type: "string",
          },
        },
      };
      const formData = {
        foo: "",
      };
      const onSubmit = sandbox.spy();
      const onError = sandbox.spy();
      const omitExtraData = true;
      const { comp, node } = createFormComponent({
        schema,
        formData,
        onSubmit,
        onError,
        omitExtraData,
      });

      sandbox.stub(comp, "getUsedFormData").returns({
        foo: "",
      });

      Simulate.submit(node);

      sinon.assert.calledOnce(comp.getUsedFormData);
    });
    it("should just return the single input form value", () => {
      const schema = {
        title: "A single-field form",
        type: "string",
      };
      const formData = "foo";
      const onSubmit = sandbox.spy();
      const { comp } = createFormComponent({
        schema,
        formData,
        onSubmit,
      });

      const result = comp.getUsedFormData(formData, []);
      expect(result).eql("foo");
    });

    it("should return the root level array", () => {
      const schema = {
        type: "array",
        items: {
          type: "string",
        },
      };
      const formData = [];
      const onSubmit = sandbox.spy();
      const { comp } = createFormComponent({
        schema,
        formData,
        onSubmit,
      });

      const result = comp.getUsedFormData(formData, []);
      expect(result).eql([]);
    });

    it("should call getUsedFormData with data from fields in event", () => {
      const schema = {
        type: "object",
        properties: {
          foo: { type: "string" },
        },
      };
      const formData = {
        foo: "bar",
      };
      const onSubmit = sandbox.spy();
      const { comp } = createFormComponent({
        schema,
        formData,
        onSubmit,
      });

      const result = comp.getUsedFormData(formData, ["foo"]);
      expect(result).eql({ foo: "bar" });
    });

    it("unused form values should be omitted", () => {
      const schema = {
        type: "object",
        properties: {
          foo: { type: "string" },
          baz: { type: "string" },
          list: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                details: { type: "string" },
              },
            },
          },
        },
      };

      const formData = {
        foo: "bar",
        baz: "buzz",
        list: [
          { title: "title0", details: "details0" },
          { title: "title1", details: "details1" },
        ],
      };
      const onSubmit = sandbox.spy();
      const { comp } = createFormComponent({
        schema,
        formData,
        onSubmit,
      });

      const result = comp.getUsedFormData(formData, [
        "foo",
        "list.0.title",
        "list.1.details",
      ]);
      expect(result).eql({
        foo: "bar",
        list: [{ title: "title0" }, { details: "details1" }],
      });
    });
  });

  describe("getFieldNames()", () => {
    it("should return an empty array for a single input form", () => {
      const schema = {
        type: "string",
      };

      const formData = "foo";

      const onSubmit = sandbox.spy();
      const { comp } = createFormComponent({
        schema,
        formData,
        onSubmit,
      });

      const pathSchema = {
        $name: "",
      };

      const fieldNames = comp.getFieldNames(pathSchema, formData);
      expect(fieldNames).eql([]);
    });

    it("should get field names from pathSchema", () => {
      const schema = {};

      const formData = {
        extra: {
          foo: "bar",
        },
        level1: {
          level2: "test",
          anotherThing: {
            anotherThingNested: "abc",
            extra: "asdf",
            anotherThingNested2: 0,
          },
        },
        level1a: 1.23,
      };

      const onSubmit = sandbox.spy();
      const { comp } = createFormComponent({
        schema,
        formData,
        onSubmit,
      });

      const pathSchema = {
        $name: "",
        level1: {
          $name: "level1",
          level2: { $name: "level1.level2" },
          anotherThing: {
            $name: "level1.anotherThing",
            anotherThingNested: {
              $name: "level1.anotherThing.anotherThingNested",
            },
            anotherThingNested2: {
              $name: "level1.anotherThing.anotherThingNested2",
            },
          },
        },
        level1a: {
          $name: "level1a",
        },
      };

      const fieldNames = comp.getFieldNames(pathSchema, formData);
      expect(fieldNames.sort()).eql(
        [
          "level1a",
          "level1.level2",
          "level1.anotherThing.anotherThingNested",
          "level1.anotherThing.anotherThingNested2",
        ].sort()
      );
    });

    it("should get field marked as additionalProperties", () => {
      const schema = {};

      const formData = {
        extra: {
          foo: "bar",
        },
        level1: {
          level2: "test",
          extra: "foo",
          mixedMap: {
            namedField: "foo",
            key1: "val1",
          },
        },
        level1a: 1.23,
      };

      const onSubmit = sandbox.spy();
      const { comp } = createFormComponent({
        schema,
        formData,
        onSubmit,
      });

      const pathSchema = {
        $name: "",
        level1: {
          $name: "level1",
          level2: { $name: "level1.level2" },
          mixedMap: {
            $name: "level1.mixedMap",
            __rjsf_additionalProperties: true,
            namedField: { $name: "level1.mixedMap.namedField" }, // this name should not be returned, as the root object paths should be returned for objects marked with additionalProperties
          },
        },
        level1a: {
          $name: "level1a",
        },
      };

      const fieldNames = comp.getFieldNames(pathSchema, formData);
      expect(fieldNames.sort()).eql(
        ["level1a", "level1.level2", "level1.mixedMap"].sort()
      );
    });

    it("should get field names from pathSchema with array", () => {
      const schema = {};

      const formData = {
        address_list: [
          {
            street_address: "21, Jump Street",
            city: "Babel",
            state: "Neverland",
          },
          {
            street_address: "1234 Schema Rd.",
            city: "New York",
            state: "Arizona",
          },
        ],
      };

      const onSubmit = sandbox.spy();
      const { comp } = createFormComponent({
        schema,
        formData,
        onSubmit,
      });

      const pathSchema = {
        $name: "",
        address_list: {
          "0": {
            $name: "address_list.0",
            city: {
              $name: "address_list.0.city",
            },
            state: {
              $name: "address_list.0.state",
            },
            street_address: {
              $name: "address_list.0.street_address",
            },
          },
          "1": {
            $name: "address_list.1",
            city: {
              $name: "address_list.1.city",
            },
            state: {
              $name: "address_list.1.state",
            },
            street_address: {
              $name: "address_list.1.street_address",
            },
          },
        },
      };

      const fieldNames = comp.getFieldNames(pathSchema, formData);
      expect(fieldNames.sort()).eql(
        [
          "address_list.0.city",
          "address_list.0.state",
          "address_list.0.street_address",
          "address_list.1.city",
          "address_list.1.state",
          "address_list.1.street_address",
        ].sort()
      );
    });
  });

  it("should not omit data on change with omitExtraData=false and liveOmit=false", () => {
    const omitExtraData = false;
    const liveOmit = false;
    const schema = {
      type: "object",
      properties: {
        foo: { type: "string" },
        bar: { type: "string" },
      },
    };
    const formData = { foo: "foo", baz: "baz" };
    const { node, onChange } = createFormComponent({
      schema,
      formData,
      omitExtraData,
      liveOmit,
    });

    Simulate.change(node.querySelector("#root_foo"), {
      target: { value: "foobar" },
    });

    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: { foo: "foobar", baz: "baz" },
    });
  });

  it("should not omit data on change with omitExtraData=true and liveOmit=false", () => {
    const omitExtraData = true;
    const liveOmit = false;
    const schema = {
      type: "object",
      properties: {
        foo: { type: "string" },
        bar: { type: "string" },
      },
    };
    const formData = { foo: "foo", baz: "baz" };
    const { node, onChange } = createFormComponent({
      schema,
      formData,
      omitExtraData,
      liveOmit,
    });

    Simulate.change(node.querySelector("#root_foo"), {
      target: { value: "foobar" },
    });

    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: { foo: "foobar", baz: "baz" },
    });
  });

  it("should not omit data on change with omitExtraData=false and liveOmit=true", () => {
    const omitExtraData = false;
    const liveOmit = true;
    const schema = {
      type: "object",
      properties: {
        foo: { type: "string" },
        bar: { type: "string" },
      },
    };
    const formData = { foo: "foo", baz: "baz" };
    const { node, onChange } = createFormComponent({
      schema,
      formData,
      omitExtraData,
      liveOmit,
    });

    Simulate.change(node.querySelector("#root_foo"), {
      target: { value: "foobar" },
    });

    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: { foo: "foobar", baz: "baz" },
    });
  });

  it("should omit data on change with omitExtraData=true and liveOmit=true", () => {
    const omitExtraData = true;
    const liveOmit = true;
    const schema = {
      type: "object",
      properties: {
        foo: { type: "string" },
        bar: { type: "string" },
      },
    };
    const formData = { foo: "foo", baz: "baz" };
    const { node, onChange } = createFormComponent({
      schema,
      formData,
      omitExtraData,
      liveOmit,
    });

    Simulate.change(node.querySelector("#root_foo"), {
      target: { value: "foobar" },
    });

    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: { foo: "foobar" },
    });
  });

  it("should not omit additionalProperties on change with omitExtraData=true and liveOmit=true", () => {
    const omitExtraData = true;
    const liveOmit = true;
    const schema = {
      type: "object",
      properties: {
        foo: { type: "string" },
        bar: { type: "string" },
        add: {
          type: "object",
          additionalProperties: {},
        },
      },
    };
    const formData = { foo: "foo", baz: "baz", add: { prop: 123 } };
    const { node, onChange } = createFormComponent({
      schema,
      formData,
      omitExtraData,
      liveOmit,
    });

    Simulate.change(node.querySelector("#root_foo"), {
      target: { value: "foobar" },
    });

    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: { foo: "foobar", add: { prop: 123 } },
    });
  });

  it("should rename formData key if key input is renamed in a nested object with omitExtraData=true and liveOmit=true", () => {
    const { node, onChange } = createFormComponent(
      {
        schema: {
          type: "object",
          properties: {
            nested: {
              additionalProperties: { type: "string" },
            },
          },
        },
        formData: { nested: { key1: "value" } },
      },
      { omitExtraData: true, liveOmit: true }
    );

    const textNode = node.querySelector("#root-key");
    Simulate.blur(textNode, {
      target: { value: "key1new" },
    });

    sinon.assert.calledWithMatch(onChange.lastCall, {
      formData: { nested: { key1new: "value" } },
    });
  });

  describe("Async errors", () => {
    it("should render the async errors", () => {
      const schema = {
        type: "object",
        properties: {
          foo: { type: "string" },
          candy: {
            type: "object",
            properties: {
              bar: { type: "string" },
            },
          },
        },
      };

      const extraErrors = {
        foo: {
          __errors: ["some error that got added as a prop"],
        },
        candy: {
          bar: {
            __errors: ["some other error that got added as a prop"],
          },
        },
      };

      const { node } = createFormComponent({ schema, extraErrors });

      expect(node.querySelectorAll(".error-detail li")).to.have.length.of(2);
    });

    it("should not block form submission", () => {
      const onSubmit = sinon.spy();
      const schema = {
        type: "object",
        properties: {
          foo: { type: "string" },
        },
      };

      const extraErrors = {
        foo: {
          __errors: ["some error that got added as a prop"],
        },
      };

      const { node } = createFormComponent({ schema, extraErrors, onSubmit });
      Simulate.submit(node);
      sinon.assert.calledOnce(onSubmit);
    });

    it("should reset when props extraErrors changes and noValidate is true", () => {
      const schema = {
        type: "object",
        properties: {
          foo: { type: "string" },
        },
      };

      const extraErrors = {
        foo: {
          __errors: ["foo"],
        },
      };

      const props = {
        schema,
        noValidate: true,
      };
      const { comp } = createFormComponent({
        ...props,
        extraErrors,
      });

      setProps(comp, {
        ...props,
        extraErrors: {},
      });

      expect(comp.state.errorSchema).eql({});
      expect(comp.state.errors).eql([]);
    });

    it("should reset when props extraErrors changes and liveValidate is false", () => {
      const schema = {
        type: "object",
        properties: {
          foo: { type: "string" },
        },
      };

      const extraErrors = {
        foo: {
          __errors: ["foo"],
        },
      };

      const props = {
        schema,
        liveValidate: false,
      };
      const { comp } = createFormComponent({
        ...props,
        extraErrors,
      });

      setProps(comp, {
        ...props,
        extraErrors: {},
      });

      expect(comp.state.errorSchema).eql({});
      expect(comp.state.errors).eql([]);
    });
  });

  it("should keep schema errors when extraErrors set after submit and liveValidate is false", () => {
    const schema = {
      type: "object",
      properties: {
        foo: { type: "string" },
      },
      required: ["foo"],
    };

    const extraErrors = {
      foo: {
        __errors: ["foo"],
      },
    };

    const onSubmit = sinon.spy();

    const props = {
      schema,
      onSubmit,
      liveValidate: false,
    };
    const event = { type: "submit" };
    const { comp, node } = createFormComponent(props);

    Simulate.submit(node, event);
    expect(node.querySelectorAll(".error-detail li")).to.have.length.of(1);

    setProps(comp, {
      ...props,
      extraErrors,
    });

    expect(node.querySelectorAll(".error-detail li")).to.have.length.of(2);
  });
});
