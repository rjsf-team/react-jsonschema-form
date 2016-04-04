import { expect } from "chai";
import { Simulate } from "react-addons-test-utils";

import { createFormComponent } from "./test_utils";

describe("StringField", () => {
  describe("TextWidget", () => {
    it("should render a string field", () => {
      const {node} = createFormComponent({schema: {
        type: "string"
      }});

      expect(node.querySelectorAll(".field input[type=text]"))
        .to.have.length.of(1);
    });

    it("should render a string field with a label", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
        title: "foo"
      }});

      expect(node.querySelector(".field label").textContent)
        .eql("foo");
    });

    it("should render a string field with a placeholder", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
        description: "bar",
      }});

      expect(node.querySelector(".field input").getAttribute("placeholder"))
        .eql("bar");
    });

    it("should assign a default value", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
        default: "plop",
      }});

      expect(node.querySelector(".field input").getAttribute("value"))
        .eql("plop");
    });

    it("should handle a change event", () => {
      const {comp, node} = createFormComponent({schema: {
        type: "string",
      }});

      Simulate.change(node.querySelector("input"), {
        target: {value: "yo"}
      });

      expect(comp.state.formData).eql("yo");
    });

    it("should fill field with data", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
      }, formData: "plip"});

      expect(node.querySelector(".field input").getAttribute("value"))
        .eql("plip");
    });

    it("should render the widget with the expected id", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
      }});

      expect(node.querySelector("input[type=text]").id)
        .eql("root");
    });
  });

  describe("SelectWidget", () => {
    it("should render a string field", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
        enum: ["foo", "bar"]
      }});

      expect(node.querySelectorAll(".field select"))
        .to.have.length.of(1);
    });

    it("should render a string field with a label", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
        enum: ["foo", "bar"],
        title: "foo",
      }});

      expect(node.querySelector(".field label").textContent)
        .eql("foo");
    });

    it("should render a select field with a tooltip", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
        enum: ["foo", "bar"],
        description: "baz",
      }});

      expect(node.querySelector(".field select").getAttribute("title"))
        .eql("baz");
    });

    it("should assign a default value", () => {
      const {comp} = createFormComponent({schema: {
        type: "string",
        enum: ["foo", "bar"],
        default: "bar",
      }});

      expect(comp.state.formData).eql("bar");
    });

    it("should reflect the change into the form state", () => {
      const {comp, node} = createFormComponent({schema: {
        type: "string",
        enum: ["foo", "bar"],
      }});

      Simulate.change(node.querySelector("select"), {
        target: {value: "foo"}
      });

      expect(comp.state.formData).eql("foo");
    });

    it("should reflect the change into the dom", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
        enum: ["foo", "bar"],
      }});

      Simulate.change(node.querySelector("select"), {
        target: {value: "foo"}
      });

      expect(node.querySelector("select").value).eql("foo");
    });

    it("should fill field with data", () => {
      const {comp} = createFormComponent({schema: {
        type: "string",
        enum: ["foo", "bar"],
      }, formData: "bar"});

      expect(comp.state.formData).eql("bar");
    });

    it("should render the widget with the expected id", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
        enum: ["a", "b"]
      }});

      expect(node.querySelector("select").id)
        .eql("root");
    });
  });

  describe("DateTimeWidget", () => {
    it("should render a datetime field", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
        format: "date-time",
      }});

      expect(node.querySelectorAll(".field [type=datetime]"))
        .to.have.length.of(1);
    });

    it("should render a string field with a label", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
        format: "date-time",
        title: "foo",
      }});

      expect(node.querySelector(".field label").textContent)
        .eql("foo");
    });

    it("should render a select field with a placeholder", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
        format: "date-time",
        description: "baz",
      }});

      expect(node.querySelector(".field [type=datetime]").getAttribute("placeholder"))
        .eql("baz");
    });

    it("should assign a default value", () => {
      const datetime = new Date().toJSON();
      const {comp} = createFormComponent({schema: {
        type: "string",
        format: "date-time",
        default: datetime,
      }});

      expect(comp.state.formData).eql(datetime);
    });

    it("should reflect the change into the dom", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
        format: "date-time",
      }});

      const newDatetime = new Date().toJSON();
      Simulate.change(node.querySelector("[type=datetime]"), {
        target: {value: newDatetime}
      });

      expect(node.querySelector("[type=datetime]").value).eql(newDatetime);
    });

    it("should fill field with data", () => {
      const datetime = new Date().toJSON();
      const {comp} = createFormComponent({schema: {
        type: "string",
        format: "date-time",
      }, formData: datetime});

      expect(comp.state.formData).eql(datetime);
    });

    it("should render the widget with the expected id", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
        format: "date-time",
      }});

      expect(node.querySelector("[type=datetime]").id)
        .eql("root");
    });
  });
});
