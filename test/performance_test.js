import sinon from "sinon";
import React from "react";

import {getDefaultRegistry} from "../src/utils";
import ArrayField from "../src/components/fields/ArrayField";
import ObjectField from "../src/components/fields/ObjectField";
import {
  createComponent,
  createFormComponent,
  createSandbox,
  setProps
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
      const schema = {type: "string"};
      const uiSchema = {};

      const {comp} = createFormComponent({schema, uiSchema});
      sandbox.stub(comp, "render").returns(<div/>);

      comp.componentWillReceiveProps({schema});

      sinon.assert.notCalled(comp.render);
    });

    it("should not render if next formData are equivalent", () => {
      const schema = {type: "string"};
      const formData = "foo";

      const {comp} = createFormComponent({schema, formData});
      sandbox.stub(comp, "render").returns(<div/>);

      comp.componentWillReceiveProps({formData});

      sinon.assert.notCalled(comp.render);
    });
  });

  describe("ArrayField", () => {
    const onChange = () => {};
    const onBlur = () => {};
    const schema = {type: "array", items: {type: "string"}};
    const uiSchema = {};
    const registry = getDefaultRegistry();

    it("should not render if next props are equivalent", () => {
      const props = {
        registry,
        schema,
        uiSchema,
        onChange,
        onBlur
      };

      const {comp} = createComponent(ArrayField, props);
      sandbox.stub(comp, "render").returns(<div/>);

      setProps(comp, props);

      sinon.assert.notCalled(comp.render);
    });

    it("should not render if next formData are equivalent", () => {
      const props = {
        registry,
        schema,
        formData: ["a", "b"],
        onChange,
        onBlur
      };

      const {comp} = createComponent(ArrayField, props);
      sandbox.stub(comp, "render").returns(<div/>);

      setProps(comp, {...props, formData: ["a", "b"]});

      sinon.assert.notCalled(comp.render);
    });
  });

  describe("ObjectField", () => {
    const onChange = () => {};
    const onBlur = () => {};
    const registry = getDefaultRegistry();
    const uiSchema = {};
    const schema = {
      type: "object",
      properties: {
        foo: {type: "string"}
      }
    };
    const idSchema = {$id: "root", foo: {$id: "root_plop"}};

    it("should not render if next props are equivalent", () => {
      const props = {
        registry,
        schema,
        uiSchema,
        onChange,
        idSchema,
        onBlur
      };

      const {comp} = createComponent(ObjectField, props);
      sandbox.stub(comp, "render").returns(<div/>);

      setProps(comp, props);

      sinon.assert.notCalled(comp.render);
    });

    it("should not render if next formData are equivalent", () => {
      const props = {
        registry,
        schema,
        formData: {foo: "blah"},
        onChange,
        idSchema,
        onBlur
      };

      const {comp} = createComponent(ObjectField, props);
      sandbox.stub(comp, "render").returns(<div/>);

      setProps(comp, {...props, formData: {foo: "blah"}});

      sinon.assert.notCalled(comp.render);
    });
  });
});
