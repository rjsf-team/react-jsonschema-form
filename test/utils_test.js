import { expect } from "chai";

import { getDefaultFormState, isMultiSelect, mergeObjects } from "../src/utils";


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
    it("it should't mutate the provided objects", () => {
      const obj1 = {a: 1};
      mergeObjects(obj1, {b: 2});
      expect(obj1).eql({a: 1});
    });

    it("it should merge two one-level deep objects", () => {
      expect(mergeObjects({a: 1}, {b: 2})).eql({a: 1, b: 2});
    });

    it("it should override the first object with the values from the second", () => {
      expect(mergeObjects({a: 1}, {a: 2})).eql({a: 2});
    });

    it("it should recursively merge deeply nested objects", () => {
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
});
