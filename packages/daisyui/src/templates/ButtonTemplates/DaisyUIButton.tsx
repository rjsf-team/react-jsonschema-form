import { memo } from 'react';
import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

/** Interface for props specific to DaisyUIButton, extending IconButtonProps but with stricter icon typing */
interface DaisyUIButtonProps<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>
  extends Omit<IconButtonProps<T, S, F>, 'icon'> {
  /** The FontAwesome icon to display in the button */
  icon: IconDefinition;
}

/** The `DaisyUIButton` component renders a button with an icon using DaisyUI styling.
 * It's used as the base for various button components like add, remove, copy, move up/down.
 *
 * @param props - The component props
 */
function DaisyUIButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: DaisyUIButtonProps<T, S, F>,
) {
  const { icon, iconType, uiSchema, registry, className, ...otherProps } = props;
  return (
    <button type='button' className={className} aria-label={props.title!} {...otherProps}>
      <FontAwesomeIcon icon={icon} className='h-5 w-5' />
    </button>
  );
}

DaisyUIButton.displayName = 'DaisyUIButton';

export default memo(DaisyUIButton) as typeof DaisyUIButton;
