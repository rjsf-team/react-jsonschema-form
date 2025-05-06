import { SubmitButtonProps, getSubmitButtonOptions } from '@rjsf/utils';
import { Button } from '@trussworks/react-uswds';

export default function SubmitButton<T = any>(props: SubmitButtonProps<T>) {
  const { submitText, props: submitButtonProps } = getSubmitButtonOptions(props.uiSchema);
  return (
    <Button type="submit" {...submitButtonProps} className="usa-button">
      {submitText}
    </Button>
  );
}
