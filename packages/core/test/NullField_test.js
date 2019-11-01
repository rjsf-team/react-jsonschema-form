import { expect } from "chai";

import { createFormComponent, createSandbox } from "./test_utils";

describe("NullField", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("No widget", () => {
    it("should render a null field", () => {
      const { node } = createFormComponent({
        schema: {
          type: "null"
        }
      });

      expect(node.querySelectorAll(".field")).to.have.length.of(1);
    });

    it("should render a null field with a label", () => {
      const { node } = createFormComponent({
        schema: {
          type: "null",
          title: "foo"
        }
      });

      expect(node.querySelector(".field label").textContent).eql("foo");
    });

    it("should assign a default value", () => {
      const { comp } = createFormComponent({
        schema: {
          type: "null",
          default: null
        }
      });

      expect(comp.state.formData).eql(null);
    });

    it("should not overwrite existing data", () => {
      const { comp } = createFormComponent({
        schema: {
          type: "null"
        },
        formData: 3
      });

      expect(comp.state.formData).eql(3);
    });
  });
});
