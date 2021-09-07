import React from "react";

import { expect } from "chai";
import { createFormComponent, createSandbox } from "./test_utils";

describe("FieldTemplate", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("FieldTemplate should only have one child", () => {
    function FieldTemplate(props) {
      if (React.Children.count(props.children) !== 1) {
        throw "Got wrong number of children";
      }
      return null;
    }
    createFormComponent({
      schema: { type: "string" },
      uiSchema: { "ui:disabled": true },
      FieldTemplate,
    });
  });

  describe("Custom FieldTemplate for disabled property", () => {
    function FieldTemplate(props) {
      return <div className={props.disabled ? "disabled" : "foo"} />;
    }

    describe("with template globally configured", () => {
      it("should render with disabled when ui:disabled is truthy", () => {
        const { node } = createFormComponent({
          schema: { type: "string" },
          uiSchema: { "ui:disabled": true },
          FieldTemplate,
        });
        expect(node.querySelectorAll(".disabled")).to.have.length.of(1);
      });

      it("should render with disabled when ui:disabled is falsey", () => {
        const { node } = createFormComponent({
          schema: { type: "string" },
          uiSchema: { "ui:disabled": false },
          FieldTemplate,
        });
        expect(node.querySelectorAll(".disabled")).to.have.length.of(0);
      });
    });
    describe("with template configured in ui:FieldTemplate", () => {
      it("should render with disabled when ui:disabled is truthy", () => {
        const { node } = createFormComponent({
          schema: { type: "string" },
          uiSchema: { "ui:disabled": true, "ui:FieldTemplate": FieldTemplate },
        });
        expect(node.querySelectorAll(".disabled")).to.have.length.of(1);
      });

      it("should render with disabled when ui:disabled is falsey", () => {
        const { node } = createFormComponent({
          schema: { type: "string" },
          uiSchema: { "ui:disabled": false, "ui:FieldTemplate": FieldTemplate },
        });
        expect(node.querySelectorAll(".disabled")).to.have.length.of(0);
      });
    });
    describe("with template configured globally being overriden in ui:FieldTemplate", () => {
      it("should render with disabled when ui:disabled is truthy", () => {
        const { node } = createFormComponent({
          schema: { type: "string" },
          uiSchema: { "ui:disabled": true, "ui:FieldTemplate": FieldTemplate },
          // Empty field template to prove that overides work
          FieldTemplate: () => <div />,
        });
        expect(node.querySelectorAll(".disabled")).to.have.length.of(1);
      });

      it("should render with disabled when ui:disabled is falsey", () => {
        const { node } = createFormComponent({
          schema: { type: "string" },
          uiSchema: { "ui:disabled": false, "ui:FieldTemplate": FieldTemplate },
          // Empty field template to prove that overides work
          FieldTemplate: () => <div />,
        });
        expect(node.querySelectorAll(".disabled")).to.have.length.of(0);
      });
    });
  });

  describe("Custom FieldTemplate should have registry", () => {
    function FieldTemplate(props) {
      return (
        <div>
          Root Schema:{" "}
          <span id="root-schema">
            {JSON.stringify(props.registry.rootSchema)}
          </span>
        </div>
      );
    }

    it("should allow access to root schema from registry", () => {
      const schema = {
        type: "object",
        properties: { fooBarBaz: { type: "string" } },
      };

      const { node } = createFormComponent({
        schema,
        FieldTemplate,
      });

      expect(node.querySelectorAll("#root-schema")).to.have.length.of(1);
      expect(node.querySelectorAll("#root-schema")[0].innerHTML).to.equal(
        JSON.stringify(schema)
      );
    });
  });

  describe("FieldTemplate should use label & description from uiSchema", () => {
    const schema = {
      type: "string",
      title: "Example Title",
      description: "Example description",
    };
    const uiSchemaWithUiOptions = {
      "ui:title": "Replace Title",
      "ui:description": "Replace description",
      "ui:options": {
        title: "Override Title",
        description: "Override description",
      },
    };
    const { node: nodeWithUiOptions } = createFormComponent({
      schema: schema,
      uiSchema: uiSchemaWithUiOptions,
      formData: "test string",
    });

    it("should use label from ui:options", () => {
      const foundNodes = nodeWithUiOptions.querySelectorAll("label");
      expect(foundNodes).to.have.length.of(1);
      expect(foundNodes[0].firstChild.data).to.equal("Override Title");
    });

    it("should use description from ui:options", () => {
      const foundNodes = nodeWithUiOptions.querySelectorAll(
        "#root__description"
      );
      expect(foundNodes).to.have.length.of(1);
      expect(foundNodes[0].firstChild.data).to.equal("Override description");
    });

    // use ui:title and ui:description
    const uiSchema = {
      "ui:title": "Replace Title",
      "ui:description": "Replace description",
    };
    const { node } = createFormComponent({
      schema: schema,
      uiSchema: uiSchema,
      formData: "test string",
    });

    it("should use label from ui:options", () => {
      const foundNodes = node.querySelectorAll("label");
      expect(foundNodes).to.have.length.of(1);
      expect(foundNodes[0].firstChild.data).to.equal("Replace Title");
    });

    it("should use description from ui:options", () => {
      const foundNodes = node.querySelectorAll("#root__description");
      expect(foundNodes).to.have.length.of(1);
      expect(foundNodes[0].firstChild.data).to.equal("Replace description");
    });
  });
});
