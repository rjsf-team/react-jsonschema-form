import { expect } from "chai";
import sinon from "sinon";
import { Simulate } from "react-addons-test-utils";

import validateFormData, { toErrorList } from "../src/validate";
import { createFormComponent } from "./test_utils";


describe("Validation", () => {
  describe("validate.validateFormData()", () => {
    describe("No custom validate function", () => {
      const schema = {
        type: "object",
        properties: {
          foo: {type: "string"}
        }
      };

      let errors, errorSchema;

      beforeEach(() => {
        return validateFormData({foo: 42}, schema)
          .then(result => {
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
      });

      it("should return an error list", function*() {
        expect(errors).to.have.length.of(1);
        expect(errors[0].message).eql("is not of a type(s) string");
      });

      it("should return an errorSchema", function*() {
        expect(errorSchema.foo.__errors).to.have.length.of(1);
        expect(errorSchema.foo.__errors[0]).eql("is not of a type(s) string");
      });
    });

    describe("Custom validate function", () => {
      let errors, errorSchema;

      const schema = {
        type: "object",
        required: ["pass1", "pass2"],
        properties: {
          pass1: {type: "string"},
          pass2: {type: "string"},
        }
      };

      beforeEach(() => {
        const validate = (formData, errors) => {
          if (formData.pass1 !== formData.pass2) {
            errors.pass2.addError("passwords don't match.");
          }
          return errors;
        };
        const formData = {pass1: "a", pass2: "b"};
        return validateFormData(formData, schema, validate)
          .then(result => {
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
      });

      it("should return an error list", function*() {
        expect(errors).to.have.length.of(1);
        expect(errors[0].stack).eql("pass2 passwords don't match.");
      });

      it("should return an errorSchema", function*() {
        expect(errorSchema.pass2.__errors).to.have.length.of(1);
        expect(errorSchema.pass2.__errors[0]).eql("passwords don't match.");
      });
    });

    describe("toErrorList()", () => {
      it("should convert an errorSchema into a flat list", function*() {
        expect(toErrorList({
          a: {
            b: {
              __errors: ["err1", "err2"]
            }
          },
          c: {
            __errors: ["err3"]
          }
        })).eql([
          {stack: "b err1"},
          {stack: "b err2"},
          {stack: "c err3"},
        ]);
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

        it("should validate a required field", function*() {
          expect(comp.state.errors)
            .to.have.length.of(1);
          expect(comp.state.errors[0].message)
            .eql(`requires property "foo"`);
        });

        it("should render errors", function*() {
          expect(node.querySelectorAll(".errors li"))
            .to.have.length.of(1);
          expect(node.querySelector(".errors li").textContent)
            .eql(`instance requires property "foo"`);
        });

        it("should trigger the onError handler", function*() {
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

        it("should validate a minLength field", function*() {
          expect(comp.state.errors)
            .to.have.length.of(1);
          expect(comp.state.errors[0].message)
            .eql(`does not meet minimum length of 10`);
        });

        it("should render errors", function*() {
          expect(node.querySelectorAll(".errors li"))
            .to.have.length.of(1);
          expect(node.querySelector(".errors li").textContent)
            .eql("instance.foo does not meet minimum length of 10");
        });

        it("should trigger the onError handler", function*() {
          sinon.assert.calledWith(onError, sinon.match(errors => {
            return errors[0].message ===
              "does not meet minimum length of 10";
          }));
        });
      });
    });

    describe("Custom Form validation", () => {
      it("should validate a simple string value", function*() {
        const schema = {type: "string"};
        const formData = "a";

        function validate(formData, errors) {
          if (formData !== "hello") {
            errors.addError("Invalid");
          }
          return errors;
        }

        const {comp} = createFormComponent({schema, validate, liveValidate: true});
        comp.componentWillReceiveProps({formData});

        expect(comp.state.errorSchema).eql({
          __errors: ["Invalid"],
        });
      });

      it("should validate a simple object", function*() {
        const schema = {
          type: "object",
          properties: {
            pass1: {type: "string", minLength: 3},
            pass2: {type: "string", minLength: 3},
          }
        };

        const formData = {pass1: "aaa", pass2: "b"};

        function validate(formData, errors) {
          const {pass1, pass2} = formData;
          if (pass1 !== pass2) {
            errors.pass2.addError("Passwords don't match");
          }
          return errors;
        }

        const {comp} = createFormComponent({schema, validate, liveValidate: true});
        comp.componentWillReceiveProps({formData});

        expect(comp.state.errorSchema).eql({
          __errors: [],
          pass1: {
            __errors: [],
          },
          pass2: {
            __errors: [
              "does not meet minimum length of 3",
              "Passwords don't match",
            ]
          }
        });
      });

      it("should validate a simple array", function*() {
        const schema = {
          type: "array",
          items: {
            type: "string"
          }
        };

        const formData = ["aaa", "bbb", "ccc"];

        function validate(formData, errors) {
          if (formData.indexOf("bbb") !== -1) {
            errors.addError("Forbidden value: bbb");
          }
          return errors;
        }

        const {comp} = createFormComponent({schema, validate, liveValidate: true});
        comp.componentWillReceiveProps({formData});

        expect(comp.state.errorSchema).eql({
          __errors: ["Forbidden value: bbb"],
        });
      });
    });
  });
});
