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

  it("should properly merge multiple schemas with refs", () => {
    const schema = {
      definitions: {
        address: {
          type: "object",
          properties: {
            street_address: { type: "string" },
            city: { type: "string" },
            state: { type: "string" },
          },
          required: ["street_address", "city", "state"],
        },
      },

      allOf: [
        { $ref: "#/definitions/address" },
        {
          properties: {
            type: { enum: ["residential", "business"] },
          },
        },
      ],
    };

    const { node } = createFormComponent({
      schema,
    });

    expect(node.querySelectorAll("input")).to.have.length.of(3); // Schema 1
    expect(node.querySelectorAll("select")).to.have.length.of(1); // Schema 2
  });

  it("should be able to handle incompatible types and not crash", () => {
    const schema = {
      type: "object",
      properties: {
        foo: {
          allOf: [{ type: "string" }, { type: "boolean" }], // this will basically pick up the last entry
        },
      },
    };

    const { node } = createFormComponent({
      schema,
    });

    expect(node.querySelectorAll("input")).to.have.length.of(1);
  });
});
