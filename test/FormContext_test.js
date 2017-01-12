import React from "react";
import {expect} from "chai";

import {createFormComponent, createSandbox} from "./test_utils";

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
    return (<div id={props.formContext.foo}/>);
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

    expect(node.querySelector("#" + formContext.foo))
      .to.exist;
  });

  it("should be passed to custom widget", () => {
    const widgets = {custom: CustomComponent};

    const {node} = createFormComponent({
      schema: {type: "string"},
      uiSchema: {"ui:widget": "custom"},
      widgets,
      formContext
    });

    expect(node.querySelector("#" + formContext.foo))
      .to.exist;
  });

  it("should be passed to TemplateField", () => {
    function CustomTemplateField({formContext}) {
      return <div id={formContext.foo}/>;
    }

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
      FieldTemplate: CustomTemplateField,
      formContext
    });

    expect(node.querySelector("#" + formContext.foo))
      .to.exist;
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

    expect(node.querySelector("#" + formContext.foo))
      .to.exist;
  });

  it("should be passed to custom DescriptionField", () => {
    const fields = {DescriptionField: CustomComponent};

    const {node} = createFormComponent({
      schema: {type: "string", description: "A description"},
      fields,
      formContext
    });

    expect(node.querySelector("#" + formContext.foo))
      .to.exist;
  });
});
