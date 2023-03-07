import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';
import { IIconProps, CommandBarButton } from '@fluentui/react';

const addIcon: IIconProps = { iconName: 'Add' };

export default function AddButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <CommandBarButton
      style={{ height: '32px' }}
      iconProps={addIcon}
      text={translateString(TranslatableString.AddItemButton)}
      className={props.className}
      onClick={props.onClick}
      disabled={props.disabled}
    />
  );
}
