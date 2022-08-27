import React from "react";
import renderer from "react-test-renderer";

import TitleField from "../src/TitleField";
import { mockRegistry } from "./helpers/createMocks";

describe("TitleField", () => {
  test("simple", () => {
    const registry = mockRegistry();
    const tree = renderer
      .create(<TitleField id="testid" title="Hello" registry={registry} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
