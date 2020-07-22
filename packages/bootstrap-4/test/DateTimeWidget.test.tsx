import React from "react";
import DateTimeWidget from "../src/DateTimeWidget";
import renderer from "react-test-renderer";
import { makeWidgetMockProps } from "./helpers/createMocks";

describe("DateTimeWidget", () => {
  test("simple", () => {
    const tree = renderer
      .create(
        <DateTimeWidget {...makeWidgetMockProps({ value: new Date() })} />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
