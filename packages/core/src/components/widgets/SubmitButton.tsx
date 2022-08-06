import React from "react";
import { getSubmitButtonOptions, WidgetProps } from "@rjsf/utils";

/** The `SubmitButton` renders a button that represent the `Submit` action on a form */
export default function SubmitButton<T, F>({
  uiSchema,
}: Partial<WidgetProps<T, F>>) {
  const {
    submitText,
    norender,
    props: submitButtonProps = {},
  } = getSubmitButtonOptions(uiSchema);
  if (norender) {
    return null;
  }
  const props = { className: "btn btn-info", ...submitButtonProps };
  return (
    <div>
      <button type="submit" {...props}>
        {submitText}
      </button>
    </div>
  );
}
