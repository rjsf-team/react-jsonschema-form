import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';
import { Button, ConfirmationButton, Icon } from '@appfolio/react-gears';

export default function IconButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F> & { color?: string }
) {
  const { icon, iconType, className, uiSchema, registry, ...otherProps } = props;
  return (
    <Button
      outline
      className='border-0'
      block={iconType === 'block'}
      {...otherProps}
      color={props.color || 'secondary'}
      size='sm'
    >
      {icon}
    </Button>
  );
}

export function CopyButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return <IconButton title={translateString(TranslatableString.CopyButton)} {...props} icon={<Icon name='copy' />} />;
}

export function MoveDownButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton
      title={translateString(TranslatableString.MoveDownButton)}
      {...props}
      icon={<Icon name='arrow-down' />}
    />
  );
}

export function MoveUpButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <IconButton title={translateString(TranslatableString.MoveUpButton)} {...props} icon={<Icon name='arrow-up' />} />
  );
}

export function RemoveButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <ConfirmationButton
      color='danger'
      confirmation={translateString(TranslatableString.RemoveButton)}
      aria-label='Delete'
      outline
      className='p-2 align-self-stretch border-0'
      {...props}
    >
      <Icon name='circle-xmark' />
    </ConfirmationButton>
  );
}
