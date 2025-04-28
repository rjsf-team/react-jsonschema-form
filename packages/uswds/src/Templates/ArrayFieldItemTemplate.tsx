import React from "react";
import { ArrayFieldTemplateItemType, FormContextType, RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";
import { Grid } from "@trussworks/react-uswds"; // Updated import

/** The `ArrayFieldItemTemplate` component is the template used to render an items of an array.
 *
 * @param props - The `ArrayFieldTemplateItemType` props for the component
 */
const ArrayFieldItemTemplate = <
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  children,
  className,
  disabled,
  hasToolbar,
  hasCopy,
  hasMoveDown,
  hasMoveUp,
  hasRemove,
  index,
  onCopyIndexClick,
  onDropIndexClick,
  onReorderClick,
  readonly,
  registry,
  required,
  schema,
  uiSchema,
  buttonsProps, // Added buttonsProps
}: ArrayFieldTemplateItemType<T, S, F>) => {
  const { ArrayFieldItemButtonsTemplate } = registry.templates; // Get ArrayFieldItemButtonsTemplate

  return (
    <Grid row gap className={className}>
      <Grid col={true} className="rjsf-uswds-array-item-content">
        {children}
      </Grid>
      {hasToolbar && (
        <Grid col="auto" className="rjsf-uswds-array-item-toolbox">
          {/* Render the buttons template */}
          <ArrayFieldItemButtonsTemplate {...buttonsProps} />
        </Grid>
      )}
    </Grid>
  );
};

export default ArrayFieldItemTemplate;
