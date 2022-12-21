import { createSchemaUtils, getDefaultFormState, RJSFSchema } from "../../src";
import { computeDefaults } from "../../src/schema/getDefaultFormState";
import { TestValidatorType } from "./types";

export default function getDefaultFormStateTest(
  testValidator: TestValidatorType
) {
  describe("getDefaultFormState()", () => {
    let consoleWarnSpy: jest.SpyInstance;
    beforeAll(() => {
      consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(); // mock this to avoid actually warning in the tests
    });
    afterAll(() => {
      consoleWarnSpy.mockRestore();
    });
    it("throws error when schema is not an object", () => {
      expect(() =>
        getDefaultFormState(testValidator, null as unknown as RJSFSchema)
      ).toThrowError("Invalid schema:");
    });
    describe("computeDefaults()", () => {
      it("test computeDefaults that is passed a schema with a ref", () => {
        const schema: RJSFSchema = {
          definitions: {
            foo: {
              type: "number",
              default: 42,
            },
            testdef: {
              type: "object",
              properties: {
                foo: {
                  $ref: "#/definitions/foo",
                },
              },
            },
          },
          $ref: "#/definitions/testdef",
        };
        expect(
          computeDefaults(testValidator, schema, undefined, schema)
        ).toEqual({
          foo: 42,
        });
      });
      it("test computeDefaults that is passed an object with an optional object property that has a nested required property", () => {
        const schema: RJSFSchema = {
          type: "object",
          properties: {
            optionalProperty: {
              type: "object",
              properties: {
                nestedRequiredProperty: {
                  type: "string",
                },
              },
              required: ["nestedRequiredProperty"],
            },
            requiredProperty: {
              type: "string",
              default: "foo",
            },
          },
          required: ["requiredProperty"],
        };
        expect(
          computeDefaults(testValidator, schema, undefined, schema)
        ).toEqual({ requiredProperty: "foo" });
      });
      it("test computeDefaults that is passed an object with an optional object property that has a nested required property and includeUndefinedValues", () => {
        const schema: RJSFSchema = {
          type: "object",
          properties: {
            optionalProperty: {
              type: "object",
              properties: {
                nestedRequiredProperty: {
                  type: "object",
                  properties: {
                    undefinedProperty: {
                      type: "string",
                    },
                  },
                },
              },
              required: ["nestedRequiredProperty"],
            },
            requiredProperty: {
              type: "string",
              default: "foo",
            },
          },
          required: ["requiredProperty"],
        };
        expect(
          computeDefaults(
            testValidator,
            schema,
            undefined,
            schema,
            undefined,
            true
          )
        ).toEqual({
          optionalProperty: {
            nestedRequiredProperty: {
              undefinedProperty: undefined,
            },
          },
          requiredProperty: "foo",
        });
      });
      it("test computeDefaults that is passed an object with an optional object property that has a nested required property and includeUndefinedValues is 'excludeObjectChildren'", () => {
        const schema: RJSFSchema = {
          type: "object",
          properties: {
            optionalProperty: {
              type: "object",
              properties: {
                nestedRequiredProperty: {
                  type: "object",
                  properties: {
                    undefinedProperty: {
                      type: "string",
                    },
                  },
                },
              },
              required: ["nestedRequiredProperty"],
            },
            requiredProperty: {
              type: "string",
              default: "foo",
            },
          },
          required: ["requiredProperty"],
        };
        expect(
          computeDefaults(
            testValidator,
            schema,
            undefined,
            schema,
            undefined,
            "excludeObjectChildren"
          )
        ).toEqual({
          optionalProperty: {
            nestedRequiredProperty: undefined,
          },
          requiredProperty: "foo",
        });
      });
      it("test computeDefaults handles an invalid property schema", () => {
        const schema: RJSFSchema = {
          type: "object",
          properties: {
            invalidProperty: "not a valid property value",
          },
        } as RJSFSchema;
        expect(
          computeDefaults(
            testValidator,
            schema,
            undefined,
            schema,
            undefined,
            "excludeObjectChildren"
          )
        ).toEqual({});
      });
    });
    describe("root default", () => {
      it("should map root schema default to form state, if any", () => {
        expect(
          getDefaultFormState(testValidator, {
            type: "string",
            default: "foo",
          })
        ).toEqual("foo");
      });
      it("should keep existing form data that is equal to 0", () => {
        expect(
          getDefaultFormState(
            testValidator,
            {
              type: "number",
              default: 1,
            },
            0
          )
        ).toEqual(0);
      });
      it("should keep existing form data that is equal to false", () => {
        expect(
          getDefaultFormState(
            testValidator,
            {
              type: "boolean",
            },
            false
          )
        ).toEqual(false);
      });

      const noneValues = [null, undefined, NaN];
      noneValues.forEach((noneValue) => {
        it("should overwrite existing form data that is equal to a none value", () => {
          expect(
            getDefaultFormState(
              testValidator,
              {
                type: "number",
                default: 1,
              },
              noneValue
            ),
            `for noneValue ${noneValue}`
          ).toEqual(1);
        });
      });
    });
    describe("nested default", () => {
      it("should map schema object prop default to form state", () => {
        expect(
          getDefaultFormState(testValidator, {
            type: "object",
            properties: {
              string: {
                type: "string",
                default: "foo",
              },
            },
          })
        ).toEqual({ string: "foo" });
      });
      it("should default to empty object if no properties are defined", () => {
        expect(
          getDefaultFormState(testValidator, {
            type: "object",
          })
        ).toEqual({});
      });
      it("should recursively map schema object default to form state", () => {
        expect(
          getDefaultFormState(testValidator, {
            type: "object",
            properties: {
              object: {
                type: "object",
                properties: {
                  string: {
                    type: "string",
                    default: "foo",
                  },
                },
              },
            },
          })
        ).toEqual({ object: { string: "foo" } });
      });
      it("should map schema array default to form state", () => {
        expect(
          getDefaultFormState(testValidator, {
            type: "object",
            properties: {
              array: {
                type: "array",
                default: ["foo", "bar"],
                items: {
                  type: "string",
                },
              },
            },
          })
        ).toEqual({ array: ["foo", "bar"] });
      });
      it("should recursively map schema array default to form state", () => {
        expect(
          getDefaultFormState(testValidator, {
            type: "object",
            properties: {
              object: {
                type: "object",
                properties: {
                  array: {
                    type: "array",
                    default: ["foo", "bar"],
                    items: {
                      type: "string",
                    },
                  },
                },
              },
            },
          })
        ).toEqual({ object: { array: ["foo", "bar"] } });
      });
      it("should propagate nested defaults to resulting formData by default", () => {
        const schema: RJSFSchema = {
          type: "object",
          properties: {
            object: {
              type: "object",
              properties: {
                array: {
                  type: "array",
                  default: ["foo", "bar"],
                  items: {
                    type: "string",
                  },
                },
                bool: {
                  type: "boolean",
                  default: true,
                },
              },
            },
          },
        };
        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
          object: { array: ["foo", "bar"], bool: true },
        });
      });
      it("should keep parent defaults if they don`t have a node level default", () => {
        const schema: RJSFSchema = {
          type: "object",
          properties: {
            level1: {
              type: "object",
              default: {
                level2: {
                  leaf1: 1,
                  leaf2: 1,
                  leaf3: 1,
                  leaf4: 1,
                },
              },
              properties: {
                level2: {
                  type: "object",
                  default: {
                    // No level2 default for leaf1
                    leaf2: 2,
                    leaf3: 2,
                  },
                  properties: {
                    leaf1: { type: "number" }, // No level2 default for leaf1
                    leaf2: { type: "number" }, // No level3 default for leaf2
                    leaf3: { type: "number", default: 3 },
                    leaf4: { type: "number" }, // Defined in formData.
                  },
                },
              },
            },
          },
        };
        expect(
          getDefaultFormState(testValidator, schema, {
            level1: { level2: { leaf4: 4 } },
          })
        ).toEqual({
          level1: {
            level2: { leaf1: 1, leaf2: 2, leaf3: 3, leaf4: 4 },
          },
        });
      });
      it("should support nested values in formData", () => {
        const schema: RJSFSchema = {
          type: "object",
          properties: {
            level1: {
              type: "object",
              properties: {
                level2: {
                  oneOf: [
                    {
                      type: "object",
                      properties: {
                        leaf1: {
                          type: "string",
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        };
        const formData = {
          level1: {
            level2: {
              leaf1: "a",
            },
          },
        };
        expect(getDefaultFormState(testValidator, schema, formData)).toEqual({
          level1: { level2: { leaf1: "a" } },
        });
      });
      it("should use parent defaults for ArrayFields", () => {
        const schema: RJSFSchema = {
          type: "object",
          properties: {
            level1: {
              type: "array",
              default: [1, 2, 3],
              items: { type: "number" },
            },
          },
        };
        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
          level1: [1, 2, 3],
        });
      });
      it("should use parent defaults for ArrayFields if declared in parent", () => {
        const schema: RJSFSchema = {
          type: "object",
          default: { level1: [1, 2, 3] },
          properties: {
            level1: {
              type: "array",
              items: { type: "number" },
            },
          },
        };
        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
          level1: [1, 2, 3],
        });
      });
      it("should map item defaults to fixed array default", () => {
        const schema: RJSFSchema = {
          type: "object",
          properties: {
            array: {
              type: "array",
              items: [
                {
                  type: "string",
                  default: "foo",
                },
                {
                  type: "number",
                },
              ],
            },
          },
        };
        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
          array: ["foo", undefined],
        });
      });
      it("should merge schema array item defaults from grandparent for overlapping default definitions", () => {
        const schema: RJSFSchema = {
          type: "object",
          default: {
            level1: { level2: ["root-default-1", "root-default-2"] },
          },
          properties: {
            level1: {
              type: "object",
              properties: {
                level2: {
                  type: "array",
                  items: [
                    {
                      type: "string",
                      default: "child-default-1",
                    },
                    {
                      type: "string",
                    },
                  ],
                },
              },
            },
          },
        };

        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
          level1: { level2: ["child-default-1", "root-default-2"] },
        });
      });
      it("should overwrite schema array item defaults from parent for nested default definitions", () => {
        const schema: RJSFSchema = {
          type: "object",
          default: {
            level1: {
              level2: [{ item: "root-default-1" }, { item: "root-default-2" }],
            },
          },
          properties: {
            level1: {
              type: "object",
              default: { level2: [{ item: "parent-default-1" }, {}] },
              properties: {
                level2: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      item: {
                        type: "string",
                      },
                    },
                  },
                },
              },
            },
          },
        };

        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
          level1: { level2: [{ item: "parent-default-1" }, {}] },
        });
      });
      it("should merge schema array item defaults from the same item for overlapping default definitions", () => {
        const schema: RJSFSchema = {
          type: "object",
          properties: {
            level1: {
              type: "array",
              default: ["property-default-1", "property-default-2"],
              items: [
                {
                  type: "string",
                  default: "child-default-1",
                },
                // this falls back to an empty item when it is missing
              ],
            },
          },
        };

        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
          level1: ["child-default-1", "property-default-2"],
        });
      });
      it("should merge schema from additionalItems defaults into property default", () => {
        const schema: RJSFSchema = {
          type: "object",
          properties: {
            level1: {
              type: "array",
              default: [
                {
                  item: "property-default-1",
                },
                {},
              ],
              additionalItems: {
                type: "object",
                properties: {
                  item: {
                    type: "string",
                    default: "additional-default",
                  },
                },
              },
              items: [
                {
                  type: "object",
                  properties: {
                    item: {
                      type: "string",
                    },
                  },
                },
              ],
            },
          },
        };

        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
          level1: [
            { item: "property-default-1" },
            { item: "additional-default" },
          ],
        });
      });
      it("should overwrite defaults over multiple levels with arrays", () => {
        const schema: RJSFSchema = {
          type: "object",
          default: {
            level1: [
              {
                item: "root-default-1",
              },
              {
                item: "root-default-2",
              },
              {
                item: "root-default-3",
              },
              {
                item: "root-default-4",
              },
            ],
          },
          properties: {
            level1: {
              type: "array",
              default: [
                {
                  item: "property-default-1",
                },
                {},
                {},
              ],
              additionalItems: {
                type: "object",
                properties: {
                  item: {
                    type: "string",
                    default: "additional-default",
                  },
                },
              },
              items: [
                {
                  type: "object",
                  properties: {
                    item: {
                      type: "string",
                    },
                  },
                },
                {
                  type: "object",
                  properties: {
                    item: {
                      type: "string",
                      default: "child-default-2",
                    },
                  },
                },
              ],
            },
          },
        };

        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
          level1: [
            { item: "property-default-1" },
            { item: "child-default-2" },
            { item: "additional-default" },
          ],
        });
      });
      it("should use schema default for referenced definitions", () => {
        const schema: RJSFSchema = {
          definitions: {
            foo: {
              type: "number",
            },
            testdef: {
              type: "object",
              properties: {
                foo: {
                  $ref: "#/definitions/foo",
                },
              },
            },
          },
          $ref: "#/definitions/testdef",
          default: { foo: 42 },
        };
        const schemaUtils = createSchemaUtils(testValidator, schema);

        expect(schemaUtils.getDefaultFormState(schema)).toEqual({
          foo: 42,
        });
      });
      it("should fill array with additional items schema when items is empty", () => {
        const schema: RJSFSchema = {
          type: "object",
          properties: {
            array: {
              type: "array",
              minItems: 1,
              additionalItems: {
                type: "string",
                default: "foo",
              },
              items: [],
            },
          },
        };
        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
          array: ["foo"],
        });
      });
      it("should not fill array with additional items from schema when items is empty and form data contains partial array", () => {
        const schema: RJSFSchema = {
          type: "object",
          properties: {
            array: {
              type: "array",
              minItems: 2,
              additionalItems: {
                type: "string",
                default: "foo",
              },
              items: [],
            },
          },
        };
        expect(
          getDefaultFormState(testValidator, schema, { array: ["bar"] })
        ).toEqual({
          array: ["bar"],
        });
      });
      it("should fill defaults in existing array items", () => {
        const schema: RJSFSchema = {
          type: "array",
          minItems: 2,
          items: {
            type: "object",
            properties: {
              item: {
                type: "string",
                default: "foo",
              },
            },
          },
        };
        expect(getDefaultFormState(testValidator, schema, [{}])).toEqual([
          { item: "foo" },
        ]);
      });
      it("defaults passed along for multiselect arrays when minItems is present", () => {
        const schema: RJSFSchema = {
          type: "object",
          properties: {
            array: {
              type: "array",
              minItems: 1,
              uniqueItems: true,
              default: ["foo", "qux"],
              items: {
                type: "string",
                enum: ["foo", "bar", "fuzz", "qux"],
              },
            },
          },
        };
        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
          array: ["foo", "qux"],
        });
      });
      it("returns empty defaults when no item defaults are defined", () => {
        const schema: RJSFSchema = {
          type: "object",
          properties: {
            array: {
              type: "array",
              minItems: 1,
              uniqueItems: true,
              items: {
                type: "string",
                enum: ["foo", "bar", "fuzz", "qux"],
              },
            },
          },
        };
        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
          array: [],
        });
      });
      it("returns explicit defaults along with auto-fill when provided", () => {
        const schema: RJSFSchema = {
          type: "object",
          properties: {
            turtles: {
              type: "array",
              minItems: 4,
              default: ["Raphael", "Michaelangelo"],
              items: {
                type: "string",
                default: "Unknown",
              },
            },
          },
        };
        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
          turtles: ["Raphael", "Michaelangelo", "Unknown", "Unknown"],
        });
      });
    });
    describe("defaults with oneOf", () => {
      it("should populate defaults for oneOf", () => {
        const schema: RJSFSchema = {
          type: "object",
          properties: {
            name: {
              type: "string",
              oneOf: [
                { type: "string", default: "a" },
                { type: "string", default: "b" },
              ],
            },
          },
        };
        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
          name: "a",
        });
      });
      it("should populate defaults for oneOf when `type`: `object` is missing", () => {
        const schema: RJSFSchema = {
          type: "object",
          oneOf: [
            {
              properties: { name: { type: "string", default: "a" } },
            },
            {
              properties: { id: { type: "number", default: 13 } },
            },
          ],
        };
        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
          name: "a",
        });
      });
      it("should populate nested default values for oneOf", () => {
        const schema: RJSFSchema = {
          type: "object",
          properties: {
            name: {
              type: "object",
              oneOf: [
                {
                  type: "object",
                  properties: {
                    first: { type: "string", default: "First Name" },
                  },
                },
                { type: "string", default: "b" },
              ],
            },
          },
        };
        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
          name: {
            first: "First Name",
          },
        });
      });
      it("should populate defaults for oneOf + dependencies", () => {
        const schema: RJSFSchema = {
          oneOf: [
            {
              type: "object",
              properties: {
                name: {
                  type: "string",
                },
              },
            },
          ],
          dependencies: {
            name: {
              oneOf: [
                {
                  properties: {
                    name: {
                      type: "string",
                    },
                    grade: {
                      default: "A",
                    },
                  },
                },
              ],
            },
          },
        };
        expect(
          getDefaultFormState(testValidator, schema, { name: "Name" })
        ).toEqual({
          name: "Name",
          grade: "A",
        });
      });
      it("should populate defaults for oneOf second option", () => {
        const schema: RJSFSchema = {
          type: "object",
          properties: {
            test: {
              oneOf: [
                { properties: { a: { type: "string", default: "a" } } },
                { properties: { b: { type: "string", default: "b" } } },
              ],
            },
          },
        };
        // Mock errors so that getMatchingOption works as expected
        testValidator.setReturnValues({ isValid: [false, true] });
        expect(
          getDefaultFormState(testValidator, schema, { test: { b: "b" } })
        ).toEqual({
          test: { b: "b" },
        });
      });
    });
    describe("defaults with anyOf", () => {
      it("should populate defaults for anyOf", () => {
        const schema: RJSFSchema = {
          type: "object",
          properties: {
            name: {
              type: "string",
              anyOf: [
                { type: "string", default: "a" },
                { type: "string", default: "b" },
              ],
            },
          },
        };
        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
          name: "a",
        });
      });
      it("should populate nested default values for anyOf", () => {
        const schema: RJSFSchema = {
          type: "object",
          properties: {
            name: {
              type: "object",
              anyOf: [
                {
                  type: "object",
                  properties: {
                    first: { type: "string", default: "First Name" },
                  },
                },
                { type: "string", default: "b" },
              ],
            },
          },
        };
        expect(getDefaultFormState(testValidator, schema, {})).toEqual({
          name: {
            first: "First Name",
          },
        });
      });
      it("should populate defaults for anyOf + dependencies", () => {
        const schema: RJSFSchema = {
          anyOf: [
            {
              type: "object",
              properties: {
                name: {
                  type: "string",
                },
              },
            },
          ],
          dependencies: {
            name: {
              oneOf: [
                {
                  properties: {
                    name: {
                      type: "string",
                    },
                    grade: {
                      type: "string",
                      default: "A",
                    },
                  },
                },
              ],
            },
          },
        };
        expect(
          getDefaultFormState(testValidator, schema, { name: "Name" })
        ).toEqual({
          name: "Name",
          grade: "A",
        });
      });
      it("should populate defaults for anyOf second option", () => {
        const schema: RJSFSchema = {
          type: "object",
          properties: {
            test: {
              anyOf: [
                { properties: { a: { type: "string", default: "a" } } },
                { properties: { b: { type: "string", default: "b" } } },
              ],
            },
          },
        };
        // Mock errors so that getMatchingOption works as expected
        testValidator.setReturnValues({ isValid: [false, true] });
        expect(
          getDefaultFormState(testValidator, schema, { test: { b: "b" } })
        ).toEqual({
          test: { b: "b" },
        });
      });
    });
    describe("with dependencies", () => {
      it("should populate defaults for dependencies", () => {
        const schema: RJSFSchema = {
          type: "object",
          properties: {
            name: {
              type: "string",
            },
          },
          dependencies: {
            name: {
              oneOf: [
                {
                  properties: {
                    name: {
                      type: "string",
                    },
                    grade: {
                      type: "string",
                      default: "A",
                    },
                  },
                },
              ],
            },
          },
        };
        expect(
          getDefaultFormState(testValidator, schema, { name: "Name" })
        ).toEqual({
          name: "Name",
          grade: "A",
        });
      });
      it("should populate defaults for nested dependencies", () => {
        const schema: RJSFSchema = {
          type: "object",
          properties: {
            foo: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                },
              },
              dependencies: {
                name: {
                  oneOf: [
                    {
                      properties: {
                        name: {
                          type: "string",
                        },
                        grade: {
                          type: "string",
                          default: "A",
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        };
        expect(
          getDefaultFormState(testValidator, schema, { foo: { name: "Name" } })
        ).toEqual({
          foo: {
            name: "Name",
            grade: "A",
          },
        });
      });
      it("should populate defaults for nested dependencies in arrays", () => {
        const schema: RJSFSchema = {
          type: "array",
          items: {
            properties: {
              foo: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                  },
                },
                dependencies: {
                  name: {
                    oneOf: [
                      {
                        properties: {
                          name: {
                            type: "string",
                          },
                          grade: {
                            type: "string",
                            default: "A",
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        };
        expect(
          getDefaultFormState(testValidator, schema, [
            { foo: { name: "Name" } },
          ])
        ).toEqual([
          {
            foo: {
              name: "Name",
              grade: "A",
            },
          },
        ]);
      });
      it("should populate defaults for nested dependencies in arrays when matching enum values in oneOf", () => {
        // Mock errors so that withExactlyOneSubschema works as expected
        testValidator.setReturnValues({
          data: [
            { errors: [], errorSchema: {} }, // First oneOf... first === first
            { errors: [{ stack: "error" }], errorSchema: {} }, // Second oneOf... second !== first
            { errors: [{ stack: "error" }], errorSchema: {} }, // First oneOf... first !== second
            { errors: [], errorSchema: {} }, // Second oneOf... second === second
          ],
        });
        const schema: RJSFSchema = {
          type: "array",
          items: {
            properties: {
              foo: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                  },
                },
                dependencies: {
                  name: {
                    oneOf: [
                      {
                        properties: {
                          name: {
                            enum: ["first"],
                          },
                          grade: {
                            type: "string",
                            default: "A",
                          },
                        },
                      },
                      {
                        properties: {
                          name: {
                            enum: ["second"],
                          },
                          grade: {
                            type: "string",
                            default: "B",
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        };
        expect(
          getDefaultFormState(testValidator, schema, [
            { foo: { name: "first" } },
            { foo: { name: "second" } },
            { foo: { name: "third" } },
          ])
        ).toEqual([
          {
            foo: {
              name: "first",
              grade: "A",
            },
          },
          {
            foo: {
              name: "second",
              grade: "B",
            },
          },
          {
            foo: {
              name: "third",
            },
          },
        ]);
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          "ignoring oneOf in dependencies because there isn't exactly one subschema that is valid"
        );
      });
      it("should populate defaults for nested oneOf + dependencies", () => {
        const schema: RJSFSchema = {
          type: "object",
          properties: {
            foo: {
              oneOf: [
                {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                    },
                  },
                },
              ],
              dependencies: {
                name: {
                  oneOf: [
                    {
                      properties: {
                        name: {
                          type: "string",
                        },
                        grade: {
                          type: "string",
                          default: "A",
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        };
        expect(
          getDefaultFormState(testValidator, schema, { foo: { name: "Name" } })
        ).toEqual({
          foo: {
            name: "Name",
            grade: "A",
          },
        });
      });
      it("should populate defaults for nested dependencies when formData passed to computeDefaults is undefined", () => {
        const schema: RJSFSchema = {
          type: "object",
          properties: {
            can_1: {
              type: "object",
              properties: {
                phy: {
                  title: "Physical",
                  description: "XYZ",
                  type: "object",
                  properties: {
                    bit_rate_cfg_mode: {
                      title: "Sub title",
                      description: "XYZ",
                      type: "integer",
                      default: 0,
                    },
                  },
                  dependencies: {
                    bit_rate_cfg_mode: {
                      oneOf: [
                        {
                          properties: {
                            bit_rate_cfg_mode: {
                              enum: [0],
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        };
        expect(getDefaultFormState(testValidator, schema, undefined)).toEqual({
          can_1: {
            phy: {
              bit_rate_cfg_mode: 0,
            },
          },
        });
      });
      it("should not crash for defaults for nested dependencies when formData passed to computeDefaults is null", () => {
        const schema: RJSFSchema = {
          type: "object",
          properties: {
            can_1: {
              type: "object",
              properties: {
                phy: {
                  title: "Physical",
                  description: "XYZ",
                  type: "object",
                  properties: {
                    bit_rate_cfg_mode: {
                      title: "Sub title",
                      description: "XYZ",
                      type: "integer",
                      default: 0,
                    },
                  },
                  dependencies: {
                    bit_rate_cfg_mode: {
                      oneOf: [
                        {
                          properties: {
                            bit_rate_cfg_mode: {
                              enum: [0],
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        };
        expect(
          getDefaultFormState(testValidator, schema, { can_1: { phy: null } })
        ).toEqual({
          can_1: {
            phy: null,
          },
        });
      });
    });
    describe("with schema keys not defined in the formData", () => {
      it("shouldn`t add in undefined keys to formData", () => {
        const schema: RJSFSchema = {
          type: "object",
          properties: {
            foo: { type: "string" },
            bar: { type: "string" },
          },
        };
        const formData = {
          foo: "foo",
          baz: "baz",
        };
        const result = {
          foo: "foo",
          baz: "baz",
        };
        expect(getDefaultFormState(testValidator, schema, formData)).toEqual(
          result
        );
      });
    });
  });
}
