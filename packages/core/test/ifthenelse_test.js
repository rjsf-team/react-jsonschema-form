import { expect } from "chai";

import { createFormComponent, createSandbox } from "./test_utils";

describe("conditional items", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  const schema = {
    type: "object",
    properties: {
      street_address: {
        type: "string",
      },
      country: {
        enum: ["United States of America", "Canada"],
      },
    },
    if: {
      properties: { country: { const: "United States of America" } },
    },
    then: {
      properties: { zipcode: { type: "string" } },
    },
    else: {
      properties: { postal_code: { type: "string" } },
    },
  };

  const schemaWithAllOf = {
    type: "object",
    properties: {
      street_address: {
        type: "string",
      },
      country: {
        enum: ["United States of America", "Canada"],
      },
    },
    allOf: [
      {
        if: {
          properties: { country: { const: "United States of America" } },
        },
        then: {
          properties: { zipcode: { type: "string" } },
        },
      },
      // Note this is commented out at the moment because currently this does
      // not support switch style with allOf
      // reason being is that the allOf is merged and it cannot merge this configuration
      // need to come up with a solution here
      {
        if: {
          properties: { country: { const: "United Kingdom" } },
        },
        then: {
          properties: { postcode: { type: "string" } },
        },
      },
    ],
  };

  it("should render then when condition is true", () => {
    const formData = {
      country: "United States of America",
    };

    const { node } = createFormComponent({
      schema,
      formData,
    });

    expect(node.querySelector("input[label=zipcode]")).not.eql(null);
    expect(node.querySelector("input[label=postal_code]")).to.eql(null);
  });

  it("should render else when condition is false", () => {
    const formData = {
      country: "France",
    };

    const { node } = createFormComponent({
      schema,
      formData,
    });

    expect(node.querySelector("input[label=zipcode]")).to.eql(null);
    expect(node.querySelector("input[label=postal_code]")).not.eql(null);
  });

  it("should render correctly when condition is true in allOf (1)", () => {
    const formData = {
      country: "United States of America",
    };

    const { node } = createFormComponent({
      schema: schemaWithAllOf,
      formData,
    });

    expect(node.querySelector("input[label=zipcode]")).not.eql(null);
  });

  it("should render correctly when condition is false in allOf (1)", () => {
    const formData = {
      country: "",
    };

    const { node } = createFormComponent({
      schema: schemaWithAllOf,
      formData,
    });

    expect(node.querySelector("input[label=zipcode]")).to.eql(null);
  });
  /*
  it("should render correctly when condition is true in allof (2)", () => {
    const formData = {
      country: "United Kingdom"
    }

    const { node } = createFormComponent({
      schema: schemaWithAllOf,
      formData
    });

    expect(node.querySelector("input[label=postcode]")).to.eql(null);
  }) */
});
