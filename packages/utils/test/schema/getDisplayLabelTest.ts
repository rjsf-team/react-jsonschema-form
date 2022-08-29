import { createSchemaUtils, getDisplayLabel, RJSFSchema } from "../../src";
import { TestValidatorType } from "./types";

export default function getDisplayLabelTest(testValidator: TestValidatorType) {
  describe("getDisplayLabel()", () => {
    it("object type", () => {
      expect(getDisplayLabel(testValidator, { type: "object" })).toEqual(false);
    });
    it("boolean type without widget", () => {
      expect(getDisplayLabel(testValidator, { type: "boolean" })).toEqual(
        false
      );
    });
    it("boolean type with widget", () => {
      expect(
        getDisplayLabel(
          testValidator,
          { type: "boolean" },
          { "ui:widget": "test" }
        )
      ).toEqual(true);
    });
    it("with ui:field", () => {
      const schema: RJSFSchema = { type: "string" };
      const schemaUtils = createSchemaUtils(testValidator, schema);
      expect(
        schemaUtils.getDisplayLabel(schema, { "ui:field": "test" })
      ).toEqual(false);
    });
    describe("array type", () => {
      it("items", () => {
        expect(
          getDisplayLabel(
            testValidator,
            { type: "array", items: { type: "string" } },
            {}
          )
        ).toEqual(false);
      });
      it("items enum", () => {
        expect(
          getDisplayLabel(
            testValidator,
            { type: "array", enum: ["NW", "NE", "SW", "SE"] },
            {}
          )
        ).toEqual(false);
      });
      it("files type", () => {
        expect(
          getDisplayLabel(
            testValidator,
            { type: "array" },
            { "ui:widget": "files" }
          )
        ).toEqual(true);
      });
      it("custom type", () => {
        expect(
          getDisplayLabel(
            testValidator,
            { type: "array", title: "myAwesomeTitle" },
            { "ui:widget": "MyAwesomeWidget" }
          )
        ).toEqual(true);
      });
    });
  });
}
