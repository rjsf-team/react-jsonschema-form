import type { FormContextType, RJSFSchema, StrictRJSFSchema, WrapIfAdditionalTemplateProps } from '@rjsf/utils';
import {
  ADDITIONAL_PROPERTY_FLAG,
  additionalKeyId,
  AdditionalPropertyKeySelect,
  buttonId,
  descriptionId,
  getAdditionalKeyAttributes,
  getTemplates,
  getUiOptions,
  hasAdditionalKeyLabel,
  joinClassNames,
  templateDrawsDescription,
  TranslatableString,
} from '@rjsf/utils';

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
  const keyAttributes = getAdditionalKeyAttributes<T, S, F>(props);
  const { templates, translateString, classMap } = registry;
  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = templates.ButtonTemplates;
  const keyLabel = translateString(TranslatableString.KeyLabel, [label]);
  const keyId = additionalKeyId(id);
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;

  if (!additional) {
    return (
      <div className={classNames} style={style} data-invalid={hasErrors || undefined}>
        {children}
      </div>
    );
  }
  const { DescriptionFieldTemplate } = getTemplates<T, S, F>(registry, getUiOptions<T, S, F>(uiSchema));
  return (
    <div className={classNames} style={style} data-invalid={hasErrors || undefined}>
      <div className='rjsf-additional-property'>
        <div className='rjsf-additional-property-key'>
          {hasKeyLabel && (
            <Label
              label={keyLabel}
              required={required}
              id={keyId}
              className={joinClassNames('rjsf-field-label', classMap.fieldLabel)}
              invalid={keyAttributes['aria-invalid']}
            />
          )}
          {/* The value's description sits between its label and input, so an invisible copy of it, drawn by the same
              template under an id of its own, holds the key's input level with the value's, wrapping alike for a
              description as wide in either column */}
          {rawDescription && templateDrawsDescription<T, S, F>(props) && (
            <div aria-hidden='true' style={{ visibility: 'hidden' }}>
              <DescriptionFieldTemplate
                id={descriptionId(keyId)}
                description={rawDescription}
                hasErrors={hasErrors}
                schema={schema}
                uiSchema={uiSchema}
                registry={registry}
              />
            </div>
          )}
          {propertyNamesEnum ? (
            <AdditionalPropertyKeySelect<T, S, F>
              errorAttributes={keyAttributes}
              id={keyId}
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
              id={keyId}
              aria-label={hasKeyLabel ? undefined : keyLabel}
              {...keyAttributes}
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
