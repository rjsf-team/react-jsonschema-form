import {
  FormContextType,
  ObjectFieldTemplateProps,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { Grid, GridContainer } from '@trussworks/react-uswds';

export default function ObjectField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  description,
  title,
  properties,
  required,
  uiSchema,
  idSchema,
  schema,
  formData,
}: ObjectFieldTemplateProps<T, S, F>) {
  return (
    <GridContainer className="usa-form-group">
      {title && <h3 className="usa-label">{title}</h3>}
      {description && <div className="usa-hint">{description}</div>}
      <Grid row gap={2}>
        {properties.map((prop) => (
          <Grid key={prop.name} col={12}>
            {prop.content}
          </Grid>
        ))}
      </Grid>
    </GridContainer>
  );
}
