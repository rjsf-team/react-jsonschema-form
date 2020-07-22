import React from "react";
import IconButton from "../src/IconButton";
import renderer from "react-test-renderer";

describe("IconButton", () => {
  test("simple", () => {
    const tree = renderer
      .create(
        <IconButton
          icon="plus"
          className="someClass"
          onClick={() => void 0}
          disabled={false}
        />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  test("disable", () => {
    const tree = renderer
      .create(<IconButton icon="remove" disabled />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
