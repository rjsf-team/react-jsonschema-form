import React from "react";
import PropTypes from "prop-types";

const REQUIRED_FIELD_SYMBOL = "*";

function TitleTemplate(props) {
  const { id, title, required } = props;
  const legend = required ? title + REQUIRED_FIELD_SYMBOL : title;
  return <legend id={id}>{legend}</legend>;
}

if (process.env.NODE_ENV !== "production") {
  TitleTemplate.propTypes = {
    id: PropTypes.string,
    title: PropTypes.string,
    required: PropTypes.bool,
  };
}

export default TitleTemplate;
