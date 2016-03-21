import React from "react";
import { expect } from "chai";
import SchemaField from "../src/components/fields/SchemaField";

import { createFormComponent } from "./test_utils";

describe("SchemaField", () => {
  describe("Custom SchemaField component", () => {
    const CustomSchemaField = function(props) {
      return (<div id="custom"><SchemaField {...props} /></div>);
    };

    it("should use the specified custom SchemaType property", () => {
      const {node} = createFormComponent({
        schema: {type: "string"},
        SchemaField: CustomSchemaField
      });

      expect(node.querySelectorAll("#custom > .field input[type=text]"))
        .to.have.length.of(1);
    });
  });

  describe("ui:field support", () => {
    class MyObject extends React.Component {
      constructor(props) {
        super(props);
      }

      render() {
        return <div id="custom" />;
      }
    }

    const schema = {
      type: "object",
      properties: {
        foo: {type: "string"},
        bar: {type: "string"}
      }
    };

    it("should use provided direct custom component for object", () => {
      const uiSchema = {"ui:field": MyObject};

      const {node} = createFormComponent({schema, uiSchema});

      expect(node.querySelectorAll("#custom"))
        .to.have.length.of(1);
    });

    it("should use registered custom component for object", () => {
      const uiSchema = {"ui:field": "myobject"};
      const fields = {"myobject": MyObject};

      const {node} = createFormComponent({schema, uiSchema, fields});

      expect(node.querySelectorAll("#custom"))
        .to.have.length.of(1);
    });

    it("should handle referenced schema definitions", () => {
      const schema = {
        definitions: {
          foobar: {
            type: "object",
            properties: {
              foo: {type: "string"},
              bar: {type: "string"}
            }
          }
        },
        $ref: "#/definitions/foobar"
      };
      const uiSchema = {"ui:field": "myobject"};
      const fields = {"myobject": MyObject};

      const {node} = createFormComponent({schema, uiSchema, fields});

      expect(node.querySelectorAll("#custom"))
        .to.have.length.of(1);
    });
  });
});
