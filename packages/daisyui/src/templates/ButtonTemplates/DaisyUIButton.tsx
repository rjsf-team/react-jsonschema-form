import { memo } from 'react';
import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface DaisyUIButtonProps<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>
  extends Omit<IconButtonProps<T, S, F>, 'icon'> {
  icon: IconDefinition;
}

function DaisyUIButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: DaisyUIButtonProps<T, S, F>
) {
  const { icon, iconType, uiSchema, registry, ...otherProps } = props;
  return (
    <button type='button' className={`btn btn-${iconType}`} aria-label={props.title!} {...otherProps}>
      <FontAwesomeIcon icon={icon} className='h-5 w-5' />
    </button>
  );
}

DaisyUIButton.displayName = 'DaisyUIButton';

export default memo(DaisyUIButton) as typeof DaisyUIButton;
