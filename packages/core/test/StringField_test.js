import React from "react";
import { expect } from "chai";
import { Simulate } from "react-dom/test-utils";
import sinon from "sinon";

import { parseDateString, toDateString, utcToLocal } from "../src/utils";
import { createFormComponent, createSandbox, submitForm } from "./test_utils";

describe("StringField", () => {
  let sandbox;

  const CustomWidget = () => <div id="custom" />;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("TextWidget", () => {
    it("should render a string field", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
        },
      });

      expect(
        node.querySelectorAll(".field input[type=text]")
      ).to.have.length.of(1);
    });

    it("should render a string field with a label", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          title: "foo",
        },
      });

      expect(node.querySelector(".field label").textContent).eql("foo");
    });

    it("should render a string field with a description", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          description: "bar",
        },
      });

      expect(node.querySelector(".field-description").textContent).eql("bar");
    });

    it("should assign a default value", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          default: "plop",
        },
      });

      expect(node.querySelector(".field input").value).eql("plop");
      expect(
        node.querySelectorAll(".field datalist > option")
      ).to.have.length.of(0);
    });

    it("should render a string field with examples", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          examples: ["Firefox", "Chrome", "Vivaldi"],
        },
      });

      expect(
        node.querySelectorAll(".field datalist > option")
      ).to.have.length.of(3);
      const datalistId = node.querySelector(".field datalist").id;
      expect(node.querySelector(".field input").getAttribute("list")).eql(
        datalistId
      );
    });

    it("should render a string with examples that includes the default value", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          default: "Firefox",
          examples: ["Chrome", "Vivaldi"],
        },
      });
      expect(
        node.querySelectorAll(".field datalist > option")
      ).to.have.length.of(3);
      const datalistId = node.querySelector(".field datalist").id;
      expect(node.querySelector(".field input").getAttribute("list")).eql(
        datalistId
      );
    });

    it("should render a string with examples that overlaps with the default value", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          default: "Firefox",
          examples: ["Firefox", "Chrome", "Vivaldi"],
        },
      });
      expect(
        node.querySelectorAll(".field datalist > option")
      ).to.have.length.of(3);
      const datalistId = node.querySelector(".field datalist").id;
      expect(node.querySelector(".field input").getAttribute("list")).eql(
        datalistId
      );
    });

    it("should default submit value to undefined", () => {
      const { node, onSubmit } = createFormComponent({
        schema: { type: "string" },
        noValidate: true,
      });
      submitForm(node);

      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        formData: undefined,
      });
    });

    it("should handle a change event", () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: "string",
        },
      });

      Simulate.change(node.querySelector("input"), {
        target: { value: "yo" },
      });

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: "yo",
      });
    });

    it("should handle a blur event", () => {
      const onBlur = sandbox.spy();
      const { node } = createFormComponent({
        schema: {
          type: "string",
        },
        onBlur,
      });
      const input = node.querySelector("input");
      Simulate.blur(input, {
        target: { value: "yo" },
      });

      expect(onBlur.calledWith(input.id, "yo")).to.be.true;
    });

    it("should handle a focus event", () => {
      const onFocus = sandbox.spy();
      const { node } = createFormComponent({
        schema: {
          type: "string",
        },
        onFocus,
      });
      const input = node.querySelector("input");
      Simulate.focus(input, {
        target: { value: "yo" },
      });

      expect(onFocus.calledWith(input.id, "yo")).to.be.true;
    });

    it("should handle an empty string change event", () => {
      const { node, onChange } = createFormComponent({
        schema: { type: "string" },
        formData: "x",
      });

      Simulate.change(node.querySelector("input"), {
        target: { value: "" },
      });

      sinon.assert.calledWithMatch(onChange.lastCall, { formData: undefined });
    });

    it("should handle an empty string change event with custom ui:emptyValue", () => {
      const { node, onChange } = createFormComponent({
        schema: { type: "string" },
        uiSchema: { "ui:emptyValue": "default" },
        formData: "x",
      });

      Simulate.change(node.querySelector("input"), {
        target: { value: "" },
      });

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: "default",
      });
    });

    it("should handle an empty string change event with defaults set", () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: "string",
          default: "a",
        },
      });

      Simulate.change(node.querySelector("input"), {
        target: { value: "" },
      });

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: undefined,
      });
    });

    it("should fill field with data", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
        },
        formData: "plip",
      });

      expect(node.querySelector(".field input").value).eql("plip");
    });

    it("should render the widget with the expected id", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
        },
      });

      expect(node.querySelector("input[type=text]").id).eql("root");
    });

    it("should render customized TextWidget", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
        },
        widgets: {
          TextWidget: CustomWidget,
        },
      });

      expect(node.querySelector("#custom")).to.exist;
    });

    it("should create and set autocomplete attribute", () => {
      const { node } = createFormComponent({
        schema: { type: "string" },
        uiSchema: { "ui:autocomplete": "family-name" },
        formData: undefined,
      });

      expect(node.querySelector("input").getAttribute("autocomplete")).eql(
        "family-name"
      );
    });
  });

  describe("SelectWidget", () => {
    it("should render a string field", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          enum: ["foo", "bar"],
        },
      });

      expect(node.querySelectorAll(".field select")).to.have.length.of(1);
    });

    it("should render a string field for an enum without a type", () => {
      const { node } = createFormComponent({
        schema: {
          enum: ["foo", "bar"],
        },
      });

      expect(node.querySelectorAll(".field select")).to.have.length.of(1);
    });

    it("should render a string field with a label", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          enum: ["foo", "bar"],
          title: "foo",
        },
      });

      expect(node.querySelector(".field label").textContent).eql("foo");
    });

    it("should render empty option", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          enum: ["foo", "bar"],
        },
      });

      expect(node.querySelectorAll(".field option")[0].value).eql("");
    });

    it("should render empty option with placeholder text", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          enum: ["foo", "bar"],
        },
        uiSchema: {
          "ui:options": {
            placeholder: "Test",
          },
        },
      });

      expect(node.querySelectorAll(".field option")[0].textContent).eql("Test");
    });

    it("should assign a default value", () => {
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: "string",
          enum: ["foo", "bar"],
          default: "bar",
        },
      });

      submitForm(node);

      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        formData: "bar",
      });
    });

    it("should reflect the change in the change event", () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: "string",
          enum: ["foo", "bar"],
        },
      });

      Simulate.change(node.querySelector("select"), {
        target: { value: "foo" },
      });
      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: "foo",
      });
    });

    it("should reflect undefined in change event if empty option selected", () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: "string",
          enum: ["foo", "bar"],
        },
      });

      Simulate.change(node.querySelector("select"), {
        target: { value: "" },
      });

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: undefined,
      });
    });

    it("should reflect the change into the dom", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          enum: ["foo", "bar"],
        },
      });

      Simulate.change(node.querySelector("select"), {
        target: { value: "foo" },
      });

      expect(node.querySelector("select").value).eql("foo");
    });

    it("should reflect undefined value into the dom as empty option", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          enum: ["foo", "bar"],
        },
      });

      Simulate.change(node.querySelector("select"), {
        target: { value: "" },
      });

      expect(node.querySelector("select").value).eql("");
    });

    it("should fill field with data", () => {
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: "string",
          enum: ["foo", "bar"],
        },
        formData: "bar",
      });
      submitForm(node);

      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        formData: "bar",
      });
    });

    it("should render the widget with the expected id", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          enum: ["a", "b"],
        },
      });

      expect(node.querySelector("select").id).eql("root");
    });

    it("should render customized SelectWidget", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          enum: [],
        },
        widgets: {
          SelectWidget: CustomWidget,
        },
      });

      expect(node.querySelector("#custom")).to.exist;
    });

    it("should render a select element with first option 'false' if the default value is false", () => {
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
      expect(options.length).eql(2);
    });

    it("should render a select element and the option's length is equal the enum's length, if set the enum and the default value is empty.", () => {
      const schema = {
        type: "object",
        properties: {
          foo: {
            type: "string",
            enum: ["", "1"],
            default: "",
          },
        },
      };

      const { node } = createFormComponent({
        schema,
      });

      const options = node.querySelectorAll("option");
      expect(options[0].innerHTML).eql("");
      expect(options.length).eql(2);
    });

    it("should render only one empty option when the default value is empty.", () => {
      const schema = {
        type: "object",
        properties: {
          foo: {
            type: "string",
            enum: [""],
            default: "",
          },
        },
      };

      const { node } = createFormComponent({
        schema,
      });

      const options = node.querySelectorAll("option");
      expect(options[0].innerHTML).eql("");
      expect(options.length).eql(1);
    });
  });

  describe("TextareaWidget", () => {
    it("should handle an empty string change event", () => {
      const { node, onChange } = createFormComponent({
        schema: { type: "string" },
        uiSchema: { "ui:widget": "textarea" },
        formData: "x",
      });

      Simulate.change(node.querySelector("textarea"), {
        target: { value: "" },
      });

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: undefined,
      });
    });

    it("should handle an empty string change event with custom ui:emptyValue", () => {
      const { node, onChange } = createFormComponent({
        schema: { type: "string" },
        uiSchema: {
          "ui:widget": "textarea",
          "ui:emptyValue": "default",
        },
        formData: "x",
      });

      Simulate.change(node.querySelector("textarea"), {
        target: { value: "" },
      });

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: "default",
      });
    });

    it("should render a textarea field with rows", () => {
      const { node } = createFormComponent({
        schema: { type: "string" },
        uiSchema: {
          "ui:widget": "textarea",
          "ui:options": { rows: 20 },
        },
        formData: "x",
      });

      expect(node.querySelector("textarea").getAttribute("rows")).eql("20");
    });
  });

  describe("DateTimeWidget", () => {
    it("should render an datetime-local field", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "date-time",
        },
      });

      expect(
        node.querySelectorAll(".field [type=datetime-local]")
      ).to.have.length.of(1);
    });

    it("should assign a default value", () => {
      const datetime = new Date().toJSON();
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: "string",
          format: "date-time",
          default: datetime,
        },
      });
      submitForm(node);
      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        formData: datetime,
      });
    });

    it("should reflect the change into the dom", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "date-time",
        },
      });

      const newDatetime = new Date().toJSON();

      Simulate.change(node.querySelector("[type=datetime-local]"), {
        target: { value: newDatetime },
      });

      expect(node.querySelector("[type=datetime-local]").value).eql(
        utcToLocal(newDatetime)
      );
    });

    it("should fill field with data", () => {
      const datetime = new Date().toJSON();
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: "string",
          format: "date-time",
        },
        formData: datetime,
      });
      submitForm(node);
      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        formData: datetime,
      });
    });

    it("should render the widget with the expected id", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "date-time",
        },
      });

      expect(node.querySelector("[type=datetime-local]").id).eql("root");
    });

    it("should reject an invalid entered datetime", () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: "string",
          format: "date-time",
        },
        liveValidate: true,
      });

      Simulate.change(node.querySelector("[type=datetime-local]"), {
        target: { value: "invalid" },
      });

      sinon.assert.calledWithMatch(onChange.lastCall, {
        errorSchema: { __errors: ["should be string"] },
        errors: [
          {
            message: "should be string",
            name: "type",
            params: { type: "string" },
            property: "",
            schemaPath: "#/type",
            stack: "should be string",
          },
        ],
      });
    });

    it("should render customized DateTimeWidget", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "date-time",
        },
        widgets: {
          DateTimeWidget: CustomWidget,
        },
      });

      expect(node.querySelector("#custom")).to.exist;
    });

    it("should allow overriding of BaseInput", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "date-time",
        },
        widgets: {
          BaseInput: CustomWidget,
        },
      });

      expect(node.querySelector("#custom")).to.exist;
    });
  });

  describe("DateWidget", () => {
    const uiSchema = { "ui:widget": "date" };

    it("should render a date field", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "date",
        },
        uiSchema,
      });

      expect(node.querySelectorAll(".field [type=date]")).to.have.length.of(1);
    });

    it("should assign a default value", () => {
      const datetime = new Date().toJSON();
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: "string",
          format: "date",
          default: datetime,
        },
        uiSchema,
        noValidate: true,
      });
      submitForm(node);
      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        formData: datetime,
      });
    });

    it("should reflect the change into the dom", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "date",
        },
        uiSchema,
      });

      const newDatetime = "2012-12-12";

      Simulate.change(node.querySelector("[type=date]"), {
        target: { value: newDatetime },
      });

      expect(node.querySelector("[type=date]").value)
        // XXX import and use conversion helper
        .eql(newDatetime.slice(0, 10));
    });

    it("should fill field with data", () => {
      const datetime = new Date().toJSON();
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: "string",
          format: "date",
        },
        formData: datetime,
        noValidate: true,
      });
      submitForm(node);
      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        formData: datetime,
      });
    });

    it("should render the widget with the expected id", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "date",
        },
        uiSchema,
      });

      expect(node.querySelector("[type=date]").id).eql("root");
    });

    it("should accept a valid entered date", () => {
      const { node, onError, onChange } = createFormComponent({
        schema: {
          type: "string",
          format: "date",
        },
        uiSchema,
        liveValidate: true,
      });

      Simulate.change(node.querySelector("[type=date]"), {
        target: { value: "2012-12-12" },
      });

      sinon.assert.notCalled(onError);

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: "2012-12-12",
      });
    });

    it("should reject an invalid entered date", () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: "string",
          format: "date",
        },
        uiSchema,
        liveValidate: true,
      });

      Simulate.change(node.querySelector("[type=date]"), {
        target: { value: "invalid" },
      });

      sinon.assert.calledWithMatch(onChange.lastCall, {
        errorSchema: { __errors: ['should match format "date"'] },
        errors: [
          {
            message: 'should match format "date"',
            name: "format",
            params: { format: "date" },
            property: "",
            schemaPath: "#/format",
            stack: 'should match format "date"',
          },
        ],
      });
    });

    it("should render customized DateWidget", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "date",
        },
        widgets: {
          DateWidget: CustomWidget,
        },
      });

      expect(node.querySelector("#custom")).to.exist;
    });

    it("should allow overriding of BaseInput", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "date",
        },
        widgets: {
          BaseInput: CustomWidget,
        },
      });

      expect(node.querySelector("#custom")).to.exist;
    });
  });

  describe("AltDateTimeWidget", () => {
    const uiSchema = { "ui:widget": "alt-datetime" };

    it("should render a datetime field", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "date-time",
        },
        uiSchema,
      });

      expect(node.querySelectorAll(".field select")).to.have.length.of(6);
    });

    it("should render a string field with a main label", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "date-time",
          title: "foo",
        },
        uiSchema,
      });

      expect(node.querySelector(".field label").textContent).eql("foo");
    });

    it("should assign a default value", () => {
      const datetime = new Date().toJSON();
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: "string",
          format: "date-time",
          default: datetime,
        },
        uiSchema,
      });
      submitForm(node);
      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        formData: datetime,
      });
    });

    it("should reflect the change into the dom", () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: "string",
          format: "date-time",
        },
        uiSchema,
      });

      Simulate.change(node.querySelector("#root_year"), {
        target: { value: 2012 },
      });
      Simulate.change(node.querySelector("#root_month"), {
        target: { value: 10 },
      });
      Simulate.change(node.querySelector("#root_day"), {
        target: { value: 2 },
      });
      Simulate.change(node.querySelector("#root_hour"), {
        target: { value: 1 },
      });
      Simulate.change(node.querySelector("#root_minute"), {
        target: { value: 2 },
      });
      Simulate.change(node.querySelector("#root_second"), {
        target: { value: 3 },
      });

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: "2012-10-02T01:02:03.000Z",
      });
    });

    it("should fill field with data", () => {
      const datetime = new Date().toJSON();
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: "string",
          format: "date-time",
        },
        formData: datetime,
      });
      submitForm(node);
      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        formData: datetime,
      });
    });

    it("should render the widgets with the expected ids", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "date-time",
        },
        uiSchema,
      });

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
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "date-time",
        },
        uiSchema,
      });

      const lengths = [].map.call(
        node.querySelectorAll("select"),
        node => node.length
      );

      expect(lengths).eql([
        // from 1900 to current year + 2 (inclusive) + 1 undefined option
        new Date().getFullYear() - 1900 + 3 + 1,
        12 + 1,
        31 + 1,
        24 + 1,
        60 + 1,
        60 + 1,
      ]);
      const monthOptions = node.querySelectorAll("select#root_month option");
      const monthOptionsValues = [].map.call(monthOptions, o => o.value);
      expect(monthOptionsValues).eql([
        "",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
      ]);
    });

    it("should render the widgets with the expected options' labels", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "date-time",
        },
        uiSchema,
      });

      const monthOptions = node.querySelectorAll("select#root_month option");
      const monthOptionsLabels = [].map.call(monthOptions, o => o.text);
      expect(monthOptionsLabels).eql([
        "month",
        "01",
        "02",
        "03",
        "04",
        "05",
        "06",
        "07",
        "08",
        "09",
        "10",
        "11",
        "12",
      ]);
    });

    describe("Action buttons", () => {
      it("should render action buttons", () => {
        const { node } = createFormComponent({
          schema: {
            type: "string",
            format: "date-time",
          },
          uiSchema,
        });

        const buttonLabels = [].map.call(
          node.querySelectorAll("a.btn"),
          x => x.textContent
        );
        expect(buttonLabels).eql(["Now", "Clear"]);
      });

      it("should set current date when pressing the Now button", () => {
        const { node, onChange } = createFormComponent({
          schema: {
            type: "string",
            format: "date-time",
          },
          uiSchema,
        });

        Simulate.click(node.querySelector("a.btn-now"));
        const formValue = onChange.lastCall.args[0].formData;
        // Test that the two DATETIMEs are within 5 seconds of each other.
        const now = new Date().getTime();
        const timeDiff = now - new Date(formValue).getTime();
        expect(timeDiff).to.be.at.most(5000);
      });

      it("should clear current date when pressing the Clear button", () => {
        const { node, onChange } = createFormComponent({
          schema: {
            type: "string",
            format: "date-time",
          },
          uiSchema,
        });

        Simulate.click(node.querySelector("a.btn-now"));
        Simulate.click(node.querySelector("a.btn-clear"));

        sinon.assert.calledWithMatch(onChange.lastCall, {
          formData: undefined,
        });
      });
    });

    it("should render customized AltDateWidget", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "date-time",
        },
        uiSchema: {
          "ui:widget": "alt-datetime",
        },
        widgets: {
          AltDateTimeWidget: CustomWidget,
        },
      });

      expect(node.querySelector("#custom")).to.exist;
    });

    it("should render customized AltDateTimeWidget", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "date",
        },
        uiSchema: {
          "ui:widget": "alt-datetime",
        },
        widgets: {
          AltDateTimeWidget: CustomWidget,
        },
      });

      expect(node.querySelector("#custom")).to.exist;
    });
  });

  describe("AltDateWidget", () => {
    const uiSchema = { "ui:widget": "alt-date" };

    it("should render a date field", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "date",
        },
        uiSchema,
      });

      expect(node.querySelectorAll(".field select")).to.have.length.of(3);
    });

    it("should render a string field with a main label", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "date",
          title: "foo",
        },
        uiSchema,
      });

      expect(node.querySelector(".field label").textContent).eql("foo");
    });

    it("should assign a default value", () => {
      const datetime = "2012-12-12";
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: "string",
          format: "date",
          default: datetime,
        },
        uiSchema,
      });
      submitForm(node);
      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        formData: datetime,
      });
    });

    it("should reflect the change into the dom", () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: "string",
          format: "date",
        },
        uiSchema,
      });

      Simulate.change(node.querySelector("#root_year"), {
        target: { value: 2012 },
      });
      Simulate.change(node.querySelector("#root_month"), {
        target: { value: 10 },
      });
      Simulate.change(node.querySelector("#root_day"), {
        target: { value: 2 },
      });

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: "2012-10-02",
      });
    });

    it("should fill field with data", () => {
      const datetime = "2012-12-12";
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: "string",
          format: "date",
        },
        uiSchema,
        formData: datetime,
      });
      submitForm(node);
      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        formData: datetime,
      });
    });

    it("should render the widgets with the expected ids", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "date",
        },
        uiSchema,
      });

      const ids = [].map.call(node.querySelectorAll("select"), node => node.id);

      expect(ids).eql(["root_year", "root_month", "root_day"]);
    });

    it("should render the widgets with the expected options' values", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "date",
        },
        uiSchema,
      });

      const lengths = [].map.call(
        node.querySelectorAll("select"),
        node => node.length
      );

      expect(lengths).eql([
        // from 1900 to current year + 2 (inclusive) + 1 undefined option
        new Date().getFullYear() - 1900 + 3 + 1,
        12 + 1,
        31 + 1,
      ]);
      const monthOptions = node.querySelectorAll("select#root_month option");
      const monthOptionsValues = [].map.call(monthOptions, o => o.value);
      expect(monthOptionsValues).eql([
        "",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
      ]);
    });

    it("should render the widgets with the expected options' labels", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "date",
        },
        uiSchema,
      });

      const monthOptions = node.querySelectorAll("select#root_month option");
      const monthOptionsLabels = [].map.call(monthOptions, o => o.text);
      expect(monthOptionsLabels).eql([
        "month",
        "01",
        "02",
        "03",
        "04",
        "05",
        "06",
        "07",
        "08",
        "09",
        "10",
        "11",
        "12",
      ]);
    });

    it("should accept a valid date", () => {
      const { onError } = createFormComponent({
        schema: {
          type: "string",
          format: "date",
        },
        uiSchema,
        liveValidate: true,
        formData: "2012-12-12",
      });

      sinon.assert.notCalled(onError);
    });

    it("should throw on invalid date", () => {
      try {
        createFormComponent({
          schema: {
            type: "string",
            format: "date",
          },
          uiSchema,
          liveValidate: true,
          formData: "2012-1212",
        });
      } catch (err) {
        expect(err.message).eql("Unable to parse date 2012-1212");
      }
    });

    describe("Action buttons", () => {
      it("should render action buttons", () => {
        const { node } = createFormComponent({
          schema: {
            type: "string",
            format: "date",
          },
          uiSchema,
        });

        const buttonLabels = [].map.call(
          node.querySelectorAll("a.btn"),
          x => x.textContent
        );
        expect(buttonLabels).eql(["Now", "Clear"]);
      });

      it("should set current date when pressing the Now button", () => {
        const { node, onChange } = createFormComponent({
          schema: {
            type: "string",
            format: "date",
          },
          uiSchema,
        });

        Simulate.click(node.querySelector("a.btn-now"));

        const expected = toDateString(
          parseDateString(new Date().toJSON()),
          false
        );

        sinon.assert.calledWithMatch(onChange.lastCall, {
          formData: expected,
        });
      });

      it("should clear current date when pressing the Clear button", () => {
        const { node, onChange } = createFormComponent({
          schema: {
            type: "string",
            format: "date",
          },
          uiSchema,
        });

        Simulate.click(node.querySelector("a.btn-now"));
        Simulate.click(node.querySelector("a.btn-clear"));

        sinon.assert.calledWithMatch(onChange.lastCall, {
          formData: undefined,
        });
      });
    });

    it("should render customized AltDateWidget", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "date",
        },
        uiSchema: {
          "ui:widget": "alt-date",
        },
        widgets: {
          AltDateWidget: CustomWidget,
        },
      });

      expect(node.querySelector("#custom")).to.exist;
    });
  });

  describe("EmailWidget", () => {
    it("should render an email field", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "email",
        },
      });

      expect(node.querySelectorAll(".field [type=email]")).to.have.length.of(1);
    });

    it("should render a string field with a label", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "email",
          title: "foo",
        },
      });

      expect(node.querySelector(".field label").textContent).eql("foo");
    });

    it("should render a select field with a description", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "email",
          description: "baz",
        },
      });

      expect(node.querySelector(".field-description").textContent).eql("baz");
    });

    it("should assign a default value", () => {
      const email = "foo@bar.baz";
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: "string",
          format: "email",
          default: email,
        },
      });

      submitForm(node);

      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        formData: email,
      });
    });

    it("should reflect the change into the dom", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "email",
        },
      });

      const newDatetime = new Date().toJSON();

      Simulate.change(node.querySelector("[type=email]"), {
        target: { value: newDatetime },
      });

      expect(node.querySelector("[type=email]").value).eql(newDatetime);
    });

    it("should fill field with data", () => {
      const email = "foo@bar.baz";
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: "string",
          format: "email",
        },
        formData: email,
      });

      submitForm(node);
      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        formData: email,
      });
    });

    it("should render the widget with the expected id", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "email",
        },
      });

      expect(node.querySelector("[type=email]").id).eql("root");
    });

    it("should reject an invalid entered email", () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: "string",
          format: "email",
        },
        liveValidate: true,
      });

      Simulate.change(node.querySelector("[type=email]"), {
        target: { value: "invalid" },
      });

      sinon.assert.calledWithMatch(onChange.lastCall, {
        errorSchema: { __errors: ['should match format "email"'] },
        errors: [
          {
            message: 'should match format "email"',
            name: "format",
            params: { format: "email" },
            property: "",
            schemaPath: "#/format",
            stack: 'should match format "email"',
          },
        ],
      });
    });

    it("should render customized EmailWidget", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "email",
        },
        widgets: {
          EmailWidget: CustomWidget,
        },
      });

      expect(node.querySelector("#custom")).to.exist;
    });
  });

  describe("URLWidget", () => {
    it("should render an url field", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "uri",
        },
      });

      expect(node.querySelectorAll(".field [type=url]")).to.have.length.of(1);
    });

    it("should render a string field with a label", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "uri",
          title: "foo",
        },
      });

      expect(node.querySelector(".field label").textContent).eql("foo");
    });

    it("should render a select field with a placeholder", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "uri",
          description: "baz",
        },
      });

      expect(node.querySelector(".field-description").textContent).eql("baz");
    });

    it("should assign a default value", () => {
      const url = "http://foo.bar/baz";
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: "string",
          format: "uri",
          default: url,
        },
      });

      submitForm(node);

      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        formData: url,
      });
    });

    it("should reflect the change into the dom", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "uri",
        },
      });

      const newDatetime = new Date().toJSON();
      Simulate.change(node.querySelector("[type=url]"), {
        target: { value: newDatetime },
      });

      expect(node.querySelector("[type=url]").value).eql(newDatetime);
    });

    it("should fill field with data", () => {
      const url = "http://foo.bar/baz";
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: "string",
          format: "uri",
        },
        formData: url,
      });

      submitForm(node);

      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        formData: url,
      });
    });

    it("should render the widget with the expected id", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "uri",
        },
      });

      expect(node.querySelector("[type=url]").id).eql("root");
    });

    it("should reject an invalid entered url", () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: "string",
          format: "uri",
        },
        liveValidate: true,
      });

      Simulate.change(node.querySelector("[type=url]"), {
        target: { value: "invalid" },
      });

      sinon.assert.calledWithMatch(onChange.lastCall, {
        errorSchema: { __errors: ['should match format "uri"'] },
        errors: [
          {
            message: 'should match format "uri"',
            name: "format",
            params: { format: "uri" },
            property: "",
            schemaPath: "#/format",
            stack: 'should match format "uri"',
          },
        ],
      });
    });

    it("should render customized URLWidget", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "uri",
        },
        widgets: {
          URLWidget: CustomWidget,
        },
      });

      expect(node.querySelector("#custom")).to.exist;
    });
  });

  describe("ColorWidget", () => {
    const uiSchema = { "ui:widget": "color" };
    const color = "#123456";

    it("should render a color field", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "color",
        },
        uiSchema,
      });

      expect(node.querySelectorAll(".field [type=color]")).to.have.length.of(1);
    });

    it("should assign a default value", () => {
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: "string",
          format: "color",
          default: color,
        },
        uiSchema,
      });
      submitForm(node);

      sinon.assert.calledWithMatch(onSubmit.lastCall, { formData: color });
    });

    it("should reflect the change into the dom", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "color",
        },
        uiSchema,
      });

      const newColor = "#654321";

      Simulate.change(node.querySelector("[type=color]"), {
        target: { value: newColor },
      });

      expect(node.querySelector("[type=color]").value).eql(newColor);
    });

    it("should fill field with data", () => {
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: "string",
          format: "color",
        },
        formData: color,
      });
      submitForm(node);

      sinon.assert.calledWithMatch(onSubmit.lastCall, { formData: color });
    });

    it("should render the widget with the expected id", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "color",
        },
        uiSchema,
      });

      expect(node.querySelector("[type=color]").id).eql("root");
    });

    it("should reject an invalid entered color", () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: "string",
          format: "color",
        },
        uiSchema,
        liveValidate: true,
      });

      Simulate.change(node.querySelector("[type=color]"), {
        target: { value: "invalid" },
      });

      sinon.assert.calledWithMatch(onChange.lastCall, {
        errorSchema: { __errors: ['should match format "color"'] },
        errors: [
          {
            message: 'should match format "color"',
            name: "format",
            params: { format: "color" },
            property: "",
            schemaPath: "#/format",
            stack: 'should match format "color"',
          },
        ],
      });
    });

    it("should render customized ColorWidget", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "color",
        },
        widgets: {
          ColorWidget: CustomWidget,
        },
      });

      expect(node.querySelector("#custom")).to.exist;
    });
  });

  describe("FileWidget", () => {
    const initialValue = "data:text/plain;name=file1.txt;base64,dGVzdDE=";

    it("should render a file field", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "data-url",
        },
      });

      expect(node.querySelectorAll(".field [type=file]")).to.have.length.of(1);
    });

    it("should assign a default value", () => {
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: "string",
          format: "data-url",
          default: initialValue,
        },
      });
      submitForm(node);

      sinon.assert.calledWithMatch(onSubmit.lastCall, {
        formData: initialValue,
      });
    });

    it("should reflect the change into the dom", async () => {
      sandbox.stub(window, "FileReader").returns({
        set onload(fn) {
          fn({ target: { result: "data:text/plain;base64,x=" } });
        },
        readAsDataUrl() {},
      });

      const { node, onChange } = createFormComponent({
        schema: {
          type: "string",
          format: "data-url",
        },
      });

      Simulate.change(node.querySelector("[type=file]"), {
        target: {
          files: [{ name: "file1.txt", size: 1, type: "type" }],
        },
      });

      await new Promise(setImmediate);

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: "data:text/plain;name=file1.txt;base64,x=",
      });
    });

    it("should encode file name with encodeURIComponent", async () => {
      const nonUriEncodedValue = "fileáéí óú1.txt";
      const uriEncodedValue = "file%C3%A1%C3%A9%C3%AD%20%C3%B3%C3%BA1.txt";

      sandbox.stub(window, "FileReader").returns({
        set onload(fn) {
          fn({ target: { result: "data:text/plain;base64,x=" } });
        },
        readAsDataUrl() {},
      });

      const { node, onChange } = createFormComponent({
        schema: {
          type: "string",
          format: "data-url",
        },
      });

      Simulate.change(node.querySelector("[type=file]"), {
        target: {
          files: [{ name: nonUriEncodedValue, size: 1, type: "type" }],
        },
      });

      await new Promise(setImmediate);

      sinon.assert.calledWithMatch(onChange.lastCall, {
        formData: "data:text/plain;name=" + uriEncodedValue + ";base64,x=",
      });
    });

    it("should render the widget with the expected id", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "data-url",
        },
        uiSchema: {
          "ui:options": { accept: ".pdf" },
        },
      });

      expect(node.querySelector("[type=file]").accept).eql(".pdf");
    });

    it("should render the file widget with accept attribute", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "data-url",
        },
      });

      expect(node.querySelector("[type=file]").id).eql("root");
    });

    it("should render customized FileWidget", () => {
      const { node } = createFormComponent({
        schema: {
          type: "string",
          format: "data-url",
        },
        widgets: {
          FileWidget: CustomWidget,
        },
      });

      expect(node.querySelector("#custom")).to.exist;
    });
  });

  describe("UpDownWidget", () => {
    it("should allow overriding of BaseInput", () => {
      const { node } = createFormComponent({
        schema: {
          type: "number",
          format: "updown",
        },
        widgets: {
          BaseInput: CustomWidget,
        },
      });

      expect(node.querySelector("#custom")).to.exist;
    });
  });

  describe("Label", () => {
    const Widget = props => <div id={`label-${props.label}`} />;

    const widgets = { Widget };

    it("should pass field name to widget if there is no title", () => {
      const schema = {
        type: "object",
        properties: {
          string: {
            type: "string",
          },
        },
      };
      const uiSchema = {
        string: {
          "ui:widget": "Widget",
        },
      };

      const { node } = createFormComponent({ schema, widgets, uiSchema });
      expect(node.querySelector("#label-string")).to.not.be.null;
    });

    it("should pass schema title to widget", () => {
      const schema = {
        type: "string",
        title: "test",
      };
      const uiSchema = {
        "ui:widget": "Widget",
      };

      const { node } = createFormComponent({ schema, widgets, uiSchema });
      expect(node.querySelector("#label-test")).to.not.be.null;
    });

    it("should pass empty schema title to widget", () => {
      const schema = {
        type: "string",
        title: "",
      };
      const uiSchema = {
        "ui:widget": "Widget",
      };
      const { node } = createFormComponent({ schema, widgets, uiSchema });
      expect(node.querySelector("#label-")).to.not.be.null;
    });
  });
});
