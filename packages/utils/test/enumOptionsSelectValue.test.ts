import { enumOptionsSelectValue, EnumOptionsType } from "../src";

const ALL_OPTIONS: EnumOptionsType[] = [
  { value: "foo", label: "Foo" },
  { value: "bar", label: "Bar" },
  { value: "baz", label: "Baz" },
  { value: "boo", label: "Boo" },
];

describe("enumOptionsSelectValue", () => {
  let selected: EnumOptionsType["value"][];
  describe("no enumOptions", () => {
    it("adds a value to an empty list", () => {
      const { value } = ALL_OPTIONS[2];
      selected = enumOptionsSelectValue(value, []);
      expect(selected).toEqual([value]);
    });
    it("adds a second value to an existing list in the correct position", () => {
      const { value } = ALL_OPTIONS[0];
      const expected = [...selected, value];
      selected = enumOptionsSelectValue(value, selected);
      expect(selected).toEqual(expected);
    });
    it("adds a third value to an existing list in the correct position", () => {
      const { value } = ALL_OPTIONS[3];
      const expected = [...selected, value];
      selected = enumOptionsSelectValue(value, selected);
      expect(selected).toEqual(expected);
    });
    it("adds the last value to an existing list in the correct position", () => {
      const { value } = ALL_OPTIONS[1];
      const expected = [...selected, value];
      expect(enumOptionsSelectValue(value, selected)).toEqual(expected);
    });
  });
  describe("enumOptions", () => {
    it("adds a value to an empty list", () => {
      const { value } = ALL_OPTIONS[2];
      selected = enumOptionsSelectValue(value, [], ALL_OPTIONS);
      expect(selected).toEqual([value]);
    });
    it("adds a second value to an existing list in the correct position", () => {
      const { value } = ALL_OPTIONS[0];
      const expected = [value, ...selected];
      selected = enumOptionsSelectValue(value, selected, ALL_OPTIONS);
      expect(selected).toEqual(expected);
    });
    it("adds a third value to an existing list in the correct position", () => {
      const { value } = ALL_OPTIONS[3];
      const expected = [...selected, value];
      selected = enumOptionsSelectValue(value, selected, ALL_OPTIONS);
      expect(selected).toEqual(expected);
    });
    it("adds the last value to an existing list in the correct position", () => {
      const { value } = ALL_OPTIONS[1];
      const expected = ALL_OPTIONS.map(({ value }) => value);
      expect(enumOptionsSelectValue(value, selected, ALL_OPTIONS)).toEqual(
        expected
      );
    });
  });
});
