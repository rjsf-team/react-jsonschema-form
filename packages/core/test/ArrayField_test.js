import React from "react";

import { expect } from "chai";
import { Simulate } from "react-dom/test-utils";
import sinon from "sinon";

import { createFormComponent, createSandbox, submitForm } from "./test_utils";

const ArrayKeyDataAttr = "data-rjsf-itemkey";
const ExposedArrayKeyTemplate = function(props) {
  return (
    <div className="array">
      {props.items &&
        props.items.map(element => (
          <div
            key={element.key}
            className="array-item"
            data-rjsf-itemkey={element.key}>
            <div>{element.children}</div>
            {(element.hasMoveUp || element.hasMoveDown) && (
              <button
                className="array-item-move-down"
                onClick={element.onReorderClick(
                  element.index,
                  element.index + 1
                )}>
                Down
              </button>
            )}
            {(element.hasMoveUp || element.hasMoveDown) && (
              <button
                className="array-item-move-up"
                onClick={element.onReorderClick(
                  element.index,
                  element.index - 1
                )}>
                Up
              </button>
            )}
            {element.hasRemove && (
              <button
                className="array-item-remove"
                onClick={element.onDropIndexClick(element.index)}>
                Remove
              </button>
            )}
            <button onClick={element.onDropIndexClick(element.index)}>
              Delete
            </button>
            <hr />
          </div>
        ))}

      {props.canAdd && (
        <div className="array-item-add">
          <button onClick={props.onAddClick} type="button">
            Add New
          </button>
        </div>
      )}
    </div>
  );
};

const CustomOnAddClickTemplate = function(props) {
  return (
    <div className="array">
      {props.items &&
        props.items.map(element => (
          <div key={element.key} className="array-item">
            <div>{element.children}</div>
          </div>
        ))}

      {props.canAdd && (
        <div className="array-item-add">
          <button onClick={() => props.onAddClick()} type="button">
            Add New
          </button>
        </div>
      )}
    </div>
  );
};

