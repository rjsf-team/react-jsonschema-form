import { expect } from "chai";
import { Simulate } from "react-addons-test-utils";

import { createFormComponent } from "./test_utils";

describe("ArrayField", () => {
  describe("List of inputs", () => {
    const schema = {
      type: "array",
      title: "my list",
      items: {type: "string"}
    };

    it("should render a fieldset", () => {
      const {node} = createFormComponent({schema});

      expect(node.querySelectorAll("fieldset"))
        .to.have.length.of(1);
    });

    it("should render a fieldset legend", () => {
      const {node} = createFormComponent({schema});

      expect(node.querySelector("fieldset > legend").textContent)
        .eql("my list");
    });

    it("should contain no field in the list by default", () => {
      const {node} = createFormComponent({schema});

      expect(node.querySelectorAll(".field-string"))
        .to.have.length.of(0);
    });

    it("should have an add button", () => {
      const {node} = createFormComponent({schema});

      expect(node.querySelector(".array-item-add button"))
        .not.eql(null);
    });

    it("should add a new field when clicking the add button", () => {
      const {node} = createFormComponent({schema});

      Simulate.click(node.querySelector(".array-item-add button"));

      expect(node.querySelectorAll(".field-string"))
        .to.have.length.of(1);
    });

    it("should fill an array field with data", () => {
      const {node} = createFormComponent({schema, formData: ["foo", "bar"]});
      const inputs = node.querySelectorAll(".field-string input[type=text]");

      expect(inputs).to.have.length.of(2);
      expect(inputs[0].value).eql("foo");
      expect(inputs[1].value).eql("bar");
    });

    it("should remove a field from the list", () => {
      const {node} = createFormComponent({schema, formData: ["foo", "bar"]});
      const dropBtns = node.querySelectorAll(".array-item-remove button");

      Simulate.click(dropBtns[0]);

      const inputs = node.querySelectorAll(".field-string input[type=text]");
      expect(inputs).to.have.length.of(1);
      expect(inputs[0].value).eql("bar");
    });
  });

  describe("Multiple choices list", () => {
    const schema = {
      type: "array",
      title: "My field",
      items: {
        enum: ["foo", "bar", "fuzz"],
        type: "string"
      },
      uniqueItems: true,
      value: ["foo", "fuzz"]
    };

    it("should render a select widget", () => {
      const {node} = createFormComponent({schema});

      expect(node.querySelectorAll("select"))
        .to.have.length.of(1);
    });

    it("should render a select widget with a label", () => {
      const {node} = createFormComponent({schema});

      expect(node.querySelector(".field label > span").textContent)
        .eql("My field");
    });

    it("should render a select widget with multiple attribute", () => {
      const {node} = createFormComponent({schema});

      expect(node.querySelector(".field select").getAttribute("multiple"))
        .not.to.be.null;
    });

    it("should render options", () => {
      const {node} = createFormComponent({schema});

      expect(node.querySelectorAll("select option"))
        .to.have.length.of(3);
    });

    it("should handle a change event", () => {
      const {comp, node} = createFormComponent({schema});

      Simulate.change(node.querySelector(".field select"), {
        target: {options: [
          {selected: true, value: "foo"},
          {selected: true, value: "bar"},
          {selected: false, value: "fuzz"},
        ]}
      });

      expect(comp.state.formData).eql(["foo", "bar"]);
    });

    it("should fill field with data", () => {
      const {node} = createFormComponent({schema, formData: ["foo", "bar"]});

      const options = node.querySelectorAll(".field select option");
      expect(options).to.have.length.of(3);
      expect(options[0].getAttribute("selected")).not.to.be.null;  // foo
      expect(options[1].getAttribute("selected")).not.to.be.null;  // bar
      expect(options[2].getAttribute("selected")).to.be.null;  // fuzz
    });
  });
});
