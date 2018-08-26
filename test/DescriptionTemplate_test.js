import React from "react";
import { expect } from "chai";

import DescriptionTemplate from "../src/components/templates/DescriptionTemplate";
import { createSandbox, createComponent } from "./test_utils";

describe("DescriptionTemplate", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  // For some reason, stateless components needs to be wrapped into a stateful
  // one to be rendered into the document.
  class DescriptionTemplateWrapper extends React.Component {
    constructor(props) {
      super(props);
    }
    render() {
      return <DescriptionTemplate {...this.props} />;
    }
  }

  it("should return a div for a custom component", () => {
    const props = {
      description: <em>description</em>,
    };
    const { node } = createComponent(DescriptionTemplateWrapper, props);

    expect(node.tagName).to.equal("DIV");
  });

  it("should return a p for a description text", () => {
    const props = {
      description: "description",
    };
    const { node } = createComponent(DescriptionTemplateWrapper, props);

    expect(node.tagName).to.equal("P");
  });

  it("should have the expected id", () => {
    const props = {
      description: "Field description",
      id: "sample_id",
    };
    const { node } = createComponent(DescriptionTemplateWrapper, props);

    expect(node.id).to.equal("sample_id");
  });
});
