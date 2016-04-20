import React, { PropTypes } from "react";

import { memoizeStatelessComponent } from "../../utils";


function EmailWidget({
  schema,
  id,
  placeholder,
  value,
  required,
  onChange
}) {
  return (
    <input type="email"
      id={id}
      className="form-control"
      value={typeof value === "undefined" ? "" : value}
      placeholder={placeholder}
      required={required}
      onChange={(event) => onChange(event.target.value)} />
  );
}

if (process.env.NODE_ENV !== "production") {
  EmailWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: React.PropTypes.string,
    required: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default memoizeStatelessComponent(EmailWidget);
