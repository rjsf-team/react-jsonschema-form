import { SubmitButtonProps } from '@rjsf/utils';
import { Button } from '@trussworks/react-uswds';

export default function SubmitButton<T = any>(props: SubmitButtonProps<T>) {
  return (
    <Button type="submit" className="usa-button">
      {props.uiSchema?.['ui:submitButtonOptions']?.submitText || 'Submit'}
    </Button>
  );
}
