import { Button, Icon } from '@trussworks/react-uswds'; // Import Icon
import {
  IconButtonProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
} from '@rjsf/utils';

/** The `MoveDownButton` renders a button that moves the item down in an array.
 *
 * @param props - The `IconButtonProps` for the component
 */
export default function MoveDownButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: IconButtonProps<T, S, F>) {
  const { icon, iconType, registry, ...otherProps } = props;
  const translatedLabel = registry.translateString(TranslatableString.MoveDownButton);
  return (
    <Button
      type="button"
      {...otherProps}
      data-testid="move-down-button"
      aria-label={translatedLabel}
      className={`usa-button usa-button--unstyled ${otherProps.className || ''}`.trim()}
    >
      <Icon.ArrowDownward aria-hidden="true" />
    </Button>
  );
}
