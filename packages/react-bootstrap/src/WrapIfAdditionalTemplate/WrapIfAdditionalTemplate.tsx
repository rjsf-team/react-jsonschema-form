import type { FormContextType, RJSFSchema, StrictRJSFSchema, WrapIfAdditionalTemplateProps } from '@rjsf/utils';
import {
  ADDITIONAL_PROPERTY_FLAG,
  AdditionalPropertyKeySelect,
  buttonId,
  hasAdditionalKeyLabel,
  TranslatableString,
} from '@rjsf/utils';
import { Col, Form, Row } from 'react-bootstrap';

export default function WrapIfAdditionalTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WrapIfAdditionalTemplateProps<T, S, F>) {
  const {
    classNames,
    style,
    children,
    disabled,
    id,
    label,
    keyName,
    onRemoveProperty,
    onKeyRename,
    onKeyRenameBlur,
    propertyNamesEnum,
    rawDescription,
    readonly,
    required,
    schema,
    uiSchema,
    registry,
  } = props;
  // The key is labelled wherever the value's label is drawn, by the template or the value's own component
  const hasKeyLabel = hasAdditionalKeyLabel<T, S, F>(props);
  const { templates, translateString } = registry;
  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = templates.ButtonTemplates;
  const keyLabel = translateString(TranslatableString.KeyLabel, [label]);
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;
  const descPadding = rawDescription ? 1 : 0;
  const descMargin = rawDescription ? -24 : 0;

  if (!additional) {
    return (
      <div className={classNames} style={style}>
        {children}
      </div>
    );
  }

  const keyId = `${id}-key`;
  const margin = hasKeyLabel ? 12 + descMargin : 0;
  const padding = hasKeyLabel ? 4 + descPadding : 1;

  return (
    <Row className={classNames} style={style} key={keyId}>
      <Col xs={5}>
        <Form.Group>
          {hasKeyLabel && <Form.Label htmlFor={keyId}>{keyLabel}</Form.Label>}
          {propertyNamesEnum ? (
            <AdditionalPropertyKeySelect<T, S, F>
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
            <Form.Control
              key={keyName}
              aria-label={hasKeyLabel ? undefined : keyLabel}
              required={required}
              defaultValue={keyName}
              disabled={disabled || readonly}
              id={keyId}
              name={keyId}
              onBlur={!readonly ? onKeyRenameBlur : undefined}
              type='text'
            />
          )}
        </Form.Group>
      </Col>
      <Col xs={6}>{children}</Col>
      <Col xs={1} className={`py-${padding} d-grid gap-2`} style={{ marginTop: `${margin}px`, maxHeight: `2.5rem` }}>
        <RemoveButton
          id={buttonId(id, 'remove')}
          className='rjsf-object-property-remove w-100'
          disabled={disabled || readonly}
          onClick={onRemoveProperty}
          uiSchema={uiSchema}
          registry={registry}
        />
      </Col>
    </Row>
  );
}
