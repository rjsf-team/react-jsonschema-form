import React from "react";
import TitleField from "../src/TitleField";
import renderer from "react-test-renderer";

describe("TitleField", () => {
  test("simple", () => {
    const tree = renderer.create(<TitleField title="Hello" uiSchema={{}} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
