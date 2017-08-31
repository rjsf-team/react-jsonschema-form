import React from "react";
import PropTypes from "prop-types";

function UnsupportedField({ schema, idSchema, reason }) {
  return (
    <div className="unsupported-field">
      <p>
        Unsupported field schema{idSchema &&
        idSchema.$id && (
          <span>
            {" for"} field <code>{idSchema.$id}</code>
          </span>
        )}
        {reason && <em>: {reason}</em>}.
      </p>
      {schema && <pre>{JSON.stringify(schema, null, 2)}</pre>}
    </div>
  );
}

if (process.env.NODE_ENV !== "production") {
  UnsupportedField.propTypes = {
    schema: PropTypes.object.isRequired,
    idSchema: PropTypes.object,
    reason: PropTypes.string,
  };
}

export default UnsupportedField;
