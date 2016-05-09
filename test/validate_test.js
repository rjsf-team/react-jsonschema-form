import { expect } from "chai";
import sinon from "sinon";

import validateFormData from "../src/validate";


describe("validateFormData()", () => {
  const schema = {
    type: "object",
    properties: {
      foo: {type: "string"}
    }
  };

  it("should return errors and errorSchema properties", () => {
    const formData = {};
    const validate = (formData, errors) => errors;

    const result = validateFormData(formData, schema, validate);

    expect(result).eql({errors: [], errorSchema: {__errors: []}});
  });

  describe("wrapped formData", () => {
    let errorHandler;

    beforeEach(() => {
      const formData = {a: {b: 42}};
      const validate = sinon.stub().returns({});

      validateFormData(formData, schema, validate);
      errorHandler = validate.getCall(0).args[1];
    });

    it("should implement addError", () => {
      expect(errorHandler).to.include.key("addError");
      expect(errorHandler).to.include.key("a");
      expect(errorHandler.a).to.include.key("addError");
      expect(errorHandler.a).to.include.key("b");
      expect(errorHandler.a.b).to.include.key("addError");
    });
  });
});
