import type { FormContextType, RJSFSchema, StrictRJSFSchema, WrapIfAdditionalTemplateProps } from '@rjsf/utils';
import {
  ADDITIONAL_PROPERTY_FLAG,
  AdditionalPropertyKeySelect,
  buttonId,
  hasAdditionalKeyLabel,
  TranslatableString,
} from '@rjsf/utils';
import { clsx } from 'clsx';

import Label from './Label.tsx';

/** The `WrapIfAdditional` component is used by the `FieldTemplate` to rename, or remove properties that are
 * part of an `additionalProperties` part of a schema.
 *
 * @param props - The `WrapIfAdditionalProps` for this component
 *
 * @deprecated `@rjsf/bootstrap3` is removed in v8; move to another theme
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
    hasErrors,
    label,
    keyName,
    onKeyRename,
    onKeyRenameBlur,
    onRemoveProperty,
    propertyNamesEnum,
    rawDescription,
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
  const hasDescription = !!rawDescription;

  // From the field's own errors, as its `rjsf-field-error` class is, so an `anyOf`/`oneOf` option follows its own
  // `ui:hideError` rather than the field above's
  const uiClassNames = clsx('form-group', classNames, hasErrors && 'has-error has-danger');

  if (!additional) {
    return (
      <div className={uiClassNames} style={style}>
        {children}
      </div>
    );
  }
  const margin = hasDescription ? 46 : 26;
  return (
    <div className={uiClassNames} style={style}>
      <div className='row'>
        <div className='col-xs-5 form-additional'>
          <div className='form-group'>
            {hasKeyLabel && (
              <Label label={keyLabel} required={required} id={`${id}-key`} className={classMap.fieldLabel} />
            )}
            {hasKeyLabel && rawDescription && <div>&nbsp;</div>}
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
                className='form-control'
                type='text'
                id={`${id}-key`}
                aria-label={hasKeyLabel ? undefined : keyLabel}
                onBlur={onKeyRenameBlur}
                defaultValue={keyName}
              />
            )}
          </div>
        </div>
        <div className='form-additional form-group col-xs-5'>{children}</div>
        <div className='col-xs-2' style={{ marginTop: hasKeyLabel ? `${margin}px` : undefined }}>
          <RemoveButton
            id={buttonId(id, 'remove')}
            className='rjsf-object-property-remove btn-block'
            style={{ border: '0' }}
            disabled={disabled || readonly}
            onClick={onRemoveProperty}
            uiSchema={uiSchema}
            registry={registry}
          />
        </div>
      </div>
    </div>
  );
}
