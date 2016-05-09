import { expect } from "chai";

import validateFormData from "../src/validate";


describe("validateFormData()", () => {
  describe("No custom validate function", () => {
    const schema = {
      type: "object",
      properties: {
        foo: {type: "string"}
      }
    };

    let errors, errorSchema;

    beforeEach(() => {
      const result = validateFormData({foo: 42}, schema);
      errors = result.errors;
      errorSchema = result.errorSchema;
    });

    it("should return an error list", () => {
      expect(errors).to.have.length.of(1);
      expect(errors[0].message).eql("is not of a type(s) string");
    });

    it("should return an errorSchema", () => {
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
      const result = validateFormData(formData, schema, validate);
      errors = result.errors;
      errorSchema = result.errorSchema;
    });

    it("should return an error list", () => {
      expect(errors).to.have.length.of(1);
      expect(errors[0].stack).eql("pass2 passwords don't match.");
    });

    it("should return an errorSchema", () => {
      expect(errorSchema.pass2.__errors).to.have.length.of(1);
      expect(errorSchema.pass2.__errors[0]).eql("passwords don't match.");
    });
  });
});
