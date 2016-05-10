import { expect } from "chai";

import { createFormComponent, createSandbox, Simulate } from "./test_utils";


describe("ArrayField", () => {
  let sandbox;

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
      items: {type: "string"}
    };

    it("should render a fieldset", function*() {
      const {node} = yield createFormComponent({schema});

      expect(node.querySelectorAll("fieldset"))
        .to.have.length.of(1);
    });

    it("should render a fieldset legend", function*() {
      const {node} = yield createFormComponent({schema});

      const legend = node.querySelector("fieldset > legend");

      expect(legend.textContent).eql("my list");
      expect(legend.id).eql("root__title");
    });

    it("should contain no field in the list by default", function*() {
      const {node} = yield createFormComponent({schema});

      expect(node.querySelectorAll(".field-string"))
        .to.have.length.of(0);
    });

    it("should have an add button", function*() {
      const {node} = yield createFormComponent({schema});

      expect(node.querySelector(".array-item-add button"))
        .not.eql(null);
    });

    it("should add a new field when clicking the add button", function*() {
      const {node} = yield createFormComponent({schema});

      yield Simulate.click(node.querySelector(".array-item-add button"));

      expect(node.querySelectorAll(".field-string"))
        .to.have.length.of(1);
    });

    it("should fill an array field with data", function*() {
      const {node} = yield createFormComponent({schema, formData: ["foo", "bar"]});
      const inputs = node.querySelectorAll(".field-string input[type=text]");

      expect(inputs).to.have.length.of(2);
      expect(inputs[0].value).eql("foo");
      expect(inputs[1].value).eql("bar");
    });

    it("should remove a field from the list", function*() {
      const {node} = yield createFormComponent({schema, formData: ["foo", "bar"]});
      const dropBtns = node.querySelectorAll(".array-item-remove button");

      yield Simulate.click(dropBtns[0]);

      const inputs = node.querySelectorAll(".field-string input[type=text]");
      expect(inputs).to.have.length.of(1);
      expect(inputs[0].value).eql("bar");
    });

    it("should render the input widgets with the expected ids", function*() {
      const {node} = yield createFormComponent({schema, formData: ["foo", "bar"]});

      const inputs = node.querySelectorAll("input[type=text]");
      expect(inputs[0].id).eql("root_0");
      expect(inputs[1].id).eql("root_1");
    });

    it("should render nested input widgets with the expected ids", function*() {
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
      const {node} = yield createFormComponent({schema: complexSchema, formData: {
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
      value: ["foo", "fuzz"]
    };

    it("should render a select widget", function*() {
      const {node} = yield createFormComponent({schema});

      expect(node.querySelectorAll("select"))
        .to.have.length.of(1);
    });

    it("should render a select widget with a label", function*() {
      const {node} = yield createFormComponent({schema});

      expect(node.querySelector(".field label").textContent)
        .eql("My field");
    });

    it("should render a select widget with multiple attribute", function*() {
      const {node} = yield createFormComponent({schema});

      expect(node.querySelector(".field select").getAttribute("multiple"))
        .not.to.be.null;
    });

    it("should render options", function*() {
      const {node} = yield createFormComponent({schema});

      expect(node.querySelectorAll("select option"))
        .to.have.length.of(3);
    });

    it("should handle a change event", function*() {
      const {comp, node} = yield createFormComponent({schema});

      yield Simulate.change(node.querySelector(".field select"), {
        target: {options: [
          {selected: true, value: "foo"},
          {selected: true, value: "bar"},
          {selected: false, value: "fuzz"},
        ]}
      });

      expect(comp.state.formData).eql(["foo", "bar"]);
    });

    it("should fill field with data", function*() {
      const {node} = yield createFormComponent({
        schema,
        formData: ["foo", "bar"]
      });

      const options = node.querySelectorAll(".field select option");
      expect(options).to.have.length.of(3);
      expect(options[0].selected).eql(true);   // foo
      expect(options[1].selected).eql(true);   // bar
      expect(options[2].selected).eql(false);  // fuzz
    });

    it("should render the select widget with the expected id", function*() {
      const {node} = yield createFormComponent({schema});

      expect(node.querySelector("select").id).eql("root");
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

    it("should render two lists of inputs inside of a list", function*() {
      const {node} = yield createFormComponent({schema, formData: [[1, 2], [3, 4]]});
      expect(node.querySelectorAll("fieldset fieldset")).to.have.length.of(2);
    });

    it("should add an inner list when clicking the add button", function*() {
      const {node} = yield createFormComponent({schema});
      expect(node.querySelectorAll("fieldset fieldset")).to.be.empty;

      yield Simulate.click(node.querySelector(".array-item-add button"));

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

    it("should render a fieldset", function*() {
      const {node} = yield createFormComponent({schema});

      expect(node.querySelectorAll("fieldset"))
          .to.have.length.of(1);
    });

    it("should render a fieldset legend", function*() {
      const {node} = yield createFormComponent({schema});
      const legend = node.querySelector("fieldset > legend");
      expect(legend.textContent).eql("List of fixed items");
      expect(legend.id).eql("root__title");
    });

    it("should render field widgets", function*() {
      const {node} = yield createFormComponent({schema});
      const strInput =
          node.querySelector("fieldset .field-string input[type=text]");
      const numInput =
          node.querySelector("fieldset .field-number input[type=text]");
      expect(strInput.id).eql("root_0");
      expect(numInput.id).eql("root_1");
    });

    it("should fill fields with data", function*() {
      const {node} = yield createFormComponent({schema, formData: ["foo", 42]});
      const strInput =
          node.querySelector("fieldset .field-string input[type=text]");
      const numInput =
          node.querySelector("fieldset .field-number input[type=text]");
      expect(strInput.value).eql("foo");
      expect(numInput.value).eql("42");
    });

    it("should handle change events", function*() {
      const {comp, node} = yield createFormComponent({schema});
      const strInput =
          node.querySelector("fieldset .field-string input[type=text]");
      const numInput =
          node.querySelector("fieldset .field-number input[type=text]");

      yield Simulate.change(strInput, {target: { value: "bar" }});
      yield Simulate.change(numInput, {target: { value: "101" }});

      expect(comp.state.formData).eql(["bar", 101]);
    });

    it("should generate additional fields and fill data", function*() {
      const {node} = yield createFormComponent({
        schema: schemaAdditional,
        formData: [1, 2, "bar"]
      });
      const addInput =
          node.querySelector("fieldset .field-string input[type=text]");
      expect(addInput.id).eql("root_2");
      expect(addInput.value).eql("bar");
    });

    describe("operations for additional items", () => {
      let comp, node;

      beforeEach(function* () {
        const res = yield createFormComponent({
          schema: schemaAdditional,
          formData: [1, 2, "foo"]
        });
        comp = res.comp;
        node = res.node;
      });

      it("should add a field when clicking add button", function*() {
        const addBtn = node.querySelector(".array-item-add button");

        yield Simulate.click(addBtn);

        expect(node.querySelectorAll(".field-string")).to.have.length.of(2);
        expect(comp.state.formData).eql([1, 2, "foo", undefined]);
      });

      it("should change the state when changing input value", function*() {
        const inputs = node.querySelectorAll(".field-string input[type=text]");

        yield Simulate.change(inputs[0], {target: {value: "bar"}});
        yield Simulate.change(inputs[1], {target: {value: "baz"}});

        expect(comp.state.formData).eql([1, 2, "bar", "baz"]);
      });

      it("should remove array items when clicking remove buttons", function*() {
        let dropBtns = node.querySelectorAll(".array-item-remove button");

        yield Simulate.click(dropBtns[0]);

        expect(node.querySelectorAll(".field-string")).to.have.length.of(1);
        expect(comp.state.formData).eql([1, 2, "baz"]);

        dropBtns = node.querySelectorAll(".array-item-remove button");
        yield Simulate.click(dropBtns[0]);

        expect(node.querySelectorAll(".field-string")).to.be.empty;
        expect(comp.state.formData).eql([1, 2]);
      });
    });
  });
});
