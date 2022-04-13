import React from "react";
import { getSubmitButtonOptions } from ".././../utils";

export default function SubmitButton({ uiSchema }) {
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
