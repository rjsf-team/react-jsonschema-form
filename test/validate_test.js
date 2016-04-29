import { expect } from "chai";
import sinon from "sinon";

import userValidate from "../src/validate";


describe("userValidate()", () => {
  it("should return errors and errorSchema properties", () => {
    const formData = {};
    const errorSchema = {};
    const validate = (formData, errors) => errors;

    const result = userValidate(validate, formData, errorSchema);

    expect(result).eql({errors: [], errorSchema: {__errors: []}});
  });

  describe("wrapped formData", () => {
    let errorHandler;

    beforeEach(() => {
      const formData = {a: {b: 42}};
      const errorSchema = {};
      const validate = sinon.stub().returns({});

      userValidate(validate, formData, errorSchema);
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
