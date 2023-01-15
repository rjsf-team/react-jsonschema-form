import { enumOptionsDeselectValue, EnumOptionsType } from "../src";

const ALL_VALUES: EnumOptionsType["value"][] = ["foo", "bar", "baz"];

describe("enumOptionsDeselectValue", () => {
  let selected: EnumOptionsType["value"][];
  it("removes a value from a selected list", () => {
    const value = ALL_VALUES[1];
    selected = enumOptionsDeselectValue(value, ALL_VALUES);
    expect(selected).toEqual([ALL_VALUES[0], ALL_VALUES[2]]);
  });
  it("removes a second value from a selected list", () => {
    const value = ALL_VALUES[0];
    selected = enumOptionsDeselectValue(value, selected);
    expect(selected).toEqual([ALL_VALUES[2]]);
  });
  it("removes a third value from a selected list", () => {
    const value = ALL_VALUES[2];
    expect(enumOptionsDeselectValue(value, selected)).toEqual([]);
  });
});
