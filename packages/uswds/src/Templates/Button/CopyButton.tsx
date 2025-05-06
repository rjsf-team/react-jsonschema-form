import { Button, Icon } from '@trussworks/react-uswds';
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
  const { icon, iconType, registry, className, ...otherProps } = props;
  const translatedLabel = registry.translateString(TranslatableString.CopyButton);
  return (
    <Button
      type="button"
      {...otherProps}
      data-testid="copy-button"
      aria-label={translatedLabel}
      className={`usa-button usa-button--outline margin-right-1 ${className || ''}`.trim()}
    >
      <Icon.ContentCopy className="margin-right-1" aria-hidden="true" />
      {translatedLabel}
    </Button>
  );
}
