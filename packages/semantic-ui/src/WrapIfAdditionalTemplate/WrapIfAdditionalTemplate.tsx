import { FocusEvent } from 'react';
import {
  ADDITIONAL_PROPERTY_FLAG,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  WrapIfAdditionalTemplateProps,
} from '@rjsf/utils';
import { Form, Grid } from 'semantic-ui-react';

/** The `WrapIfAdditional` component is used by the `FieldTemplate` to rename, or remove properties that are
 * part of an `additionalProperties` part of a schema.
 *
 * @param props - The `WrapIfAdditionalProps` for this component
 */
export default function WrapIfAdditionalTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WrapIfAdditionalTemplateProps<T, S, F>) {
  const {
    children,
    classNames,
    style,
    disabled,
    id,
    label,
    onDropPropertyClick,
    onKeyChange,
    readonly,
    required,
    schema,
    uiSchema,
    registry,
  } = props;
  const { templates, translateString } = registry;
  // Button templates are not overridden in the uiSchema
  const { RemoveButton } = templates.ButtonTemplates;
  const keyLabel = translateString(TranslatableString.KeyLabel, [label]);
  const { readonlyAsDisabled = true, wrapperStyle } = registry.formContext;

  const additional = ADDITIONAL_PROPERTY_FLAG in schema;

  if (!additional) {
    return (
      <div className={classNames} style={style}>
        {children}
      </div>
    );
  }

  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onKeyChange(target.value);

  return (
    <div className={classNames} style={style} key={`${id}-key`}>
      <Grid columns='equal'>
        <Grid.Row>
          <Grid.Column className='form-additional'>
            <Form.Group widths='equal' grouped>
              <Form.Input
                className='form-group'
                hasFeedback
                fluid
                htmlFor={`${id}`}
                label={keyLabel}
                required={required}
                defaultValue={label}
                disabled={disabled || (readonlyAsDisabled && readonly)}
                id={`${id}`}
                name={`${id}`}
                onBlur={!readonly ? handleBlur : undefined}
                style={wrapperStyle}
                type='text'
              ></Form.Input>
            </Form.Group>
          </Grid.Column>
          <Grid.Column className='form-additional' verticalAlign='middle'>
            {children}
          </Grid.Column>
          <Grid.Column>
            <RemoveButton
              iconType='mini'
              className='array-item-remove'
              disabled={disabled || readonly}
              onClick={onDropPropertyClick(label)}
              uiSchema={uiSchema}
              registry={registry}
            />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </div>
  );
}
