import React from "react";
import { expect } from "chai";
import sinon from "sinon";
import { Simulate } from "react-dom/test-utils";

import validateFormData, { isValid, toErrorList } from "../src/validate";
import { createFormComponent, submitForm } from "./test_utils";

describe("Validation", () => {
  describe("validate.isValid()", () => {
    it("should return true if the data is valid against the schema", () => {
      const schema = {
        type: "object",
        properties: {
          foo: { type: "string" },
        },
      };

      expect(isValid(schema, { foo: "bar" })).to.be.true;
    });

    it("should return false if the data is not valid against the schema", () => {
      const schema = {
        type: "object",
        properties: {
          foo: { type: "string" },
        },
      };

      expect(isValid(schema, { foo: 12345 })).to.be.false;
    });

    it("should return false if the schema is invalid", () => {
      const schema = "foobarbaz";

      expect(isValid(schema, { foo: "bar" })).to.be.false;
    });
  });

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

    describe("Validating multipleOf with a float", () => {
      const schema = {
        type: "object",
        properties: {
          price: {
            title: "Price per task ($)",
            type: "number",
            multipleOf: 0.01,
            minimum: 0,
          },
        },
      };

      let errors;

      beforeEach(() => {
        const result = validateFormData({ price: 0.14 }, schema);
        errors = result.errors;
      });

      it("should not return an error", () => {
        expect(errors).to.have.length.of(0);
      });
    });

    describe("validating using custom meta schema", () => {
      const schema = {
        $ref: "#/definitions/Dataset",
        $schema: "http://json-schema.org/draft-04/schema#",
        definitions: {
          Dataset: {
            properties: {
              datasetId: {
                pattern: "\\d+",
                type: "string",
              },
            },
            required: ["datasetId"],
            type: "object",
          },
        },
      };
      const metaSchemaDraft4 = require("ajv/lib/refs/json-schema-draft-04.json");
      const metaSchemaDraft6 = require("ajv/lib/refs/json-schema-draft-06.json");

      it("should return a validation error about meta schema when meta schema is not defined", () => {
        const errors = validateFormData(
          { datasetId: "some kind of text" },
          schema
        );
        const errMessage =
          'no schema with key or ref "http://json-schema.org/draft-04/schema#"';
        expect(errors.errors[0].stack).to.equal(errMessage);
        expect(errors.errors).to.eql([
          {
            stack: errMessage,
          },
        ]);
        expect(errors.errorSchema).to.eql({
          $schema: { __errors: [errMessage] },
        });
      });
      it("should return a validation error about formData", () => {
        const errors = validateFormData(
          { datasetId: "some kind of text" },
          schema,
          null,
          null,
          [metaSchemaDraft4]
        );
        expect(errors.errors).to.have.lengthOf(1);
        expect(errors.errors[0].stack).to.equal(
          '.datasetId should match pattern "\\d+"'
        );
      });
      it("should return a validation error about formData, when used with multiple meta schemas", () => {
        const errors = validateFormData(
          { datasetId: "some kind of text" },
          schema,
          null,
          null,
          [metaSchemaDraft4, metaSchemaDraft6]
        );
        expect(errors.errors).to.have.lengthOf(1);
        expect(errors.errors[0].stack).to.equal(
          '.datasetId should match pattern "\\d+"'
        );
      });
    });

    describe("validating using custom string formats", () => {
      const schema = {
        type: "object",
        properties: {
          phone: {
            type: "string",
            format: "phone-us",
          },
        },
      };

      it("should not return a validation error if unknown string format is used", () => {
        const result = validateFormData({ phone: "800.555.2368" }, schema);
        expect(result.errors.length).eql(0);
      });

      it("should return a validation error about formData", () => {
        const result = validateFormData(
          { phone: "800.555.2368" },
          schema,
          null,
          null,
          null,
          { "phone-us": /\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/ }
        );

        expect(result.errors).to.have.lengthOf(1);
        expect(result.errors[0].stack).to.equal(
          '.phone should match format "phone-us"'
        );
      });

      it("prop updates with new custom formats are accepted", () => {
        const result = validateFormData(
          { phone: "abc" },
          {
            type: "object",
            properties: {
              phone: {
                type: "string",
                format: "area-code",
              },
            },
          },
          null,
          null,
          null,
          { "area-code": /\d{3}/ }
        );

        expect(result.errors).to.have.lengthOf(1);
        expect(result.errors[0].stack).to.equal(
          '.phone should match format "area-code"'
        );
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

    describe("Data-Url validation", () => {
      const schema = {
        type: "object",
        properties: {
          dataUrlWithName: { type: "string", format: "data-url" },
          dataUrlWithoutName: { type: "string", format: "data-url" },
        },
      };

      it("Data-Url with name is accepted", () => {
        const formData = {
          dataUrlWithName: "data:text/plain;name=file1.txt;base64,x=",
        };
        const result = validateFormData(formData, schema);
        expect(result.errors).to.have.length.of(0);
      });

      it("Data-Url without name is accepted", () => {
        const formData = {
          dataUrlWithoutName: "data:text/plain;base64,x=",
        };
        const result = validateFormData(formData, schema);
        expect(result.errors).to.have.length.of(0);
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
        expect(errors[0].schemaPath).eql("#/definitions/stringArray/type"); // TODO: This schema path is wrong due to a bug in ajv; change this test when https://github.com/epoberezkin/ajv/issues/512 is fixed.
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

  describe("Form integration", () => {
    let sandbox;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
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

        let onError, node;
        beforeEach(() => {
          const compInfo = createFormComponent({
            schema,
            formData: {
              foo: undefined,
            },
          });
          onError = compInfo.onError;
          node = compInfo.node;
          submitForm(node);
        });

        it("should trigger onError call", () => {
          sinon.assert.calledWithMatch(onError.lastCall, [
            {
              message: "is a required property",
              name: "required",
              params: { missingProperty: "foo" },
              property: ".foo",
              schemaPath: "#/required",
              stack: ".foo is a required property",
            },
          ]);
        });

        it("should render errors", () => {
          expect(node.querySelectorAll(".errors li")).to.have.length.of(1);
          expect(node.querySelector(".errors li").textContent).eql(
            ".foo is a required property"
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

        let node, onError;

        beforeEach(() => {
          onError = sandbox.spy();
          const compInfo = createFormComponent({
            schema,
            formData: {
              foo: "123456789",
            },
            onError,
          });
          node = compInfo.node;

          submitForm(node);
        });

        it("should render errors", () => {
          expect(node.querySelectorAll(".errors li")).to.have.length.of(1);
          expect(node.querySelector(".errors li").textContent).eql(
            ".foo should NOT be shorter than 10 characters"
          );
        });

        it("should trigger the onError handler", () => {
          sinon.assert.calledWithMatch(onError.lastCall, [
            {
              message: "should NOT be shorter than 10 characters",
              name: "minLength",
              params: { limit: 10 },
              property: ".foo",
              schemaPath: "#/properties/foo/minLength",
              stack: ".foo should NOT be shorter than 10 characters",
            },
          ]);
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

        const { onError, node } = createFormComponent({
          schema,
          validate,
          formData,
        });

        submitForm(node);
        sinon.assert.calledWithMatch(onError.lastCall, [
          { stack: "root: Invalid" },
        ]);
      });

      it("should live validate a simple string value when liveValidate is set to true", () => {
        const schema = { type: "string" };
        const formData = "a";

        function validate(formData, errors) {
          if (formData !== "hello") {
            errors.addError("Invalid");
          }
          return errors;
        }

        const { onChange, node } = createFormComponent({
          schema,
          validate,
          formData,
          liveValidate: true,
        });
        Simulate.change(node.querySelector("input"), {
          target: { value: "1234" },
        });

        sinon.assert.calledWithMatch(onChange.lastCall, {
          errorSchema: { __errors: ["Invalid"] },
          errors: [{ stack: "root: Invalid" }],
          formData: "1234",
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

        submitForm(node);

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

        submitForm(node);

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

        const { node, onError } = createFormComponent({
          schema,
          validate,
          formData,
        });
        submitForm(node);
        sinon.assert.calledWithMatch(onError.lastCall, [
          { stack: "pass2: should NOT be shorter than 3 characters" },
          { stack: "pass2: Passwords don't match" },
        ]);
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

        const { node, onError } = createFormComponent({
          schema,
          validate,
          formData,
        });

        submitForm(node);
        sinon.assert.calledWithMatch(onError.lastCall, [
          { stack: "pass2: Passwords don't match" },
        ]);
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

        const { node, onError } = createFormComponent({
          schema,
          validate,
          formData,
        });
        submitForm(node);
        sinon.assert.calledWithMatch(onError.lastCall, [
          { stack: "root: Forbidden value: bbb" },
        ]);
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

        let node, onError;
        beforeEach(() => {
          const compInfo = createFormComponent({
            schema,
            formData: {
              foo: undefined,
            },
            showErrorList: false,
          });
          node = compInfo.node;
          onError = compInfo.onError;

          submitForm(node);
        });

        it("should not render error list if showErrorList prop true", () => {
          expect(node.querySelectorAll(".errors li")).to.have.length.of(0);
        });

        it("should trigger onError call", () => {
          sinon.assert.calledWithMatch(onError.lastCall, [
            {
              message: "is a required property",
              name: "required",
              params: { missingProperty: "foo" },
              property: ".foo",
              schemaPath: "#/required",
              stack: ".foo is a required property",
            },
          ]);
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
    describe("Custom meta schema", () => {
      let onError, node;
      const formData = {
        datasetId: "no err",
      };

      const schema = {
        $ref: "#/definitions/Dataset",
        $schema: "http://json-schema.org/draft-04/schema#",
        definitions: {
          Dataset: {
            properties: {
              datasetId: {
                pattern: "\\d+",
                type: "string",
              },
            },
            required: ["datasetId"],
            type: "object",
          },
        },
      };

      beforeEach(() => {
        const withMetaSchema = createFormComponent({
          schema,
          formData,
          liveValidate: true,
          additionalMetaSchemas: [
            require("ajv/lib/refs/json-schema-draft-04.json"),
          ],
        });
        node = withMetaSchema.node;
        onError = withMetaSchema.onError;
        submitForm(node);
      });
      it("should be used to validate schema", () => {
        expect(node.querySelectorAll(".errors li")).to.have.length.of(1);
        sinon.assert.calledWithMatch(onError.lastCall, [
          {
            message: 'should match pattern "\\d+"',
            name: "pattern",
            params: { pattern: "\\d+" },
            property: ".datasetId",
            schemaPath: "#/properties/datasetId/pattern",
            stack: '.datasetId should match pattern "\\d+"',
          },
        ]);
        onError.resetHistory();

        Simulate.change(node.querySelector("input"), {
          target: { value: "1234" },
        });
        expect(node.querySelectorAll(".errors li")).to.have.length.of(0);
        sinon.assert.notCalled(onError);
      });
    });
  });
});
