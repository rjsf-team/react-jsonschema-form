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
    const fields = {custom: CustomComponent};

    const {node} = createFormComponent({
      schema: schema,
      uiSchema: {"ui:field": "custom"},
      fields,
      formContext
    });

    expect(node.querySelectorAll("#" + formContext.foo))
      .to.have.length.of(1);
  });

  it("should be passed to custom widget", () => {
    const widgets = {custom: CustomComponent};

    const {node} = createFormComponent({
      schema: {type: "string"},
      uiSchema: {"ui:widget": "custom"},
      widgets,
      formContext
    });

    expect(node.querySelectorAll("#" + formContext.foo))
      .to.have.length.of(1);
  });

  it("should be passed to custom TitleField", () => {
    const fields = {TitleField: CustomComponent};

    const {node} = createFormComponent({
      schema: {
        type: "object",
        title: "A title",
        properties: {
          prop: {
            type:  "string"
          }
        }
      },
      fields,
      formContext
    });

    expect(node.querySelectorAll("#" + formContext.foo))
      .to.have.length.of(1);
  });

  it("should be passed to custom DescriptionField", () => {
    const fields = {DescriptionField: CustomComponent};

    const {node} = createFormComponent({
      schema: {type: "string"},
      uiSchema: {
        "ui:description": "A description"
      },
      fields,
      formContext
    });

    expect(node.querySelectorAll("#" + formContext.foo))
      .to.have.length.of(1);
  });
});
