import React from "react";

export default function UnsupportedField({ schema }) {
  // XXX render json as string so dev can inspect faulty subschema
  return (
    <div className="unsupported-field">
      Unsupported field schema {JSON.stringify(schema, null, 2)}.
    </div>
  );
}
