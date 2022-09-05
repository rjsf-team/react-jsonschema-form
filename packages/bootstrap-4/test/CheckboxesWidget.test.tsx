import React from "react";
import CheckboxesWidget from "../src/CheckboxesWidget";
import renderer from "react-test-renderer";
import { makeWidgetMockProps } from "./helpers/createMocks";

describe("CheckboxesWidget", () => {
  test("simple", () => {
    const tree = renderer
      .create(
        <CheckboxesWidget
          {...makeWidgetMockProps({
            options: {
              enumOptions: [{ label: "", value: "" }],
            },
          })}
        />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("inline", () => {
    const tree = renderer
      .create(
        <CheckboxesWidget
          {...makeWidgetMockProps({
            options: { enumOptions: [{ label: "", value: "" }], inline: true },
          })}
        />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
