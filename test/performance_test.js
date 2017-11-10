import sinon from "sinon";
import React from "react";
import { scryRenderedComponentsWithType } from "react-addons-test-utils";
import { getDefaultRegistry } from "../src/utils";
import SchemaField from "../src/components/fields/SchemaField";
import {
  createComponent,
  createFormComponent,
  createSandbox,
  setProps,
} from "./test_utils";

describe("Rendering performance optimizations", () => {
  var sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("Form", () => {
    it("should not render if next props are equivalent", () => {
      const schema = { type: "string" };
      const uiSchema = {};

      const { comp } = createFormComponent({ schema, uiSchema });
      sandbox.stub(comp, "render").returns(<div />);

      comp.componentWillReceiveProps({ schema });

      sinon.assert.notCalled(comp.render);
    });

    it("should not render if next formData are equivalent", () => {
      const schema = { type: "string" };
      const formData = "foo";

      const { comp } = createFormComponent({ schema, formData });
      sandbox.stub(comp, "render").returns(<div />);

      comp.componentWillReceiveProps({ formData });

      sinon.assert.notCalled(comp.render);
    });

    it("should only render changed object properties", () => {
      const schema = {
        type: "object",
        properties: {
          const: { type: "string" },
          var: { type: "string" },
        },
      };

      const { comp } = createFormComponent({
        schema,
        formData: { const: "0", var: "0" },
      });

      const fields = scryRenderedComponentsWithType(comp, SchemaField).reduce(
        (fields, fieldComp) => {
          sandbox.stub(fieldComp, "render").returns(<div />);
          fields[fieldComp.props.idSchema.$id] = fieldComp;
          return fields;
        }
      );

      setProps(comp, { schema, formData: { const: "0", var: "1" } });

      sinon.assert.notCalled(fields.root_const.render);
      sinon.assert.calledOnce(fields.root_var.render);
    });

    it("should only render changed array items", () => {
      const schema = {
        type: "array",
        items: { type: "string" },
      };

      const { comp } = createFormComponent({
        schema,
        formData: ["const", "var0"],
      });

      const fields = scryRenderedComponentsWithType(comp, SchemaField).reduce(
        (fields, fieldComp) => {
          sandbox.stub(fieldComp, "render").returns(<div />);
          fields[fieldComp.props.idSchema.$id] = fieldComp;
          return fields;
        }
      );

      setProps(comp, { schema, formData: ["const", "var1"] });

      sinon.assert.notCalled(fields.root_0.render);
      sinon.assert.calledOnce(fields.root_1.render);
    });
  });

  describe("SchemaField", () => {
    const onChange = () => {};
    const onBlur = () => {};
    const onFocus = () => {};
    const registry = getDefaultRegistry();
    const uiSchema = {};
    const schema = {
      type: "object",
      properties: {
        foo: { type: "string" },
      },
    };
    const idSchema = { $id: "root", foo: { $id: "root_plop" } };

    it("should not render if next props are equivalent", () => {
      const props = {
        registry,
        schema,
        uiSchema,
        onChange,
        idSchema,
        onBlur,
        onFocus,
      };

      const { comp } = createComponent(SchemaField, props);
      sandbox.stub(comp, "render").returns(<div />);

      setProps(comp, props);

      sinon.assert.notCalled(comp.render);
    });

    it("should not render if next formData are equivalent", () => {
      const props = {
        registry,
        schema,
        formData: { foo: "blah" },
        onChange,
        idSchema,
        onBlur,
      };

      const { comp } = createComponent(SchemaField, props);
      sandbox.stub(comp, "render").returns(<div />);

      setProps(comp, { ...props, formData: { foo: "blah" } });

      sinon.assert.notCalled(comp.render);
    });
  });
});
