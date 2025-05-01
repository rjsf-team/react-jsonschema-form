import { FormContextType, getSubmitButtonOptions, RJSFSchema, StrictRJSFSchema, SubmitButtonProps } from '@rjsf/utils';
import { Button, makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  buttonRow: {
    marginTop: tokens.spacingVerticalL,
  },
});

export default function SubmitButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ uiSchema }: SubmitButtonProps<T, S, F>) {
  const classes = useStyles();
  const { submitText, norender, props: submitButtonProps } = getSubmitButtonOptions(uiSchema);
  if (norender) {
    return null;
  }
  return (
    <div className={classes.buttonRow}>
      <Button appearance='primary' type='submit' {...submitButtonProps}>
        {submitText}
      </Button>
    </div>
  );
}
