import React from "react";
import TextWidget from "../src/TextWidget";
import renderer from "react-test-renderer";
import { makeWidgetMockProps } from "./helpers/createMocks";

describe("TextWidget", () => {
  test("simple", () => {
    const tree = renderer
      .create(<TextWidget {...makeWidgetMockProps({})} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
