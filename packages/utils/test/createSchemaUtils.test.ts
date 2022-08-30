import {
  createSchemaUtils,
  RJSFSchema,
  SchemaUtilsType,
  ValidatorType,
} from "../src";
import getTestValidator from "./testUtils/getTestValidator";

describe("createSchemaUtils()", () => {
  let testValidator: ValidatorType;
  let rootSchema: RJSFSchema;
  let schemaUtils: SchemaUtilsType;
  beforeAll(() => {
    testValidator = getTestValidator({});
    rootSchema = { type: "object" };
    schemaUtils = createSchemaUtils(testValidator, rootSchema);
  });
  it("getValidator()", () => {
    expect(schemaUtils.getValidator()).toBe(testValidator);
  });
  describe("doesSchemaUtilsDiffer()", () => {
    it("passing falsy validator returns false", () => {
      expect(
        schemaUtils.doesSchemaUtilsDiffer(null as unknown as ValidatorType, {})
      ).toBe(false);
    });
    it("passing falsy rootSchema returns false", () => {
      expect(
        schemaUtils.doesSchemaUtilsDiffer(
          testValidator,
          null as unknown as RJSFSchema
        )
      ).toBe(false);
    });
    it("passing different validator returns true", () => {
      expect(schemaUtils.doesSchemaUtilsDiffer(getTestValidator({}), {})).toBe(
        true
      );
    });
    it("passing different rootSchema returns true", () => {
      expect(schemaUtils.doesSchemaUtilsDiffer(testValidator, {})).toBe(true);
    });
    it("passing same validator and rootSchema returns false", () => {
      expect(
        schemaUtils.doesSchemaUtilsDiffer(testValidator, { type: "object" })
      ).toBe(false);
    });
  });
  // NOTE: the rest of the functions are tested in the tests defined in the `schema` directory
});
