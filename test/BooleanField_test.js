import { expect } from "chai";
import { Simulate } from "react-addons-test-utils";

import { createFormComponent } from "./test_utils";

describe("BooleanField", () => {
  it("should render a boolean field", () => {
    const {node} = createFormComponent({schema: {
      type: "boolean"
    }});

    expect(node.querySelectorAll(".field input[type=checkbox]"))
      .to.have.length.of(1);
  });

  it("should render a boolean field with a label", () => {
    const {node} = createFormComponent({schema: {
      type: "boolean",
      title: "foo"
    }});

    expect(node.querySelector(".field label > span").textContent)
      .eql("foo");
  });

  it("should assign a default value", () => {
    const {node} = createFormComponent({schema: {
      type: "boolean",
      default: true,
    }});

    expect(node.querySelector(".field input").checked)
      .eql(true);
  });

  it("should handle a change event", () => {
    const {comp, node} = createFormComponent({schema: {
      type: "boolean",
      default: false,
    }});

    Simulate.change(node.querySelector("input"), {
      target: {checked: true}
    });

    expect(comp.state.formData).eql(true);
  });

  it("should fill field with data", () => {
    const {node} = createFormComponent({schema: {
      type: "boolean",
    }, formData: true});

    expect(node.querySelector(".field input").checked)
      .eql(true);
  });
});
