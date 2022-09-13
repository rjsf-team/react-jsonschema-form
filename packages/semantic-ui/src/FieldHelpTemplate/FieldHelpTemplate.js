/* eslint-disable react/prop-types */
import React from "react";
import PropTypes from "prop-types";
import { Message } from "semantic-ui-react";

/**
 * @return {null}
 */
function FieldHelpTemplate({ help, idSchema }) {
  if (help) {
    const id = `${idSchema.$id}__help`;
    return <Message size="mini" info id={id} content={help} />;
  }
  return null;
}

FieldHelpTemplate.propTypes = {
  helpText: PropTypes.string,
  id: PropTypes.string,
};

export default FieldHelpTemplate;
