import React from "react";

import {expect} from "chai";
import {Simulate} from "react-addons-test-utils";

import {createFormComponent, createSandbox} from "./test_utils";


describe("ArrayField", () => {
  let sandbox;
  const CustomComponent = () => <div id="custom"/>;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("List of inputs", () => {
    const schema = {
      type: "array",
      title: "my list",
      description: "my description",
      items: {type: "string"}
    };

    it("should render a fieldset", () => {
      const {node} = createFormComponent({schema});

      expect(node.querySelectorAll("fieldset"))
        .to.have.length.of(1);
    });

    it("should render a fieldset legend", () => {
      const {node} = createFormComponent({schema});

      const legend = node.querySelector("fieldset > legend");

      expect(legend.textContent).eql("my list");
      expect(legend.id).eql("root__title");
    });

    it("should render a description", () => {
      const {node} = createFormComponent({schema});

      const description = node.querySelector("fieldset > .field-description");

      expect(description.textContent).eql("my description");
      expect(description.id).eql("root__description");
    });

    it("should render a customized title", () => {
      const CustomTitleField = ({title}) => <div id="custom">{title}</div>;

      const {node} = createFormComponent({schema,
        fields: {TitleField: CustomTitleField}
      });
      expect(node.querySelector("fieldset > #custom").textContent)
        .to.eql("my list");
    });

    it("should render a customized description", () => {
      const CustomDescriptionField = ({description}) => <div id="custom">{description}</div>;

      const {node} = createFormComponent({schema, fields: {
        DescriptionField: CustomDescriptionField}
      });
      expect(node.querySelector("fieldset > #custom").textContent)
        .to.eql("my description");
    });

    it("should render a customized file widget", () => {
      const {node} = createFormComponent({schema,
        uiSchema: {
          "ui:widget": "files"
        },
        widgets: {FileWidget: CustomComponent}
      });
      expect(node.querySelector("#custom"))
        .to.exist;
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

    it("should not have an add button if addable is false", () => {
      const {node} = createFormComponent({schema, uiSchema: {"ui:options": {addable: false}}});

      expect(node.querySelector(".array-item-add button")).to.be.null;
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

    it("should't have reorder buttons when list length <= 1", () => {
      const {node} = createFormComponent({schema, formData: ["foo"]});

      expect(node.querySelector(".array-item-move-up"))
        .eql(null);
      expect(node.querySelector(".array-item-move-down"))
        .eql(null);
    });

    it("should have reorder buttons when list length >= 2", () => {
      const {node} = createFormComponent({schema, formData: ["foo", "bar"]});

      expect(node.querySelector(".array-item-move-up"))
        .not.eql(null);
      expect(node.querySelector(".array-item-move-down"))
        .not.eql(null);
    });

    it("should move down a field from the list", () => {
      const {node} = createFormComponent({schema, formData: ["foo", "bar", "baz"]});
      const moveDownBtns = node.querySelectorAll(".array-item-move-down");

      Simulate.click(moveDownBtns[0]);

      const inputs = node.querySelectorAll(".field-string input[type=text]");
      expect(inputs).to.have.length.of(3);
      expect(inputs[0].value).eql("bar");
      expect(inputs[1].value).eql("foo");
      expect(inputs[2].value).eql("baz");
    });

    it("should move up a field from the list", () => {
      const {node} = createFormComponent({schema, formData: ["foo", "bar", "baz"]});
      const moveUpBtns = node.querySelectorAll(".array-item-move-up");

      Simulate.click(moveUpBtns[2]);

      const inputs = node.querySelectorAll(".field-string input[type=text]");
      expect(inputs).to.have.length.of(3);
      expect(inputs[0].value).eql("foo");
      expect(inputs[1].value).eql("baz");
      expect(inputs[2].value).eql("bar");
    });

    it("should disable move buttons on the ends of the list", () => {
      const {node} = createFormComponent({schema, formData: ["foo", "bar"]});
      const moveUpBtns = node.querySelectorAll(".array-item-move-up");
      const moveDownBtns = node.querySelectorAll(".array-item-move-down");

      expect(moveUpBtns[0].disabled).eql(true);
      expect(moveDownBtns[0].disabled).eql(false);
      expect(moveUpBtns[1].disabled).eql(false);
      expect(moveDownBtns[1].disabled).eql(true);
    });

    it("should not show move up/down buttons if orderable is false", () => {
      const {node} = createFormComponent({schema, formData: ["foo", "bar"], uiSchema: {"ui:options": {orderable: false}}});
      const moveUpBtns = node.querySelector(".array-item-move-up");
      const moveDownBtns = node.querySelector(".array-item-move-down");

      expect(moveUpBtns).to.be.null;
      expect(moveDownBtns).to.be.null;
    });

    it("should remove a field from the list", () => {
      const {node} = createFormComponent({schema, formData: ["foo", "bar"]});
      const dropBtns = node.querySelectorAll(".array-item-remove");

      Simulate.click(dropBtns[0]);

      const inputs = node.querySelectorAll(".field-string input[type=text]");
      expect(inputs).to.have.length.of(1);
      expect(inputs[0].value).eql("bar");
    });

    it("should not show remove button if removable is false", () => {
      const {node} = createFormComponent({schema, formData: ["foo", "bar"], uiSchema: {"ui:options": {removable: false}}});
      const dropBtn = node.querySelector(".array-item-remove");

      expect(dropBtn).to.be.null;
    });

    it("should force revalidation when a field is removed", () => {
      // refs #195
      const {node} = createFormComponent({
        schema: {
          ...schema,
          items: {...schema.items, minLength: 4}
        },
        formData: ["foo", "bar!"],
      });

      try {
        Simulate.submit(node);
      } catch (e) {
        // Silencing error thrown as failure is expected here
      }

      expect(node.querySelectorAll(".has-error .error-detail"))
        .to.have.length.of(1);

      const dropBtns = node.querySelectorAll(".array-item-remove");

      Simulate.click(dropBtns[0]);

      expect(node.querySelectorAll(".has-error .error-detail"))
        .to.have.length.of(0);
    });

    it("should render the input widgets with the expected ids", () => {
      const {node} = createFormComponent({schema, formData: ["foo", "bar"]});

      const inputs = node.querySelectorAll("input[type=text]");
      expect(inputs[0].id).eql("root_0");
      expect(inputs[1].id).eql("root_1");
    });

    it("should render nested input widgets with the expected ids", () => {
      const complexSchema = {
        type: "object",
        properties: {
          foo: {
            type: "array",
            items: {
              type: "object",
              properties: {
                bar: {type: "string"},
                baz: {type: "string"}
              }
            }
          }
        }
      };
      const {node} = createFormComponent({schema: complexSchema, formData: {
        foo: [
          {bar: "bar1", baz: "baz1"},
          {bar: "bar2", baz: "baz2"},
        ]
      }});

      const inputs = node.querySelectorAll("input[type=text]");
      expect(inputs[0].id).eql("root_foo_0_bar");
      expect(inputs[1].id).eql("root_foo_0_baz");
      expect(inputs[2].id).eql("root_foo_1_bar");
      expect(inputs[3].id).eql("root_foo_1_baz");
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
    };

    describe("Select multiple widget", () => {
      it("should render a select widget", () => {
        const {node} = createFormComponent({schema});

        expect(node.querySelectorAll("select"))
          .to.have.length.of(1);
      });

      it("should render a select widget with a label", () => {
        const {node} = createFormComponent({schema});

        expect(node.querySelector(".field label").textContent)
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

      it("should handle a blur event", () => {
        const onBlur = sandbox.spy();
        const {node} = createFormComponent({schema, onBlur});

        const select = node.querySelector(".field select");
        Simulate.blur(select, {
          target: {options: [
            {selected: true, value: "foo"},
            {selected: true, value: "bar"},
            {selected: false, value: "fuzz"},
          ]}
        });

        expect(onBlur.calledWith(select.id, ["foo", "bar"])).to.be.true;
      });

      it("should fill field with data", () => {
        const {node} = createFormComponent({schema, formData: ["foo", "bar"]});

        const options = node.querySelectorAll(".field select option");
        expect(options).to.have.length.of(3);
        expect(options[0].selected).eql(true);   // foo
        expect(options[1].selected).eql(true);   // bar
        expect(options[2].selected).eql(false);  // fuzz
      });

      it("should render the select widget with the expected id", () => {
        const {node} = createFormComponent({schema});

        expect(node.querySelector("select").id).eql("root");
      });
    });

    describe("CheckboxesWidget", () => {
      const uiSchema = {
        "ui:widget": "checkboxes"
      };

      it("should render the expected number of checkboxes", () => {
        const {node} = createFormComponent({schema, uiSchema});

        expect(node.querySelectorAll("[type=checkbox]"))
          .to.have.length.of(3);
      });

      it("should render the expected labels", () => {
        const {node} = createFormComponent({schema, uiSchema});

        const labels = [].map.call(node.querySelectorAll(".checkbox label"),
                                   node => node.textContent);
        expect(labels).eql(["foo", "bar", "fuzz"]);
      });

      it("should handle a change event", () => {
        const {comp, node} = createFormComponent({schema, uiSchema});

        Simulate.change(node.querySelectorAll("[type=checkbox]")[0], {
          target: {checked: true}
        });
        Simulate.change(node.querySelectorAll("[type=checkbox]")[2], {
          target: {checked: true}
        });

        expect(comp.state.formData).eql(["foo", "fuzz"]);
      });

      it("should fill field with data", () => {
        const {node} = createFormComponent({
          schema,
          uiSchema,
          formData: ["foo", "fuzz"]
        });

        const labels = [].map.call(node.querySelectorAll("[type=checkbox]"),
                                   node => node.checked);
        expect(labels).eql([true, false, true]);
      });

      it("should render the widget with the expected id", () => {
        const {node} = createFormComponent({schema, uiSchema});

        expect(node.querySelector(".checkboxes").id).eql("root");
      });

      it("should support inline checkboxes", () => {
        const {node} = createFormComponent({
          schema,
          uiSchema: {
            "ui:widget": "checkboxes",
            "ui:options": {
              inline: true
            }
          }
        });

        expect(node.querySelectorAll(".checkbox-inline"))
          .to.have.length.of(3);
      });
    });
  });

  describe("Multiple files field", () => {
    const schema = {
      type: "array",
      title: "My field",
      items: {
        type: "string",
        format: "data-url",
      },
    };

    it("should render an input[type=file] widget", () => {
      const {node} = createFormComponent({schema});

      expect(node.querySelectorAll("input[type=file]"))
        .to.have.length.of(1);
    });

    it("should render a select widget with a label", () => {
      const {node} = createFormComponent({schema});

      expect(node.querySelector(".field label").textContent)
        .eql("My field");
    });

    it("should render a file widget with multiple attribute", () => {
      const {node} = createFormComponent({schema});

      expect(node.querySelector(".field [type=file]").getAttribute("multiple"))
        .not.to.be.null;
    });

    it("should handle a change event", () => {
      sandbox.stub(window, "FileReader").returns({
        set onload(fn) {
          fn({target: {result: "data:text/plain;base64,x="}});
        },
        readAsDataUrl() {}
      });

      const {comp, node} = createFormComponent({schema});

      Simulate.change(node.querySelector(".field input[type=file]"), {
        target: {
          files: [
            {name: "file1.txt", size: 1, type: "type"},
            {name: "file2.txt", size: 2, type: "type"},
          ]
        }
      });

      return new Promise(setImmediate)
        .then(() => expect(comp.state.formData).eql([
          "data:text/plain;name=file1.txt;base64,x=",
          "data:text/plain;name=file2.txt;base64,x=",
        ]));
    });

    it("should fill field with data", () => {
      const {node} = createFormComponent({
        schema,
        formData: [
          "data:text/plain;name=file1.txt;base64,dGVzdDE=",
          "data:image/png;name=file2.png;base64,ZmFrZXBuZw==",
        ],
      });

      const li = node.querySelectorAll(".file-info li");

      expect(li).to.have.length.of(2);
      expect(li[0].textContent).eql("file1.txt (text/plain, 5 bytes)");
      expect(li[1].textContent).eql("file2.png (image/png, 7 bytes)");
    });

    it("should render the file widget with the expected id", () => {
      const {node} = createFormComponent({schema});

      expect(node.querySelector("input[type=file]").id).eql("root");
    });
  });

  describe("Nested lists", () => {
    const schema = {
      "type": "array",
      "title": "A list of arrays",
      "items": {
        "type": "array",
        "title": "A list of numbers",
        "items": {
          "type": "number"
        }
      }
    };

    it("should render two lists of inputs inside of a list", () => {
      const {node} = createFormComponent({schema, formData: [[1, 2], [3, 4]]});
      expect(node.querySelectorAll("fieldset fieldset")).to.have.length.of(2);
    });

    it("should add an inner list when clicking the add button", () => {
      const {node} = createFormComponent({schema});
      expect(node.querySelectorAll("fieldset fieldset")).to.be.empty;

      Simulate.click(node.querySelector(".array-item-add button"));

      expect(node.querySelectorAll("fieldset fieldset")).to.have.length.of(1);
    });
  });

  describe("Fixed items lists", () => {
    const schema = {
      type: "array",
      title: "List of fixed items",
      items: [
        {
          type: "string",
          title: "Some text"
        },
        {
          type: "number",
          title: "A number"
        }
      ]
    };

    const schemaAdditional = {
      type: "array",
      title: "List of fixed items",
      items: [
        {
          type: "number",
          title: "A number"
        },
        {
          type: "number",
          title: "Another number"
        }
      ],
      additionalItems: {
        type: "string",
        title: "Additional item"
      }
    };

    it("should render a fieldset", () => {
      const {node} = createFormComponent({schema});

      expect(node.querySelectorAll("fieldset"))
          .to.have.length.of(1);
    });

    it("should render a fieldset legend", () => {
      const {node} = createFormComponent({schema});
      const legend = node.querySelector("fieldset > legend");
      expect(legend.textContent).eql("List of fixed items");
      expect(legend.id).eql("root__title");
    });

    it("should render field widgets", () => {
      const {node} = createFormComponent({schema});
      const strInput =
          node.querySelector("fieldset .field-string input[type=text]");
      const numInput =
          node.querySelector("fieldset .field-number input[type=text]");
      expect(strInput.id).eql("root_0");
      expect(numInput.id).eql("root_1");
    });

    it("should fill fields with data", () => {
      const {node} = createFormComponent({schema, formData: ["foo", 42]});
      const strInput =
          node.querySelector("fieldset .field-string input[type=text]");
      const numInput =
          node.querySelector("fieldset .field-number input[type=text]");
      expect(strInput.value).eql("foo");
      expect(numInput.value).eql("42");
    });

    it("should handle change events", () => {
      const {comp, node} = createFormComponent({schema});
      const strInput =
          node.querySelector("fieldset .field-string input[type=text]");
      const numInput =
          node.querySelector("fieldset .field-number input[type=text]");

      Simulate.change(strInput, {target: {value: "bar"}});
      Simulate.change(numInput, {target: {value: "101"}});

      expect(comp.state.formData).eql(["bar", 101]);
    });

    it("should generate additional fields and fill data", () => {
      const {node} = createFormComponent({
        schema: schemaAdditional,
        formData: [1, 2, "bar"]
      });
      const addInput =
          node.querySelector("fieldset .field-string input[type=text]");
      expect(addInput.id).eql("root_2");
      expect(addInput.value).eql("bar");
    });

    it("should have an add button if additionalItems is an object", () => {
      const {node} = createFormComponent({schema: schemaAdditional});
      expect(node.querySelector(".array-item-add button")).not.to.be.null;
    });

    it("should not have an add button if additionalItems is not set", () => {
      const {node} = createFormComponent({schema});
      expect(node.querySelector(".array-item-add button")).to.be.null;
    });

    it("should not have an add button if addable is false", () => {
      const {node} = createFormComponent({schema, uiSchema: {"ui:options": {addable: false}}});
      expect(node.querySelector(".array-item-add button")).to.be.null;
    });

    describe("operations for additional items", () => {
      const {comp, node} = createFormComponent({
        schema: schemaAdditional,
        formData: [1, 2, "foo"]
      });

      it("should add a field when clicking add button", () => {
        const addBtn = node.querySelector(".array-item-add button");

        Simulate.click(addBtn);

        expect(node.querySelectorAll(".field-string")).to.have.length.of(2);
        expect(comp.state.formData).eql([1, 2, "foo", undefined]);
      });

      it("should change the state when changing input value", () => {
        const inputs = node.querySelectorAll(".field-string input[type=text]");

        Simulate.change(inputs[0], {target: {value: "bar"}});
        Simulate.change(inputs[1], {target: {value: "baz"}});

        expect(comp.state.formData).eql([1, 2, "bar", "baz"]);
      });

      it("should remove array items when clicking remove buttons", () => {
        let dropBtns = node.querySelectorAll(".array-item-remove");

        Simulate.click(dropBtns[0]);

        expect(node.querySelectorAll(".field-string")).to.have.length.of(1);
        expect(comp.state.formData).eql([1, 2, "baz"]);

        dropBtns = node.querySelectorAll(".array-item-remove");
        Simulate.click(dropBtns[0]);

        expect(node.querySelectorAll(".field-string")).to.be.empty;
        expect(comp.state.formData).eql([1, 2]);
      });
    });
  });

  describe("Multiple number choices list", () => {
    const schema = {
      type: "array",
      title: "My field",
      items: {
        enum: [1, 2, 3],
        type: "integer"
      },
      uniqueItems: true,
    };

    it("should convert array of strings to numbers if type of items is 'number'", () => {
      const {comp, node} = createFormComponent({schema});

      Simulate.change(node.querySelector(".field select"), {
        target: {options: [
          {selected: true, value: "1"},
          {selected: true, value: "2"},
          {selected: false, value: "3"},
        ]}
      });

      expect(comp.state.formData).eql([1, 2]);
    });
  });

  describe("Title", () => {
    const TitleField = props => <div id={`title-${props.title}`}/>;

    const fields = {TitleField};

    it("should pass field name to TitleField if there is no title", () => {
      const schema = {
        "type": "object",
        "properties": {
          "array": {
            "type": "array",
            "items": {
            }
          }
        }
      };

      const {node} = createFormComponent({schema, fields});
      expect(node.querySelector("#title-array")).to.not.be.null;
    });

    it("should pass schema title to TitleField", () => {
      const schema = {
        "type": "array",
        "title": "test",
        "items": {
        }
      };

      const {node} = createFormComponent({schema, fields});
      expect(node.querySelector("#title-test")).to.not.be.null;
    });

    it("should pass empty schema title to TitleField", () => {
      const schema = {
        "type": "array",
        "title": "",
        "items": {
        }
      };
      const {node} = createFormComponent({schema, fields});
      expect(node.querySelector("#title-")).to.be.null;
    });
  });
});
