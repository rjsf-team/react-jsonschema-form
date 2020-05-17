import { expect } from "chai";

import { createFormComponent, createSandbox } from "./test_utils";

describe("const", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should not mutate disabled when field is not a const", () => {
    const schema = {
      type: "object",
      properties: {
        foo: { type: "string" },
      },
    };

    const { node } = createFormComponent({
      schema,
    });
    let input = node.querySelector("input#root_foo");
    expect(input).not.eql(null);
    expect(input.value).to.eql("");
    expect(input.disabled).to.eql(false);
  });

  it("should render a schema that uses const with a string value", () => {
    const schema = {
      type: "object",
      properties: {
        foo: { const: "bar" },
      },
    };

    const { node, comp } = createFormComponent({
      schema,
    });

    let input = node.querySelector("input#root_foo");
    expect(input).not.eql(null);
    expect(input.value).to.eql("bar");
    expect(input.disabled).to.eql(true);
    expect(comp.state.formData.foo).to.eql("bar");
  });

  it("should render a schema that uses const with a number value", () => {
    const schema = {
      type: "object",
      properties: {
        foo: { const: 123 },
      },
    };

    const { node, comp } = createFormComponent({
      schema,
    });

    let input = node.querySelector("input#root_foo");
    expect(input).not.eql(null);
    expect(input.value).to.eql("123");
    expect(input.disabled).to.eql(true);
    expect(comp.state.formData.foo).to.eql(123);
  });

  it("should render a schema that uses const with a boolean value", () => {
    const schema = {
      type: "object",
      properties: {
        foo: { const: true },
      },
    };

    const { node, comp } = createFormComponent({
      schema,
    });

    let input = node.querySelector("input#root_foo[type='checkbox']");
    expect(input).not.eql(null);
    expect(input.checked).to.eql(true);
    expect(input.disabled).to.eql(true);
    expect(comp.state.formData.foo).to.eql(true);
  });
});
