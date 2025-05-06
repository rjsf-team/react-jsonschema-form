import { Button, Icon } from '@trussworks/react-uswds'; // Import Icon
import {
  IconButtonProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
} from '@rjsf/utils';

/** The `AddButton` renders a button that adds a new item to an array field.
 *
 * @param props - The `IconButtonProps` for the component
 */
export default function AddButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: IconButtonProps<T, S, F>) {
  const { icon, iconType, registry, className, ...otherProps } = props; // Extract className
  const translatedLabel = registry.translateString(TranslatableString.AddItemButton);
  return (
    <Button
      type="button"
      {...otherProps}
      data-testid="add-button"
      aria-label={translatedLabel}
      className={`usa-button usa-button--outline margin-right-1 ${className || ''}`.trim()}
    >
      <Icon.Add className="margin-right-1" aria-hidden="true" />
      {translatedLabel} {/* Show the text label */}
    </Button>
  );
}
