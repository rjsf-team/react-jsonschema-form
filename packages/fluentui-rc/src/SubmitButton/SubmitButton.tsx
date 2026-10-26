import type { MouseEvent } from 'react';
import { Button, makeStyles, tokens } from '@fluentui/react-components';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, SubmitButtonProps } from '@rjsf/utils';
import { getSubmitButtonOptions } from '@rjsf/utils';

type ClickHandler = (event: MouseEvent<HTMLElement>) => void;

/** Calls `second` even when `first` throws */
function callInOrder(event: MouseEvent<HTMLElement>, first?: ClickHandler, second?: ClickHandler) {
  try {
    first?.(event);
  } finally {
    second?.(event);
  }
}

const useStyles = makeStyles({
  buttonRow: {
    marginTop: tokens.spacingVerticalL,
  },
});

export default function SubmitButton<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ uiSchema, pending }: SubmitButtonProps<T, S, F>) {
  const classes = useStyles();
  const { submitText, norender, props: submitButtonProps } = getSubmitButtonOptions(uiSchema);
  if (norender) {
    return null;
  }
  const { onClick, onClickCapture }: { onClick?: ClickHandler; onClickCapture?: ClickHandler } =
    submitButtonProps ?? {};
  // Fluent's `Button` calls no `onClick` while it is `aria-disabled`, as the form makes it while pending, so the form's
  // `onClick`, which calls the app's and cancels the click, runs in the capture phase meanwhile, after the app's own
  // capture handler, as it would outside the pending state, even when that handler throws
  const pendingProps = pending
    ? {
        onClick: undefined,
        onClickCapture: (event: MouseEvent<HTMLElement>) => callInOrder(event, onClickCapture, onClick),
      }
    : undefined;
  return (
    <div className={classes.buttonRow}>
      <Button appearance='primary' type='submit' {...submitButtonProps} {...pendingProps}>
        {submitText}
      </Button>
    </div>
  );
}
