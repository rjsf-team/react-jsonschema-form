import { expect } from "chai";

import { createFormComponent, createSandbox } from "./test_utils";

describe("array type", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should render a select form component", () => {
    const schema = {
      title: "A registration form",
      description: "A simple form example.",
      properties: {
        email: {
          type: ["string", "array"],
          format: "email",
          uniqueItems: true,
          minItems: 1,
          items: {
            type: "string",
            format: "email",
          },
        },
      },
    };

    const { node } = createFormComponent({
      schema,
    });

    expect(node.querySelectorAll("select option")).to.have.length.of(2);
  });
});
