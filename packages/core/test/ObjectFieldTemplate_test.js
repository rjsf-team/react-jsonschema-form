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
        TitleField,
        DescriptionField,
        properties,
        title,
        description,
      } = this.props;
      return (
        <div className="root">
          <TitleField title={title} />
          <DescriptionField description={description} />
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

  const TitleField = () => <div className="title-field" />;
  const DescriptionField = ({ description }) =>
    description ? <div className="description-field" /> : null;

  let node;
  describe("with template globally configured", () => {
    node = createFormComponent({
      schema: {
        type: "object",
        properties: { foo: { type: "string" }, bar: { type: "string" } },
      },
      uiSchema: { "ui:description": "foobar" },
      formData,
      ObjectFieldTemplate,
      fields: {
        TitleField,
        DescriptionField,
      },
    }).node;
    sharedIts();
  });
  describe("with template configured in ui:ObjectFieldTemplate", () => {
    node = createFormComponent({
      schema: {
        type: "object",
        properties: { foo: { type: "string" }, bar: { type: "string" } },
      },
      uiSchema: {
        "ui:description": "foobar",
        "ui:ObjectFieldTemplate": ObjectFieldTemplate,
      },
      formData,
      fields: {
        TitleField,
        DescriptionField,
      },
    }).node;
    sharedIts();
  });
  describe("with template configured globally overridden by ui:ObjectFieldTemplate", () => {
    node = createFormComponent({
      schema: {
        type: "object",
        properties: { foo: { type: "string" }, bar: { type: "string" } },
      },
      uiSchema: {
        "ui:description": "foobar",
        "ui:ObjectFieldTemplate": ObjectFieldTemplate,
      },
      formData,
      ObjectFieldTemplate: () => <div />, // Empty object field template, proof that it's overridden
      fields: {
        TitleField,
        DescriptionField,
      },
    }).node;
    sharedIts();
  });

  function sharedIts() {
    it("should render one root element", () => {
      expect(node.querySelectorAll(".root")).to.have.length.of(1);
    });

    it("should render one title", () => {
      expect(node.querySelectorAll(".title-field")).to.have.length.of(1);
    });

    it("should render one description", () => {
      expect(node.querySelectorAll(".description-field")).to.have.length.of(1);
    });

    it("should render two property containers", () => {
      expect(node.querySelectorAll(".property")).to.have.length.of(2);
    });
  }
});

describe("ObjectFieldTemplate with hidden label", () => {
  const schema = {
    type: "object",
    title: "Example object label",
    description: "Example object description",
    properties: {
      name: { type: "string" },
    },
  };
  const uiSchema = {
    "ui:options": { label: false },
  };

  it("should not generate label and description", () => {
    const { node } = createFormComponent({
      schema: schema,
      uiSchema: uiSchema,
      formData: { name: "test object " },
    });

    expect(node.querySelectorAll("legend")).to.have.length.of(0);
  });
});

describe("ObjectFieldTemplate with labels & description from uiSchema", () => {
  const schema = {
    type: "object",
    title: "Object Label",
    description: "Object Description",
    properties: {
      name: { type: "string" },
    },
  };
  const uiSchema = {
    "ui:title": "Replace title",
    "ui:description": "Replace description",
    "ui:options": {
      title: "Override title",
      description: "Override description",
    },
  };
  const { node } = createFormComponent({
    schema: schema,
    uiSchema: uiSchema,
    formData: { name: "test object " },
  });

  it("should use label from ui:options", () => {
    const foundNodes = node.querySelectorAll("#root__title");
    expect(foundNodes).to.have.length.of(1);
    expect(foundNodes[0].firstChild.data).to.be.equal("Override title");
  });

  it("should use description from ui:options", () => {
    const foundNodes = node.querySelectorAll("#root__description");
    expect(foundNodes).to.have.length.of(1);
    expect(foundNodes[0].firstChild.data).to.be.equal("Override description");
  });

  // create a form with ui:title and ui:description
  const modifiedUiSchema = {
    "ui:title": "Replace title",
    "ui:description": "Replace description",
  };
  const { node: newNode } = createFormComponent({
    schema: schema,
    uiSchema: modifiedUiSchema,
    formData: { name: "test object " },
  });

  it("should use label from ui:title", () => {
    const foundNodes = newNode.querySelectorAll("#root__title");
    expect(foundNodes).to.have.length.of(1);
    expect(foundNodes[0].firstChild.data).to.be.equal("Replace title");
  });

  it("should use description from ui:description", () => {
    const foundNodes = newNode.querySelectorAll("#root__description");
    expect(foundNodes).to.have.length.of(1);
    expect(foundNodes[0].firstChild.data).to.be.equal("Replace description");
  });
});
