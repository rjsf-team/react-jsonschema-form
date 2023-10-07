import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';

import { Button } from '@carbon/react';
import { Copy, ArrowDown, ArrowUp, TrashCan } from '@carbon/icons-react';

/** Implement `ButtonTemplates.CopyButton`
 */
export function CopyButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <Button
      className='array-item-copy'
      size='sm'
      kind='ghost'
      hasIconOnly
      iconDescription={translateString(TranslatableString.CopyButton)}
      renderIcon={Copy}
      {...props}
    />
  );
}

/** Implement `ButtonTemplates.MoveDownButton`
 */
export function MoveDownButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <Button
      className='array-item-move-down'
      size='sm'
      kind='ghost'
      hasIconOnly
      iconDescription={translateString(TranslatableString.MoveDownButton)}
      renderIcon={ArrowDown}
      {...props}
    />
  );
}

/** Implement `ButtonTemplates.MoveUpButton`
 */
export function MoveUpButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <Button
      className='array-item-move-up'
      size='sm'
      kind='ghost'
      hasIconOnly
      iconDescription={translateString(TranslatableString.MoveUpButton)}
      renderIcon={ArrowUp}
      {...props}
    />
  );
}

/** Implement `ButtonTemplates.RemoveButton`
 */
export function RemoveButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <Button
      className='array-item-remove'
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
