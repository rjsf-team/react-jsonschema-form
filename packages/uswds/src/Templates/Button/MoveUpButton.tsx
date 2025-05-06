import { Button, Icon } from '@trussworks/react-uswds'; // Import Icon
import {
  IconButtonProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
} from '@rjsf/utils';

/** The `MoveUpButton` renders a button that moves the item up in an array.
 *
 * @param props - The `IconButtonProps` for the component
 */
export default function MoveUpButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: IconButtonProps<T, S, F>) {
  const { icon, iconType, registry, ...otherProps } = props;
  const translatedLabel = registry.translateString(TranslatableString.MoveUpButton);
  return (
    <Button
      type="button"
      {...otherProps}
      data-testid="move-up-button"
      aria-label={translatedLabel}
      className={`usa-button usa-button--unstyled ${otherProps.className || ''}`.trim()}
    >
      <Icon.ArrowUpward aria-hidden="true" />
    </Button>
  );
}
