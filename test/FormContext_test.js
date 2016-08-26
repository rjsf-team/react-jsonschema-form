import React from "react";
import { expect } from "chai";

import { createFormComponent, createSandbox } from "./test_utils";

describe("FormContext", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  const schema = {type: "string"};

  const formContext = {foo: "bar"};

  const CustomComponent = function(props) {
    return (<div id={props.formContext.foo} />);
  };

  it("should be passed to Form", () => {
    const {comp} = createFormComponent({
      schema: schema,
      formContext
    });
    expect(comp.props.formContext).eq(formContext);
  });

  it("should be passed to custom field", () => {
    const fields = {SchemaField: CustomComponent};

    const {node} = createFormComponent({
      schema: schema,
      fields,
      formContext
    });

    expect(node.querySelectorAll("#" + formContext.foo))
      .to.have.length.of(1);
  });

  ["string", "integer", "boolean"].forEach(type => {
    it("should be passed to custom " + type + " widget", () => {
      const widgets = {[type]: CustomComponent};

      const {node} = createFormComponent({
        schema: {type:  type},
        uiSchema: {"ui:widget": type},
        widgets,
        formContext
      });

      expect(node.querySelectorAll("#" + formContext.foo))
        .to.have.length.of(1);
    });
  });
});
