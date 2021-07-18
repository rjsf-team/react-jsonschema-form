import React from "react";
import DateWidget from "../src/DateWidget";
import renderer from "react-test-renderer";
import { makeWidgetMockProps } from "./helpers/createMocks";

describe("DateWidget", () => {
  test("simple", () => {
    const tree = renderer
      .create(<DateWidget {...makeWidgetMockProps({})} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
