import { expect } from "chai";

import { getDefaultFormState } from "../src/utils";


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
});
