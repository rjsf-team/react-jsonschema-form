import { ArrayFieldTemplateItemType, FormContextType, RJSFSchema, StrictRJSFSchema, getTemplate } from '@rjsf/utils';
import { Grid } from '@trussworks/react-uswds';

export default function ArrayFieldItemTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldTemplateItemType<T, S, F>) {
  const {
    children,
    className, // RJSF className
    registry,
    buttonsProps,
    // Destructure other props if needed, but avoid spreading unknown props
  } = props;

  const ArrayFieldItemButtonsTemplate = getTemplate<'ArrayFieldItemButtonsTemplate', T, S, F>(
    'ArrayFieldItemButtonsTemplate',
    registry
  );

  // Props for the root Grid row
  const gridRowProps = {
    className: className, // Use RJSF's className
  };

  // Props for the content Grid column
  const contentColProps = {
    col: 'fill' as const, // Use 'fill' or a number (1-12)
    className: 'rjsf-array-item-content',
  };

  // Props for the buttons Grid column
  const buttonsColProps = {
    col: 'auto' as const, // Ensure 'auto' is valid, use 'as const' for type safety
    className: 'rjsf-array-item-buttons margin-top-1',
  };

  return (
    <Grid row {...gridRowProps}>
      <Grid {...contentColProps}>{children}</Grid>

      {buttonsProps && (
        <Grid {...buttonsColProps}>
          {/* Pass only necessary props to the buttons template */}
          <ArrayFieldItemButtonsTemplate {...buttonsProps} registry={registry} />
        </Grid>
      )}
    </Grid>
  );
}
