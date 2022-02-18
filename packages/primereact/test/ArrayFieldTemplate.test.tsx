import React from "react";
import ArrayFieldTemplate from "../src/ArrayFieldTemplate";
import DescriptionField from "../src/DescriptionField";
import renderer from "react-test-renderer";
import TitleField from "../src/TitleField";
import { mockSchema } from "./helpers/createMocks";
import { utils } from "@rjsf/core";
const { getDefaultRegistry } = utils;

describe("ArrayFieldTemplate", () => {
  test("simple", () => {
    const tree = renderer
      .create(
        <ArrayFieldTemplate
          DescriptionField={() => <DescriptionField description={null} />}
          TitleField={() => <TitleField uiSchema={{}} />}
          items={[]}
          canAdd={true}
          className=""
          disabled={false}
          onAddClick={() => void 0}
          readonly={false}
          required={false}
          schema={mockSchema}
          uiSchema={{}}
          title=""
          formContext={{}}
          formData={{}}
          registry={{ ...getDefaultRegistry() }}
          // @ts-ignore
          idSchema={{}}
        />
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
