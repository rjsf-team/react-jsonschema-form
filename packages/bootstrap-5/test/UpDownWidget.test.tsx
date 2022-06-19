import React from "react";
import UpDownWidget from "../src/UpDownWidget";
import renderer from "react-test-renderer";
import { makeWidgetMockProps } from "./helpers/createMocks";

describe("UpDownWidget", () => {
  test("renders 0 as 0 and not ''", () => {
    const tree = renderer
      .create(<UpDownWidget {...{ ...makeWidgetMockProps({}), value: 0 }} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
