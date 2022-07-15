import { createSchemaUtils, getMatchingOption, RJSFSchema } from "../../src";
import { TestValidatorType } from "./types";

export default function getMatchingOptionTest(
  testValidator: TestValidatorType
) {
  describe("getMatchingOption()", () => {
    let rootSchema: RJSFSchema;
    beforeAll(() => {
      rootSchema = {
        definitions: {
          a: { type: "object", properties: { id: { enum: ["a"] } } },
          nested: {
            type: "object",
            properties: {
              id: { enum: ["nested"] },
              child: { $ref: "#/definitions/any" },
            },
          },
          any: {
            anyOf: [
              { $ref: "#/definitions/a" },
              { $ref: "#/definitions/nested" },
            ],
          },
        },
        $ref: "#/definitions/any",
      };
    });
    it("should infer correct anyOf schema based on data if passing undefined", () => {
      const options: RJSFSchema[] = [
        { type: "object", properties: { id: { enum: ["a"] } } },
        {
          type: "object",
          properties: {
            id: { enum: ["nested"] },
            child: { $ref: "#/definitions/any" },
          },
        },
      ];
      expect(
        getMatchingOption(testValidator, undefined, options, rootSchema)
      ).toEqual(0);
    });
    it("should infer correct anyOf schema with properties also having anyOf/allOf", () => {
      // Mock isValid to iterate through both options by failing the first
      testValidator.setReturnValues({ isValid: [false, false] });
      const options: RJSFSchema[] = [
        {
          type: "object",
          properties: { id: { enum: ["a"] } },
          anyOf: [{ type: "string" }, { type: "boolean" }],
        },
        {
          type: "object",
          properties: {
            id: { enum: ["nested"] },
            child: { $ref: "#/definitions/any" },
          },
          anyOf: [{ type: "number" }, { type: "boolean" }],
          allOf: [{ type: "string" }],
        },
      ];
      expect(
        getMatchingOption(testValidator, null, options, rootSchema)
      ).toEqual(0);
    });
    it("returns 0 if no options match", () => {
      // Mock isValid fail all the tests to trigger the fall-through
      testValidator.setReturnValues({ isValid: [false, false, true] });
      const options: RJSFSchema[] = [
        { type: "string" },
        { type: "string" },
        { type: "null" },
      ];
      expect(
        getMatchingOption(testValidator, null, options, rootSchema)
      ).toEqual(2);
    });
    it("should infer correct anyOf schema based on data if passing null and option 2 is {type: null}", () => {
      // Mock isValid fail the first two, non-null values
      testValidator.setReturnValues({ isValid: [false, false, true] });
      const options: RJSFSchema[] = [
        { type: "string" },
        { type: "string" },
        { type: "null" },
      ];
      expect(
        getMatchingOption(testValidator, null, options, rootSchema)
      ).toEqual(2);
    });
    it("should infer correct anyOf schema based on data", () => {
      // Mock isValid fail the first non-nested value
      testValidator.setReturnValues({ isValid: [false, true] });
      const options: RJSFSchema[] = [
        { type: "object", properties: { id: { enum: ["a"] } } },
        {
          type: "object",
          properties: {
            id: { enum: ["nested"] },
            child: { $ref: "#/definitions/any" },
          },
        },
      ];
      const formData = {
        id: "nested",
        child: {
          id: "nested",
          child: {
            id: "a",
          },
        },
      };
      const schemaUtils = createSchemaUtils(testValidator, rootSchema);
      expect(schemaUtils.getMatchingOption(formData, options)).toEqual(1);
    });
  });
}
