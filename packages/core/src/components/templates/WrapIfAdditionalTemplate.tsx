import type { FormContextType, RJSFSchema, StrictRJSFSchema, WrapIfAdditionalTemplateProps } from '@rjsf/utils';
import {
  ADDITIONAL_PROPERTY_FLAG,
  AdditionalPropertyKeySelect,
  buttonId,
  hasAdditionalKeyLabel,
  TranslatableString,
} from '@rjsf/utils';
import { clsx } from 'clsx';

import Label from './FieldTemplate/Label.tsx';

/** The `WrapIfAdditional` component is used by the `FieldTemplate` to rename, or remove properties that are
 * part of an `additionalProperties` part of a schema. The key, the value and the remove button sit in a row that
 * `rjsf.css` lays out as a grid.
 *
 * @param props - The `WrapIfAdditionalProps` for this component
 */
export default function WrapIfAdditionalTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WrapIfAdditionalTemplateProps<T, S, F>) {
  const {
    id,
    classNames,
    style,
    disabled,
    label,
    keyName,
    onKeyRename,
    onKeyRenameBlur,
    onRemoveProperty,
    propertyNamesEnum,
    readonly,
    required,
    schema,
    children,
    uiSchema,
    registry,
  } = props;
  // The key is labelled wherever the value's label is drawn, by the template or the value's own component
  const hasKeyLabel = hasAdditionalKeyLabel<T, S, F>(props);
  const { templates, translateString, classMap } = registry;
  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = templates.ButtonTemplates;
  const keyLabel = translateString(TranslatableString.KeyLabel, [label]);
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;

  if (!additional) {
    return (
      <div className={classNames} style={style}>
        {children}
      </div>
    );
  }
  return (
    <div className={classNames} style={style}>
      <div className='rjsf-additional-property'>
        <div className='rjsf-additional-property-key'>
          {hasKeyLabel && (
            <Label
              label={keyLabel}
              required={required}
              id={`${id}-key`}
              className={clsx('rjsf-field-label', classMap.fieldLabel)}
            />
          )}
          {propertyNamesEnum ? (
            <AdditionalPropertyKeySelect<T, S, F>
              id={`${id}-key`}
              label={keyLabel}
              hideLabel
              labelledByTemplate={hasKeyLabel}
              value={keyName}
              propertyNamesEnum={propertyNamesEnum}
              onKeyRename={onKeyRename}
              disabled={disabled}
              readonly={readonly}
              required={required}
              registry={registry}
            />
          ) : (
            <input
              key={keyName}
              className={classMap.input}
              type='text'
              id={`${id}-key`}
              aria-label={hasKeyLabel ? undefined : keyLabel}
              onBlur={onKeyRenameBlur}
              defaultValue={keyName}
            />
          )}
        </div>
        <div className='rjsf-additional-property-value'>{children}</div>
        <RemoveButton
          id={buttonId(id, 'remove')}
          className='rjsf-object-property-remove'
          disabled={disabled || readonly}
          onClick={onRemoveProperty}
          uiSchema={uiSchema}
          registry={registry}
        />
      </div>
    </div>
  );
}
