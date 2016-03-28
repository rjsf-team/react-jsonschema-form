import { expect } from "chai";

import {
  asNumber,
  getDefaultFormState,
  isMultiSelect,
  mergeObjects,
  retrieveSchema,
  shouldRender,
  toIdSchema
} from "../src/utils";


describe("utils", () => {
  describe("getDefaultFormState()", () => {
    describe("root default", () => {
      it("should map root schema default to form state, if any", () => {
        expect(getDefaultFormState({
          type: "string",
          default: "foo",
        })).to.eql("foo");
      });
    });

    describe("nested default", () => {
      it("should map schema object prop default to form state", () => {
        expect(getDefaultFormState({
          type: "object",
          properties: {
            string: {
              type: "string",
              default: "foo",
            }
          }
        })).to.eql({string: "foo"});
      });

      it("should recursively map schema object default to form state", () => {
        expect(getDefaultFormState({
          type: "object",
          properties: {
            object: {
              type: "object",
              properties: {
                string: {
                  type: "string",
                  default: "foo",
                }
              }
            }
          }
        })).to.eql({object: {string: "foo"}});
      });

      it("should map schema array default to form state", () => {
        expect(getDefaultFormState({
          type: "object",
          properties: {
            array: {
              type: "array",
              default: ["foo", "bar"],
              items: {
                type: "string"
              }
            }
          }
        })).to.eql({array: ["foo", "bar"]});
      });

      it("should recursively map schema array default to form state", () => {
        expect(getDefaultFormState({
          type: "object",
          properties: {
            object: {
              type: "object",
              properties: {
                array: {
                  type: "array",
                  default: ["foo", "bar"],
                  items: {
                    type: "string"
                  }
                }
              }
            }
          }
        })).to.eql({object: {array: ["foo", "bar"]}});
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
                    type: "string"
                  }
                },
                bool: {
                  type: "boolean",
                  default: true
                }
              }
            }
          }
        };
        expect(getDefaultFormState(schema, {}))
          .eql({object: {array: ["foo", "bar"], bool: true}});
      });

      it("should keep parent defaults if they don't have a node level default", () => {
        const schema = {
          type: "object",
          properties: {
            level1: {
              type: "object",
              default: {level2: {leaf1: 1, leaf2: 1, leaf3: 1, leaf4: 1}},
              properties: {
                level2: {
                  type: "object",
                  default: {
                    // No level2 default for leaf1
                    leaf2: 2,
                    leaf3: 2
                  },
                  properties: {
                    leaf1: {type: "number"}, // No level2 default for leaf1
                    leaf2: {type: "number"}, // No level3 default for leaf2
                    leaf3: {type: "number", default: 3},
                    leaf4: {type: "number"} // Defined in formData.
                  }
                },
              }
            }
          }
        };
        expect(getDefaultFormState(schema, {level1: {level2: {leaf4: 4}}}))
          .eql({level1: {level2: {leaf1: 1, leaf2: 2, leaf3: 3, leaf4: 4}}});
      });

      it("should use parent defaults for ArrayFields", () => {
        const schema = {
          type: "object",
          properties: {
            level1: {
              type: "array",
              default: [1, 2, 3],
              items: {type: "number"}
            }
          }
        };
        expect(getDefaultFormState(schema, {}))
          .eql({level1: [1, 2, 3]});
      });

      it("should use parent defaults for ArrayFields if declared in parent", () => {
        const schema = {
          type: "object",
          default: {level1: [1, 2, 3]},
          properties: {
            level1: {
              type: "array",
              items: {type: "number"}
            }
          }
        };
        expect(getDefaultFormState(schema, {}))
          .eql({level1: [1, 2, 3]});
      });

      it("should use first enum value when no default is specified", () => {
        const schema = {
          type: "object",
          properties: {
            foo: {
              type: "string",
              enum: ["a", "b", "c"],
            }
          }
        };
        expect(getDefaultFormState(schema, {}))
          .eql({foo: "a"});
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
  });

  describe("isMultiSelect()", () => {
    it("should be true if schema items enum is an array and uniqueItems is true", () => {
      let schema = {items: {enum: ["foo", "bar"]}, uniqueItems: true};
      expect(isMultiSelect(schema)).to.be.true;
    });

    it("should be false if uniqueItems is false", () => {
      const schema = {items: {enum: ["foo", "bar"]}, uniqueItems: false};
      expect(isMultiSelect(schema)).to.be.false;
    });

    it("should be false if schema items enum is not an array", () => {
      const schema = {items: {}, uniqueItems: true};
      expect(isMultiSelect(schema)).to.be.false;
    });
  });

  describe("mergeObjects()", () => {
    it("should't mutate the provided objects", () => {
      const obj1 = {a: 1};
      mergeObjects(obj1, {b: 2});
      expect(obj1).eql({a: 1});
    });

    it("should merge two one-level deep objects", () => {
      expect(mergeObjects({a: 1}, {b: 2})).eql({a: 1, b: 2});
    });

    it("should override the first object with the values from the second", () => {
      expect(mergeObjects({a: 1}, {a: 2})).eql({a: 2});
    });

    it("should recursively merge deeply nested objects", () => {
      const obj1 = {
        a: 1,
        b: {
          c: 3,
          d: [1, 2, 3],
          e: {f: {g: 1}}
        },
        c: 2
      };
      const obj2 = {
        a: 1,
        b: {
          d: [3, 2, 1],
          e: {f: {h: 2}},
          g: 1
        },
        c: 3
      };
      const expected = {
        a: 1,
        b: {
          c: 3,
          d: [3, 2, 1],
          e: {f: {g: 1, h: 2}},
          g: 1
        },
        c: 3
      };
      expect(mergeObjects(obj1, obj2)).eql(expected);
    });
  });

  describe("retrieveSchema()", () => {
    it("should 'resolve' a schema which contains definitions", () => {
      const schema = { $ref: "#/definitions/address" };
      const address_definition = {
        type: "object",
        properties: {
          street_address: { type: "string" },
          city: { type: "string" },
          state: { type: "string" }
        },
        required: [ "street_address", "city", "state" ]
      };
      const definitions = { address: address_definition };
      expect(retrieveSchema(schema, definitions)).eql(address_definition);
    });
  });

  describe("shouldRender", () => {
    describe("single level comparison checks", () => {
      const initial = {props: {myProp: 1}, state: {myState: 1}};

      it("should detect equivalent props and state", () => {
        expect(shouldRender(
          initial,
          {myProp: 1},
          {myState: 1}
        )).eql(false);
      });

      it("should detect diffing props", () => {
        expect(shouldRender(
          initial,
          {myProp: 2},
          {myState: 1}
        )).eql(true);
      });

      it("should detect diffing state", () => {
        expect(shouldRender(
          initial,
          {myProp: 1},
          {myState: 2}
        )).eql(true);
      });

      it("should handle equivalent function prop", () => {
        const fn = () => {};
        expect(shouldRender(
          {props: {myProp: fn}, state: {myState: 1}},
          {myProp: fn},
          {myState: 1}
        )).eql(false);
      });
    });

    describe("nested levels comparison checks", () => {
      const initial = {
        props: {myProp: {mySubProp: 1}},
        state: {myState: {mySubState: 1}}
      };

      it("should detect equivalent props and state", () => {
        expect(shouldRender(
          initial,
          {myProp: {mySubProp: 1}},
          {myState: {mySubState: 1}}
        )).eql(false);
      });

      it("should detect diffing props", () => {
        expect(shouldRender(
          initial,
          {myProp: {mySubProp: 2}},
          {myState: {mySubState: 1}}
        )).eql(true);
      });

      it("should detect diffing state", () => {
        expect(shouldRender(
          initial,
          {myProp: {mySubProp: 1}},
          {myState: {mySubState: 2}}
        )).eql(true);
      });

      it("should handle equivalent function prop", () => {
        const fn = () => {};
        expect(shouldRender(
          {
            props: {myProp: {mySubProp: fn}},
            state: {myState: {mySubState: fn}}
          },
          {myProp: {mySubProp: fn}},
          {myState: {mySubState: fn}}
        )).eql(false);
      });
    });
  });

  describe("toIdSchema", () => {
    it("should return an idSchema for root field", () => {
      const schema = {type: "string"};

      expect(toIdSchema(schema)).eql({id: "root"});
    });

    it("should return an idSchema for nested objects", () => {
      const schema = {
        type: "object",
        properties: {
          level1: {
            type: "object",
            properties: {
              level2: {type: "string"}
            }
          }
        }
      };

      expect(toIdSchema(schema)).eql({
        id: "root",
        level1: {
          id: "root_level1",
          level2: {id: "root_level1_level2"}
        }
      });
    });

    it("should return an idSchema for multiple nested objects", () => {
      const schema = {
        type: "object",
        properties: {
          level1a: {
            type: "object",
            properties: {
              level1a2a: {type: "string"},
              level1a2b: {type: "string"}
            }
          },
          level1b: {
            type: "object",
            properties: {
              level1b2a: {type: "string"},
              level1b2b: {type: "string"}
            }
          }
        }
      };

      expect(toIdSchema(schema)).eql({
        id: "root",
        level1a: {
          id: "root_level1a",
          level1a2a: {id: "root_level1a_level1a2a"},
          level1a2b: {id: "root_level1a_level1a2b"},
        },
        level1b: {
          id: "root_level1b",
          level1b2a: {id: "root_level1b_level1b2a"},
          level1b2b: {id: "root_level1b_level1b2b"},
        },
      });
    });

    it("should return an idSchema for array item objects", () => {
      const schema = {
        type: "array",
        items: {
          type: "object",
          properties: {
            foo: {type: "string"}
          }
        }
      };

      expect(toIdSchema(schema)).eql({
        id: "root",
        foo: {id: "root_foo"}
      });
    });

    it("should retrieve reference schema definitions", () => {
      const schema = {
        definitions: {
          testdef: {
            type: "object",
            properties: {
              foo: {type: "string"},
              bar: {type: "string"},
            }
          }
        },
        $ref: "#/definitions/testdef"
      };

      expect(toIdSchema(schema, undefined, schema.definitions)).eql({
        id: "root",
        foo: {id: "root_foo"},
        bar: {id: "root_bar"}
      });
    });
  });
});
