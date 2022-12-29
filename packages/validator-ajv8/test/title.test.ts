import Ajv2020 from "ajv/dist/2020";
import {
  ErrorSchema,
  ErrorSchemaBuilder,
  RJSFSchema,
  RJSFValidationError,
} from "@rjsf/utils";

import AJV8Validator from "../src/validator";

class TestValidator extends AJV8Validator {
  withIdRefPrefix(schemaNode: RJSFSchema): RJSFSchema {
    return super.withIdRefPrefix(schemaNode);
  }
}

describe("title", () => {
  let builder: ErrorSchemaBuilder;
  beforeAll(() => {
    builder = new ErrorSchemaBuilder();
  });
  afterEach(() => {
    builder.resetAllErrors();
  });
  describe("default options, with Ajv2020", () => {
    // Use the TestValidator to access the `withIdRefPrefix` function
    let validator: TestValidator;
    beforeAll(() => {
      validator = new TestValidator({ AjvClass: Ajv2020 });
    });
    describe("Validating required fields", () => {
      let errors: RJSFValidationError[];
      let errorSchema: ErrorSchema;
      describe("formData is not provided at top level", () => {
        beforeAll(() => {
          const schema: RJSFSchema = {
            type: "object",
            required: ["firstName", "lastName"],
            properties: {
              firstName: { title: "First Name", type: "string" },
              lastName: { title: "Last Name", type: "string" },
            },
          };

          const formData = { firstName: "a" };
          const result = validator.validateFormData(formData, schema);
          errors = result.errors;
          errorSchema = result.errorSchema;
        });
        it("should return an error list", () => {
          expect(errors).toHaveLength(1);
          expect(errors[0].stack).toEqual(
            "must have required property 'Last Name'"
          );
        });
        it("should return an errorSchema", () => {
          expect(errorSchema.lastName!.__errors).toHaveLength(1);
          expect(errorSchema.lastName!.__errors![0]).toEqual(
            "must have required property 'Last Name'"
          );
        });
      });
      describe("formData is not provided for nested child", () => {
        beforeAll(() => {
          const schema: RJSFSchema = {
            type: "object",
            properties: {
              nested: {
                type: "object",
                required: ["firstName", "lastName"],
                properties: {
                  firstName: { type: "string", title: "First Name" },
                  lastName: { type: "string", title: "Last Name" },
                },
              },
            },
          };

          const formData = { nested: { firstName: "a" } };
          const result = validator.validateFormData(formData, schema);
          errors = result.errors;
          errorSchema = result.errorSchema;
        });
        it("should return an error list", () => {
          expect(errors).toHaveLength(1);
          expect(errors[0].stack).toEqual(
            "must have required property 'Last Name'"
          );
        });
        it("should return an errorSchema", () => {
          expect(errorSchema.nested!.lastName!.__errors).toHaveLength(1);
          expect(errorSchema.nested!.lastName!.__errors![0]).toEqual(
            "must have required property 'Last Name'"
          );
        });
      });
    });
  });
});
