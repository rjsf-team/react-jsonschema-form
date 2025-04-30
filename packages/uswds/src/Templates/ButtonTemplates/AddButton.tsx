import { Button, Icon } from '@trussworks/react-uswds'; // Import Icon
import { IconButtonProps, FormContextType, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';

/** The `AddButton` renders a button that adds a new item to an array field.
 *
 * @param props - The `IconButtonProps` for the component
 */
export default function AddButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: IconButtonProps<T, S, F>) {
  const { icon, iconType, registry, ...otherProps } = props; // Destructure registry
  const translatedLabel = registry.translateString(TranslatableString.AddItemButton);
  return (
    // Add appropriate styling for an icon-only button if desired, e.g., usa-button--icon-only
    <Button type="button" {...otherProps} data-testid="add-button" aria-label={translatedLabel} className={`usa-button usa-button--outline ${otherProps.className || ''}`.trim()}>
      {/* Use Icon.Add */}
      <Icon.Add aria-hidden="true" />
      {/* Optionally add screen-reader only text if aria-label isn't sufficient */}
      {/* <span className="usa-sr-only">{translatedLabel}</span> */}
    </Button>
  );
}
