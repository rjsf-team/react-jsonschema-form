import React from "react";
import { getSubmitButtonOptions, WidgetProps } from "@rjsf/utils";

/**  */
export default function SubmitButton<T, F>({
  uiSchema,
}: Partial<WidgetProps<T, F>>) {
  const {
    submitText,
    norender,
    props: submitButtonProps,
  } = getSubmitButtonOptions(uiSchema);
  return (
    <div>
      {!norender && (
        <button type="submit" {...submitButtonProps} className="btn btn-info">
          {submitText}
        </button>
      )}
    </div>
  );
}
