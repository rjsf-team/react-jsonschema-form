import React, { PureComponent } from "react";

import { expect } from "chai";
import { createFormComponent, createSandbox } from "./test_utils";

describe("ObjectFieldTemplate", () => {
  let sandbox;

  const formData = { foo: "bar", bar: "foo" };

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  class ObjectFieldTemplate extends PureComponent {
    render() {
      const {
        properties,
        title,
        description,
        registry: {
          templates: { TitleTemplate, DescriptionTemplate },
        },
      } = this.props;
      return (
        <div className="root">
          <TitleTemplate title={title} />
          <DescriptionTemplate description={description} />
          <div>
            {properties.map(({ content }, index) => (
              <div key={index} className="property">
                {content}
              </div>
            ))}
          </div>
        </div>
      );
    }
  }

  const TitleTemplate = () => <div className="title-template" />;
  const DescriptionTemplate = ({ description }) =>
    description ? <div className="description-template" /> : null;

  const { node } = createFormComponent({
    schema: {
      type: "object",
      properties: { foo: { type: "string" }, bar: { type: "string" } },
    },
    uiSchema: { "ui:description": "foobar" },
    formData,
    templates: { ObjectFieldTemplate, TitleTemplate, DescriptionTemplate },
  });

  it("should render one root element", () => {
    expect(node.querySelectorAll(".root")).to.have.length.of(1);
  });

  it("should render one title", () => {
    expect(node.querySelectorAll(".title-template")).to.have.length.of(1);
  });

  it("should render one description", () => {
    expect(node.querySelectorAll(".description-template")).to.have.length.of(1);
  });

  it("should render two property containers", () => {
    expect(node.querySelectorAll(".property")).to.have.length.of(2);
  });
});
