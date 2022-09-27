import React from "react";
import { FieldHelpProps } from "@rjsf/utils";
import { Message } from "semantic-ui-react";

/**
 * @return {null}
 */
function FieldHelpTemplate({ help, idSchema }: FieldHelpProps) {
  if (help) {
    const id = `${idSchema.$id}__help`;
    return <Message size="mini" info id={id} content={help} />;
  }
  return null;
}

export default FieldHelpTemplate;
