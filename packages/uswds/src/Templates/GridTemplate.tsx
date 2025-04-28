import { GenericObjectType } from '@rjsf/utils'; // Removed unused types
import { Grid } from '@trussworks/react-uswds';
import { PropsWithChildren } from 'react'; // Keep only PropsWithChildren

// Assuming this template simply wraps children in a Grid
// Adjust props if it needs more context like FieldTemplateProps
export default function GridTemplate({
  children,
  classNames,
  uiSchema,
}: PropsWithChildren<{ classNames?: string; uiSchema?: GenericObjectType }>) {
  // Simplified props
  const uiOptions = uiSchema?.['ui:options'] || {};
  const { col = 12, ...gridProps } = uiOptions; // Example: Get grid options from uiSchema

  return (
    <Grid col={col} className={classNames} {...gridProps}>
      {children}
    </Grid>
  );
}
