import React from "react";
import ColorWidget from "../src/ColorWidget";
import renderer from "react-test-renderer";
import { makeWidgetMockProps } from "./helpers/createMocks";

describe("ColorWidget", () => {
  test("simple", () => {
    const tree = renderer
      .create(<ColorWidget {...makeWidgetMockProps({})} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
