import React from "react";

import { expect } from "chai";
import { createFormComponent } from "./test_utils";

describe("FieldTemplate", () => {

  describe("Custom FieldTemplate for disabled property", () => {
    function FieldTemplate(props) {
      return <div className={props.disabled ? "disabled" : "foo"} />;
    }

    it("should render with disabled when ui:disabled is truthy", () => {
      const { node } = createFormComponent({
        schema: { type: "string" },
        uiSchema: { "ui:disabled": true },
        FieldTemplate,
      });
      expect(node.querySelectorAll(".disabled")).to.have.lengthOf(1);
    });

    it("should render with disabled when ui:disabled is falsey", () => {
      const { node } = createFormComponent({
        schema: { type: "string" },
        uiSchema: { "ui:disabled": false },
        FieldTemplate,
      });
      expect(node.querySelectorAll(".disabled")).to.have.lengthOf(0);
    });
  });
});
