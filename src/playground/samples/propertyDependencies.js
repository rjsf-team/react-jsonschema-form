import React from "react";

export default {
  schema: {
    title: "Property dependencies",
    description: "These samples are best viewed without live validation.",
    type: "object",
    properties: {
      unidirectional: {
        title: "Unidirectional",
        src:
          "https://spacetelescope.github.io/understanding-json-schema/reference/object.html#dependencies",
        type: "object",
        properties: {
          name: {
            type: "string",
          },
          credit_card: {
            type: "number",
          },
          billing_address: {
            type: "string",
          },
        },
        required: ["name"],
        dependencies: {
          credit_card: ["billing_address"],
        },
      },
      bidirectional: {
        title: "Bidirectional",
        src:
          "https://spacetelescope.github.io/understanding-json-schema/reference/object.html#dependencies",
        description:
          "Dependencies are not bidirectional, you can, of course, define the bidirectional dependencies explicitly.",
        type: "object",
        properties: {
          name: {
            type: "string",
          },
          credit_card: {
            type: "number",
          },
          billing_address: {
            type: "string",
          },
        },
        required: ["name"],
        dependencies: {
          credit_card: ["billing_address"],
          billing_address: ["credit_card"],
        },
      },
    },
  },
  uiSchema: {
    unidirectional: {
      credit_card: {
        "ui:help": (
          <p>
            If you enter anything here then <code>billing_address</code> will
            become required.
          </p>
        ),
      },
      billing_address: {
        "ui:help":
          "It’s okay to have a billing address without a credit card number.",
      },
    },
    bidirectional: {
      credit_card: {
        "ui:help": (
          <p>
            "If you enter anything here then <code>billing_address</code> will
            become required.
          </p>
        ),
      },
      billing_address: {
        "ui:help": (
          <p>
            If you enter anything here then <code>credit_card</code> will become
            required.
          </p>
        ),
      },
    },
  },
  formData: {
    unidirectional: {
      name: "Tim",
    },
    bidirectional: {
      name: "Jill",
    },
  },
};
