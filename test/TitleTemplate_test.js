import React from "react";
import { expect } from "chai";

import TitleTemplate from "../src/components/templates/TitleTemplate";
import { createSandbox, createComponent } from "./test_utils";

describe("TitleTemplate", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  // For some reason, stateless components needs to be wrapped into a stateful
  // one to be rendered into the document.
  class TitleTemplateWrapper extends React.Component {
    constructor(props) {
      super(props);
    }
    render() {
      return <TitleTemplate {...this.props} />;
    }
  }

  it("should return a legend", () => {
    const props = {
      title: "Field title",
      required: true,
    };
    const { node } = createComponent(TitleTemplateWrapper, props);

    expect(node.tagName).to.equal("LEGEND");
  });

  it("should have the expected id", () => {
    const props = {
      title: "Field title",
      required: true,
      id: "sample_id",
    };
    const { node } = createComponent(TitleTemplateWrapper, props);

    expect(node.id).to.equal("sample_id");
  });

  it("should include only title, when field is not required", () => {
    const props = {
      title: "Field title",
      required: false,
    };
    const { node } = createComponent(TitleTemplateWrapper, props);

    expect(node.textContent).to.equal(props.title);
  });

  it("should add an asterisk to the title, when field is required", () => {
    const props = {
      title: "Field title",
      required: true,
    };
    const { node } = createComponent(TitleTemplateWrapper, props);

    expect(node.textContent).to.equal(props.title + "*");
  });
});
