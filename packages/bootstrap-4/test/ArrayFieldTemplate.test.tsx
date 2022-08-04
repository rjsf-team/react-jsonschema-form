import React from "react";
import renderer from "react-test-renderer";
import { IdSchema, Registry } from "@rjsf/utils";
import { getDefaultRegistry } from "@rjsf/core";

import templates from "../src/Templates";
import widgets from "../src/Widgets";
import ArrayFieldTemplate from "../src/ArrayFieldTemplate";
import { mockSchema, mockSchemaUtils } from "./helpers/createMocks";

describe("ArrayFieldTemplate", () => {
  const { fields } = getDefaultRegistry();
  const registry: Registry = {
    fields,
    templates,
    widgets,
    schemaUtils: mockSchemaUtils,
    formContext: {},
    rootSchema: mockSchema,
  };
  test("simple", () => {
    const tree = renderer
      .create(
        <ArrayFieldTemplate
          canAdd={true}
          className=""
          disabled={false}
          onAddClick={() => void 0}
          readonly={false}
          required={false}
          schema={mockSchema}
          uiSchema={{}}
          title=""
          items={[]}
          formContext={{}}
          formData={{}}
          registry={registry}
          idSchema={{ $id: "root" } as IdSchema}
        />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
