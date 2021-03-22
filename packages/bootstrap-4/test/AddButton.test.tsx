import React from "react";
import AddButton from "../src/AddButton";
import renderer from "react-test-renderer";

describe("AddButton", () => {
  test("simple", () => {
    const tree = renderer
      .create(
        <AddButton
          className="someClass"
          onClick={() => void 0}
          disabled={false}
        />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
