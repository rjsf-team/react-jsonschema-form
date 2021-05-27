import React from "react";
import PropTypes from "prop-types";
import { useIntl } from "react-intl";

function UnsupportedField({ schema, idSchema, reason }) {
  return (
    <div className="unsupported-field">
      <p>
        {useIntl().formatMessage(
          {
            defaultMessage: `Unsupported field schema{hasSchema, select,
              true { for field {schema}}
              other {}
            }{hasReason, select,
              true {: {reason}}
              other {}
            }`,
          },
          {
            hasSchema: Boolean(idSchema && idSchema.$id),
            schema: <code>{idSchema.$id}</code>,
            hasReason: Boolean(reason),
            reason: <em>{reason}</em>,
          }
        )}
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
