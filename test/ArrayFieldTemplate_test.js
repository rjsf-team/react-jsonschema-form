import React, { PureComponent } from "react";

import { expect } from "chai";
import { createFormComponent, createSandbox } from "./test_utils";

describe("ArrayFieldTemplate", () => {
  let sandbox;

  const formData = ["one", "two", "three"];

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("Custom ArrayFieldTemplate of string array", () => {
    function ArrayFieldTemplate(props) {
      return (
        <div className={props.uiSchema.classNames}>
          {props.canAdd && <button className="custom-array-add" />}
          {props.items.map(element => {
            return (
              <div className="custom-array-item" key={element.index}>
                {element.hasMoveUp && (
                  <button className="custom-array-item-move-up" />
                )}
                {element.hasMoveDown && (
                  <button className="custom-array-item-move-down" />
                )}

                {element.children}
              </div>
            );
          })}
        </div>
      );
    }

    describe("Stateful ArrayFieldTemplate", () => {
      class ArrayFieldTemplate extends PureComponent {
        render() {
          return <div>{this.props.items.map(item => item.element)}</div>;
        }
      }

      describe("with template globally configured", () => {
        it("should render a stateful custom component", () => {
          const { node } = createFormComponent({
            schema: { type: "array", items: { type: "string" } },
            formData,
            ArrayFieldTemplate,
          });

          expect(node.querySelectorAll(".field-array div")).to.have.length.of(
            6
          );
        });
      });
      describe("with template configured in ui:ArrayFieldTemplate", () => {
        it("should render a stateful custom component", () => {
          const { node } = createFormComponent({
            schema: { type: "array", items: { type: "string" } },
            formData,
            uiSchema: {
              "ui:ArrayFieldTemplate": ArrayFieldTemplate,
            },
          });

          expect(node.querySelectorAll(".field-array div")).to.have.length.of(
            6
          );
        });
      });
    });

    describe("not fixed items", () => {
      const schema = {
        type: "array",
        title: "my list",
        description: "my description",
        items: { type: "string" },
      };

      let node;

      describe("with template globally configured", () => {
        const uiSchema = {
          classNames: "custom-array",
        };

        beforeEach(() => {
          node = createFormComponent({
            ArrayFieldTemplate,
            formData,
            schema,
            uiSchema,
          }).node;
        });

        sharedIts();
      });
      describe("with template configured in ui:ArrayFieldTemplate", () => {
        const uiSchema = {
          classNames: "custom-array",
          "ui:ArrayFieldTemplate": ArrayFieldTemplate,
        };

        beforeEach(() => {
          node = createFormComponent({
            formData,
            schema,
            uiSchema,
          }).node;
        });
        sharedIts();
      });
      function sharedIts() {
        it("should render one root element for the array", () => {
          expect(node.querySelectorAll(".custom-array")).to.have.length.of(1);
        });

        it("should render one add button", () => {
          expect(node.querySelectorAll(".custom-array-add")).to.have.length.of(
            1
          );
        });

        it("should render one child for each array item", () => {
          expect(node.querySelectorAll(".custom-array-item")).to.have.length.of(
            formData.length
          );
        });

        it("should render text input for each array item", () => {
          expect(
            node.querySelectorAll(".custom-array-item .field input[type=text]")
          ).to.have.length.of(formData.length);
        });

        it("should render move up button for all but one array items", () => {
          expect(
            node.querySelectorAll(".custom-array-item-move-up")
          ).to.have.length.of(formData.length - 1);
        });

        it("should render move down button for all but one array items", () => {
          expect(
            node.querySelectorAll(".custom-array-item-move-down")
          ).to.have.length.of(formData.length - 1);
        });
      }
    });

    describe("fixed items", () => {
      const schema = {
        type: "array",
        title: "my list",
        description: "my description",
        items: [{ type: "string" }, { type: "string" }, { type: "string" }],
      };

      let node;

      describe("with template globally configured", () => {
        const uiSchema = {
          classNames: "custom-array",
        };
        beforeEach(() => {
          node = createFormComponent({
            formData,
            schema,
            uiSchema,
            ArrayFieldTemplate,
          }).node;
        });
        sharedIts();
      });

      describe("with template configured in ui:ArrayFieldTemplate", () => {
        const uiSchema = {
          classNames: "custom-array",
          "ui:ArrayFieldTemplate": ArrayFieldTemplate,
        };
        beforeEach(() => {
          node = createFormComponent({
            formData,
            schema,
            uiSchema,
          }).node;
        });
        sharedIts();
      });
      function sharedIts() {
        it("should render one root element for the array", () => {
          expect(node.querySelectorAll(".custom-array")).to.have.length.of(1);
        });

        it("should not render an add button", () => {
          expect(node.querySelectorAll(".custom-array-add")).to.have.length.of(
            0
          );
        });

        it("should render one child for each array item", () => {
          expect(node.querySelectorAll(".custom-array-item")).to.have.length.of(
            formData.length
          );
        });

        it("should render text input for each array item", () => {
          expect(
            node.querySelectorAll(".custom-array-item .field input[type=text]")
          ).to.have.length.of(formData.length);
        });

        it("should not render any move up buttons", () => {
          expect(
            node.querySelectorAll(".custom-array-item-move-up")
          ).to.have.length.of(0);
        });

        it("should not render any move down buttons", () => {
          expect(
            node.querySelectorAll(".custom-array-item-move-down")
          ).to.have.length.of(0);
        });
      }
    });
  });
});
