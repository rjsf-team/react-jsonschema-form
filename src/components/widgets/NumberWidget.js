import React from "react";
import PropTypes from "prop-types";

import { rangeSpec } from "../../utils";

function NumberWidget(props) {
  const { schema } = props;
  const { BaseInput } = props.registry.widgets;
  return <BaseInput type="number" {...props} {...rangeSpec(schema)} />;
}

if (process.env.NODE_ENV !== "production") {
  Number.propTypes = {
    value: PropTypes.string,
  };
}

export default NumberWidget;
