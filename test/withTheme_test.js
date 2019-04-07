import { expect } from "chai";
import React from "react";

import { withTheme } from "../src";
import { createComponent, createSandbox } from "./test_utils";

describe.only("withTheme", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("With widgets", () => {
    it("should use the provided widgets", () => {
      const widgets = {
        TextWidget: () => <div id="test" />,
      };
      const schema = {
        type: "string",
      };
      const uiSchema = {};
      let { node } = createComponent(withTheme({ widgets }), {
        schema,
        uiSchema,
      });
      expect(node.querySelectorAll("#test")).to.have.length.of(1);
    });
  });
});
