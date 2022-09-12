import React from "react";
import { FieldHelpProps } from "@rjsf/utils";

/** The `FieldHelpTemplate` component renders any help desired for a field
 *
 * @param props - The `FieldHelpProps` to be rendered
 */
export default function FieldHelpTemplate<T = any, F = any>(
  props: FieldHelpProps<T, F>
) {
  const { idSchema, help } = props;
  if (!help) {
    return null;
  }
  const id = `${idSchema.$id}__help`;
  if (typeof help === "string") {
    return (
      <p id={id} className="help-block">
        {help}
      </p>
    );
  }
  return (
    <div id={id} className="help-block">
      {help}
    </div>
  );
}
