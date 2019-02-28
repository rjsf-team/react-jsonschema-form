import React from "react";
import { expect } from "chai";
import { Simulate } from "react-addons-test-utils";
import sinon from "sinon";

import { createFormComponent, createSandbox, setProps } from "./test_utils";

describe("NumberField", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("TextWidget", () => {
    it("should render a number input", () => {
      const { node } = createFormComponent({
        schema: {
          type: "number",
        },
      });

      expect(
        node.querySelectorAll(".field input[type=number]")
      ).to.have.length.of(1);
    });

    it("should render a string field with a label", () => {
      const { node } = createFormComponent({
        schema: {
          type: "number",
          title: "foo",
        },
      });

      expect(node.querySelector(".field label").textContent).eql("foo");
    });

    it("should render a string field with a description", () => {
      const { node } = createFormComponent({
        schema: {
          type: "number",
          description: "bar",
        },
      });

      expect(node.querySelector(".field-description").textContent).eql("bar");
    });

    it("should default state value to undefined", () => {
      const { comp } = createFormComponent({
        schema: { type: "number" },
      });

      expect(comp.state.formData).eql(undefined);
    });

    it("should assign a default value", () => {
      const { node } = createFormComponent({
        schema: {
          type: "number",
          default: 2,
        },
      });

      expect(node.querySelector(".field input").value).eql("2");
    });

    it("should handle a change event", () => {
      const { comp, node } = createFormComponent({
        schema: {
          type: "number",
        },
      });

      Simulate.change(node.querySelector("input"), {
        target: { value: "2" },
      });

      expect(comp.state.formData).eql(2);
    });

    it("should handle a blur event", () => {
      const onBlur = sandbox.spy();
      const { node } = createFormComponent({
        schema: {
          type: "number",
        },
        onBlur,
      });

      const input = node.querySelector("input");
      Simulate.blur(input, {
        target: { value: "2" },
      });

      expect(onBlur.calledWith(input.id, 2));
    });

    it("should handle a focus event", () => {
      const onFocus = sandbox.spy();
      const { node } = createFormComponent({
        schema: {
          type: "number",
        },
        onFocus,
      });

      const input = node.querySelector("input");
      Simulate.focus(input, {
        target: { value: "2" },
      });

      expect(onFocus.calledWith(input.id, 2));
    });

    it("should fill field with data", () => {
      const { node } = createFormComponent({
        schema: {
          type: "number",
        },
        formData: 2,
      });

      expect(node.querySelector(".field input").value).eql("2");
    });

    describe("when inputting a number that ends with a dot and/or zero it should normalize it, without changing the input value", () => {
      const { comp, node } = createFormComponent({
        schema: {
          type: "number",
        },
      });

      const $input = node.querySelector("input");

      const tests = [
        {
          input: "2.",
          output: 2,
        },
        {
          input: "2.0",
          output: 2,
        },
        {
          input: "2.3",
          output: 2.3,
        },
        {
          input: "2.30",
          output: 2.3,
        },
        {
          input: "2.300",
          output: 2.3,
        },
        {
          input: "2.3001",
          output: 2.3001,
        },
        {
          input: "2.03",
          output: 2.03,
        },
        {
          input: "2.003",
          output: 2.003,
        },
        {
          input: "2.00300",
          output: 2.003,
        },
        {
          input: "200300",
          output: 200300,
        },
      ];

      tests.forEach(test => {
        it(`should work with an input value of ${test.input}`, () => {
          Simulate.change($input, {
            target: { value: test.input },
          });

          expect(comp.state.formData).eql(test.output);
          expect($input.value).eql(test.input);
        });
      });
    });

    it("should normalize values beginning with a decimal point", () => {
      const { comp, node } = createFormComponent({
        schema: {
          type: "number",
        },
      });

      const $input = node.querySelector("input");

      Simulate.change($input, {
        target: { value: ".00" },
      });

      expect(comp.state.formData).eql(0);
      expect($input.value).eql("0");
    });

    it("should update input values correctly when formData prop changes", () => {
      const schema = {
        type: "number",
      };

      const { comp, node } = createFormComponent({
        schema,
        formData: 2.03,
      });

      const $input = node.querySelector("input");

      expect($input.value).eql("2.03");

      setProps(comp, {
        schema,
        formData: 203,
      });

      expect($input.value).eql("203");
    });

    it("should render the widget with the expected id", () => {
      const { node } = createFormComponent({
        schema: {
          type: "number",
        },
      });

      expect(node.querySelector("input[type=number]").id).eql("root");
    });

    it("should render with trailing zeroes", () => {
      const { node } = createFormComponent({
        schema: {
          type: "number",
        },
      });

      Simulate.change(node.querySelector("input"), {
        target: { value: "2." },
      });
      expect(node.querySelector(".field input").value).eql("2.");

      Simulate.change(node.querySelector("input"), {
        target: { value: "2.0" },
      });
      expect(node.querySelector(".field input").value).eql("2.0");

      Simulate.change(node.querySelector("input"), {
        target: { value: "2.00" },
      });
      expect(node.querySelector(".field input").value).eql("2.00");

      Simulate.change(node.querySelector("input"), {
        target: { value: "2.000" },
      });
      expect(node.querySelector(".field input").value).eql("2.000");
    });

    it("should allow a zero to be input", () => {
      const { node } = createFormComponent({
        schema: {
          type: "number",
        },
      });

      Simulate.change(node.querySelector("input"), {
        target: { value: "0" },
      });
      expect(node.querySelector(".field input").value).eql("0");
    });

    it("should render customized StringField", () => {
      const CustomStringField = () => <div id="custom" />;

      const { node } = createFormComponent({
        schema: {
          type: "number",
        },
        fields: {
          StringField: CustomStringField,
        },
      });

      expect(node.querySelector("#custom")).to.exist;
    });

    it("should use step to represent the multipleOf keyword", () => {
      const { node } = createFormComponent({
        schema: {
          type: "number",
          multipleOf: 5,
        },
      });

      expect(node.querySelector("input").step).to.eql("5");
    });
  });

  describe("SelectWidget", () => {
    it("should render a number field", () => {
      const { node } = createFormComponent({
        schema: {
          type: "number",
          enum: [1, 2],
        },
      });

      expect(node.querySelectorAll(".field select")).to.have.length.of(1);
    });

    it("should infer the value from an enum on change", () => {
      const spy = sinon.spy();
      const { node } = createFormComponent({
        schema: {
          enum: [1, 2],
        },
        onChange: spy,
      });

      expect(node.querySelectorAll(".field select")).to.have.length.of(1);
      const $select = node.querySelector(".field select");
      expect($select.value).eql("");

      Simulate.change(node.querySelector(".field select"), {
        target: { value: "1" },
      });
      expect($select.value).eql("1");
      expect(spy.lastCall.args[0].formData).eql(1);
    });

    it("should render a string field with a label", () => {
      const { node } = createFormComponent({
        schema: {
          type: "number",
          enum: [1, 2],
          title: "foo",
        },
      });

      expect(node.querySelector(".field label").textContent).eql("foo");
    });

    it("should assign a default value", () => {
      const { comp } = createFormComponent({
        schema: {
          type: "number",
          enum: [1, 2],
          default: 1,
        },
      });

      expect(comp.state.formData).eql(1);
    });

    it("should handle a change event", () => {
      const { comp, node } = createFormComponent({
        schema: {
          type: "number",
          enum: [1, 2],
        },
      });

      Simulate.change(node.querySelector("select"), {
        target: { value: "2" },
      });

      expect(comp.state.formData).eql(2);
    });

    it("should fill field with data", () => {
      const { comp } = createFormComponent({
        schema: {
          type: "number",
          enum: [1, 2],
        },
        formData: 2,
      });

      expect(comp.state.formData).eql(2);
    });

    it("should render the widget with the expected id", () => {
      const { node } = createFormComponent({
        schema: {
          type: "number",
          enum: [1, 2],
        },
      });

      expect(node.querySelector("select").id).eql("root");
    });

    it("should render a select element with a blank option, when default value is not set.", () => {
      const schema = {
        type: "object",
        properties: {
          foo: {
            type: "number",
            enum: [0],
          },
        },
      };

      const { node } = createFormComponent({
        schema,
      });

      const selects = node.querySelectorAll("select");
      expect(selects[0].value).eql("");

      const options = node.querySelectorAll("option");
      expect(options.length).eql(2);
      expect(options[0].innerHTML).eql("");
    });

    it("should render a select element without a blank option, if a default value is set.", () => {
      const schema = {
        type: "object",
        properties: {
          foo: {
            type: "number",
            enum: [2],
            default: 2,
          },
        },
      };

      const { node } = createFormComponent({
        schema,
      });

      const selects = node.querySelectorAll("select");
      expect(selects[0].value).eql("2");

      const options = node.querySelectorAll("option");
      expect(options.length).eql(1);
      expect(options[0].innerHTML).eql("2");
    });

    it("should render a select element without a blank option, if the default value is 0.", () => {
      const schema = {
        type: "object",
        properties: {
          foo: {
            type: "number",
            enum: [0],
            default: 0,
          },
        },
      };

      const { node } = createFormComponent({
        schema,
      });

      const selects = node.querySelectorAll("select");
      expect(selects[0].value).eql("0");

      const options = node.querySelectorAll("option");
      expect(options.length).eql(1);
      expect(options[0].innerHTML).eql("0");
    });
  });
});
