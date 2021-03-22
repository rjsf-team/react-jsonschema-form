import React from "react";
import DateTimeWidget from "../src/DateTimeWidget";
import renderer from "react-test-renderer";
import { makeWidgetMockProps } from "./helpers/createMocks";

describe("DateTimeWidget", () => {
  test("simple", () => {
    const tree = renderer
      .create(
        <DateTimeWidget {...makeWidgetMockProps({ value: "2020-07-30T13:41:00.268" })} />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
