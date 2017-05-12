import React from "react";
import { expect } from "chai";

import TitleField from "../src/components/fields/TitleField";
import { createSandbox, createComponent } from "./test_utils";

describe("TitleField", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  // For some reason, stateless components needs to be wrapped into a stateful
  // one to be rendered into the document.
  class TitleFieldWrapper extends React.Component {
    constructor(props) {
      super(props);
    }
    render() {
      return <TitleField {...this.props} />;
    }
  }

  it("should return a legend", () => {
    const props = {
      title: "Field title",
      required: true,
    };
    const { node } = createComponent(TitleFieldWrapper, props);

    expect(node.tagName).to.equal("LEGEND");
  });

  it("should have the expected id", () => {
    const props = {
      title: "Field title",
      required: true,
      id: "sample_id",
    };
    const { node } = createComponent(TitleFieldWrapper, props);

    expect(node.id).to.equal("sample_id");
  });

  it("should include only title, when field is not required", () => {
    const props = {
      title: "Field title",
      required: false,
    };
    const { node } = createComponent(TitleFieldWrapper, props);

    expect(node.textContent).to.equal(props.title);
  });

  it("should add an asterisk to the title, when field is required", () => {
    const props = {
      title: "Field title",
      required: true,
    };
    const { node } = createComponent(TitleFieldWrapper, props);

    expect(node.textContent).to.equal(props.title + "*");
  });
});
