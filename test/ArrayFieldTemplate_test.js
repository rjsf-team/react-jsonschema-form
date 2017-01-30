import React from "react";

import {expect} from "chai";
import {createFormComponent, createSandbox} from "./test_utils";

describe("ArrayFieldTemplate", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("Custom ArrayFieldTemplate of string array", () => {

    function ArrayFieldTemplate(props) {
      return (
        <div className="custom-array">
          {props.canAdd && <button className="custom-array-add"></button>}
          {props.items.map(element => {
            return (
              <div className="custom-array-item" key={element.index}>
                {element.hasMoveUp &&
                  <button className="custom-array-item-move-up"></button>}
                {element.hasMoveDown &&
                  <button className="custom-array-item-move-down"></button>}

                {element.children}
              </div>
            );
          })}
        </div>
      );
    }

    const formData = ["one", "two", "three"];

    describe("not fixed items", () => {
      const schema = {
        type: "array",
        title: "my list",
        description: "my description",
        items: {type: "string"}
      };

      let node;
      beforeEach(() => {
        node = createFormComponent({
          ArrayFieldTemplate,
          formData,
          schema
        }).node;
      });

      it("should render one root element for the array", () => {
        expect(node.querySelectorAll(".custom-array"))
          .to.have.length.of(1);
      });

      it("should render one add button", () => {
        expect(node.querySelectorAll(".custom-array-add"))
          .to.have.length.of(1);
      });

      it("should render one child for each array item", () => {
        expect(node.querySelectorAll(".custom-array-item"))
         .to.have.length.of(formData.length);
      });

      it("should render text input for each array item", () => {
        expect(node.querySelectorAll(".custom-array-item .field input[type=text]"))
          .to.have.length.of(formData.length);
      });

      it("should render move up button for all but one array items", () => {
        expect(node.querySelectorAll(".custom-array-item-move-up"))
          .to.have.length.of(formData.length - 1);
      });

      it("should render move down button for all but one array items", () => {
        expect(node.querySelectorAll(".custom-array-item-move-down"))
          .to.have.length.of(formData.length - 1);
      });
    });

    describe("fixed items", () => {
      const schema = {
        type: "array",
        title: "my list",
        description: "my description",
        items: [
          {type: "string"},
          {type: "string"},
          {type: "string"}
        ]
      };

      let node;
      beforeEach(() => {
        node = createFormComponent({
          ArrayFieldTemplate,
          formData,
          schema
        }).node;
      });

      it("should render one root element for the array", () => {
        expect(node.querySelectorAll(".custom-array"))
          .to.have.length.of(1);
      });

      it("should not render an add button", () => {
        expect(node.querySelectorAll(".custom-array-add"))
          .to.have.length.of(0);
      });

      it("should render one child for each array item", () => {
        expect(node.querySelectorAll(".custom-array-item"))
          .to.have.length.of(formData.length);
      });

      it("should render text input for each array item", () => {
        expect(node.querySelectorAll(".custom-array-item .field input[type=text]"))
          .to.have.length.of(formData.length);
      });

      it("should not render any move up buttons", () => {
        expect(node.querySelectorAll(".custom-array-item-move-up"))
          .to.have.length.of(0);
      });

      it("should not render any move down buttons", () => {
        expect(node.querySelectorAll(".custom-array-item-move-down"))
          .to.have.length.of(0);
      });
    });

  });
});
