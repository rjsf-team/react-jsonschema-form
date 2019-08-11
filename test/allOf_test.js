import { expect } from "chai";

import { createFormComponent, createSandbox } from "./test_utils";

describe("allOf", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should render a regular input element with a single type, when multiple types specified", () => {
    const schema = {
      type: "object",
      properties: {
        foo: {
          allOf: [{ type: ["string", "number", "null"] }, { type: "string" }],
        },
      },
    };

    const { node } = createFormComponent({
      schema,
    });

    expect(node.querySelectorAll("input")).to.have.length.of(1);
  });
});
