import React from "react";
import { expect } from "chai";
import sinon from "sinon";
import { Simulate } from "react-addons-test-utils";

import validateFormData, { toErrorList } from "../src/validate";
import { createFormComponent } from "./test_utils";

describe("Validation", () => {
  describe("validate.validateFormData()", () => {
    describe("No custom validate function", () => {
      const illFormedKey = "bar.'\"[]()=+*&^%$#@!";
      const schema = {
        type: "object",
        properties: {
          foo: { type: "string" },
          [illFormedKey]: { type: "string" },
        },
      };

      let errors, errorSchema;

      beforeEach(() => {
        const result = validateFormData(
          { foo: 42, [illFormedKey]: 41 },
          schema
        );
        errors = result.errors;
        errorSchema = result.errorSchema;
      });

      it("should return an error list", () => {
        expect(errors).to.have.length.of(2);
        expect(errors[0].message).eql("should be string");
        expect(errors[1].message).eql("should be string");
      });

      it("should return an errorSchema", () => {
        expect(errorSchema.foo.__errors).to.have.length.of(1);
        expect(errorSchema.foo.__errors[0]).eql("should be string");
        expect(errorSchema[illFormedKey].__errors).to.have.length.of(1);
        expect(errorSchema[illFormedKey].__errors[0]).eql("should be string");
      });
    });

    describe("Custom validate function", () => {
      let errors, errorSchema;

      const schema = {
        type: "object",
        required: ["pass1", "pass2"],
        properties: {
          pass1: { type: "string" },
          pass2: { type: "string" },
        },
      };

      beforeEach(() => {
        const validate = (formData, errors) => {
          if (formData.pass1 !== formData.pass2) {
            errors.pass2.addError("passwords don't match.");
          }
          return errors;
        };
        const formData = { pass1: "a", pass2: "b" };
        const result = validateFormData(formData, schema, validate);
        errors = result.errors;
        errorSchema = result.errorSchema;
      });

      it("should return an error list", () => {
        expect(errors).to.have.length.of(1);
        expect(errors[0].stack).eql("pass2: passwords don't match.");
      });

      it("should return an errorSchema", () => {
        expect(errorSchema.pass2.__errors).to.have.length.of(1);
        expect(errorSchema.pass2.__errors[0]).eql("passwords don't match.");
      });
    });

    describe("toErrorList()", () => {
      it("should convert an errorSchema into a flat list", () => {
        expect(
          toErrorList({
            __errors: ["err1", "err2"],
            a: {
              b: {
                __errors: ["err3", "err4"],
              },
            },
            c: {
              __errors: ["err5"],
            },
          })
        ).eql([
          { stack: "root: err1" },
          { stack: "root: err2" },
          { stack: "b: err3" },
          { stack: "b: err4" },
          { stack: "c: err5" },
        ]);
      });
    });

    describe("transformErrors", () => {
      const illFormedKey = "bar.'\"[]()=+*&^%$#@!";
      const schema = {
        type: "object",
        properties: {
          foo: { type: "string" },
          [illFormedKey]: { type: "string" },
        },
      };
      const newErrorMessage = "Better error message";
      const transformErrors = errors => {
        return [Object.assign({}, errors[0], { message: newErrorMessage })];
      };

      let errors;

      beforeEach(() => {
        const result = validateFormData(
          { foo: 42, [illFormedKey]: 41 },
          schema,
          undefined,
          transformErrors
        );
        errors = result.errors;
      });

      it("should use transformErrors function", () => {
        expect(errors).not.to.be.empty;
        expect(errors[0].message).to.equal(newErrorMessage);
      });
    });

    describe("Invalid schema", () => {
      const schema = {
        type: "object",
        properties: {
          foo: {
            type: "string",
            required: "invalid_type_non_array",
          },
        },
      };

      let errors, errorSchema;

      beforeEach(() => {
        const result = validateFormData({ foo: 42 }, schema);
        errors = result.errors;
        errorSchema = result.errorSchema;
      });

      it("should return an error list", () => {
        expect(errors).to.have.length.of(1);
        expect(errors[0].name).eql("type");
        expect(errors[0].property).eql(".properties['foo'].required");
        expect(errors[0].message).eql("should be array");
      });

      it("should return an errorSchema", () => {
        expect(errorSchema.properties.foo.required.__errors).to.have.length.of(
          1
        );
        expect(errorSchema.properties.foo.required.__errors[0]).eql(
          "should be array"
        );
      });
    });
  });

  describe("Form integration", () => {
    let sandbox;

    beforeEach(() => {
      sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
      sandbox.restore();
    });

    describe("JSONSchema validation", () => {
      describe("Required fields", () => {
        const schema = {
          type: "object",
          required: ["foo"],
          properties: {
            foo: { type: "string" },
            bar: { type: "string" },
          },
        };

        var comp, node, onError;

        beforeEach(() => {
          onError = sandbox.spy();
          const compInfo = createFormComponent({
            schema,
            formData: {
              foo: undefined,
            },
            onError,
          });
          comp = compInfo.comp;
          node = compInfo.node;

          Simulate.submit(node);
        });

        it("should validate a required field", () => {
          expect(comp.state.errors).to.have.length.of(1);
          expect(comp.state.errors[0].message).eql("is a required property");
        });

        it("should render errors", () => {
          expect(node.querySelectorAll(".errors li")).to.have.length.of(1);
          expect(node.querySelector(".errors li").textContent).eql(
            ".foo is a required property"
          );
        });

        it("should trigger the onError handler", () => {
          sinon.assert.calledWith(
            onError,
            sinon.match(errors => {
              return errors[0].message === "is a required property";
            })
          );
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
          },
        };

        var comp, node, onError;

        beforeEach(() => {
          onError = sandbox.spy();
          const compInfo = createFormComponent({
            schema,
            formData: {
              foo: "123456789",
            },
            onError,
          });
          comp = compInfo.comp;
          node = compInfo.node;

          Simulate.submit(node);
        });

        it("should validate a minLength field", () => {
          expect(comp.state.errors).to.have.length.of(1);
          expect(comp.state.errors[0].message).eql(
            "should NOT be shorter than 10 characters"
          );
        });

        it("should render errors", () => {
          expect(node.querySelectorAll(".errors li")).to.have.length.of(1);
          expect(node.querySelector(".errors li").textContent).eql(
            ".foo should NOT be shorter than 10 characters"
          );
        });

        it("should trigger the onError handler", () => {
          sinon.assert.calledWith(
            onError,
            sinon.match(errors => {
              return (
                errors[0].message === "should NOT be shorter than 10 characters"
              );
            })
          );
        });
      });
    });

    describe("Custom Form validation", () => {
      it("should validate a simple string value", () => {
        const schema = { type: "string" };
        const formData = "a";

        function validate(formData, errors) {
          if (formData !== "hello") {
            errors.addError("Invalid");
          }
          return errors;
        }

        const { comp } = createFormComponent({
          schema,
          validate,
          liveValidate: true,
        });
        comp.componentWillReceiveProps({ formData });

        expect(comp.state.errorSchema).eql({
          __errors: ["Invalid"],
        });
      });

      it("should submit form on valid data", () => {
        const schema = { type: "string" };
        const formData = "hello";
        const onSubmit = sandbox.spy();

        function validate(formData, errors) {
          if (formData !== "hello") {
            errors.addError("Invalid");
          }
          return errors;
        }

        const { node } = createFormComponent({
          schema,
          formData,
          validate,
          onSubmit,
        });

        Simulate.submit(node);

        sinon.assert.called(onSubmit);
      });

      it("should prevent form submission on invalid data", () => {
        const schema = { type: "string" };
        const formData = "a";
        const onSubmit = sandbox.spy();
        const onError = sandbox.spy();

        function validate(formData, errors) {
          if (formData !== "hello") {
            errors.addError("Invalid");
          }
          return errors;
        }

        const { node } = createFormComponent({
          schema,
          formData,
          validate,
          onSubmit,
          onError,
        });

        Simulate.submit(node);

        sinon.assert.notCalled(onSubmit);
        sinon.assert.called(onError);
      });

      it("should validate a simple object", () => {
        const schema = {
          type: "object",
          properties: {
            pass1: { type: "string", minLength: 3 },
            pass2: { type: "string", minLength: 3 },
          },
        };

        const formData = { pass1: "aaa", pass2: "b" };

        function validate(formData, errors) {
          const { pass1, pass2 } = formData;
          if (pass1 !== pass2) {
            errors.pass2.addError("Passwords don't match");
          }
          return errors;
        }

        const { comp } = createFormComponent({
          schema,
          validate,
          liveValidate: true,
        });
        comp.componentWillReceiveProps({ formData });

        expect(comp.state.errorSchema).eql({
          __errors: [],
          pass1: {
            __errors: [],
          },
          pass2: {
            __errors: [
              "should NOT be shorter than 3 characters",
              "Passwords don't match",
            ],
          },
        });
      });

      it("should validate an array of object", () => {
        const schema = {
          type: "array",
          items: {
            type: "object",
            properties: {
              pass1: { type: "string" },
              pass2: { type: "string" },
            },
          },
        };

        const formData = [
          { pass1: "a", pass2: "b" },
          { pass1: "a", pass2: "a" },
        ];

        function validate(formData, errors) {
          formData.forEach(({ pass1, pass2 }, i) => {
            if (pass1 !== pass2) {
              errors[i].pass2.addError("Passwords don't match");
            }
          });
          return errors;
        }

        const { comp } = createFormComponent({
          schema,
          validate,
          liveValidate: true,
        });
        comp.componentWillReceiveProps({ formData });

        expect(comp.state.errorSchema).eql({
          0: {
            pass1: {
              __errors: [],
            },
            pass2: {
              __errors: ["Passwords don't match"],
            },
            __errors: [],
          },
          1: {
            pass1: {
              __errors: [],
            },
            pass2: {
              __errors: [],
            },
            __errors: [],
          },
          __errors: [],
        });
      });

      it("should validate a simple array", () => {
        const schema = {
          type: "array",
          items: {
            type: "string",
          },
        };

        const formData = ["aaa", "bbb", "ccc"];

        function validate(formData, errors) {
          if (formData.indexOf("bbb") !== -1) {
            errors.addError("Forbidden value: bbb");
          }
          return errors;
        }

        const { comp } = createFormComponent({
          schema,
          validate,
          liveValidate: true,
        });
        comp.componentWillReceiveProps({ formData });

        expect(comp.state.errorSchema).eql({
          0: { __errors: [] },
          1: { __errors: [] },
          2: { __errors: [] },
          __errors: ["Forbidden value: bbb"],
        });
      });
    });

    describe("showErrorList prop validation", () => {
      describe("Required fields", () => {
        const schema = {
          type: "object",
          required: ["foo"],
          properties: {
            foo: { type: "string" },
            bar: { type: "string" },
          },
        };

        var comp, node, onError;

        beforeEach(() => {
          onError = sandbox.spy();
          const compInfo = createFormComponent({
            schema,
            formData: {
              foo: undefined,
            },
            onError,
            showErrorList: false,
          });
          comp = compInfo.comp;
          node = compInfo.node;

          Simulate.submit(node);
        });

        it("should validate a required field", () => {
          expect(comp.state.errors).to.have.length.of(1);
          expect(comp.state.errors[0].message).eql("is a required property");
        });

        it("should not render error list if showErrorList prop true", () => {
          expect(node.querySelectorAll(".errors li")).to.have.length.of(0);
        });

        it("should trigger the onError handler", () => {
          sinon.assert.calledWith(
            onError,
            sinon.match(errors => {
              return errors[0].message === "is a required property";
            })
          );
        });
      });
    });

    describe("Custom ErrorList", () => {
      const schema = {
        type: "string",
        minLength: 1,
      };

      const uiSchema = {
        foo: "bar",
      };

      const formData = 0;

      const CustomErrorList = ({
        errors,
        errorSchema,
        schema,
        uiSchema,
        formContext: { className },
      }) => (
        <div>
          <div className="CustomErrorList">{errors.length} custom</div>
          <div className={"ErrorSchema"}>{errorSchema.__errors[0]}</div>
          <div className={"Schema"}>{schema.type}</div>
          <div className={"UiSchema"}>{uiSchema.foo}</div>
          <div className={className} />
        </div>
      );

      it("should use CustomErrorList", () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          liveValidate: true,
          formData,
          ErrorList: CustomErrorList,
          formContext: { className: "foo" },
        });
        expect(node.querySelectorAll(".CustomErrorList")).to.have.length.of(1);
        expect(node.querySelector(".CustomErrorList").textContent).eql(
          "1 custom"
        );
        expect(node.querySelectorAll(".ErrorSchema")).to.have.length.of(1);
        expect(node.querySelector(".ErrorSchema").textContent).eql(
          "should be string"
        );
        expect(node.querySelectorAll(".Schema")).to.have.length.of(1);
        expect(node.querySelector(".Schema").textContent).eql("string");
        expect(node.querySelectorAll(".UiSchema")).to.have.length.of(1);
        expect(node.querySelector(".UiSchema").textContent).eql("bar");
        expect(node.querySelectorAll(".foo")).to.have.length.of(1);
      });
    });
  });
});
