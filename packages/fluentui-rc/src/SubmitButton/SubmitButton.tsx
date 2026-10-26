import { Button, makeStyles, tokens } from '@fluentui/react-components';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, SubmitButtonProps } from '@rjsf/utils';
import { getSubmitButtonOptions } from '@rjsf/utils';

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
  // Fluent's `Button` calls no `onClick` while it is `aria-disabled`, as the form makes it while pending, so the form's
  // `onClick`, which calls the app's and cancels the click, runs in the capture phase meanwhile
  const pendingProps = pending ? { onClick: undefined, onClickCapture: submitButtonProps?.onClick } : undefined;
  return (
    <div className={classes.buttonRow}>
      <Button appearance='primary' type='submit' {...submitButtonProps} {...pendingProps}>
        {submitText}
      </Button>
    </div>
  );
}
