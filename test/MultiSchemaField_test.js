import React from "react";
import { expect } from "chai";
import { Simulate } from "react-addons-test-utils";

import { createFormComponent } from "./test_utils";

describe("MultiSchemaField", () => {
  it("should render the SelectWidget by default", () => {
    const { node } = createFormComponent({
      schema: {
        oneOf: [
          {
            type: "string",
            title: "String Option",
          },
          {
            type: "number",
            title: "Number Option",
          },
        ],
      },
    });

    expect(node.querySelectorAll(".form-control")[0].tagName).eql("SELECT");
    expect(node.querySelectorAll(".form-control option").length).eql(2);
    expect(node.querySelector("label").textContent).eql("String Option");

    Simulate.change(node.querySelector("select"), {
      target: { value: "1" },
    });
    expect(node.querySelector("label").textContent).eql("Number Option");
  });

  it("should render a custom select widget", () => {
    const { node } = createFormComponent({
      schema: {
        oneOf: [
          {
            type: "string",
          },
          {
            type: "number",
          },
        ],
      },
      widgets: {
        SelectWidget: () => {
          return <div className="custom-select-widget" />;
        },
      },
    });

    expect(node.querySelectorAll(".custom-select-widget").length).eql(1);
  });
});
