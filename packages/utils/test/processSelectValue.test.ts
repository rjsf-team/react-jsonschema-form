import { processSelectValue, RJSFSchema } from "../src";

describe("processSelectValue", () => {
  it("always returns undefined for an empty string value with no options", () => {
    expect(processSelectValue({}, "")).toBeUndefined();
  });
  it("always returns undefined for an empty string value with options.emptyValue", () => {
    expect(processSelectValue({}, "", {})).toBeUndefined();
  });
  it("always returns options.emptyValue for an empty string value when present and empty string", () => {
    const options = { emptyValue: "" };
    expect(processSelectValue({}, "", options)).toBe(options.emptyValue);
  });
  it("always returns options.emptyValue for an empty string value when present and null", () => {
    const options = { emptyValue: null };
    expect(processSelectValue({}, "", options)).toBe(options.emptyValue);
  });
  it("always returns options.emptyValue for an empty string value when present and zero", () => {
    const options = { emptyValue: 0 };
    expect(processSelectValue({}, "", options)).toBe(options.emptyValue);
  });
  it("always returns options.emptyValue for an empty string value when present and truthy", () => {
    const options = { emptyValue: "default value" };
    expect(processSelectValue({}, "", options)).toBe(options.emptyValue);
  });
  it("returns an array of numbers when the type is array and items represents a number", () => {
    const schema: RJSFSchema = {
      type: "array",
      items: { type: "number" },
    };
    const value = ["1", "1.2"];
    expect(processSelectValue(schema, value)).toEqual([1, 1.2]);
  });
  it("returns an array of numbers when the type is array and items represents an integer", () => {
    const schema: RJSFSchema = {
      type: "array",
      items: { type: "integer" },
    };
    const value = ["1", "2"];
    expect(processSelectValue(schema, value)).toEqual([1, 2]);
  });
  it("returns an array of strings when the type is array and items do not represent a number", () => {
    const schema: RJSFSchema = {
      type: "array",
      items: { type: "string" },
    };
    const value = ["1", "1.2"];
    expect(processSelectValue(schema, value)).toBe(value);
  });
  it("returns an array of strings when the type is array and items is missing", () => {
    const schema: RJSFSchema = {
      type: "array",
    };
    const value = ["1", "1.2"];
    expect(processSelectValue(schema, value)).toBe(value);
  });
  it('boolean type of value "true" is true', () => {
    const schema: RJSFSchema = {
      type: "boolean",
    };
    expect(processSelectValue(schema, "true")).toBe(true);
  });
  it('boolean type of value "false" string is false', () => {
    const schema: RJSFSchema = {
      type: "boolean",
    };
    expect(processSelectValue(schema, "false")).toBe(false);
  });
  it("integer type is converted", () => {
    const schema: RJSFSchema = {
      type: "integer",
    };
    expect(processSelectValue(schema, "1")).toEqual(1);
  });
  it("number type is converted", () => {
    const schema: RJSFSchema = {
      type: "number",
    };
    expect(processSelectValue(schema, "1.2")).toEqual(1.2);
  });
  it("enum of number is converted", () => {
    const schema: RJSFSchema = {
      enum: [1.1, 2.1, 3.1],
    };
    expect(processSelectValue(schema, "2.1")).toEqual(2.1);
  });
  it("enum of integer is converted", () => {
    const schema: RJSFSchema = {
      enum: [1, 2, 3],
    };
    expect(processSelectValue(schema, "1")).toEqual(1);
  });
  it("enum of boolean is converted", () => {
    const schema: RJSFSchema = {
      enum: [true, false],
    };
    expect(processSelectValue(schema, "true")).toBe(true);
    expect(processSelectValue(schema, "false")).toBe(false);
  });
  it("enum of string is untouched converted", () => {
    const value = "yes";
    const schema: RJSFSchema = {
      enum: [value, "no", "maybe"],
    };
    expect(processSelectValue(schema, value)).toBe(value);
  });
});
