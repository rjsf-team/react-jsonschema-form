import {
  FormContextType,
  ObjectFieldTemplateProps,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { Grid, GridContainer } from '@trussworks/react-uswds';

/** The `ObjectFieldTemplate` is the template to use to render all the inner properties of an object along with the
 * title and description if available. Since this will wrap rendered content, and was really more of a concept of
 * RJSF than a React template, the name of the component is `ObjectField` instead of `ObjectFieldTemplate`.
 *
 * @param props - The `ObjectFieldTemplateProps` for this component
 */
export default function ObjectField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ description, title, properties }: ObjectFieldTemplateProps<T, S, F>) {
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
