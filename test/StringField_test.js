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

      expect(node.querySelector(".field input").value)
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

      expect(node.querySelector(".field input").value)
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

      expect(node.querySelectorAll(".field select"))
        .to.have.length.of(6);
    });

    it("should render a string field with a main label", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
        format: "date-time",
        title: "foo",
      }});

      expect(node.querySelector(".field label").textContent)
        .eql("foo");
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
      const {comp, node} = createFormComponent({schema: {
        type: "string",
        format: "date-time",
      }});

      Simulate.change(node.querySelector("#root_year"), {target: {value: "2012"}});
      Simulate.change(node.querySelector("#root_month"), {target: {value: "10"}});
      Simulate.change(node.querySelector("#root_day"), {target: {value: "2"}});
      Simulate.change(node.querySelector("#root_hour"), {target: {value: "1"}});
      Simulate.change(node.querySelector("#root_minute"), {target: {value: "2"}});
      Simulate.change(node.querySelector("#root_second"), {target: {value: "3"}});

      expect(comp.state.formData).eql("2012-10-02T01:02:03.000Z");
    });

    it("should fill field with data", () => {
      const datetime = new Date().toJSON();
      const {comp} = createFormComponent({schema: {
        type: "string",
        format: "date-time",
      }, formData: datetime});

      expect(comp.state.formData).eql(datetime);
    });

    it("should render the widgets with the expected ids", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
        format: "date-time",
      }});

      const ids = [].map.call(node.querySelectorAll("select"), node => node.id);

      expect(ids).eql([
        "root_year",
        "root_month",
        "root_day",
        "root_hour",
        "root_minute",
        "root_second",
      ]);
    });

    it("should render the widgets with the expected options' values", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
        format: "date-time",
      }});

      const lengths = [].map.call(node.querySelectorAll("select"), node => node.length);

      expect(lengths).eql([
        121, // from 1900 to 2020
        12,
        31,
        24,
        60,
        60
      ]);
      const monthOptions = node.querySelectorAll("select#root_month option");
      const monthOptionsValues = [].map.call(monthOptions, option => option.value);
      expect(monthOptionsValues).eql([
        "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]);
    });

    it("should render the widgets with the expected options' labels", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
        format: "date-time",
      }});

      const monthOptions = node.querySelectorAll("select#root_month option");
      const monthOptionsLabels = [].map.call(monthOptions, option => option.text);
      expect(monthOptionsLabels).eql([
        "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]);
    });
  });

  describe("EmailWidget", () => {
    it("should render an email field", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
        format: "email",
      }});

      expect(node.querySelectorAll(".field [type=email]"))
        .to.have.length.of(1);
    });

    it("should render a string field with a label", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
        format: "email",
        title: "foo",
      }});

      expect(node.querySelector(".field label").textContent)
        .eql("foo");
    });

    it("should render a select field with a placeholder", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
        format: "email",
        description: "baz",
      }});

      expect(node.querySelector(".field [type=email]").getAttribute("placeholder"))
        .eql("baz");
    });

    it("should assign a default value", () => {
      const email = "foo@bar.baz";
      const {comp} = createFormComponent({schema: {
        type: "string",
        format: "email",
        default: email,
      }});

      expect(comp.state.formData).eql(email);
    });

    it("should reflect the change into the dom", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
        format: "email",
      }});

      const newDatetime = new Date().toJSON();
      Simulate.change(node.querySelector("[type=email]"), {
        target: {value: newDatetime}
      });

      expect(node.querySelector("[type=email]").value).eql(newDatetime);
    });

    it("should fill field with data", () => {
      const email = "foo@bar.baz";
      const {comp} = createFormComponent({schema: {
        type: "string",
        format: "email",
      }, formData: email});

      expect(comp.state.formData).eql(email);
    });

    it("should render the widget with the expected id", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
        format: "email",
      }});

      expect(node.querySelector("[type=email]").id)
        .eql("root");
    });

    it("should reject an invalid entered email", () => {
      const {comp, node} = createFormComponent({schema: {
        type: "string",
        format: "email",
      }, liveValidate: true});

      Simulate.change(node.querySelector("[type=email]"), {
        target: {value: "invalid"}
      });

      expect(comp.state.errors).to.have.length.of(1);
    });
  });

  describe("URLWidget", () => {
    it("should render an url field", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
        format: "uri",
      }});

      expect(node.querySelectorAll(".field [type=url]"))
        .to.have.length.of(1);
    });

    it("should render a string field with a label", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
        format: "uri",
        title: "foo",
      }});

      expect(node.querySelector(".field label").textContent)
        .eql("foo");
    });

    it("should render a select field with a placeholder", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
        format: "uri",
        description: "baz",
      }});

      expect(node.querySelector(".field [type=url]").getAttribute("placeholder"))
        .eql("baz");
    });

    it("should assign a default value", () => {
      const url = "http://foo.bar/baz";
      const {comp} = createFormComponent({schema: {
        type: "string",
        format: "uri",
        default: url,
      }});

      expect(comp.state.formData).eql(url);
    });

    it("should reflect the change into the dom", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
        format: "uri",
      }});

      const newDatetime = new Date().toJSON();
      Simulate.change(node.querySelector("[type=url]"), {
        target: {value: newDatetime}
      });

      expect(node.querySelector("[type=url]").value).eql(newDatetime);
    });

    it("should fill field with data", () => {
      const url = "http://foo.bar/baz";
      const {comp} = createFormComponent({schema: {
        type: "string",
        format: "uri",
      }, formData: url});

      expect(comp.state.formData).eql(url);
    });

    it("should render the widget with the expected id", () => {
      const {node} = createFormComponent({schema: {
        type: "string",
        format: "uri",
      }});

      expect(node.querySelector("[type=url]").id)
        .eql("root");
    });

    it("should reject an invalid entered email", () => {
      const {comp, node} = createFormComponent({schema: {
        type: "string",
        format: "uri",
      }, liveValidate: true});

      Simulate.change(node.querySelector("[type=url]"), {
        target: {value: "invalid"}
      });

      expect(comp.state.errors).to.have.length.of(1);
    });
  });
});
