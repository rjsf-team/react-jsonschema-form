import { expect } from "chai";

import { getDefaultFormState, isMultiSelect } from "../src/utils";


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
});
