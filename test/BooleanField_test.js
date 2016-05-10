import { expect } from "chai";

import { createFormComponent, createSandbox, Simulate } from "./test_utils";


describe("BooleanField", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should render a boolean field", function*() {
    const {node} = yield createFormComponent({schema: {
      type: "boolean"
    }});

    expect(node.querySelectorAll(".field input[type=checkbox]"))
      .to.have.length.of(1);
  });

  it("should render a boolean field with a label", function*() {
    const {node} = yield createFormComponent({schema: {
      type: "boolean",
      title: "foo"
    }});

    expect(node.querySelector(".field label strong").textContent)
      .eql("foo");
  });

  it("should render a single label", function*() {
    const {node} = yield createFormComponent({schema: {
      type: "boolean",
      title: "foo"
    }});

    expect(node.querySelectorAll(".field label"))
      .to.have.length.of(1);
  });

  it("should assign a default value", function*() {
    const {node} = yield createFormComponent({schema: {
      type: "boolean",
      default: true,
    }});

    expect(node.querySelector(".field input").checked)
      .eql(true);
  });

  it("should default state value to undefined", function*() {
    const {comp} = yield createFormComponent({schema: {type: "boolean"}});

    expect(comp.state.formData).eql(undefined);
  });

  it("should handle a change event", function*() {
    const {comp, node} = yield createFormComponent({schema: {
      type: "boolean",
      default: false,
    }});

    yield Simulate.change(node.querySelector("input"), {
      target: {checked: true}
    });

    expect(comp.state.formData).eql(true);
  });

  it("should fill field with data", function*() {
    const {node} = yield createFormComponent({schema: {
      type: "boolean",
    }, formData: true});

    expect(node.querySelector(".field input").checked)
      .eql(true);
  });

  it("should support enumNames for radio widgets", function*() {
    const {node} = yield createFormComponent({schema: {
      type: "boolean",
      enumNames: ["Yes", "No"],
    }, formData: true, uiSchema: {"ui:widget": "radio"}});

    const labels = [].map.call(node.querySelectorAll(".field-radio-group label"),
                               label => label.textContent);
    expect(labels).eql(["Yes", "No"]);
  });

  it("should support enumNames for select", function*() {
    const {node} = yield createFormComponent({schema: {
      type: "boolean",
      enumNames: ["Yes", "No"],
    }, formData: true, uiSchema: {"ui:widget": "select"}});

    const labels = [].map.call(node.querySelectorAll(".field option"),
                               label => label.textContent);
    expect(labels).eql(["Yes", "No"]);
  });

  it("should render the widget with the expected id", function*() {
    const {node} = yield createFormComponent({schema: {
      type: "boolean",
    }});

    expect(node.querySelector("input[type=checkbox]").id)
      .eql("root");
  });
});
