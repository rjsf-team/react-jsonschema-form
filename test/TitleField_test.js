import { expect } from "chai";
import { renderIntoDocument } from "react-addons-test-utils";
import { findDOMNode } from "react-dom";

import TitleField from "../src/components/fields/TitleField";
import { createSandbox } from "./test_utils";

describe("TitleField", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should return a legend", () => {
    const props = {
      title: "Field title",
      required: true
    };
    const comp = renderIntoDocument(TitleField(props));
    const node = findDOMNode(comp);

    expect(node.tagName).to.equal("LEGEND");
  });

  it("should include only title, when field is not required", () => {
    const props = {
      title: "Field title",
      required: false
    };
    const comp = renderIntoDocument(TitleField(props));
    const node = findDOMNode(comp);

    expect(node.textContent).to.equal(props.title);
  });

  it("should add an asterisk to the title, when field is required", () => {
    const props = {
      title: "Field title",
      required: true
    };
    const comp = renderIntoDocument(TitleField(props));
    const node = findDOMNode(comp);

    expect(node.textContent).to.equal(props.title + "*");
  });

});