describe("ArrayField", () => {
  let sandbox;
  const CustomComponent = props => {
    return <div id="custom">{props.rawErrors}</div>;
  };

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("Unsupported array schema", () => {
    it("should warn on missing items descriptor", () => {
      const { node } = createFormComponent({ schema: { type: "array" } });

      expect(
        node.querySelector(".field-array > .unsupported-field").textContent
      ).to.contain("Missing items definition");
    });

    it("should be able to be overwritten with a custom UnsupportedField component", () => {
      const CustomUnsupportedField = function() {
        return <span id="custom">Custom UnsupportedField</span>;
      };

      const fields = { UnsupportedField: CustomUnsupportedField };
      const { node } = createFormComponent({
        schema: { type: "array" },
        fields,
      });

      expect(node.querySelectorAll("#custom")[0].textContent).to.eql(
        "Custom UnsupportedField"
      );
    });
  });

  describe("Malformed nested array formData", () => {
    const schema = {
      type: "object",
      properties: {
        foo: {
          type: "array",
          items: { type: "string" },
        },
      },
    };

    it("should contain no field in the list when nested array formData is explicitly null", () => {
      const { node } = createFormComponent({
        schema,
        formData: { foo: null },
      });
      expect(node.querySelectorAll(".field-string")).to.have.length.of(0);
    });
  });

  describe("Nullable array formData", () => {
    const schema = {
      type: "object",
      properties: {
        foo: {
          type: ["array", "null"],
          items: { type: "string" },
        },
      },
    };

    it("should contain no field in the list when nested array formData is explicitly null", () => {
      const { node } = createFormComponent({
        schema,
        formData: { foo: null },
      });
      expect(node.querySelectorAll(".field-string")).to.have.length.of(0);
    });
    it("should contain a field in the list when nested array formData is a single item", () => {
      const { node } = createFormComponent({
        schema,
        formData: { foo: ["test"] },
      });
      expect(node.querySelectorAll(".field-string")).to.have.length.of(1);
    });
  });

  describe("List of inputs", () => {
    const schema = {
      type: "array",
      title: "my list",
      description: "my description",
      items: { type: "string" },
    };

    it("should render a fieldset", () => {
      const { node } = createFormComponent({ schema });

      const fieldset = node.querySelectorAll("fieldset");
      expect(fieldset).to.have.length.of(1);
      expect(fieldset[0].id).eql("root");
    });

    it("should render a fieldset legend", () => {
      const { node } = createFormComponent({ schema });

      const legend = node.querySelector("fieldset > legend");

      expect(legend.textContent).eql("my list");
      expect(legend.id).eql("root__title");
    });

    it("should render a description", () => {
      const { node } = createFormComponent({ schema });

      const description = node.querySelector("fieldset > .field-description");

      expect(description.textContent).eql("my description");
      expect(description.id).eql("root__description");
    });

    it("should render a hidden list", () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          "ui:widget": "hidden",
        },
      });
      expect(node.querySelector("div.hidden > fieldset")).to.exist;
    });

    it("should render a customized title", () => {
      const CustomTitleField = ({ title }) => <div id="custom">{title}</div>;

      const { node } = createFormComponent({
        schema,
        fields: { TitleField: CustomTitleField },
      });
      expect(node.querySelector("fieldset > #custom").textContent).to.eql(
        "my list"
      );
    });

    it("should render a customized description", () => {
      const CustomDescriptionField = ({ description }) => (
        <div id="custom">{description}</div>
      );

      const { node } = createFormComponent({
        schema,
        fields: {
          DescriptionField: CustomDescriptionField,
        },
      });
      expect(node.querySelector("fieldset > #custom").textContent).to.eql(
        "my description"
      );
    });

    it("should render a customized file widget", () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: {
          "ui:widget": "files",
        },
        widgets: { FileWidget: CustomComponent },
      });
      expect(node.querySelector("#custom")).to.exist;
    });

    it("should pass rawErrors down to custom array field templates", () => {
      const schema = {
        type: "array",
        title: "my list",
        description: "my description",
        items: { type: "string" },
        minItems: 2,
      };

      const { node } = createFormComponent({
        schema,
        ArrayFieldTemplate: CustomComponent,
        formData: [1],
        liveValidate: true,
      });

      const matches = node.querySelectorAll("#custom");
      expect(matches).to.have.length.of(1);
      expect(matches[0].textContent).to.eql(
        "should NOT have fewer than 2 items"
      );
    });

    it("should contain no field in the list by default", () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll(".field-string")).to.have.length.of(0);
    });

    it("should have an add button", () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelector(".array-item-add button")).not.eql(null);
    });

    it("should not have an add button if addable is false", () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: { "ui:options": { addable: false } },
      });

      expect(node.querySelector(".array-item-add button")).to.be.null;
    });

    it("should add a new field when clicking the add button", () => {
      const { node } = createFormComponent({ schema });

      Simulate.click(node.querySelector(".array-item-add button"));

      expect(node.querySelectorAll(".field-string")).to.have.length.of(1);
    });

    it("should assign new keys/ids when clicking the add button", () => {
      const { node } = createFormComponent({
        schema,
        ArrayFieldTemplate: ExposedArrayKeyTemplate,
      });

      Simulate.click(node.querySelector(".array-item-add button"));

      expect(node.querySelector(".array-item").hasAttribute(ArrayKeyDataAttr))
        .to.be.true;
    });

    it("should add a field when clicking add button even if event is not passed to onAddClick", () => {
      const { node } = createFormComponent({
        schema,
        ArrayFieldTemplate: CustomOnAddClickTemplate,
      });

      Simulate.click(node.querySelector(".array-item-add button"));

      expect(node.querySelector(".array-item")).not.to.be.null;
    });

    it("should not provide an add button if length equals maxItems", () => {
      const { node } = createFormComponent({
        schema: { maxItems: 2, ...schema },
        formData: ["foo", "bar"],
      });

      expect(node.querySelector(".array-item-add button")).to.be.null;
    });

    it("should provide an add button if length is lesser than maxItems", () => {
      const { node } = createFormComponent({
        schema: { maxItems: 2, ...schema },
        formData: ["foo"],
      });

      expect(node.querySelector(".array-item-add button")).not.eql(null);
    });

    it("should retain existing row keys/ids when adding new row", () => {
      const { node } = createFormComponent({
        schema: { maxItems: 2, ...schema },
        formData: ["foo"],
        ArrayFieldTemplate: ExposedArrayKeyTemplate,
      });

      const startRows = node.querySelectorAll(".array-item");
      const startRow1_key = startRows[0].getAttribute(ArrayKeyDataAttr);
      const startRow2_key = startRows[1]
        ? startRows[1].getAttribute(ArrayKeyDataAttr)
        : undefined;

      Simulate.click(node.querySelector(".array-item-add button"));

      const endRows = node.querySelectorAll(".array-item");
      const endRow1_key = endRows[0].getAttribute(ArrayKeyDataAttr);
      const endRow2_key = endRows[1].getAttribute(ArrayKeyDataAttr);

      expect(startRow1_key).to.equal(endRow1_key);
      expect(startRow2_key).to.not.equal(endRow2_key);

      expect(startRow2_key).to.be.undefined;
      expect(endRows[0].hasAttribute(ArrayKeyDataAttr)).to.be.true;
      expect(endRows[1].hasAttribute(ArrayKeyDataAttr)).to.be.true;
    });

    it("should allow inserting anywhere in list", () => {
      function addItemAboveOrBelow(item) {
        const beforeIndex = item.index;
        const addBeforeButton = (
          <button
            key={`array-item-add-before-${item.key}`}
            className={
              "array-item-move-before array-item-move-before-to-" + beforeIndex
            }
            onClick={item.onAddIndexClick(beforeIndex)}>
            {"Add Item Above"}
          </button>
        );

        const afterIndex = item.index + 1;
        const addAfterButton = (
          <button
            key={`array-item-add-after-${item.key}`}
            className={
              "array-item-move-after array-item-move-after-to-" + afterIndex
            }
            onClick={item.onAddIndexClick(afterIndex)}>
            {"Add Item Below"}
          </button>
        );

        return (
          <div
            key={item.key}
            data-rjsf-itemkey={item.key}
            className={`array-item item-${item.index}`}>
            <div>{addBeforeButton}</div>
            {item.children}
            <div>{addAfterButton}</div>
            <hr />
          </div>
        );
      }

      function addAboveOrBelowArrayFieldTemplate(props) {
        return (
          <div className="array">{props.items.map(addItemAboveOrBelow)}</div>
        );
      }

      const { node } = createFormComponent({
        schema,
        formData: ["foo", "bar", "baz"],
        ArrayFieldTemplate: addAboveOrBelowArrayFieldTemplate,
      });

      const addBeforeButtons = node.querySelectorAll(".array-item-move-before");
      const addAfterButtons = node.querySelectorAll(".array-item-move-after");

      const startRows = node.querySelectorAll(".array-item");
      const startRow1_key = startRows[0].getAttribute(ArrayKeyDataAttr);
      const startRow2_key = startRows[1].getAttribute(ArrayKeyDataAttr);
      const startRow3_key = startRows[2].getAttribute(ArrayKeyDataAttr);

      Simulate.click(addBeforeButtons[0]);
      Simulate.click(addAfterButtons[0]);

      const endRows = node.querySelectorAll(".array-item");
      const endRow2_key = endRows[1].getAttribute(ArrayKeyDataAttr);
      const endRow4_key = endRows[3].getAttribute(ArrayKeyDataAttr);
      const endRow5_key = endRows[4].getAttribute(ArrayKeyDataAttr);

      expect(startRow1_key).to.equal(endRow2_key);
      expect(startRow2_key).to.equal(endRow4_key);
      expect(startRow3_key).to.equal(endRow5_key);

      expect(endRows[0].hasAttribute(ArrayKeyDataAttr)).to.be.true;
      expect(endRows[1].hasAttribute(ArrayKeyDataAttr)).to.be.true;
      expect(endRows[2].hasAttribute(ArrayKeyDataAttr)).to.be.true;
      expect(endRows[3].hasAttribute(ArrayKeyDataAttr)).to.be.true;
      expect(endRows[4].hasAttribute(ArrayKeyDataAttr)).to.be.true;
    });

    it("should not provide an add button if addable is expliclty false regardless maxItems value", () => {
      const { node } = createFormComponent({
        schema: { maxItems: 2, ...schema },
        formData: ["foo"],
        uiSchema: {
          "ui:options": {
            addable: false,
          },
        },
      });

      expect(node.querySelector(".array-item-add button")).to.be.null;
    });

    it("should ignore addable value if maxItems constraint is not satisfied", () => {
      const { node } = createFormComponent({
        schema: { maxItems: 2, ...schema },
        formData: ["foo", "bar"],
        uiSchema: {
          "ui:options": {
            addable: true,
          },
        },
      });

      expect(node.querySelector(".array-item-add button")).to.be.null;
    });

    it("should mark a non-null array item widget as required", () => {
      const { node } = createFormComponent({ schema });

      Simulate.click(node.querySelector(".array-item-add button"));

      expect(node.querySelector(".field-string input[type=text]").required).eql(
        true
      );
    });

    it("should fill an array field with data", () => {
      const { node } = createFormComponent({
        schema,
        formData: ["foo", "bar"],
      });
      const inputs = node.querySelectorAll(".field-string input[type=text]");

      expect(inputs).to.have.length.of(2);
      expect(inputs[0].value).eql("foo");
      expect(inputs[1].value).eql("bar");
    });

    it("shouldn't have reorder buttons when list length <= 1", () => {
      const { node } = createFormComponent({ schema, formData: ["foo"] });

      expect(node.querySelector(".array-item-move-up")).eql(null);
      expect(node.querySelector(".array-item-move-down")).eql(null);
    });

    it("should have reorder buttons when list length >= 2", () => {
      const { node } = createFormComponent({
        schema,
        formData: ["foo", "bar"],
      });

      expect(node.querySelector(".array-item-move-up")).not.eql(null);
      expect(node.querySelector(".array-item-move-down")).not.eql(null);
    });

    it("should move down a field from the list", () => {
      const { node } = createFormComponent({
        schema,
        formData: ["foo", "bar", "baz"],
      });
      const moveDownBtns = node.querySelectorAll(".array-item-move-down");

      Simulate.click(moveDownBtns[0]);

      const inputs = node.querySelectorAll(".field-string input[type=text]");
      expect(inputs).to.have.length.of(3);
      expect(inputs[0].value).eql("bar");
      expect(inputs[1].value).eql("foo");
      expect(inputs[2].value).eql("baz");
    });

    it("should move up a field from the list", () => {
      const { node } = createFormComponent({
        schema,
        formData: ["foo", "bar", "baz"],
      });
      const moveUpBtns = node.querySelectorAll(".array-item-move-up");

      Simulate.click(moveUpBtns[2]);

      const inputs = node.querySelectorAll(".field-string input[type=text]");
      expect(inputs).to.have.length.of(3);
      expect(inputs[0].value).eql("foo");
      expect(inputs[1].value).eql("baz");
      expect(inputs[2].value).eql("bar");
    });

    it("should retain row keys/ids when moving down", () => {
      const { node } = createFormComponent({
        schema,
        formData: ["foo", "bar", "baz"],
        ArrayFieldTemplate: ExposedArrayKeyTemplate,
      });
      const moveDownBtns = node.querySelectorAll(".array-item-move-down");
      const startRows = node.querySelectorAll(".array-item");
      const startRow1_key = startRows[0].getAttribute(ArrayKeyDataAttr);
      const startRow2_key = startRows[1].getAttribute(ArrayKeyDataAttr);
      const startRow3_key = startRows[2].getAttribute(ArrayKeyDataAttr);

      Simulate.click(moveDownBtns[0]);

      const endRows = node.querySelectorAll(".array-item");
      const endRow1_key = endRows[0].getAttribute(ArrayKeyDataAttr);
      const endRow2_key = endRows[1].getAttribute(ArrayKeyDataAttr);
      const endRow3_key = endRows[2].getAttribute(ArrayKeyDataAttr);

      expect(startRow1_key).to.equal(endRow2_key);
      expect(startRow2_key).to.equal(endRow1_key);
      expect(startRow3_key).to.equal(endRow3_key);

      expect(endRows[0].hasAttribute(ArrayKeyDataAttr)).to.be.true;
      expect(endRows[1].hasAttribute(ArrayKeyDataAttr)).to.be.true;
      expect(endRows[2].hasAttribute(ArrayKeyDataAttr)).to.be.true;
    });

    it("should retain row keys/ids when moving up", () => {
      const { node } = createFormComponent({
        schema,
        formData: ["foo", "bar", "baz"],
        ArrayFieldTemplate: ExposedArrayKeyTemplate,
      });
      const moveUpBtns = node.querySelectorAll(".array-item-move-up");
      const startRows = node.querySelectorAll(".array-item");
      const startRow1_key = startRows[0].getAttribute(ArrayKeyDataAttr);
      const startRow2_key = startRows[1].getAttribute(ArrayKeyDataAttr);
      const startRow3_key = startRows[2].getAttribute(ArrayKeyDataAttr);

      Simulate.click(moveUpBtns[2]);

      const endRows = node.querySelectorAll(".array-item");
      const endRow1_key = endRows[0].getAttribute(ArrayKeyDataAttr);
      const endRow2_key = endRows[1].getAttribute(ArrayKeyDataAttr);
      const endRow3_key = endRows[2].getAttribute(ArrayKeyDataAttr);

      expect(startRow1_key).to.equal(endRow1_key);
      expect(startRow2_key).to.equal(endRow3_key);
      expect(startRow3_key).to.equal(endRow2_key);

      expect(endRows[0].hasAttribute(ArrayKeyDataAttr)).to.be.true;
      expect(endRows[1].hasAttribute(ArrayKeyDataAttr)).to.be.true;
      expect(endRows[2].hasAttribute(ArrayKeyDataAttr)).to.be.true;
    });

    it("should move from first to last in the list", () => {
      function moveAnywhereArrayItemTemplate(props) {
        const buttons = [];
        for (let i = 0; i < 3; i++) {
          buttons.push(
            <button
              key={i}
              className={"array-item-move-to-" + i}
              onClick={props.onReorderClick(props.index, i)}>
              {"Move item to index " + i}
            </button>
          );
        }
        return (
          <div
            key={props.key}
            data-rjsf-itemkey={props.key}
            className={`array-item item-${props.index}`}>
            {props.children}
            {buttons}
          </div>
        );
      }

      function moveAnywhereArrayFieldTemplate(props) {
        return (
          <div className="array">
            {props.items.map(moveAnywhereArrayItemTemplate)}
          </div>
        );
      }

      const { node } = createFormComponent({
        schema,
        formData: ["foo", "bar", "baz"],
        ArrayFieldTemplate: moveAnywhereArrayFieldTemplate,
      });

      const startRows = node.querySelectorAll(".array-item");
      const startRow1_key = startRows[0].getAttribute(ArrayKeyDataAttr);
      const startRow2_key = startRows[1].getAttribute(ArrayKeyDataAttr);
      const startRow3_key = startRows[2].getAttribute(ArrayKeyDataAttr);

      const button = node.querySelector(".item-0 .array-item-move-to-2");
      Simulate.click(button);

      const inputs = node.querySelectorAll(".field-string input[type=text]");
      expect(inputs[0].value).eql("bar");
      expect(inputs[1].value).eql("baz");
      expect(inputs[2].value).eql("foo");

      const endRows = node.querySelectorAll(".array-item");
      const endRow1_key = endRows[0].getAttribute(ArrayKeyDataAttr);
      const endRow2_key = endRows[1].getAttribute(ArrayKeyDataAttr);
      const endRow3_key = endRows[2].getAttribute(ArrayKeyDataAttr);

      expect(startRow1_key).to.equal(endRow3_key);
      expect(startRow2_key).to.equal(endRow1_key);
      expect(startRow3_key).to.equal(endRow2_key);

      expect(endRows[0].hasAttribute(ArrayKeyDataAttr)).to.be.true;
      expect(endRows[1].hasAttribute(ArrayKeyDataAttr)).to.be.true;
      expect(endRows[2].hasAttribute(ArrayKeyDataAttr)).to.be.true;
    });

    it("should disable move buttons on the ends of the list", () => {
      const { node } = createFormComponent({
        schema,
        formData: ["foo", "bar"],
      });
      const moveUpBtns = node.querySelectorAll(".array-item-move-up");
      const moveDownBtns = node.querySelectorAll(".array-item-move-down");

      expect(moveUpBtns[0].disabled).eql(true);
      expect(moveDownBtns[0].disabled).eql(false);
      expect(moveUpBtns[1].disabled).eql(false);
      expect(moveDownBtns[1].disabled).eql(true);
    });

    it("should not show move up/down buttons if orderable is false", () => {
      const { node } = createFormComponent({
        schema,
        formData: ["foo", "bar"],
        uiSchema: { "ui:options": { orderable: false } },
      });
      const moveUpBtns = node.querySelector(".array-item-move-up");
      const moveDownBtns = node.querySelector(".array-item-move-down");

      expect(moveUpBtns).to.be.null;
      expect(moveDownBtns).to.be.null;
    });

    it("should remove a field from the list", () => {
      const { node } = createFormComponent({
        schema,
        formData: ["foo", "bar"],
      });
      const dropBtns = node.querySelectorAll(".array-item-remove");

      Simulate.click(dropBtns[0]);

      const inputs = node.querySelectorAll(".field-string input[type=text]");
      expect(inputs).to.have.length.of(1);
      expect(inputs[0].value).eql("bar");
    });

    it("should delete item from list and correct indices", () => {
      const { node } = createFormComponent({
        schema,
        formData: ["foo", "bar", "baz"],
      });
      const deleteBtns = node.querySelectorAll(".array-item-remove");

      Simulate.click(deleteBtns[0]);

      const inputs = node.querySelectorAll(".field-string input[type=text]");

      Simulate.change(inputs[0], { target: { value: "fuzz" } });
      expect(inputs).to.have.length.of(2);
      expect(inputs[0].value).eql("fuzz");
      expect(inputs[1].value).eql("baz");
    });

    it("should retain row keys/ids of remaining rows when a row is removed", () => {
      const { node } = createFormComponent({
        schema,
        formData: ["foo", "bar"],
        ArrayFieldTemplate: ExposedArrayKeyTemplate,
      });

      const startRows = node.querySelectorAll(".array-item");
      const startRow2_key = startRows[1].getAttribute(ArrayKeyDataAttr);

      const dropBtns = node.querySelectorAll(".array-item-remove");
      Simulate.click(dropBtns[0]);

      const endRows = node.querySelectorAll(".array-item");
      const endRow1_key = endRows[0].getAttribute(ArrayKeyDataAttr);

      expect(startRow2_key).to.equal(endRow1_key);
      expect(endRows[0].hasAttribute(ArrayKeyDataAttr)).to.be.true;
    });

    it("should not show remove button if removable is false", () => {
      const { node } = createFormComponent({
        schema,
        formData: ["foo", "bar"],
        uiSchema: { "ui:options": { removable: false } },
      });
      const dropBtn = node.querySelector(".array-item-remove");

      expect(dropBtn).to.be.null;
    });

    it("should force revalidation when a field is removed", () => {
      // refs #195
      const { node } = createFormComponent({
        schema: {
          ...schema,
          items: { ...schema.items, minLength: 4 },
        },
        formData: ["foo", "bar!"],
      });

      try {
        Simulate.submit(node);
      } catch (e) {
        // Silencing error thrown as failure is expected here
      }

      expect(
        node.querySelectorAll(".has-error .error-detail")
      ).to.have.length.of(1);

      const dropBtns = node.querySelectorAll(".array-item-remove");

      Simulate.click(dropBtns[0]);

      expect(
        node.querySelectorAll(".has-error .error-detail")
      ).to.have.length.of(0);
    });

    it("should handle cleared field values in the array", () => {
      const schema = {
        type: "array",
        items: { type: "integer" },
      };
      const formData = [1, 2, 3];
      const { node, onChange, onError } = createFormComponent({
        liveValidate: true,
        schema,
        formData,
      });

      Simulate.change(node.querySelector("#root_1"), {
        target: { value: "" },
      });

      sinon.assert.calledWithMatch(onChange.lastCall, {
        errorSchema: { 1: { __errors: ["should be integer"] } },
        errors: [
          {
            message: "should be integer",
            name: "type",
            params: { type: "integer" },
            property: "[1]",
            schemaPath: "#/items/type",
            stack: "[1] should be integer",
          },
        ],
        formData: [1, null, 3],
      });

      submitForm(node);
      sinon.assert.calledWithMatch(onError.lastCall, [
        {
          message: "should be integer",
          name: "type",
          params: { type: "integer" },
          property: "[1]",
          schemaPath: "#/items/type",
          stack: "[1] should be integer",
        },
      ]);
    });

    it("should render the input widgets with the expected ids", () => {
      const { node } = createFormComponent({
        schema,
        formData: ["foo", "bar"],
      });

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
                bar: { type: "string" },
                baz: { type: "string" },
              },
            },
          },
        },
      };
      const { node } = createFormComponent({
        schema: complexSchema,
        formData: {
          foo: [{ bar: "bar1", baz: "baz1" }, { bar: "bar2", baz: "baz2" }],
        },
      });

      const inputs = node.querySelectorAll("input[type=text]");
      expect(inputs[0].id).eql("root_foo_0_bar");
      expect(inputs[1].id).eql("root_foo_0_baz");
      expect(inputs[2].id).eql("root_foo_1_bar");
      expect(inputs[3].id).eql("root_foo_1_baz");
    });

    it("should render enough inputs with proper defaults to match minItems in schema when no formData is set", () => {
      const complexSchema = {
        type: "object",
        definitions: {
          Thing: {
            type: "object",
            properties: {
              name: {
                type: "string",
                default: "Default name",
              },
            },
          },
        },
        properties: {
          foo: {
            type: "array",
            minItems: 2,
            items: {
              $ref: "#/definitions/Thing",
            },
          },
        },
      };
      let form = createFormComponent({
        schema: complexSchema,
        formData: {},
      });
      let inputs = form.node.querySelectorAll("input[type=text]");
      expect(inputs[0].value).eql("Default name");
      expect(inputs[1].value).eql("Default name");
    });

    it("should render an input for each default value, even when this is greater than minItems", () => {
      const schema = {
        type: "object",
        properties: {
          turtles: {
            type: "array",
            minItems: 2,
            default: ["Raphael", "Michaelangelo", "Donatello", "Leonardo"],
            items: {
              type: "string",
            },
          },
        },
      };
      const { node } = createFormComponent({ schema: schema });
      const inputs = node.querySelectorAll("input[type=text]");
      expect(inputs.length).to.eql(4);
      expect(inputs[0].value).to.eql("Raphael");
      expect(inputs[1].value).to.eql("Michaelangelo");
      expect(inputs[2].value).to.eql("Donatello");
      expect(inputs[3].value).to.eql("Leonardo");
    });

    it("should render enough input to match minItems, populating the first with default values, and the rest empty", () => {
      const schema = {
        type: "object",
        properties: {
          turtles: {
            type: "array",
            minItems: 4,
            default: ["Raphael", "Michaelangelo"],
            items: {
              type: "string",
            },
          },
        },
      };
      const { node } = createFormComponent({ schema });
      const inputs = node.querySelectorAll("input[type=text]");
      expect(inputs.length).to.eql(4);
      expect(inputs[0].value).to.eql("Raphael");
      expect(inputs[1].value).to.eql("Michaelangelo");
      expect(inputs[2].value).to.eql("");
      expect(inputs[3].value).to.eql("");
    });

    it("should render enough input to match minItems, populating the first with default values, and the rest with the item default", () => {
      const schema = {
        type: "object",
        properties: {
          turtles: {
            type: "array",
            minItems: 4,
            default: ["Raphael", "Michaelangelo"],
            items: {
              type: "string",
              default: "Unknown",
            },
          },
        },
      };
      const { node } = createFormComponent({ schema });
      const inputs = node.querySelectorAll("input[type=text]");
      expect(inputs.length).to.eql(4);
      expect(inputs[0].value).to.eql("Raphael");
      expect(inputs[1].value).to.eql("Michaelangelo");
      expect(inputs[2].value).to.eql("Unknown");
      expect(inputs[3].value).to.eql("Unknown");
    });

    it("should not add minItems extra formData entries when schema item is a multiselect", () => {
      const schema = {
        type: "object",
        properties: {
          multipleChoicesList: {
            type: "array",
            minItems: 3,
            uniqueItems: true,
            items: {
              type: "string",
              enum: ["Aramis", "Athos", "Porthos", "d'Artagnan"],
            },
          },
        },
      };
      const uiSchema = {
        multipleChoicesList: {
          "ui:widget": "checkboxes",
        },
      };
      let form = createFormComponent({
        schema: schema,
        uiSchema: uiSchema,
        formData: {},
        liveValidate: true,
        noValidate: true,
      });
      submitForm(form.node);

      sinon.assert.calledWithMatch(form.onSubmit.lastCall, {
        formData: { multipleChoicesList: [] },
      });

      form = createFormComponent({
        schema: schema,
        uiSchema: uiSchema,
        formData: {},
        liveValidate: true,
        noValidate: false,
      });
      submitForm(form.node);

      sinon.assert.calledWithMatch(form.onError.lastCall, [
        {
          message: "should NOT have fewer than 3 items",
          name: "minItems",
          params: { limit: 3 },
          property: ".multipleChoicesList",
          schemaPath: "#/properties/multipleChoicesList/minItems",
          stack: ".multipleChoicesList should NOT have fewer than 3 items",
        },
      ]);
    });

    it("should honor given formData, even when it does not meet ths minItems-requirement", () => {
      const complexSchema = {
        type: "object",
        definitions: {
          Thing: {
            type: "object",
            properties: {
              name: {
                type: "string",
                default: "Default name",
              },
            },
          },
        },
        properties: {
          foo: {
            type: "array",
            minItems: 2,
            items: {
              $ref: "#/definitions/Thing",
            },
          },
        },
      };
      const form = createFormComponent({
        schema: complexSchema,
        formData: { foo: [] },
      });
      const inputs = form.node.querySelectorAll("input[type=text]");
      expect(inputs.length).eql(0);
    });
  });

  describe("Multiple choices list", () => {
    const schema = {
      type: "array",
      title: "My field",
      items: {
        enum: ["foo", "bar", "fuzz"],
        type: "string",
      },
      uniqueItems: true,
    };

    describe("Select multiple widget", () => {
      it("should render a select widget", () => {
        const { node } = createFormComponent({ schema });

        expect(node.querySelectorAll("select")).to.have.length.of(1);
      });

      it("should render a select widget with a label", () => {
        const { node } = createFormComponent({ schema });

        expect(node.querySelector(".field label").textContent).eql("My field");
      });

      it("should render a select widget with multiple attribute", () => {
        const { node } = createFormComponent({ schema });

        expect(node.querySelector(".field select").getAttribute("multiple")).not
          .to.be.null;
      });

      it("should render options", () => {
        const { node } = createFormComponent({ schema });

        expect(node.querySelectorAll("select option")).to.have.length.of(3);
      });

      it("should handle a change event", () => {
        const { node, onChange } = createFormComponent({ schema });

        Simulate.change(node.querySelector(".field select"), {
          target: {
            options: [
              { selected: true, value: "foo" },
              { selected: true, value: "bar" },
              { selected: false, value: "fuzz" },
            ],
          },
        });

        sinon.assert.calledWithMatch(onChange.lastCall, {
          formData: ["foo", "bar"],
        });
      });

      it("should handle a blur event", () => {
        const onBlur = sandbox.spy();
        const { node } = createFormComponent({ schema, onBlur });

        const select = node.querySelector(".field select");
        Simulate.blur(select, {
          target: {
            options: [
              { selected: true, value: "foo" },
              { selected: true, value: "bar" },
              { selected: false, value: "fuzz" },
            ],
          },
        });

        expect(onBlur.calledWith(select.id, ["foo", "bar"])).to.be.true;
      });

      it("should handle a focus event", () => {
        const onFocus = sandbox.spy();
        const { node } = createFormComponent({ schema, onFocus });

        const select = node.querySelector(".field select");
        Simulate.focus(select, {
          target: {
            options: [
              { selected: true, value: "foo" },
              { selected: true, value: "bar" },
              { selected: false, value: "fuzz" },
            ],
          },
        });

        expect(onFocus.calledWith(select.id, ["foo", "bar"])).to.be.true;
      });

      it("should fill field with data", () => {
        const { node } = createFormComponent({
          schema,
          formData: ["foo", "bar"],
        });

        const options = node.querySelectorAll(".field select option");
        expect(options).to.have.length.of(3);
        expect(options[0].selected).eql(true); // foo
        expect(options[1].selected).eql(true); // bar
        expect(options[2].selected).eql(false); // fuzz
      });

      it("should render the select widget with the expected id", () => {
        const { node } = createFormComponent({ schema });

        expect(node.querySelector("select").id).eql("root");
      });

      it("should pass rawErrors down to custom widgets", () => {
        const { node } = createFormComponent({
          schema,
          widgets: {
            SelectWidget: CustomComponent,
          },
          formData: ["foo", "foo"],
          liveValidate: true,
        });

        const matches = node.querySelectorAll("#custom");
        expect(matches).to.have.length.of(1);
        expect(matches[0].textContent).to.eql(
          "should NOT have duplicate items (items ## 1 and 0 are identical)"
        );
      });

      it("should pass a label as prop to custom widgets", () => {
        const LabelComponent = ({ label }) => <div id="test">{label}</div>;
        const { node } = createFormComponent({
          schema,
          widgets: {
            SelectWidget: LabelComponent,
          },
        });

        const matches = node.querySelectorAll("#test");
        expect(matches).to.have.length.of(1);
        expect(matches[0].textContent).to.eql(schema.title);
      });
    });

    describe("CheckboxesWidget", () => {
      const uiSchema = {
        "ui:widget": "checkboxes",
      };

      it("should render the expected number of checkboxes", () => {
        const { node } = createFormComponent({ schema, uiSchema });

        expect(node.querySelectorAll("[type=checkbox]")).to.have.length.of(3);
      });

      it("should render the expected labels", () => {
        const { node } = createFormComponent({ schema, uiSchema });

        const labels = [].map.call(
          node.querySelectorAll(".checkbox label"),
          node => node.textContent
        );
        expect(labels).eql(["foo", "bar", "fuzz"]);
      });

      it("should handle a change event", () => {
        const { node, onChange } = createFormComponent({
          schema,
          uiSchema,
        });

        Simulate.change(node.querySelectorAll("[type=checkbox]")[0], {
          target: { checked: true },
        });
        Simulate.change(node.querySelectorAll("[type=checkbox]")[2], {
          target: { checked: true },
        });

        sinon.assert.calledWithMatch(onChange.lastCall, {
          formData: ["foo", "fuzz"],
        });
      });

      it("should fill field with data", () => {
        const { node } = createFormComponent({
          schema,
          uiSchema,
          formData: ["foo", "fuzz"],
        });

        const labels = [].map.call(
          node.querySelectorAll("[type=checkbox]"),
          node => node.checked
        );
        expect(labels).eql([true, false, true]);
      });

      it("should render the widget with the expected id", () => {
        const { node } = createFormComponent({ schema, uiSchema });

        expect(node.querySelector(".checkboxes").id).eql("root");
      });

      it("should support inline checkboxes", () => {
        const { node } = createFormComponent({
          schema,
          uiSchema: {
            "ui:widget": "checkboxes",
            "ui:options": {
              inline: true,
            },
          },
        });

        expect(node.querySelectorAll(".checkbox-inline")).to.have.length.of(3);
      });

      it("should pass rawErrors down to custom widgets", () => {
        const schema = {
          type: "array",
          title: "My field",
          items: {
            enum: ["foo", "bar", "fuzz"],
            type: "string",
          },
          minItems: 3,
          uniqueItems: true,
        };

        const { node } = createFormComponent({
          schema,
          widgets: {
            CheckboxesWidget: CustomComponent,
          },
          uiSchema,
          formData: [],
          liveValidate: true,
        });

        const matches = node.querySelectorAll("#custom");
        expect(matches).to.have.length.of(1);
        expect(matches[0].textContent).to.eql(
          "should NOT have fewer than 3 items"
        );
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
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll("input[type=file]")).to.have.length.of(1);
    });

    it("should render a select widget with a label", () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelector(".field label").textContent).eql("My field");
    });

    it("should render a file widget with multiple attribute", () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelector(".field [type=file]").getAttribute("multiple"))
        .not.to.be.null;
    });

    it("should handle a change event", async () => {
      sandbox.stub(window, "FileReader").returns({
        set onload(fn) {
          fn({ target: { result: "data:text/plain;base64,x=" } });
        },
        readAsDataUrl() {},
      });

      const { node, onChange } = createFormComponent({ schema });

      Simulate.change(node.querySelector(".field input[type=file]"), {
        target: {
          files: [
            { name: "file1.txt", size: 1, type: "type" },
            { name: "file2.txt", size: 2, type: "type" },
          ],
        },
      });

      await new Promise(setImmediate);

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: [
          "data:text/plain;name=file1.txt;base64,x=",
          "data:text/plain;name=file2.txt;base64,x=",
        ],
      });
    });

    it("should fill field with data", () => {
      const { node } = createFormComponent({
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
      const { node } = createFormComponent({ schema });

      expect(node.querySelector("input[type=file]").id).eql("root");
    });

    it("should pass rawErrors down to custom widgets", () => {
      const schema = {
        type: "array",
        title: "My field",
        items: {
          type: "string",
          format: "data-url",
        },
        minItems: 5,
      };

      const { node } = createFormComponent({
        schema,
        widgets: {
          FileWidget: CustomComponent,
        },
        formData: [],
        liveValidate: true,
      });

      const matches = node.querySelectorAll("#custom");
      expect(matches).to.have.length.of(1);
      expect(matches[0].textContent).to.eql(
        "should NOT have fewer than 5 items"
      );
    });
  });

  describe("Nested lists", () => {
    const schema = {
      type: "array",
      title: "A list of arrays",
      items: {
        type: "array",
        title: "A list of numbers",
        items: {
          type: "number",
        },
      },
    };

    it("should render two lists of inputs inside of a list", () => {
      const { node } = createFormComponent({
        schema,
        formData: [[1, 2], [3, 4]],
      });
      expect(node.querySelectorAll("fieldset fieldset")).to.have.length.of(2);
    });

    it("should add an inner list when clicking the add button", () => {
      const { node } = createFormComponent({ schema });
      expect(node.querySelectorAll("fieldset fieldset")).to.be.empty;

      Simulate.click(node.querySelector(".array-item-add button"));

      expect(node.querySelectorAll("fieldset fieldset")).to.have.length.of(1);
    });

    it("should pass rawErrors down to every level of custom widgets", () => {
      const CustomItem = props => <div id="custom-item">{props.children}</div>;
      const CustomTemplate = props => {
        return (
          <div id="custom">
            {props.items &&
              props.items.map((p, i) => <CustomItem key={i} {...p} />)}
            <div id="custom-error">
              {props.rawErrors && props.rawErrors.join(", ")}
            </div>
          </div>
        );
      };

      const schema = {
        type: "array",
        title: "A list of arrays",
        items: {
          type: "array",
          title: "A list of numbers",
          items: {
            type: "number",
          },
          minItems: 3,
        },
        minItems: 2,
      };

      const { node } = createFormComponent({
        schema,
        ArrayFieldTemplate: CustomTemplate,
        formData: [[]],
        liveValidate: true,
      });

      const matches = node.querySelectorAll("#custom-error");
      expect(matches).to.have.length.of(2);
      expect(matches[0].textContent).to.eql(
        "should NOT have fewer than 3 items"
      );
      expect(matches[1].textContent).to.eql(
        "should NOT have fewer than 2 items"
      );
    });
  });

  describe("Fixed items lists", () => {
    const schema = {
      type: "array",
      title: "List of fixed items",
      items: [
        {
          type: "string",
          title: "Some text",
        },
        {
          type: "number",
          title: "A number",
        },
      ],
    };

    const schemaAdditional = {
      type: "array",
      title: "List of fixed items",
      items: [
        {
          type: "number",
          title: "A number",
        },
        {
          type: "number",
          title: "Another number",
        },
      ],
      additionalItems: {
        type: "string",
        title: "Additional item",
      },
    };

    it("should render a fieldset", () => {
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll("fieldset")).to.have.length.of(1);
    });

    it("should render a fieldset legend", () => {
      const { node } = createFormComponent({ schema });
      const legend = node.querySelector("fieldset > legend");
      expect(legend.textContent).eql("List of fixed items");
      expect(legend.id).eql("root__title");
    });

    it("should render field widgets", () => {
      const { node } = createFormComponent({ schema });
      const strInput = node.querySelector(
        "fieldset .field-string input[type=text]"
      );
      const numInput = node.querySelector(
        "fieldset .field-number input[type=number]"
      );
      expect(strInput.id).eql("root_0");
      expect(numInput.id).eql("root_1");
    });

    it("should mark non-null item widgets as required", () => {
      const { node } = createFormComponent({ schema });
      const strInput = node.querySelector(
        "fieldset .field-string input[type=text]"
      );
      const numInput = node.querySelector(
        "fieldset .field-number input[type=number]"
      );
      expect(strInput.required).eql(true);
      expect(numInput.required).eql(true);
    });

    it("should fill fields with data", () => {
      const { node } = createFormComponent({
        schema,
        formData: ["foo", 42],
      });
      const strInput = node.querySelector(
        "fieldset .field-string input[type=text]"
      );
      const numInput = node.querySelector(
        "fieldset .field-number input[type=number]"
      );
      expect(strInput.value).eql("foo");
      expect(numInput.value).eql("42");
    });

    it("should handle change events", () => {
      const { node, onChange } = createFormComponent({ schema });
      const strInput = node.querySelector(
        "fieldset .field-string input[type=text]"
      );
      const numInput = node.querySelector(
        "fieldset .field-number input[type=number]"
      );

      Simulate.change(strInput, { target: { value: "bar" } });
      Simulate.change(numInput, { target: { value: "101" } });

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: ["bar", 101],
      });
    });

    it("should generate additional fields and fill data", () => {
      const { node } = createFormComponent({
        schema: schemaAdditional,
        formData: [1, 2, "bar"],
      });
      const addInput = node.querySelector(
        "fieldset .field-string input[type=text]"
      );
      expect(addInput.id).eql("root_2");
      expect(addInput.value).eql("bar");
    });

    it("should apply uiSchema to additionalItems", () => {
      const { node } = createFormComponent({
        schema: schemaAdditional,
        uiSchema: {
          additionalItems: {
            "ui:title": "Custom title",
          },
        },
        formData: [1, 2, "bar"],
      });
      const label = node.querySelector(
        "fieldset .field-string label.control-label"
      );
      expect(label.textContent).eql("Custom title*");
    });

    it("should have an add button if additionalItems is an object", () => {
      const { node } = createFormComponent({ schema: schemaAdditional });
      expect(node.querySelector(".array-item-add button")).not.to.be.null;
    });

    it("should not have an add button if additionalItems is not set", () => {
      const { node } = createFormComponent({ schema });
      expect(node.querySelector(".array-item-add button")).to.be.null;
    });

    it("should not have an add button if addable is false", () => {
      const { node } = createFormComponent({
        schema,
        uiSchema: { "ui:options": { addable: false } },
      });
      expect(node.querySelector(".array-item-add button")).to.be.null;
    });

    it("[fixed-noadditional] should not provide an add button regardless maxItems", () => {
      const { node } = createFormComponent({
        schema: { maxItems: 3, ...schema },
      });

      expect(node.querySelector(".array-item-add button")).to.be.null;
    });

    it("[fixed] should not provide an add button if length equals maxItems", () => {
      const { node } = createFormComponent({
        schema: { maxItems: 2, ...schemaAdditional },
      });

      expect(node.querySelector(".array-item-add button")).to.be.null;
    });

    it("[fixed] should provide an add button if length is lesser than maxItems", () => {
      const { node } = createFormComponent({
        schema: { maxItems: 3, ...schemaAdditional },
      });

      expect(node.querySelector(".array-item-add button")).not.to.be.null;
    });

    it("[fixed] should not provide an add button if addable is expliclty false regardless maxItems value", () => {
      const { node } = createFormComponent({
        schema: { maxItems: 2, ...schema },
        uiSchema: {
          "ui:options": {
            addable: false,
          },
        },
      });

      expect(node.querySelector(".array-item-add button")).to.be.null;
    });

    it("[fixed] should ignore addable value if maxItems constraint is not satisfied", () => {
      const { node } = createFormComponent({
        schema: { maxItems: 2, ...schema },
        uiSchema: {
          "ui:options": {
            addable: true,
          },
        },
      });

      expect(node.querySelector(".array-item-add button")).to.be.null;
    });

    describe("operations for additional items", () => {
      const { node, onChange } = createFormComponent({
        schema: schemaAdditional,
        formData: [1, 2, "foo"],
        ArrayFieldTemplate: ExposedArrayKeyTemplate,
      });

      const startRows = node.querySelectorAll(".array-item");
      const startRow1_key = startRows[0].getAttribute(ArrayKeyDataAttr);
      const startRow2_key = startRows[1].getAttribute(ArrayKeyDataAttr);
      const startRow3_key = startRows[2].getAttribute(ArrayKeyDataAttr);
      const startRow4_key = startRows[3]
        ? startRows[3].getAttribute(ArrayKeyDataAttr)
        : undefined;

      it("should add a field when clicking add button", () => {
        const addBtn = node.querySelector(".array-item-add button");

        Simulate.click(addBtn);

        expect(node.querySelectorAll(".field-string")).to.have.length.of(2);

        sinon.assert.calledWithMatch(onChange.lastCall, {
          formData: [1, 2, "foo", undefined],
        });
      });

      it("should retain existing row keys/ids when adding additional items", () => {
        const endRows = node.querySelectorAll(".array-item");
        const endRow1_key = endRows[0].getAttribute(ArrayKeyDataAttr);
        const endRow2_key = endRows[1].getAttribute(ArrayKeyDataAttr);
        const endRow3_key = endRows[2].getAttribute(ArrayKeyDataAttr);
        const endRow4_key = endRows[3].getAttribute(ArrayKeyDataAttr);

        expect(startRow1_key).to.equal(endRow1_key);
        expect(startRow2_key).to.equal(endRow2_key);
        expect(startRow3_key).to.equal(endRow3_key);

        expect(startRow4_key).to.not.equal(endRow4_key);
        expect(startRow4_key).to.be.undefined;
        expect(endRows[0].hasAttribute(ArrayKeyDataAttr)).to.be.true;
        expect(endRows[1].hasAttribute(ArrayKeyDataAttr)).to.be.true;
        expect(endRows[2].hasAttribute(ArrayKeyDataAttr)).to.be.true;
        expect(endRows[3].hasAttribute(ArrayKeyDataAttr)).to.be.true;
      });

      it("should change the state when changing input value", () => {
        const inputs = node.querySelectorAll(".field-string input[type=text]");

        Simulate.change(inputs[0], { target: { value: "bar" } });
        Simulate.change(inputs[1], { target: { value: "baz" } });

        sinon.assert.calledWithMatch(onChange.lastCall, {
          formData: [1, 2, "bar", "baz"],
        });
      });

      it("should remove array items when clicking remove buttons", () => {
        let dropBtns = node.querySelectorAll(".array-item-remove");

        Simulate.click(dropBtns[0]);

        expect(node.querySelectorAll(".field-string")).to.have.length.of(1);

        sinon.assert.calledWithMatch(onChange.lastCall, {
          formData: [1, 2, "baz"],
        });

        dropBtns = node.querySelectorAll(".array-item-remove");
        Simulate.click(dropBtns[0]);

        expect(node.querySelectorAll(".field-string")).to.be.empty;
        sinon.assert.calledWithMatch(onChange.lastCall, {
          formData: [1, 2],
        });
      });
    });
  });

  describe("Multiple number choices list", () => {
    const schema = {
      type: "array",
      title: "My field",
      items: {
        enum: [1, 2, 3],
        type: "integer",
      },
      uniqueItems: true,
    };

    it("should convert array of strings to numbers if type of items is 'number'", () => {
      const { node, onChange } = createFormComponent({ schema });

      Simulate.change(node.querySelector(".field select"), {
        target: {
          options: [
            { selected: true, value: "1" },
            { selected: true, value: "2" },
            { selected: false, value: "3" },
          ],
        },
      });

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: [1, 2],
      });
    });
  });

  describe("Title", () => {
    const TitleField = props => <div id={`title-${props.title}`} />;

    const fields = { TitleField };

    it("should pass field name to TitleField if there is no title", () => {
      const schema = {
        type: "object",
        properties: {
          array: {
            type: "array",
            items: {},
          },
        },
      };

      const { node } = createFormComponent({ schema, fields });
      expect(node.querySelector("#title-array")).to.not.be.null;
    });

    it("should pass schema title to TitleField", () => {
      const schema = {
        type: "array",
        title: "test",
        items: {},
      };

      const { node } = createFormComponent({ schema, fields });
      expect(node.querySelector("#title-test")).to.not.be.null;
    });

    it("should pass empty schema title to TitleField", () => {
      const schema = {
        type: "array",
        title: "",
        items: {},
      };
      const { node } = createFormComponent({ schema, fields });
      expect(node.querySelector("#title-")).to.be.null;
    });
  });
});
