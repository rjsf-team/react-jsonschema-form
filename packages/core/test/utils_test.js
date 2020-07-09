import { expect } from "chai";
import React from "react";

import {
  ADDITIONAL_PROPERTY_FLAG,
  asNumber,
  orderProperties,
  dataURItoBlob,
  deepEquals,
  getDefaultFormState,
  getSchemaType,
  getWidget,
  isFilesArray,
  isConstant,
  toConstant,
  isMultiSelect,
  mergeDefaultsWithFormData,
  mergeObjects,
  pad,
  parseDateString,
  retrieveSchema,
  shouldRender,
  toDateString,
  toIdSchema,
  toPathSchema,
  guessType,
  mergeSchemas,
  getDisplayLabel,
  schemaRequiresTrueValue,
} from "../src/utils";
import { createSandbox } from "./test_utils";

describe("utils", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("getDefaultFormState()", () => {
    describe("root default", () => {
      it("should map root schema default to form state, if any", () => {
        expect(
          getDefaultFormState({
            type: "string",
            default: "foo",
          })
        ).to.eql("foo");
      });

      it("should keep existing form data that is equal to 0", () => {
        expect(
          getDefaultFormState(
            {
              type: "number",
              default: 1,
            },
            0
          )
        ).to.eql(0);
      });

      it("should keep existing form data that is equal to false", () => {
        expect(
          getDefaultFormState(
            {
              type: "boolean",
            },
            false
          )
        ).to.eql(false);
      });

      const noneValues = [null, undefined, NaN];
      noneValues.forEach(noneValue => {
        it("should overwrite existing form data that is equal to a none value", () => {
          expect(
            getDefaultFormState(
              {
                type: "number",
                default: 1,
              },
              noneValue
            )
          ).to.eql(1);
        });
      });
    });

    describe("nested default", () => {
      it("should map schema object prop default to form state", () => {
        expect(
          getDefaultFormState({
            type: "object",
            properties: {
              string: {
                type: "string",
                default: "foo",
              },
            },
          })
        ).to.eql({ string: "foo" });
      });

      it("should default to empty object if no properties are defined", () => {
        expect(
          getDefaultFormState({
            type: "object",
          })
        ).to.eql({});
      });

      it("should recursively map schema object default to form state", () => {
        expect(
          getDefaultFormState({
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
        ).to.eql({ object: { string: "foo" } });
      });

      it("should map schema array default to form state", () => {
        expect(
          getDefaultFormState({
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
        ).to.eql({ array: ["foo", "bar"] });
      });

      it("should recursively map schema array default to form state", () => {
        expect(
          getDefaultFormState({
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
        ).to.eql({ object: { array: ["foo", "bar"] } });
      });

      it("should propagate nested defaults to resulting formData by default", () => {
        const schema = {
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
        expect(getDefaultFormState(schema, {})).eql({
          object: { array: ["foo", "bar"], bool: true },
        });
      });

      it("should keep parent defaults if they don't have a node level default", () => {
        const schema = {
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
          getDefaultFormState(schema, {
            level1: { level2: { leaf4: 4 } },
          })
        ).eql({
          level1: {
            level2: { leaf1: 1, leaf2: 2, leaf3: 3, leaf4: 4 },
          },
        });
      });

      it("should support nested values in formData", () => {
        const schema = {
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
        expect(getDefaultFormState(schema, formData)).eql({
          level1: { level2: { leaf1: "a" } },
        });
      });

      it("should use parent defaults for ArrayFields", () => {
        const schema = {
          type: "object",
          properties: {
            level1: {
              type: "array",
              default: [1, 2, 3],
              items: { type: "number" },
            },
          },
        };
        expect(getDefaultFormState(schema, {})).eql({
          level1: [1, 2, 3],
        });
      });

      it("should use parent defaults for ArrayFields if declared in parent", () => {
        const schema = {
          type: "object",
          default: { level1: [1, 2, 3] },
          properties: {
            level1: {
              type: "array",
              items: { type: "number" },
            },
          },
        };
        expect(getDefaultFormState(schema, {})).eql({
          level1: [1, 2, 3],
        });
      });

      it("should map item defaults to fixed array default", () => {
        const schema = {
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
        expect(getDefaultFormState(schema, {})).eql({
          array: ["foo", undefined],
        });
      });

      it("should merge schema array item defaults from grandparent for overlapping default definitions", () => {
        const schema = {
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

        expect(getDefaultFormState(schema, {})).eql({
          level1: { level2: ["child-default-1", "root-default-2"] },
        });
      });

      it("should overwrite schema array item defaults from parent for nested default definitions", () => {
        const schema = {
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

        expect(getDefaultFormState(schema, {})).eql({
          level1: { level2: [{ item: "parent-default-1" }, {}] },
        });
      });

      it("should merge schema array item defaults from the same item for overlapping default definitions", () => {
        const schema = {
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
                {
                  type: "string",
                },
              ],
            },
          },
        };

        expect(getDefaultFormState(schema, {})).eql({
          level1: ["child-default-1", "property-default-2"],
        });
      });

      it("should merge schema from additionalItems defaults into property default", () => {
        const schema = {
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

        expect(getDefaultFormState(schema, {})).eql({
          level1: [
            { item: "property-default-1" },
            { item: "additional-default" },
          ],
        });
      });

      it("should overwrite defaults over multiple levels with arrays", () => {
        const schema = {
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

        expect(getDefaultFormState(schema, {})).eql({
          level1: [
            { item: "property-default-1" },
            { item: "child-default-2" },
            { item: "additional-default" },
          ],
        });
      });

      it("should use schema default for referenced definitions", () => {
        const schema = {
          definitions: {
            testdef: {
              type: "object",
              properties: {
                foo: { type: "number" },
              },
            },
          },
          $ref: "#/definitions/testdef",
          default: { foo: 42 },
        };

        expect(getDefaultFormState(schema, undefined, schema)).eql({
          foo: 42,
        });
      });

      it("should fill array with additional items schema when items is empty", () => {
        const schema = {
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
        expect(getDefaultFormState(schema, {})).eql({
          array: ["foo"],
        });
      });

      it("should not fill array with additional items from schema when items is empty and form data contains partial array", () => {
        const schema = {
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
        expect(getDefaultFormState(schema, { array: ["bar"] })).eql({
          array: ["bar"],
        });
      });

      it("should fill defaults in existing array items", () => {
        const schema = {
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
        expect(getDefaultFormState(schema, [{}])).eql([{ item: "foo" }]);
      });

      it("defaults passed along for multiselect arrays when minItems is present", () => {
        const schema = {
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
        expect(getDefaultFormState(schema, {})).eql({
          array: ["foo", "qux"],
        });
      });
    });

    describe("defaults with oneOf", () => {
      it("should populate defaults for oneOf", () => {
        const schema = {
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
        expect(getDefaultFormState(schema, {})).eql({
          name: "a",
        });
      });

      it("should populate defaults for oneOf when 'type': 'object' is missing", () => {
        const schema = {
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
        expect(getDefaultFormState(schema, {})).eql({
          name: "a",
        });
      });

      it("should populate nested default values for oneOf", () => {
        const schema = {
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
        expect(getDefaultFormState(schema, {})).eql({
          name: {
            first: "First Name",
          },
        });
      });

      it("should populate defaults for oneOf + dependencies", () => {
        const schema = {
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
        expect(getDefaultFormState(schema, { name: "Name" })).eql({
          name: "Name",
          grade: "A",
        });
      });
    });

    describe("defaults with anyOf", () => {
      it("should populate defaults for anyOf", () => {
        const schema = {
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
        expect(getDefaultFormState(schema, {})).eql({
          name: "a",
        });
      });

      it("should populate nested default values for anyOf", () => {
        const schema = {
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
        expect(getDefaultFormState(schema, {})).eql({
          name: {
            first: "First Name",
          },
        });
      });

      it("should populate defaults for anyOf + dependencies", () => {
        const schema = {
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
        expect(getDefaultFormState(schema, { name: "Name" })).eql({
          name: "Name",
          grade: "A",
        });
      });
    });

    describe("with dependencies", () => {
      it("should populate defaults for dependencies", () => {
        const schema = {
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
        expect(getDefaultFormState(schema, { name: "Name" })).eql({
          name: "Name",
          grade: "A",
        });
      });

      it("should populate defaults for nested dependencies", () => {
        const schema = {
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
        expect(getDefaultFormState(schema, { foo: { name: "Name" } })).eql({
          foo: {
            name: "Name",
            grade: "A",
          },
        });
      });

      it("should populate defaults for nested dependencies in arrays", () => {
        const schema = {
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
        expect(getDefaultFormState(schema, [{ foo: { name: "Name" } }])).eql([
          {
            foo: {
              name: "Name",
              grade: "A",
            },
          },
        ]);
      });

      it("should populate defaults for nested dependencies in arrays when matching enum values in oneOf", () => {
        const schema = {
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
          getDefaultFormState(schema, [
            { foo: { name: "first" } },
            { foo: { name: "second" } },
            { foo: { name: "third" } },
          ])
        ).eql([
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
      });

      it("should populate defaults for nested oneOf + dependencies", () => {
        const schema = {
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
        expect(getDefaultFormState(schema, { foo: { name: "Name" } })).eql({
          foo: {
            name: "Name",
            grade: "A",
          },
        });
      });

      it("should populate defaults for nested dependencies when formData passed to computeDefaults is undefined", () => {
        const schema = {
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
        expect(getDefaultFormState(schema, undefined)).eql({
          can_1: {
            phy: {
              bit_rate_cfg_mode: 0,
            },
          },
        });
      });

      it("should not crash for defaults for nested dependencies when formData passed to computeDefaults is null", () => {
        const schema = {
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
        expect(getDefaultFormState(schema, { can_1: { phy: null } })).eql({
          can_1: {
            phy: null,
          },
        });
      });
    });

    describe("with schema keys not defined in the formData", () => {
      it("shouldn't add in undefined keys to formData", () => {
        const schema = {
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
        expect(getDefaultFormState(schema, formData)).to.eql(result);
      });
    });
  });

  describe("asNumber()", () => {
    it("should return a number out of a string representing a number", () => {
      expect(asNumber("3")).eql(3);
    });

    it("should return a float out of a string representing a float", () => {
      expect(asNumber("3.14")).eql(3.14);
    });

    it("should return the raw value if the input ends with a dot", () => {
      expect(asNumber("3.")).eql("3.");
    });

    it("should not convert the value to an integer if the input ends with a 0", () => {
      // this is to allow users to input 3.07
      expect(asNumber("3.0")).eql("3.0");
    });

    it("should allow numbers with a 0 in the first decimal place", () => {
      expect(asNumber("3.07")).eql(3.07);
    });

    it("should return undefined if the input is empty", () => {
      expect(asNumber("")).eql(undefined);
    });

    it("should return null if the input is null", () => {
      expect(asNumber(null)).eql(null);
    });
  });

  describe("orderProperties()", () => {
    it("should remove from order elements that are not in properties", () => {
      const properties = ["foo", "baz"];
      const order = ["foo", "bar", "baz", "qux"];
      expect(orderProperties(properties, order)).eql(["foo", "baz"]);
    });

    it("should order properties according to the order", () => {
      const properties = ["bar", "foo"];
      const order = ["foo", "bar"];
      expect(orderProperties(properties, order)).eql(["foo", "bar"]);
    });

    it("should replace * with properties that are absent in order", () => {
      const properties = ["foo", "bar", "baz"];
      const order = ["*", "foo"];
      expect(orderProperties(properties, order)).eql(["bar", "baz", "foo"]);
    });

    it("should handle more complex ordering case correctly", () => {
      const properties = ["foo", "baz", "qux", "bar"];
      const order = ["quux", "foo", "*", "corge", "baz"];
      expect(orderProperties(properties, order)).eql([
        "foo",
        "qux",
        "bar",
        "baz",
      ]);
    });
  });

  describe("isConstant", () => {
    it("should return false when neither enum nor const is defined", () => {
      const schema = {};
      expect(isConstant(schema)).to.be.false;
    });

    it("should return true when schema enum is an array of one item", () => {
      const schema = { enum: ["foo"] };
      expect(isConstant(schema)).to.be.true;
    });

    it("should return false when schema enum contains several items", () => {
      const schema = { enum: ["foo", "bar", "baz"] };
      expect(isConstant(schema)).to.be.false;
    });

    it("should return true when schema const is defined", () => {
      const schema = { const: "foo" };
      expect(isConstant(schema)).to.be.true;
    });
  });

  describe("toConstant()", () => {
    describe("schema contains an enum array", () => {
      it("should return its first value when it contains a unique element", () => {
        const schema = { enum: ["foo"] };
        expect(toConstant(schema)).eql("foo");
      });

      it("should return schema const value when it exists", () => {
        const schema = { const: "bar" };
        expect(toConstant(schema)).eql("bar");
      });

      it("should throw when it contains more than one element", () => {
        const schema = { enum: ["foo", "bar"] };
        expect(() => {
          toConstant(schema);
        }).to.Throw(Error, "cannot be inferred");
      });
    });
  });

  describe("isMultiSelect()", () => {
    describe("uniqueItems is true", () => {
      describe("schema items enum is an array", () => {
        it("should be true", () => {
          let schema = {
            items: { enum: ["foo", "bar"] },
            uniqueItems: true,
          };
          expect(isMultiSelect(schema)).to.be.true;
        });
      });

      it("should be false if items is undefined", () => {
        const schema = {};
        expect(isMultiSelect(schema)).to.be.false;
      });

      describe("schema items enum is not an array", () => {
        const constantSchema = { type: "string", enum: ["Foo"] };
        const notConstantSchema = { type: "string" };

        it("should be false if oneOf/anyOf is not in items schema", () => {
          const schema = { items: {}, uniqueItems: true };
          expect(isMultiSelect(schema)).to.be.false;
        });

        it("should be false if oneOf/anyOf schemas are not all constants", () => {
          const schema = {
            items: { oneOf: [constantSchema, notConstantSchema] },
            uniqueItems: true,
          };
          expect(isMultiSelect(schema)).to.be.false;
        });

        it("should be true if oneOf/anyOf schemas are all constants", () => {
          const schema = {
            items: { oneOf: [constantSchema, constantSchema] },
            uniqueItems: true,
          };
          expect(isMultiSelect(schema)).to.be.true;
        });
      });

      it("should retrieve reference schema definitions", () => {
        const schema = {
          items: { $ref: "#/definitions/FooItem" },
          uniqueItems: true,
        };
        const definitions = {
          FooItem: { type: "string", enum: ["foo"] },
        };
        expect(isMultiSelect(schema, { definitions })).to.be.true;
      });
    });

    it("should be false if uniqueItems is false", () => {
      const schema = {
        items: { enum: ["foo", "bar"] },
        uniqueItems: false,
      };
      expect(isMultiSelect(schema)).to.be.false;
    });
  });

  describe("isFilesArray()", () => {
    it("should be true if items have data-url format", () => {
      const schema = { items: { type: "string", format: "data-url" } };
      const uiSchema = {};
      expect(isFilesArray(schema, uiSchema)).to.be.true;
    });

    it("should be false if items is undefined", () => {
      const schema = {};
      const uiSchema = {};
      expect(isFilesArray(schema, uiSchema)).to.be.false;
    });
  });

  describe("mergeDefaultsWithFormData()", () => {
    it("shouldn't mutate the provided objects", () => {
      const obj1 = { a: 1 };
      mergeDefaultsWithFormData(obj1, { b: 2 });
      expect(obj1).eql({ a: 1 });
    });

    it("shouldn't mutate the provided arrays", () => {
      const array1 = [1];
      mergeDefaultsWithFormData(array1, [2]);
      expect(array1).eql([1]);
    });

    it("should merge two one-level deep objects", () => {
      expect(mergeDefaultsWithFormData({ a: 1 }, { b: 2 })).eql({ a: 1, b: 2 });
    });

    it("should override the first object with the values from the second", () => {
      expect(mergeDefaultsWithFormData({ a: 1 }, { a: 2 })).eql({ a: 2 });
    });

    it("should override non-existing values of the first object with the values from the second", () => {
      expect(
        mergeDefaultsWithFormData(
          { a: { b: undefined } },
          { a: { b: { c: 1 } } }
        )
      ).eql({ a: { b: { c: 1 } } });
    });

    it("should merge arrays using entries from second", () => {
      expect(mergeDefaultsWithFormData([1, 2, 3], [4, 5])).eql([4, 5]);
    });

    it("should deeply merge arrays with overlapping entries", () => {
      expect(mergeDefaultsWithFormData([{ a: 1 }], [{ b: 2 }])).eql([
        { a: 1, b: 2 },
      ]);
    });

    it("should recursively merge deeply nested objects", () => {
      const obj1 = {
        a: 1,
        b: {
          c: 3,
          d: [1, 2, 3],
          e: { f: { g: 1 } },
          h: [{ i: 1 }, { i: 2 }],
        },
        c: 2,
      };
      const obj2 = {
        a: 1,
        b: {
          d: [3],
          e: { f: { h: 2 } },
          g: 1,
          h: [{ i: 3 }],
        },
        c: 3,
      };
      const expected = {
        a: 1,
        b: {
          c: 3,
          d: [3],
          e: { f: { g: 1, h: 2 } },
          g: 1,
          h: [{ i: 3 }],
        },
        c: 3,
      };
      expect(mergeDefaultsWithFormData(obj1, obj2)).eql(expected);
    });

    it("should recursively merge File objects", () => {
      const file = new File(["test"], "test.txt");
      const obj1 = {
        a: {},
      };
      const obj2 = {
        a: file,
      };
      expect(mergeDefaultsWithFormData(obj1, obj2).a).instanceOf(File);
    });
  });

  describe("mergeObjects()", () => {
    it("shouldn't mutate the provided objects", () => {
      const obj1 = { a: 1 };
      mergeObjects(obj1, { b: 2 });
      expect(obj1).eql({ a: 1 });
    });

    it("should merge two one-level deep objects", () => {
      expect(mergeObjects({ a: 1 }, { b: 2 })).eql({ a: 1, b: 2 });
    });

    it("should override the first object with the values from the second", () => {
      expect(mergeObjects({ a: 1 }, { a: 2 })).eql({ a: 2 });
    });

    it("should override non-existing values of the first object with the values from the second", () => {
      expect(mergeObjects({ a: { b: undefined } }, { a: { b: { c: 1 } } })).eql(
        { a: { b: { c: 1 } } }
      );
    });

    it("should recursively merge deeply nested objects", () => {
      const obj1 = {
        a: 1,
        b: {
          c: 3,
          d: [1, 2, 3],
          e: { f: { g: 1 } },
        },
        c: 2,
      };
      const obj2 = {
        a: 1,
        b: {
          d: [3, 2, 1],
          e: { f: { h: 2 } },
          g: 1,
        },
        c: 3,
      };
      const expected = {
        a: 1,
        b: {
          c: 3,
          d: [3, 2, 1],
          e: { f: { g: 1, h: 2 } },
          g: 1,
        },
        c: 3,
      };
      expect(mergeObjects(obj1, obj2)).eql(expected);
    });

    it("should recursively merge File objects", () => {
      const file = new File(["test"], "test.txt");
      const obj1 = {
        a: {},
      };
      const obj2 = {
        a: file,
      };
      expect(mergeObjects(obj1, obj2).a).instanceOf(File);
    });

    describe("concatArrays option", () => {
      it("should not concat arrays by default", () => {
        const obj1 = { a: [1] };
        const obj2 = { a: [2] };

        expect(mergeObjects(obj1, obj2)).eql({ a: [2] });
      });

      it("should concat arrays when concatArrays is true", () => {
        const obj1 = { a: [1] };
        const obj2 = { a: [2] };

        expect(mergeObjects(obj1, obj2, true)).eql({ a: [1, 2] });
      });

      it("should concat nested arrays when concatArrays is true", () => {
        const obj1 = { a: { b: [1] } };
        const obj2 = { a: { b: [2] } };

        expect(mergeObjects(obj1, obj2, true)).eql({
          a: { b: [1, 2] },
        });
      });
    });
  });

  describe("mergeSchemas()", () => {
    it("shouldn't mutate the provided objects", () => {
      const obj1 = { a: 1 };
      mergeSchemas(obj1, { b: 2 });
      expect(obj1).eql({ a: 1 });
    });

    it("should merge two one-level deep objects", () => {
      expect(mergeSchemas({ a: 1 }, { b: 2 })).eql({ a: 1, b: 2 });
    });

    it("should override the first object with the values from the second", () => {
      expect(mergeSchemas({ a: 1 }, { a: 2 })).eql({ a: 2 });
    });

    it("should override non-existing values of the first object with the values from the second", () => {
      expect(mergeSchemas({ a: { b: undefined } }, { a: { b: { c: 1 } } })).eql(
        { a: { b: { c: 1 } } }
      );
    });

    it("should recursively merge deeply nested objects", () => {
      const obj1 = {
        a: 1,
        b: {
          c: 3,
          d: [1, 2, 3],
          e: { f: { g: 1 } },
        },
        c: 2,
      };
      const obj2 = {
        a: 1,
        b: {
          d: [3, 2, 1],
          e: { f: { h: 2 } },
          g: 1,
        },
        c: 3,
      };
      const expected = {
        a: 1,
        b: {
          c: 3,
          d: [3, 2, 1],
          e: { f: { g: 1, h: 2 } },
          g: 1,
        },
        c: 3,
      };
      expect(mergeSchemas(obj1, obj2)).eql(expected);
    });

    it("should recursively merge File objects", () => {
      const file = new File(["test"], "test.txt");
      const obj1 = {
        a: {},
      };
      const obj2 = {
        a: file,
      };
      expect(mergeSchemas(obj1, obj2).a).instanceOf(File);
    });

    describe("arrays", () => {
      it("should not concat arrays", () => {
        const obj1 = { a: [1] };
        const obj2 = { a: [2] };

        expect(mergeSchemas(obj1, obj2)).eql({ a: [2] });
      });

      it("should concat arrays under 'required' keyword", () => {
        const obj1 = { type: "object", required: [1] };
        const obj2 = { type: "object", required: [2] };

        expect(mergeSchemas(obj1, obj2)).eql({
          type: "object",
          required: [1, 2],
        });
      });

      it("should concat arrays under 'required' keyword when one of the schemas is an object type", () => {
        const obj1 = { type: "object", required: [1] };
        const obj2 = { required: [2] };

        expect(mergeSchemas(obj1, obj2)).eql({
          type: "object",
          required: [1, 2],
        });
      });

      it("should concat nested arrays under 'required' keyword", () => {
        const obj1 = { a: { type: "object", required: [1] } };
        const obj2 = { a: { type: "object", required: [2] } };

        expect(mergeSchemas(obj1, obj2)).eql({
          a: { type: "object", required: [1, 2] },
        });
      });

      it("should not include duplicate values when concatting arrays under 'required' keyword", () => {
        const obj1 = { type: "object", required: [1] };
        const obj2 = { type: "object", required: [1] };

        expect(mergeSchemas(obj1, obj2)).eql({ type: "object", required: [1] });
      });

      it("should not concat arrays under 'required' keyword that are not under an object type", () => {
        const obj1 = { required: [1] };
        const obj2 = { required: [2] };

        expect(mergeSchemas(obj1, obj2)).eql({ required: [2] });
      });
    });
  });

  describe("retrieveSchema()", () => {
    it("should 'resolve' a schema which contains definitions", () => {
      const schema = { $ref: "#/definitions/address" };
      const address = {
        type: "object",
        properties: {
          street_address: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
        },
        required: ["street_address", "city", "state"],
      };
      const definitions = { address };

      expect(retrieveSchema(schema, { definitions })).eql(address);
    });

    it("should 'resolve' a schema which contains definitions not in `#/definitions`", () => {
      const address = {
        type: "object",
        properties: {
          street_address: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
        },
        required: ["street_address", "city", "state"],
      };
      const schema = {
        $ref: "#/components/schemas/address",
        components: { schemas: { address } },
      };

      expect(retrieveSchema(schema, schema)).eql({
        components: { schemas: { address } },
        ...address,
      });
    });

    it("should give an error when JSON pointer is not in a URI encoded format", () => {
      const address = {
        type: "object",
        properties: {
          street_address: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
        },
        required: ["street_address", "city", "state"],
      };
      const schema = {
        $ref: "/components/schemas/address",
        components: { schemas: { address } },
      };

      expect(() => retrieveSchema(schema, schema)).to.throw(
        "Could not find a definition"
      );
    });

    it("should give an error when JSON pointer does not point to anything", () => {
      const schema = {
        $ref: "#/components/schemas/address",
        components: { schemas: {} },
      };

      expect(() => retrieveSchema(schema, schema)).to.throw(
        "Could not find a definition"
      );
    });

    it("should 'resolve' escaped JSON Pointers", () => {
      const schema = { $ref: "#/definitions/a~0complex~1name" };
      const address = { type: "string" };
      const definitions = { "a~complex/name": address };

      expect(retrieveSchema(schema, { definitions })).eql(address);
    });

    it("should 'resolve' and stub out a schema which contains an `additionalProperties` with a definition", () => {
      const schema = {
        type: "object",
        additionalProperties: {
          $ref: "#/definitions/components/schemas/address",
        },
      };

      const address = {
        type: "object",
        properties: {
          street_address: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
        },
        required: ["street_address", "city", "state"],
      };

      const definitions = { components: { schemas: { address } } };
      const formData = { newKey: {} };

      expect(retrieveSchema(schema, { definitions }, formData)).eql({
        ...schema,
        properties: {
          newKey: {
            ...address,
            [ADDITIONAL_PROPERTY_FLAG]: true,
          },
        },
      });
    });

    it("should 'resolve' and stub out a schema which contains an `additionalProperties` with a type and definition", () => {
      const schema = {
        type: "string",
        additionalProperties: {
          $ref: "#/definitions/number",
        },
      };

      const number = {
        type: "number",
      };

      const definitions = { number };
      const formData = { newKey: {} };

      expect(retrieveSchema(schema, { definitions }, formData)).eql({
        ...schema,
        properties: {
          newKey: {
            ...number,
            [ADDITIONAL_PROPERTY_FLAG]: true,
          },
        },
      });
    });

    it("should priorize local definitions over foreign ones", () => {
      const schema = {
        $ref: "#/definitions/address",
        title: "foo",
      };
      const address = {
        type: "string",
        title: "bar",
      };
      const definitions = { address };

      expect(retrieveSchema(schema, { definitions })).eql({
        ...address,
        title: "foo",
      });
    });

    describe("property dependencies", () => {
      describe("false condition", () => {
        it("should not add required properties", () => {
          const schema = {
            type: "object",
            properties: {
              a: { type: "string" },
              b: { type: "integer" },
            },
            required: ["a"],
            dependencies: {
              a: ["b"],
            },
          };
          const definitions = {};
          const formData = {};
          expect(retrieveSchema(schema, { definitions }, formData)).eql({
            type: "object",
            properties: {
              a: { type: "string" },
              b: { type: "integer" },
            },
            required: ["a"],
          });
        });
      });

      describe("true condition", () => {
        describe("when required is not defined", () => {
          it("should define required properties", () => {
            const schema = {
              type: "object",
              properties: {
                a: { type: "string" },
                b: { type: "integer" },
              },
              dependencies: {
                a: ["b"],
              },
            };
            const definitions = {};
            const formData = { a: "1" };
            expect(retrieveSchema(schema, { definitions }, formData)).eql({
              type: "object",
              properties: {
                a: { type: "string" },
                b: { type: "integer" },
              },
              required: ["b"],
            });
          });
        });

        describe("when required is defined", () => {
          it("should concat required properties", () => {
            const schema = {
              type: "object",
              properties: {
                a: { type: "string" },
                b: { type: "integer" },
              },
              required: ["a"],
              dependencies: {
                a: ["b"],
              },
            };
            const definitions = {};
            const formData = { a: "1" };
            expect(retrieveSchema(schema, { definitions }, formData)).eql({
              type: "object",
              properties: {
                a: { type: "string" },
                b: { type: "integer" },
              },
              required: ["a", "b"],
            });
          });
        });
      });
    });

    describe("schema dependencies", () => {
      describe("conditional", () => {
        describe("false condition", () => {
          it("should not modify properties", () => {
            const schema = {
              type: "object",
              properties: {
                a: { type: "string" },
              },
              dependencies: {
                a: {
                  properties: {
                    b: { type: "integer" },
                  },
                },
              },
            };
            const definitions = {};
            const formData = {};
            expect(retrieveSchema(schema, { definitions }, formData)).eql({
              type: "object",
              properties: {
                a: { type: "string" },
              },
            });
          });
        });

        describe("true condition", () => {
          it("should add properties", () => {
            const schema = {
              type: "object",
              properties: {
                a: { type: "string" },
              },
              dependencies: {
                a: {
                  properties: {
                    b: { type: "integer" },
                  },
                },
              },
            };
            const definitions = {};
            const formData = { a: "1" };
            expect(retrieveSchema(schema, { definitions }, formData)).eql({
              type: "object",
              properties: {
                a: { type: "string" },
                b: { type: "integer" },
              },
            });
          });
          it("should concat required properties", () => {
            const schema = {
              type: "object",
              properties: {
                a: { type: "string" },
                b: { type: "integer" },
              },
              required: ["a"],
              dependencies: {
                a: {
                  properties: {
                    a: { type: "string" },
                  },
                  required: ["b"],
                },
              },
            };
            const definitions = {};
            const formData = { a: "1" };
            expect(retrieveSchema(schema, { definitions }, formData)).eql({
              type: "object",
              properties: {
                a: { type: "string" },
                b: { type: "integer" },
              },
              required: ["a", "b"],
            });
          });
          it("should not concat enum properties, but should concat 'required' properties", () => {
            const schema = {
              type: "object",
              properties: {
                a: { type: "string", enum: ["FOO", "BAR", "BAZ"] },
                b: { type: "string", enum: ["GREEN", "BLUE", "RED"] },
              },
              required: ["a"],
              dependencies: {
                a: {
                  properties: {
                    a: { enum: ["FOO"] },
                    b: { enum: ["BLUE"] },
                  },
                  required: ["a", "b"],
                },
              },
            };
            const definitions = {};
            const formData = { a: "FOO" };
            expect(retrieveSchema(schema, { definitions }, formData)).eql({
              type: "object",
              properties: {
                a: { type: "string", enum: ["FOO"] },
                b: { type: "string", enum: ["BLUE"] },
              },
              required: ["a", "b"],
            });
          });
        });

        describe("with $ref in dependency", () => {
          it("should retrieve referenced schema", () => {
            const schema = {
              type: "object",
              properties: {
                a: { type: "string" },
              },
              dependencies: {
                a: {
                  $ref: "#/definitions/needsB",
                },
              },
            };
            const definitions = {
              needsB: {
                properties: {
                  b: { type: "integer" },
                },
              },
            };
            const formData = { a: "1" };
            expect(retrieveSchema(schema, { definitions }, formData)).eql({
              type: "object",
              properties: {
                a: { type: "string" },
                b: { type: "integer" },
              },
            });
          });
        });

        describe("with $ref in oneOf", () => {
          it("should retrieve referenced schemas", () => {
            const schema = {
              type: "object",
              properties: {
                a: { enum: ["typeA", "typeB"] },
              },
              dependencies: {
                a: {
                  oneOf: [
                    { $ref: "#/definitions/needsA" },
                    { $ref: "#/definitions/needsB" },
                  ],
                },
              },
            };
            const definitions = {
              needsA: {
                properties: {
                  a: { enum: ["typeA"] },
                  b: { type: "number" },
                },
              },
              needsB: {
                properties: {
                  a: { enum: ["typeB"] },
                  c: { type: "boolean" },
                },
              },
            };
            const formData = { a: "typeB" };
            expect(retrieveSchema(schema, { definitions }, formData)).eql({
              type: "object",
              properties: {
                a: { enum: ["typeA", "typeB"] },
                c: { type: "boolean" },
              },
            });
          });
        });
      });

      describe("dynamic", () => {
        describe("false condition", () => {
          it("should not modify properties", () => {
            const schema = {
              type: "object",
              properties: {
                a: { type: "string" },
              },
              dependencies: {
                a: {
                  oneOf: [
                    {
                      properties: {
                        a: { enum: ["int"] },
                        b: { type: "integer" },
                      },
                    },
                    {
                      properties: {
                        a: { enum: ["bool"] },
                        b: { type: "boolean" },
                      },
                    },
                  ],
                },
              },
            };
            const definitions = {};
            const formData = {};
            expect(retrieveSchema(schema, { definitions }, formData)).eql({
              type: "object",
              properties: {
                a: { type: "string" },
              },
            });
          });
        });

        describe("true condition", () => {
          it("should add 'first' properties given 'first' data", () => {
            const schema = {
              type: "object",
              properties: {
                a: { type: "string", enum: ["int", "bool"] },
              },
              dependencies: {
                a: {
                  oneOf: [
                    {
                      properties: {
                        a: { enum: ["int"] },
                        b: { type: "integer" },
                      },
                    },
                    {
                      properties: {
                        a: { enum: ["bool"] },
                        b: { type: "boolean" },
                      },
                    },
                  ],
                },
              },
            };
            const definitions = {};
            const formData = { a: "int" };
            expect(retrieveSchema(schema, { definitions }, formData)).eql({
              type: "object",
              properties: {
                a: { type: "string", enum: ["int", "bool"] },
                b: { type: "integer" },
              },
            });
          });

          it("should add 'second' properties given 'second' data", () => {
            const schema = {
              type: "object",
              properties: {
                a: { type: "string", enum: ["int", "bool"] },
              },
              dependencies: {
                a: {
                  oneOf: [
                    {
                      properties: {
                        a: { enum: ["int"] },
                        b: { type: "integer" },
                      },
                    },
                    {
                      properties: {
                        a: { enum: ["bool"] },
                        b: { type: "boolean" },
                      },
                    },
                  ],
                },
              },
            };
            const definitions = {};
            const formData = { a: "bool" };
            expect(retrieveSchema(schema, { definitions }, formData)).eql({
              type: "object",
              properties: {
                a: { type: "string", enum: ["int", "bool"] },
                b: { type: "boolean" },
              },
            });
          });

          describe("showing/hiding nested dependencies", () => {
            const schema = {
              type: "object",
              dependencies: {
                employee_accounts: {
                  oneOf: [
                    {
                      properties: {
                        employee_accounts: {
                          const: true,
                        },
                        update_absences: {
                          title: "Update Absences",
                          type: "string",
                          oneOf: [
                            {
                              title: "Both",
                              const: "BOTH",
                            },
                          ],
                        },
                      },
                    },
                  ],
                },
                update_absences: {
                  oneOf: [
                    {
                      properties: {
                        permitted_extension: {
                          title: "Permitted Extension",
                          type: "integer",
                        },
                        update_absences: {
                          const: "BOTH",
                        },
                      },
                    },
                    {
                      properties: {
                        permitted_extension: {
                          title: "Permitted Extension",
                          type: "integer",
                        },
                        update_absences: {
                          const: "MEDICAL_ONLY",
                        },
                      },
                    },
                    {
                      properties: {
                        permitted_extension: {
                          title: "Permitted Extension",
                          type: "integer",
                        },
                        update_absences: {
                          const: "NON_MEDICAL_ONLY",
                        },
                      },
                    },
                  ],
                },
              },
              properties: {
                employee_accounts: {
                  type: "boolean",
                  title: "Employee Accounts",
                },
              },
            };
            const definitions = {};

            it("should not include nested dependencies that should be hidden", () => {
              const formData = {
                employee_accounts: false,
                update_absences: "BOTH",
              };
              expect(retrieveSchema(schema, { definitions }, formData)).eql({
                type: "object",
                properties: {
                  employee_accounts: {
                    type: "boolean",
                    title: "Employee Accounts",
                  },
                },
              });
            });

            it("should include nested dependencies that should not be hidden", () => {
              const formData = {
                employee_accounts: true,
                update_absences: "BOTH",
              };
              expect(retrieveSchema(schema, { definitions }, formData)).eql({
                type: "object",
                properties: {
                  employee_accounts: {
                    type: "boolean",
                    title: "Employee Accounts",
                  },
                  permitted_extension: {
                    title: "Permitted Extension",
                    type: "integer",
                  },
                  update_absences: {
                    title: "Update Absences",
                    type: "string",
                    oneOf: [
                      {
                        title: "Both",
                        const: "BOTH",
                      },
                    ],
                  },
                },
              });
            });
          });
        });

        describe("with $ref in dependency", () => {
          it("should retrieve the referenced schema", () => {
            const schema = {
              type: "object",
              properties: {
                a: { type: "string", enum: ["int", "bool"] },
              },
              dependencies: {
                a: {
                  $ref: "#/definitions/typedInput",
                },
              },
            };
            const definitions = {
              typedInput: {
                oneOf: [
                  {
                    properties: {
                      a: { enum: ["int"] },
                      b: { type: "integer" },
                    },
                  },
                  {
                    properties: {
                      a: { enum: ["bool"] },
                      b: { type: "boolean" },
                    },
                  },
                ],
              },
            };
            const formData = { a: "bool" };
            expect(retrieveSchema(schema, { definitions }, formData)).eql({
              type: "object",
              properties: {
                a: { type: "string", enum: ["int", "bool"] },
                b: { type: "boolean" },
              },
            });
          });
        });
      });
    });

    describe("allOf", () => {
      it("should merge types", () => {
        const schema = {
          allOf: [{ type: ["string", "number", "null"] }, { type: "string" }],
        };
        const definitions = {};
        const formData = {};
        expect(retrieveSchema(schema, { definitions }, formData)).eql({
          type: "string",
        });
      });
      it("should not merge incompatible types", () => {
        sandbox.stub(console, "warn");
        const schema = {
          allOf: [{ type: "string" }, { type: "boolean" }],
        };
        const definitions = {};
        const formData = {};
        expect(retrieveSchema(schema, { definitions }, formData)).eql({});
        expect(
          console.warn.calledWithMatch(/could not merge subschemas in allOf/)
        ).to.be.true;
      });
      it("should merge types with $ref in them", () => {
        const schema = {
          allOf: [{ $ref: "#/definitions/1" }, { $ref: "#/definitions/2" }],
        };
        const definitions = {
          "1": { type: "string" },
          "2": { minLength: 5 },
        };
        const formData = {};
        expect(retrieveSchema(schema, { definitions }, formData)).eql({
          type: "string",
          minLength: 5,
        });
      });
      it("should properly merge schemas with nested allOf's", () => {
        const schema = {
          allOf: [
            {
              type: "string",
              allOf: [{ minLength: 2 }, { maxLength: 5 }],
            },
            {
              type: "string",
              allOf: [{ default: "hi" }, { minLength: 4 }],
            },
          ],
        };
        const definitions = {};
        const formData = {};
        expect(retrieveSchema(schema, { definitions }, formData)).eql({
          type: "string",
          minLength: 4,
          maxLength: 5,
          default: "hi",
        });
      });
    });
  });

  describe("shouldRender", () => {
    describe("single level comparison checks", () => {
      const initial = { props: { myProp: 1 }, state: { myState: 1 } };

      it("should detect equivalent props and state", () => {
        expect(shouldRender(initial, { myProp: 1 }, { myState: 1 })).eql(false);
      });

      it("should detect diffing props", () => {
        expect(shouldRender(initial, { myProp: 2 }, { myState: 1 })).eql(true);
      });

      it("should detect diffing state", () => {
        expect(shouldRender(initial, { myProp: 1 }, { myState: 2 })).eql(true);
      });

      it("should handle equivalent function prop", () => {
        const fn = () => {};
        expect(
          shouldRender(
            { props: { myProp: fn }, state: { myState: 1 } },
            { myProp: fn },
            { myState: 1 }
          )
        ).eql(false);
      });
    });

    describe("nested levels comparison checks", () => {
      const initial = {
        props: { myProp: { mySubProp: 1 } },
        state: { myState: { mySubState: 1 } },
      };

      it("should detect equivalent props and state", () => {
        expect(
          shouldRender(
            initial,
            { myProp: { mySubProp: 1 } },
            { myState: { mySubState: 1 } }
          )
        ).eql(false);
      });

      it("should detect diffing props", () => {
        expect(
          shouldRender(
            initial,
            { myProp: { mySubProp: 2 } },
            { myState: { mySubState: 1 } }
          )
        ).eql(true);
      });

      it("should detect diffing state", () => {
        expect(
          shouldRender(
            initial,
            { myProp: { mySubProp: 1 } },
            { myState: { mySubState: 2 } }
          )
        ).eql(true);
      });

      it("should handle equivalent function prop", () => {
        const fn = () => {};
        expect(
          shouldRender(
            {
              props: { myProp: { mySubProp: fn } },
              state: { myState: { mySubState: fn } },
            },
            { myProp: { mySubProp: fn } },
            { myState: { mySubState: fn } }
          )
        ).eql(false);
      });
    });
  });

  describe("toIdSchema", () => {
    it("should return an idSchema for root field", () => {
      const schema = { type: "string" };

      expect(toIdSchema(schema)).eql({ $id: "root" });
    });

    it("should return an idSchema for nested objects", () => {
      const schema = {
        type: "object",
        properties: {
          level1: {
            type: "object",
            properties: {
              level2: { type: "string" },
            },
          },
        },
      };

      expect(toIdSchema(schema)).eql({
        $id: "root",
        level1: {
          $id: "root_level1",
          level2: { $id: "root_level1_level2" },
        },
      });
    });

    it("should return an idSchema for multiple nested objects", () => {
      const schema = {
        type: "object",
        properties: {
          level1a: {
            type: "object",
            properties: {
              level1a2a: { type: "string" },
              level1a2b: { type: "string" },
            },
          },
          level1b: {
            type: "object",
            properties: {
              level1b2a: { type: "string" },
              level1b2b: { type: "string" },
            },
          },
        },
      };

      expect(toIdSchema(schema)).eql({
        $id: "root",
        level1a: {
          $id: "root_level1a",
          level1a2a: { $id: "root_level1a_level1a2a" },
          level1a2b: { $id: "root_level1a_level1a2b" },
        },
        level1b: {
          $id: "root_level1b",
          level1b2a: { $id: "root_level1b_level1b2a" },
          level1b2b: { $id: "root_level1b_level1b2b" },
        },
      });
    });

    it("schema with an id property must not corrupt the idSchema", () => {
      const schema = {
        type: "object",
        properties: {
          metadata: {
            type: "object",
            properties: {
              id: {
                type: "string",
              },
            },
            required: ["id"],
          },
        },
      };
      expect(toIdSchema(schema)).eql({
        $id: "root",
        metadata: {
          $id: "root_metadata",
          id: { $id: "root_metadata_id" },
        },
      });
    });

    it("should return an idSchema for array item objects", () => {
      const schema = {
        type: "array",
        items: {
          type: "object",
          properties: {
            foo: { type: "string" },
          },
        },
      };

      expect(toIdSchema(schema)).eql({
        $id: "root",
        foo: { $id: "root_foo" },
      });
    });

    it("should retrieve referenced schema definitions", () => {
      const schema = {
        definitions: {
          testdef: {
            type: "object",
            properties: {
              foo: { type: "string" },
              bar: { type: "string" },
            },
          },
        },
        $ref: "#/definitions/testdef",
      };

      expect(toIdSchema(schema, undefined, schema)).eql({
        $id: "root",
        foo: { $id: "root_foo" },
        bar: { $id: "root_bar" },
      });
    });

    it("should return an idSchema for property dependencies", () => {
      const schema = {
        type: "object",
        properties: {
          foo: { type: "string" },
        },
        dependencies: {
          foo: {
            properties: {
              bar: { type: "string" },
            },
          },
        },
      };
      const formData = {
        foo: "test",
      };

      expect(toIdSchema(schema, undefined, schema, formData)).eql({
        $id: "root",
        foo: { $id: "root_foo" },
        bar: { $id: "root_bar" },
      });
    });

    it("should return an idSchema for nested property dependencies", () => {
      const schema = {
        type: "object",
        properties: {
          obj: {
            type: "object",
            properties: {
              foo: { type: "string" },
            },
            dependencies: {
              foo: {
                properties: {
                  bar: { type: "string" },
                },
              },
            },
          },
        },
      };
      const formData = {
        obj: {
          foo: "test",
        },
      };

      expect(toIdSchema(schema, undefined, schema, formData)).eql({
        $id: "root",
        obj: {
          $id: "root_obj",
          foo: { $id: "root_obj_foo" },
          bar: { $id: "root_obj_bar" },
        },
      });
    });

    it("should return an idSchema for unmet property dependencies", () => {
      const schema = {
        type: "object",
        properties: {
          foo: { type: "string" },
        },
        dependencies: {
          foo: {
            properties: {
              bar: { type: "string" },
            },
          },
        },
      };

      const formData = {};

      expect(toIdSchema(schema, undefined, schema, formData)).eql({
        $id: "root",
        foo: { $id: "root_foo" },
      });
    });

    it("should handle idPrefix parameter", () => {
      const schema = {
        definitions: {
          testdef: {
            type: "object",
            properties: {
              foo: { type: "string" },
              bar: { type: "string" },
            },
          },
        },
        $ref: "#/definitions/testdef",
      };

      expect(toIdSchema(schema, undefined, schema, {}, "rjsf")).eql({
        $id: "rjsf",
        foo: { $id: "rjsf_foo" },
        bar: { $id: "rjsf_bar" },
      });
    });

    it("should handle null form data for object schemas", () => {
      const schema = {
        type: "object",
        properties: {
          foo: { type: "string" },
          bar: { type: "string" },
        },
      };
      const formData = null;
      const result = toIdSchema(schema, null, {}, formData, "rjsf");

      expect(result).eql({
        $id: "rjsf",
        foo: { $id: "rjsf_foo" },
        bar: { $id: "rjsf_bar" },
      });
    });
  });

  describe("toPathSchema", () => {
    it("should return a pathSchema for root field", () => {
      const schema = { type: "string" };

      expect(toPathSchema(schema)).eql({ $name: "" });
    });

    it("should return a pathSchema for nested objects", () => {
      const schema = {
        type: "object",
        properties: {
          level1: {
            type: "object",
            properties: {
              level2: { type: "string" },
            },
          },
        },
      };

      expect(toPathSchema(schema)).eql({
        $name: "",
        level1: {
          $name: "level1",
          level2: { $name: "level1.level2" },
        },
      });
    });

    it("should return a pathSchema for a schema with dependencies", () => {
      const schema = {
        type: "object",
        properties: {
          list: {
            title: "list",
            type: "array",
            items: {
              type: "object",
              properties: {
                a: { type: "string" },
                b: { type: "string" },
              },
              dependencies: {
                b: {
                  properties: {
                    c: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
        },
      };

      const formData = {
        list: [
          {
            a: "a1",
            b: "b1",
            c: "c1",
          },
          {
            a: "a2",
          },
          {
            a: "a2",
            c: "c2",
          },
        ],
      };

      expect(toPathSchema(schema, "", schema, formData)).eql({
        $name: "",
        list: {
          $name: "list",
          "0": {
            $name: "list.0",
            a: {
              $name: "list.0.a",
            },
            b: {
              $name: "list.0.b",
            },
            c: {
              $name: "list.0.c",
            },
          },
          "1": {
            $name: "list.1",
            a: {
              $name: "list.1.a",
            },
            b: {
              $name: "list.1.b",
            },
          },
          "2": {
            $name: "list.2",
            a: {
              $name: "list.2.a",
            },
            b: {
              $name: "list.2.b",
            },
          },
        },
      });
    });

    it("should return a pathSchema for a schema with references", () => {
      const schema = {
        definitions: {
          address: {
            type: "object",
            properties: {
              street_address: {
                type: "string",
              },
              city: {
                type: "string",
              },
              state: {
                type: "string",
              },
            },
            required: ["street_address", "city", "state"],
          },
        },
        type: "object",
        properties: {
          billing_address: {
            title: "Billing address",
            $ref: "#/definitions/address",
          },
        },
      };

      const formData = {
        billing_address: {
          street_address: "21, Jump Street",
          city: "Babel",
          state: "Neverland",
        },
      };

      expect(toPathSchema(schema, "", schema, formData)).eql({
        $name: "",
        billing_address: {
          $name: "billing_address",
          city: {
            $name: "billing_address.city",
          },
          state: {
            $name: "billing_address.state",
          },
          street_address: {
            $name: "billing_address.street_address",
          },
        },
      });
    });

    it("should return a pathSchema for a schema with references in an array item", () => {
      const schema = {
        definitions: {
          address: {
            type: "object",
            properties: {
              street_address: {
                type: "string",
              },
              city: {
                type: "string",
              },
              state: {
                type: "string",
              },
            },
            required: ["street_address", "city", "state"],
          },
        },
        type: "object",
        properties: {
          address_list: {
            title: "Address list",
            type: "array",
            items: {
              $ref: "#/definitions/address",
            },
          },
        },
      };

      const formData = {
        address_list: [
          {
            street_address: "21, Jump Street",
            city: "Babel",
            state: "Neverland",
          },
          {
            street_address: "1234 Schema Rd.",
            city: "New York",
            state: "Arizona",
          },
        ],
      };

      expect(toPathSchema(schema, "", schema, formData)).eql({
        $name: "",
        address_list: {
          $name: "address_list",
          "0": {
            $name: "address_list.0",
            city: {
              $name: "address_list.0.city",
            },
            state: {
              $name: "address_list.0.state",
            },
            street_address: {
              $name: "address_list.0.street_address",
            },
          },
          "1": {
            $name: "address_list.1",
            city: {
              $name: "address_list.1.city",
            },
            state: {
              $name: "address_list.1.state",
            },
            street_address: {
              $name: "address_list.1.street_address",
            },
          },
        },
      });
    });

    it("should return an pathSchema with different types of arrays", () => {
      const schema = {
        definitions: {
          Thing: {
            type: "object",
            properties: {
              name: {
                type: "string",
                default: "Default name",
              },
            },
          },
        },
        type: "object",
        properties: {
          listOfStrings: {
            type: "array",
            title: "A list of strings",
            items: {
              type: "string",
              default: "bazinga",
            },
          },
          multipleChoicesList: {
            type: "array",
            title: "A multiple choices list",
            items: {
              type: "string",
              enum: ["foo", "bar", "fuzz", "qux"],
            },
            uniqueItems: true,
          },
          fixedItemsList: {
            type: "array",
            title: "A list of fixed items",
            items: [
              {
                title: "A string value",
                type: "string",
                default: "lorem ipsum",
              },
              {
                title: "a boolean value",
                type: "boolean",
              },
            ],
            additionalItems: {
              title: "Additional item",
              type: "number",
            },
          },
          minItemsList: {
            type: "array",
            title: "A list with a minimal number of items",
            minItems: 3,
            items: {
              $ref: "#/definitions/Thing",
            },
          },
          defaultsAndMinItems: {
            type: "array",
            title: "List and item level defaults",
            minItems: 5,
            default: ["carp", "trout", "bream"],
            items: {
              type: "string",
              default: "unidentified",
            },
          },
          nestedList: {
            type: "array",
            title: "Nested list",
            items: {
              type: "array",
              title: "Inner list",
              items: {
                type: "string",
                default: "lorem ipsum",
              },
            },
          },
          listOfObjects: {
            type: "array",
            title: "List of objects",
            items: {
              type: "object",
              title: "Object in list",
              properties: {
                name: {
                  type: "string",
                  default: "Default name",
                },
                id: {
                  type: "number",
                  default: "an id",
                },
              },
            },
          },
          unorderable: {
            title: "Unorderable items",
            type: "array",
            items: {
              type: "string",
              default: "lorem ipsum",
            },
          },
          unremovable: {
            title: "Unremovable items",
            type: "array",
            items: {
              type: "string",
              default: "lorem ipsum",
            },
          },
          noToolbar: {
            title: "No add, remove and order buttons",
            type: "array",
            items: {
              type: "string",
              default: "lorem ipsum",
            },
          },
          fixedNoToolbar: {
            title: "Fixed array without buttons",
            type: "array",
            items: [
              {
                title: "A number",
                type: "number",
                default: 42,
              },
              {
                title: "A boolean",
                type: "boolean",
                default: false,
              },
            ],
            additionalItems: {
              title: "A string",
              type: "string",
              default: "lorem ipsum",
            },
          },
        },
      };

      const formData = {
        listOfStrings: ["foo", "bar"],
        multipleChoicesList: ["foo", "bar"],
        fixedItemsList: ["Some text", true, 123],
        minItemsList: [
          {
            name: "Default name",
          },
          {
            name: "Default name",
          },
          {
            name: "Default name",
          },
        ],
        defaultsAndMinItems: [
          "carp",
          "trout",
          "bream",
          "unidentified",
          "unidentified",
        ],
        nestedList: [["lorem", "ipsum"], ["dolor"]],
        listOfObjects: [
          { name: "name1", id: 123 },
          { name: "name2", id: 1234 },
          { id: 12345 },
        ],
        unorderable: ["one", "two"],
        unremovable: ["one", "two"],
        noToolbar: ["one", "two"],
        fixedNoToolbar: [
          42,
          true,
          "additional item one",
          "additional item two",
        ],
      };

      expect(toPathSchema(schema, "", schema, formData)).eql({
        $name: "",
        defaultsAndMinItems: {
          $name: "defaultsAndMinItems",
          "0": {
            $name: "defaultsAndMinItems.0",
          },
          "1": {
            $name: "defaultsAndMinItems.1",
          },
          "2": {
            $name: "defaultsAndMinItems.2",
          },
          "3": {
            $name: "defaultsAndMinItems.3",
          },
          "4": {
            $name: "defaultsAndMinItems.4",
          },
        },
        fixedItemsList: {
          $name: "fixedItemsList",
          "0": {
            $name: "fixedItemsList.0",
          },
          "1": {
            $name: "fixedItemsList.1",
          },
          "2": {
            $name: "fixedItemsList.2",
          },
        },
        fixedNoToolbar: {
          $name: "fixedNoToolbar",
          "0": {
            $name: "fixedNoToolbar.0",
          },
          "1": {
            $name: "fixedNoToolbar.1",
          },
          "2": {
            $name: "fixedNoToolbar.2",
          },
          "3": {
            $name: "fixedNoToolbar.3",
          },
        },
        listOfObjects: {
          $name: "listOfObjects",
          "0": {
            $name: "listOfObjects.0",
            id: {
              $name: "listOfObjects.0.id",
            },
            name: {
              $name: "listOfObjects.0.name",
            },
          },
          "1": {
            $name: "listOfObjects.1",
            id: {
              $name: "listOfObjects.1.id",
            },
            name: {
              $name: "listOfObjects.1.name",
            },
          },
          "2": {
            $name: "listOfObjects.2",
            id: {
              $name: "listOfObjects.2.id",
            },
            name: {
              $name: "listOfObjects.2.name",
            },
          },
        },
        listOfStrings: {
          $name: "listOfStrings",
          "0": {
            $name: "listOfStrings.0",
          },
          "1": {
            $name: "listOfStrings.1",
          },
        },
        minItemsList: {
          $name: "minItemsList",
          "0": {
            $name: "minItemsList.0",
            name: {
              $name: "minItemsList.0.name",
            },
          },
          "1": {
            $name: "minItemsList.1",
            name: {
              $name: "minItemsList.1.name",
            },
          },
          "2": {
            $name: "minItemsList.2",
            name: {
              $name: "minItemsList.2.name",
            },
          },
        },
        multipleChoicesList: {
          $name: "multipleChoicesList",
          "0": {
            $name: "multipleChoicesList.0",
          },
          "1": {
            $name: "multipleChoicesList.1",
          },
        },
        nestedList: {
          $name: "nestedList",
          "0": {
            $name: "nestedList.0",
            "0": {
              $name: "nestedList.0.0",
            },
            "1": {
              $name: "nestedList.0.1",
            },
          },
          "1": {
            $name: "nestedList.1",
            "0": {
              $name: "nestedList.1.0",
            },
          },
        },
        noToolbar: {
          $name: "noToolbar",
          "0": {
            $name: "noToolbar.0",
          },
          "1": {
            $name: "noToolbar.1",
          },
        },
        unorderable: {
          $name: "unorderable",
          "0": {
            $name: "unorderable.0",
          },
          "1": {
            $name: "unorderable.1",
          },
        },
        unremovable: {
          $name: "unremovable",
          "0": {
            $name: "unremovable.0",
          },
          "1": {
            $name: "unremovable.1",
          },
        },
      });
    });
  });

  describe("parseDateString()", () => {
    it("should raise on invalid JSON datetime", () => {
      expect(() => parseDateString("plop")).to.Throw(Error, "Unable to parse");
    });

    it("should return a default object when no datetime is passed", () => {
      expect(parseDateString()).eql({
        year: -1,
        month: -1,
        day: -1,
        hour: -1,
        minute: -1,
        second: -1,
      });
    });

    it("should return a default object when time should not be included", () => {
      expect(parseDateString(undefined, false)).eql({
        year: -1,
        month: -1,
        day: -1,
        hour: 0,
        minute: 0,
        second: 0,
      });
    });

    it("should parse a valid JSON datetime string", () => {
      expect(parseDateString("2016-04-05T14:01:30.182Z")).eql({
        year: 2016,
        month: 4,
        day: 5,
        hour: 14,
        minute: 1,
        second: 30,
      });
    });

    it("should exclude time when includeTime is false", () => {
      expect(parseDateString("2016-04-05T14:01:30.182Z", false)).eql({
        year: 2016,
        month: 4,
        day: 5,
        hour: 0,
        minute: 0,
        second: 0,
      });
    });
  });

  describe("toDateString()", () => {
    it("should transform an object to a valid json datetime if time=true", () => {
      expect(
        toDateString({
          year: 2016,
          month: 4,
          day: 5,
          hour: 14,
          minute: 1,
          second: 30,
        })
      ).eql("2016-04-05T14:01:30.000Z");
    });

    it("should transform an object to a valid date string if time=false", () => {
      expect(
        toDateString(
          {
            year: 2016,
            month: 4,
            day: 5,
          },
          false
        )
      ).eql("2016-04-05");
    });
  });

  describe("pad()", () => {
    it("should pad a string with 0s", () => {
      expect(pad(4, 3)).eql("004");
    });
  });

  describe("dataURItoBlob()", () => {
    it("should return the name of the file if present", () => {
      const { blob, name } = dataURItoBlob(
        "data:image/png;name=test.png;base64,VGVzdC5wbmc="
      );
      expect(name).eql("test.png");
      expect(blob)
        .to.have.property("size")
        .eql(8);
      expect(blob)
        .to.have.property("type")
        .eql("image/png");
    });

    it("should return unknown if name is not provided", () => {
      const { blob, name } = dataURItoBlob(
        "data:image/png;base64,VGVzdC5wbmc="
      );
      expect(name).eql("unknown");
      expect(blob)
        .to.have.property("size")
        .eql(8);
      expect(blob)
        .to.have.property("type")
        .eql("image/png");
    });

    it("should return ignore unsupported parameters", () => {
      const { blob, name } = dataURItoBlob(
        "data:image/png;unknown=foobar;name=test.png;base64,VGVzdC5wbmc="
      );
      expect(name).eql("test.png");
      expect(blob)
        .to.have.property("size")
        .eql(8);
      expect(blob)
        .to.have.property("type")
        .eql("image/png");
    });
  });

  describe("deepEquals()", () => {
    // Note: deepEquals implementation being extracted from node-deeper, it's
    // worthless to reproduce all the tests existing for it; so we focus on the
    // behavioral differences we introduced.
    it("should assume functions are always equivalent", () => {
      expect(deepEquals(() => {}, () => {})).eql(true);
      expect(deepEquals({ foo() {} }, { foo() {} })).eql(true);
      expect(deepEquals({ foo: { bar() {} } }, { foo: { bar() {} } })).eql(
        true
      );
    });
  });

  describe("guessType()", () => {
    it("should guess the type of array values", () => {
      expect(guessType([1, 2, 3])).eql("array");
    });

    it("should guess the type of string values", () => {
      expect(guessType("foobar")).eql("string");
    });

    it("should guess the type of null values", () => {
      expect(guessType(null)).eql("null");
    });

    it("should treat undefined values as null values", () => {
      expect(guessType()).eql("null");
    });

    it("should guess the type of boolean values", () => {
      expect(guessType(true)).eql("boolean");
    });

    it("should guess the type of object values", () => {
      expect(guessType({})).eql("object");
    });
  });

  describe("getSchemaType()", () => {
    const cases = [
      {
        schema: { type: "string" },
        expected: "string",
      },
      {
        schema: { type: "number" },
        expected: "number",
      },
      {
        schema: { type: "integer" },
        expected: "integer",
      },
      {
        schema: { type: "object" },
        expected: "object",
      },
      {
        schema: { type: "array" },
        expected: "array",
      },
      {
        schema: { type: "boolean" },
        expected: "boolean",
      },
      {
        schema: { type: "null" },
        expected: "null",
      },
      {
        schema: { const: "foo" },
        expected: "string",
      },
      {
        schema: { const: 1 },
        expected: "number",
      },
      {
        schema: { type: ["string", "null"] },
        expected: "string",
      },
      {
        schema: { type: ["null", "number"] },
        expected: "number",
      },
      {
        schema: { type: ["integer", "null"] },
        expected: "integer",
      },
      {
        schema: { properties: {} },
        expected: "object",
      },
      {
        schema: { additionalProperties: {} },
        expected: "object",
      },
    ];

    it("should correctly guess the type of a schema", () => {
      for (const test of cases) {
        expect(getSchemaType(test.schema)).eql(
          test.expected,
          `${JSON.stringify(test.schema)} should guess type of ${test.expected}`
        );
      }
    });
  });

  describe("getWidget()", () => {
    const schema = {
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

    it("should fail if widget has incorrect type", () => {
      const Widget = new Number(1);
      expect(() => getWidget(schema, Widget)).to.Throw(
        Error,
        `Unsupported widget definition: object`
      );
    });

    it("should fail if widget has no type property", () => {
      const Widget = "blabla";
      expect(() => getWidget(schema, Widget)).to.Throw(
        Error,
        `No widget for type "object"`
      );
    });

    it("should not fail on correct component", () => {
      const Widget = props => <div {...props} />;
      expect(getWidget(schema, Widget)({})).eql(<Widget options={{}} />);
    });

    it("should not fail on forwarded ref component", () => {
      const Widget = React.forwardRef((props, ref) => (
        <div {...props} ref={ref} />
      ));
      expect(getWidget(schema, Widget)({})).eql(<Widget options={{}} />);
    });

    it("should not fail on memo component", () => {
      const Widget = React.memo(props => <div {...props} />);
      expect(getWidget(schema, Widget)({})).eql(<Widget options={{}} />);
    });
  });

  describe("getDisplayLabel", () => {
    it("object type", () => {
      expect(getDisplayLabel({ type: "object" }, {})).eql(false);
    });
    it("boolean type without widget", () => {
      expect(getDisplayLabel({ type: "boolean" }, {})).eql(false);
    });
    it("boolean type with widget", () => {
      expect(getDisplayLabel({ type: "boolean" }, { "ui:widget": "test" })).eql(
        true
      );
    });
    it("with ui:field", () => {
      expect(getDisplayLabel({ type: "string" }, { "ui:field": "test" })).eql(
        false
      );
    });
    describe("array type", () => {
      it("items", () => {
        expect(
          getDisplayLabel({ type: "array", items: { type: "string" } }, {})
        ).eql(false);
      });
      it("items enum", () => {
        expect(
          getDisplayLabel({ type: "array", enum: ["NW", "NE", "SW", "SE"] }, {})
        ).eql(false);
      });
      it("files type", () => {
        expect(
          getDisplayLabel({ type: "array" }, { "ui:widget": "files" })
        ).eql(true);
      });
    });
  });

  describe("schemaRequiresTrueValue()", () => {
    it("const", () => {
      expect(schemaRequiresTrueValue({ const: true })).eql(true);
    });
    it("enum with multiple", () => {
      expect(schemaRequiresTrueValue({ enum: [true, false] })).eql(false);
    });
    it("enum with one", () => {
      expect(schemaRequiresTrueValue({ enum: [true] })).eql(true);
    });
    it("anyOf with multiple", () => {
      expect(
        schemaRequiresTrueValue({
          anyOf: [{ type: "string" }, { type: "number" }],
        })
      ).eql(false);
    });
    it("anyOf with one that would require true", () => {
      expect(
        schemaRequiresTrueValue({
          anyOf: [{ const: true }],
        })
      ).eql(true);
    });
    it("anyOf with one that would not require true", () => {
      expect(
        schemaRequiresTrueValue({
          anyOf: [{ type: "string" }],
        })
      ).eql(false);
    });
    it("oneOf with multiple", () => {
      expect(
        schemaRequiresTrueValue({
          oneOf: [{ type: "string" }, { type: "number" }],
        })
      ).eql(false);
    });
    it("oneOf with one that would require true", () => {
      expect(
        schemaRequiresTrueValue({
          oneOf: [{ const: true }],
        })
      ).eql(true);
    });
    it("oneOf with one that would not require true", () => {
      expect(
        schemaRequiresTrueValue({
          oneOf: [{ type: "string" }],
        })
      ).eql(false);
    });
    it("allOf with multiple", () => {
      expect(
        schemaRequiresTrueValue({
          allOf: [{ type: "string" }, { type: "number" }],
        })
      ).eql(false);
    });
    it("allOf with one that would require true", () => {
      expect(
        schemaRequiresTrueValue({
          allOf: [{ const: true }],
        })
      ).eql(true);
    });
    it("allOf with one that would not require true", () => {
      expect(
        schemaRequiresTrueValue({
          allOf: [{ type: "string" }],
        })
      ).eql(false);
    });
    it("simply doesn't require true", () => {
      expect(schemaRequiresTrueValue({ type: "string" })).eql(false);
    });
  });
});
