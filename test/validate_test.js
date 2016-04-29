import { expect } from "chai";
import sinon from "sinon";

import userValidate from "../src/validate";


describe("userValidate()", () => {
  it("should return errors and errorSchema properties", () => {
    const schema = {};
    const formData = {};
    const errorSchema = {};
    const validate = formData => formData;

    const result = userValidate(validate, formData, schema, errorSchema);

    expect(result).eql({errors: [], errorSchema: {
      __errors: []
    }});
  });

  it("should custom validate function with the schema", () => {
    const schema = {};
    const formData = {};
    const errorSchema = {};
    const validate = sinon.stub().returns(schema);

    userValidate(validate, formData, schema, errorSchema);

    sinon.assert.calledWithMatch(validate, {}, schema);
  });

  describe("wrapped formData", () => {
    let wrappedFormData;

    beforeEach(() => {
      const schema = {};
      const formData = {a: {b: 42}};
      const errorSchema = {};
      const validate = sinon.stub().returns(schema);

      userValidate(validate, formData, schema, errorSchema);
      wrappedFormData = validate.getCall(0).args[0];
    });

    it("should implement getValue", () => {
      expect(wrappedFormData).to.include.key("getValue");
      expect(wrappedFormData.getValue()).eql({a: {b: 42}});
    });

    it("should implement addError", () => {
      expect(wrappedFormData).to.include.key("addError");
    });

    it("should expose wrapped formData children", () => {
      expect(wrappedFormData).to.include.key("a");
      expect(wrappedFormData.a.getValue()).eql({b: 42});
    });
  });
});
