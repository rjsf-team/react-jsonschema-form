import { replaceStringParameters } from "../src";

const PARAMS = ["one", "two"];
const REPLACEABLE = "String with %1 replaceable parameters %2";
const REPLACED = "String with one replaceable parameters two";
const NO_REPLACEABLE = "String without replaceable parameter";

describe("replaceStringParameters()", () => {
  it("returns inputString when there are no parameters", () => {
    expect(replaceStringParameters(REPLACEABLE)).toBe(REPLACEABLE);
  });
  it("returns same string as input string when there are no replaceable params", () => {
    expect(replaceStringParameters(NO_REPLACEABLE, PARAMS)).toEqual(
      NO_REPLACEABLE
    );
  });
  it("returns string as input string when there are no replaceable params", () => {
    expect(replaceStringParameters(REPLACEABLE, PARAMS)).toEqual(REPLACED);
  });
});
