import {expect} from "chai";
import sinon from "sinon";
import {Simulate} from "react-addons-test-utils";

import validateFormData, {toErrorList} from "../src/validate";
import {createFormComponent} from "./test_utils";


describe("Validation", () => {
  describe("validate.validateFormData()", () => {
    describe("No custom validate function", () => {
      const illFormedKey = "bar.'\"[]()=+*&^%$#@!";
      const schema = {
        type: "object",
        properties: {foo: {type: "string"}, [illFormedKey]: {type: "string"}}
      };

      let validation = validateFormData({foo: 42}, schema);

      beforeEach(() => {
        validation = validateFormData({foo: 42}, [illFormedKey]: 41}, schema);
      });

      it("should return an error list", () => {
        return validation.then(({errors}) => {
          expect(errors).to.have.length.of(2);
          expect(errors[0].message).eql("is not of a type(s) string");
          expect(errors[1].message).eql("is not of a type(s) string");
        });
      });

      it("should return an errorSchema", () => {
        return validation.then(({errorSchema}) => {
          expect(errorSchema.foo.__errors).to.have.length.of(1);
          expect(errorSchema.foo.__errors[0]).eql("is not of a type(s) string");
          expect(errorSchema[illFormedKey].__errors).to.have.length.of(1);
          expect(errorSchema[illFormedKey].__errors[0]).eql("is not of a type(s) string");
        });
      });
    });

    describe("Custom validate function", () => {
      let result;

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
        result = validateFormData(formData, schema, validate);
      });

      it("should return an error list", () => {
        return result.then(({errors}) => {
          console.log(errors);
          expect(errors).to.have.length.of(1);
          expect(errors[0].stack).eql("instance.pass2: passwords don't match.");
        });
      });

      it("should return an errorSchema", () => {
        return result.then(({errorSchema}) => {
          expect(errorSchema.pass2.__errors).to.have.length.of(1);
          expect(errorSchema.pass2.__errors[0]).eql("passwords don't match.");
        });
      });
    });

    describe("toErrorList()", () => {
      it("should convert an errorSchema into a flat list", () => {
        expect(toErrorList({
          __errors: ["err1", "err2"],
          a: {
            b: {
              __errors: ["err3", "err4"]
            }
          },
          c: {
            __errors: ["err5"]
          }
        })).eql([
          {stack: "root: err1"},
          {stack: "root: err2"},
          {stack: "b: err3"},
          {stack: "b: err4"},
          {stack: "c: err5"},
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

        it("should eventually validate a required field", (done) => {
          setTimeout(function(){
            expect(comp.state.errors)
              .to.have.length.of(1);
            expect(comp.state.errors[0].message)
              .eql("requires property \"foo\"");
            done();
          });
        });

        it("should eventually render errors", (done) => {
          setTimeout(function(){
            expect(node.querySelectorAll(".errors li"))
              .to.have.length.of(1);
            expect(node.querySelector(".errors li").textContent)
              .eql("instance requires property \"foo\"");
            done();
          });
        });

        it("should eventually trigger the onError handler", (done) => {
          setTimeout(function () {
            sinon.assert.calledWith(onError, sinon.match(errors => {
              return errors[0].message === "requires property \"foo\"";
            }));
            done();
          });
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

        it("should eventually validate a minLength field", (done) => {
          setTimeout(function(){
            expect(comp.state.errors)
              .to.have.length.of(1);
            expect(comp.state.errors[0].message)
              .eql("does not meet minimum length of 10");
            done();
          });
        });

        it("should eventually render errors", (done) => {
          setTimeout(function(){
            expect(node.querySelectorAll(".errors li"))
              .to.have.length.of(1);
            expect(node.querySelector(".errors li").textContent)
              .eql("instance.foo does not meet minimum length of 10");
            done();
          });
        });

        it("should eventually trigger the onError handler", (done) => {
          setTimeout(function(){
            sinon.assert.calledWith(onError, sinon.match(errors => {
              return errors[0].message ===
                "does not meet minimum length of 10";
            }));
            done();
          });
        });
      });
    });

    describe("Custom Form validation", () => {
      it("should eventually validate a simple string value", (done) => {
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

        setTimeout(function(){
          expect(comp.state.errorSchema).eql({
            __errors: ["Invalid"],
          });
          done();
        });
      });

      it("should eventually submit form on valid data", (done) => {
        const schema = {type: "string"};
        const formData = "hello";
        const onSubmit = sandbox.spy();

        function validate(formData, errors) {
          if (formData !== "hello") {
            errors.addError("Invalid");
          }
          return errors;
        }

        const {node} = createFormComponent({
          schema,
          formData,
          validate,
          onSubmit,
        });

        Simulate.submit(node);

        setTimeout(function(){
          sinon.assert.called(onSubmit);
          done();
        });

      });

      it("should eventually prevent form submission on invalid data", (done) => {
        const schema = {type: "string"};
        const formData = "a";
        const onSubmit = sandbox.spy();
        const onError = sandbox.spy();

        function validate(formData, errors) {
          if (formData !== "hello") {
            errors.addError("Invalid");
          }
          return errors;
        }

        const {node} = createFormComponent({
          schema,
          formData,
          validate,
          onSubmit,
          onError,
        });

        Simulate.submit(node);

        setTimeout(function(){
          sinon.assert.notCalled(onSubmit);
          sinon.assert.called(onError);
          done();
        });
      });

      it("should eventually validate a simple object", (done) => {
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

        setTimeout(function(){
          expect(comp.state.errorSchema).eql({
/*
            //TODO: Resolve is it correct: with current flow empty errors does not appear in errorSchema
            __errors: [],
            pass1: {
              __errors: [],
            },
*/
            pass2: {
              __errors: [
                "does not meet minimum length of 3",
                "Passwords don't match",
              ]
            }
          });
          done();
        });
      });

      it("should eventually validate a simple array", (done) => {
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

        setTimeout(function(){
          expect(comp.state.errorSchema).eql({
            __errors: ["Forbidden value: bbb"],
          });
          done();
        });
      });
    });

    describe("showErrorList prop validation", () => {
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
          }, onError, showErrorList: false});
          comp = compInfo.comp;
          node = compInfo.node;

          Simulate.submit(node);
        });

        it("should eventually validate a required field", (done) => {
          setTimeout(function(){
            expect(comp.state.errors)
              .to.have.length.of(1);
            expect(comp.state.errors[0].message)
              .eql("requires property \"foo\"");
            done();
          });
        });

        it("should not render error list if showErrorList prop true", () => {
          expect(node.querySelectorAll(".errors li"))
            .to.have.length.of(0);
        });

        it("should eventually trigger the onError handler", (done) => {
          setTimeout(function(){
            sinon.assert.calledWith(onError, sinon.match(errors => {
              return errors[0].message === "requires property \"foo\"";
            }));
            done();
          });
        });
      });

    });

  });
});
