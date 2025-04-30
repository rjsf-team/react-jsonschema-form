import { Button, Icon } from '@trussworks/react-uswds'; // Import Icon
import { IconButtonProps, FormContextType, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';

/** The `RemoveButton` renders a button that removes the item from an array.
 *
 * @param props - The `IconButtonProps` for the component
 */
export default function RemoveButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: IconButtonProps<T, S, F>) {
  const { icon, iconType, registry, ...otherProps } = props;
  const translatedLabel = registry.translateString(TranslatableString.RemoveButton);
  return (
    <Button
      type="button"
      {...otherProps}
      data-testid="remove-button"
      aria-label={translatedLabel}
      // Use unstyled or adjust as needed for segmented group
      className={`usa-button usa-button--unstyled ${otherProps.className || ''}`.trim()}
    >
      {/* Use Icon.Delete */}
      <Icon.Delete aria-hidden="true" />
      {/* <span className="usa-sr-only">{translatedLabel}</span> */}
    </Button>
  );
}
