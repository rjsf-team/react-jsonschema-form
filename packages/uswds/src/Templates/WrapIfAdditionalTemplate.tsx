import { FocusEvent } from 'react';
import { FormGroup, Grid, GridContainer, Label } from '@trussworks/react-uswds';
import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WrapIfAdditionalTemplateProps,
  TranslatableString
} from '@rjsf/utils';

// Define the constant for additional property flag since it's not exported from utils
const ADDITIONAL_PROPERTY_FLAG = '__additional_property';

/** The `WrapIfAdditional` component is used by the `FieldTemplate` to wrap automatically added additional properties.
 *
 * @param props - The `WrapIfAdditionalProps` for this component
 */
export default function WrapIfAdditionalTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WrapIfAdditionalTemplateProps<T, S, F>) {
  const {
    id,
    classNames,
    style,
    disabled,
    label,
    onDropPropertyClick,
    onKeyChange,
    readonly,
    schema,
    children,
    uiSchema,
    registry,
    errors,
  } = props;
  const { templates, translateString } = registry;
  const { RemoveButton } = templates.ButtonTemplates!;
  const keyLabel = translateString(TranslatableString.KeyLabel, [label]);
  const additional = Object.prototype.hasOwnProperty.call(
    schema,
    ADDITIONAL_PROPERTY_FLAG
  );

  if (!additional) {
    return (
      <div className={classNames} style={style}>
        {children}
      </div>
    );
  }

  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onKeyChange(target.value);
  const keyId = `${id}-key`;
  const hasErrors = errors && errors.props.errors && errors.props.errors.length > 0;

  return (
    <div className={classNames} style={style}>
      <GridContainer containerSize="desktop">
        <Grid row>
          <Grid className="form-additional" col={true}>
            <FormGroup error={hasErrors}>
              <Label htmlFor={keyId}>{keyLabel}</Label>
              <input
                className="form-control"
                type="text"
                id={keyId}
                onBlur={!readonly ? handleBlur : undefined}
                defaultValue={label}
              />
            </FormGroup>
          </Grid>
          <Grid className="form-additional" col={true} id={`instance-${id}`}>
            {children}
          </Grid>
          <Grid col="auto" className="rjsf-uswds-additional-toolbox">
            <RemoveButton
              className="array-item-remove"
              disabled={disabled || readonly}
              onClick={onDropPropertyClick(label)}
              uiSchema={uiSchema}
              registry={registry}
            >
              <span className="usa-sr-only">
                {translateString(TranslatableString.RemoveButton)}
              </span>
            </RemoveButton>
          </Grid>
        </Grid>
      </GridContainer>
    </div>
  );
}
