import {
  IconButtonProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
} from '@rjsf/utils';
import { Button } from '@trussworks/react-uswds';

/** The `AddButton` renders a button that represents the `Add` action on a form */
export default function AddButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: IconButtonProps<T, S, F>) {
  const { icon, iconType = 'default', registry, className = '', uiSchema, ...otherProps } = props;
  const { translateString } = registry;
  const translatedLabel = translateString(TranslatableString.AddItemButton);
  return (
    <Button
      type="button"
      {...otherProps}
      data-testid="add-button"
      aria-label={translatedLabel}
      className={`usa-button usa-button--outline ${className}`.trim()}
    >
      {translatedLabel}
    </Button>
  );
}
