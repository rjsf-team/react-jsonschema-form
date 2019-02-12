import { expect } from "chai";

import { createFormComponent, createSandbox } from "./test_utils";

describe("enum", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should render a select element if set the enum.", () => {
    const schema = {
      type: "object",
      properties: {
        foo: {
          type: "string",
          enum: [0],
        },
      },
    };

    const { node } = createFormComponent({
      schema,
    });

    const selects = node.querySelectorAll("select");
    expect(selects).to.have.length.of(1);
  });

  it("should render a select element and it's value is empty, if set the enum and the default value is undefined.", () => {
    const schema = {
      type: "object",
      properties: {
        foo: {
          type: "string",
          enum: [0],
        },
      },
    };

    const { node } = createFormComponent({
      schema,
    });

    const selects = node.querySelectorAll("select");
    expect(selects[0].value).eql("");
  });

  it("should render a select element and it's first option has an empty innerHTML, if set the enum and the default value is undefined.", () => {
    const schema = {
      type: "object",
      properties: {
        foo: {
          type: "string",
          enum: [0],
        },
      },
    };

    const { node } = createFormComponent({
      schema,
    });

    const options = node.querySelectorAll("option");
    expect(options[0].innerHTML).eql("");
  });

  it("should render a select element and it's first option is '0', if set the enum and the default value is 0.", () => {
    const schema = {
      type: "object",
      properties: {
        foo: {
          type: "string",
          enum: [0],
          default: 0,
        },
      },
    };

    const { node } = createFormComponent({
      schema,
    });

    const options = node.querySelectorAll("option");
    expect(options[0].innerHTML).eql("0");
  });

  it("should render a select element and it's first option is 'false', if set the enum and the default value is false.", () => {
    const schema = {
      type: "object",
      properties: {
        foo: {
          type: "string",
          enum: [false, true],
          default: false,
        },
      },
    };

    const { node } = createFormComponent({
      schema,
    });

    const options = node.querySelectorAll("option");
    expect(options[0].innerHTML).eql("false");
  });

  it("should render a select element and the option's length is equal the enum's length, if set the enum.", () => {
    const schema = {
      type: "object",
      properties: {
        foo: {
          type: "string",
          enum: [false, true],
          default: false,
        },
      },
    };

    const { node } = createFormComponent({
      schema,
    });

    const options = node.querySelectorAll("option");
    expect(options.length).eql(2);
  });
});
