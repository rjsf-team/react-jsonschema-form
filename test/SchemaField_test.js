import React from "react";
import { expect } from "chai";
import SchemaField from "../src/components/fields/SchemaField";

import { createFormComponent } from "./test_utils";

describe("Custom SchemaField", () => {
  const CustomSchemaField = function(props) {
    return (<div id="custom"><SchemaField {...props} /></div>);
  };

  it("should use the specified custom SchemaType property", () => {
    const {node} = createFormComponent({
      schema: {type: "string"},
      SchemaField: CustomSchemaField
    });

    expect(node.querySelectorAll("#custom > .field input[type=text]"))
      .to.have.length.of(1);
  });
});
