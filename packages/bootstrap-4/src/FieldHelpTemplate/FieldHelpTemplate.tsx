import React from "react";
import { FieldHelpProps } from "@rjsf/utils";
import Form from "react-bootstrap/Form";

/** The `FieldHelpTemplate` component renders any help desired for a field
 *
 * @param props - The `FieldHelpProps` to be rendered
 */
export default function FieldHelpTemplate(props: FieldHelpProps) {
  const { idSchema, help, hasErrors } = props;
  if (!help) {
    return null;
  }
  const id = `${idSchema.$id}__help`;
  return (
    <Form.Text className={hasErrors ? "text-danger" : "text-muted"} id={id}>
      {help}
    </Form.Text>
  );
}
