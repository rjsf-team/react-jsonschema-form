import { Button, Icon } from '@trussworks/react-uswds'; // Import Icon
import {
  IconButtonProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
} from '@rjsf/utils';

/** The `CopyButton` renders a button that copies the data for an array item.
 *
 * @param props - The `IconButtonProps` for the component
 */
export default function CopyButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: IconButtonProps<T, S, F>) {
  // Use IconButtonProps
  const { icon, iconType, registry, ...otherProps } = props;
  const translatedLabel = registry.translateString(TranslatableString.CopyButton);
  return (
    <Button
      type="button"
      {...otherProps}
      data-testid="copy-button"
      aria-label={translatedLabel}
      className={`usa-button usa-button--unstyled ${otherProps.className || ''}`.trim()}
    >
      {/* Use Icon.ContentCopy */}
      <Icon.ContentCopy aria-hidden="true" />
      {/* <span className="usa-sr-only">{translatedLabel}</span> */}
    </Button>
  );
}
