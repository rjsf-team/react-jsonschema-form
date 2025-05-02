import { SubmitButtonProps } from '@rjsf/utils';
import { Button } from '@trussworks/react-uswds';

export default function SubmitButton<T = any>(props: SubmitButtonProps<T>) {
  const { submitText, uiSchema } = props;
  return (
    <Button type="submit" className="usa-button">
      {submitText}
    </Button>
  );
}
