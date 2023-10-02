import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';

import { Button } from '@carbon/react';
import { Copy, ArrowDown, ArrowUp, TrashCan } from '@carbon/icons-react';

export function CopyButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <Button
      size='sm'
      kind='ghost'
      hasIconOnly
      iconDescription={translateString(TranslatableString.CopyButton)}
      renderIcon={Copy}
      {...props}
    />
  );
}

export function MoveDownButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <Button
      size='sm'
      kind='ghost'
      hasIconOnly
      iconDescription={translateString(TranslatableString.MoveDownButton)}
      renderIcon={ArrowDown}
      {...props}
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
    <Button
      size='sm'
      kind='ghost'
      hasIconOnly
      iconDescription={translateString(TranslatableString.MoveUpButton)}
      renderIcon={ArrowUp}
      {...props}
    />
  );
}

export function RemoveButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <Button
      size='sm'
      kind='danger--ghost'
      // there's a css bug in carbon design
      style={{ paddingRight: 0 }}
      hasIconOnly
      iconDescription={translateString(TranslatableString.RemoveButton)}
      {...props}
      renderIcon={TrashCan}
    />
  );
}
