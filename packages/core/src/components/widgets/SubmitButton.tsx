import React from 'react';
import { getSubmitButtonOptions, UiSchema } from '@rjsf/utils';

export interface SubmitButtonProps<T, F> {
  uiSchema: UiSchema<T, F>;
}

export default function SubmitButton<T, F>({ uiSchema }: SubmitButtonProps<T, F>) {
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
