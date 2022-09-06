import AJV8Validator from "../src/validator";
import defaultValidator, { customizeValidator } from "../src";
import { CUSTOM_OPTIONS } from "./createAjvInstance.test";

jest.mock("../src/validator");

type TestType = {
  foo: string;
  bar: boolean;
};

describe("customizeValidator()", () => {
  it("defaultValidator was created", () => {
    expect(defaultValidator).toBeInstanceOf(AJV8Validator);
  });
  it("defaultValidator was constructed with empty object", () => {
    expect(AJV8Validator).toHaveBeenCalledWith({});
  });
  describe("passing options to customizeValidator", () => {
    let custom: any;
    beforeAll(() => {
      (AJV8Validator as unknown as jest.Mock).mockClear();
      custom = customizeValidator<TestType>(CUSTOM_OPTIONS);
    });
    it("custom validator was created", () => {
      expect(custom).toBeInstanceOf(AJV8Validator);
    });
    it("defaultValidator was constructed with empty object", () => {
      expect(AJV8Validator).toHaveBeenCalledWith(CUSTOM_OPTIONS);
    });
  });
});
