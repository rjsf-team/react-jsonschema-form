import { FocusEvent } from 'react';
import {
  ADDITIONAL_PROPERTY_FLAG,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  WrapIfAdditionalTemplateProps,
} from '@rjsf/utils';
import { FormLabelGroup, HasManyFieldsRow, Input, Row, Col } from '@appfolio/react-gears';

export default function WrapIfAdditionalTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({
  classNames,
  style,
  children,
  disabled,
  id,
  label,
  onDropPropertyClick,
  onKeyChange,
  readonly,
  required,
  schema,
  registry,
}: WrapIfAdditionalTemplateProps<T, S, F>) {
  const { translateString } = registry;
  const keyLabel = translateString(TranslatableString.KeyLabel, [label]);
  const additional = ADDITIONAL_PROPERTY_FLAG in schema;

  if (!additional) {
    return (
      <div className={classNames} style={style}>
        {children}
      </div>
    );
  }

  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onKeyChange(target.value);
  const keyId = `${id}-key`;

  return (
    <HasManyFieldsRow onDelete={onDropPropertyClick(label)} disabled={disabled || readonly}>
      <Row className={classNames} style={style} key={keyId}>
        <Col>
          <FormLabelGroup label={keyLabel} stacked>
            <Input
              required={required}
              defaultValue={label}
              disabled={disabled || readonly}
              id={keyId}
              name={keyId}
              onBlur={!readonly ? handleBlur : undefined}
              type='text'
            />
          </FormLabelGroup>
        </Col>
        <Col>{children}</Col>
      </Row>
    </HasManyFieldsRow>
  );
}
