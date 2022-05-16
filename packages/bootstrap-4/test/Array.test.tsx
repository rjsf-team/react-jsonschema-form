import React from 'react';
import Form from "../src/index";
import { JSONSchema7 } from "json-schema";
import renderer from "react-test-renderer";
import { ArrayFieldTemplateProps, UiSchema } from '@rjsf/core';

const ArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
  const title: string = props.uiSchema['ui:title'] || props.title || '';
  const description: string = props.uiSchema['ui:description'] || props.schema.description || '';
  const { TitleField, DescriptionField } = props;
  return (
    <div id="custom-tpl" className={props.className}>
      {title && <TitleField
          id={`${props.idSchema.$id}__title`}
          title={title}
          required={props.required}
        />}
      {description && <DescriptionField
          id={`${props.idSchema.$id}-description`}
          description={description}
        />}
      {props.items.map(item => <div key={item.key}>{item.children}</div>)}
    </div>
  );
}

describe("array fields", () => {
  test("array", () => {
    const schema: JSONSchema7 = {
      type: "array",
      items: {
        type: "string"
      }
    };
    const tree = renderer
      .create(<Form schema={schema} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("fixed array", () => {
    const schema: JSONSchema7 = {
      type: "array",
      items: [
        {
          type: "string"
        },
        {
          type: "number"
        }
      ]
    };
    const tree = renderer
      .create(<Form schema={schema} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("checkboxes", () => {
    const schema: JSONSchema7 = {
      type: "array",
      items: {
        type: "string",
        enum: ["a", "b", "c"]
      },
      uniqueItems: true
    };
    const tree = renderer
      .create(<Form schema={schema} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("customize array title and description", () => {
    const schema: JSONSchema7 = {
      type: "array",
      title: "my-title",
      description: "my-description",
      items: {
        "type": "boolean"
      }
    };
    const uiSchema: UiSchema = {
      "ui:ArrayFieldTemplate": ArrayFieldTemplate
    }
    const fields = {
      TitleField: ({ title }: any) => (
        <div id="custom-title">{title}</div>
      ),
      DescriptionField: ({ description }: any) => (
        <div id="custom-description">{description}</div>
      ),
    }
    const tree = renderer
      .create(<Form schema={schema} uiSchema={uiSchema} fields={fields} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
  test("customize fixed array title and description", () => {
    const schema: JSONSchema7 = {
      type: "array",
      title: "my-title",
      description: "my-description",
      items: [
        {
          type: "boolean",
          default: true
        }
      ]
    };
    const uiSchema: UiSchema = {
      "ui:ArrayFieldTemplate": ArrayFieldTemplate
    }
    const fields = {
      TitleField: ({ title }: any) => (
        <div id="custom-title">{title}</div>
      ),
      DescriptionField: ({ description }: any) => (
        <div id="custom-description">{description}</div>
      ),
    }
    const tree = renderer
      .create(<Form schema={schema} uiSchema={uiSchema} fields={fields} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});