import React from "react";
import DescriptionField from "../src/DescriptionField";
import renderer from "react-test-renderer";

describe("DescriptionField", () => {
  test("should return null when no description as a props is passed", () => {
    const tree = renderer.create(<DescriptionField />).toJSON();
    expect(tree).toBe(null);
  });

  test("should return h2 element when description is being passed as props", () => {
    const tree = renderer
      .create(<DescriptionField description="SOME THING" />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
