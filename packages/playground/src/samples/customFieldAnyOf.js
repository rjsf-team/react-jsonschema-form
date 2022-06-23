import React from "react";
import ObjectField from "@rjsf/core/lib/components/fields/ObjectField";

export default {
  schema: {
    title: "Location",
    type: "object",
    anyOf: [
      {
        title: "City",
        properties: {
          city: {
            type: "string",
          },
        },
        required: ["city"],
      },
      {
        title: "Coordinates",
        properties: {
          lat: {
            type: "number",
          },
          lon: {
            type: "number",
          },
        },
        required: ["lat", "lon"],
      },
    ],
  },
  uiSchema: {
    "ui:field": ({ schema, ...other }) => (
      <div style={{ display: "flex" }}>
        {schema.anyOf.map((subSchema, i) => (
          <div
            key={`subSchema ${i}`}
            style={{
              display: "flex",
              flexDirection: "column",
              width: "50%",
              margin: "1rem",
            }}>
            <ObjectField {...other} schema={subSchema} />
          </div>
        ))}
      </div>
    ),
  },
  formData: {},
};
