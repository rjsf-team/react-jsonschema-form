import {
  getTemplate,
  getUiOptions,
  ArrayFieldTemplateProps,
  ArrayFieldTemplateItemType,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  isObject,
} from '@rjsf/utils';
import React from 'react';
import { Fieldset, Grid, GridContainer } from '@trussworks/react-uswds';

/** The `ArrayFieldTemplate` component is the template used to render all items in an array.
 *
 * @param props - The `ArrayFieldTemplateProps` for this component
 */
export default function ArrayFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldTemplateProps<T, S, F>) {
  const {
    canAdd,
    className,
    disabled = false,
    idSchema,
    items,
    onAddClick,
    readonly = false,
    registry,
    required,
    schema,
    title,
    uiSchema,
  } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldDescriptionTemplate = getTemplate<'ArrayFieldDescriptionTemplate', T, S, F>(
    'ArrayFieldDescriptionTemplate',
    registry,
    uiOptions,
  );
  const ArrayFieldItemTemplate = getTemplate<'ArrayFieldItemTemplate', T, S, F>(
    'ArrayFieldItemTemplate',
    registry,
    uiOptions,
  );
  const ArrayFieldTitleTemplate = getTemplate<'ArrayFieldTitleTemplate', T, S, F>(
    'ArrayFieldTitleTemplate',
    registry,
    uiOptions,
  );
  const { AddButton } = registry.templates.ButtonTemplates!;
  const fieldTitle = uiOptions.title ?? title;
  const fieldDescription = uiOptions.description ?? schema.description;
  const hideTitle = !fieldTitle;

  // Determine if the array is likely rendered as checkboxes
  const isCheckboxes =
    uiOptions['ui:widget'] === 'checkboxes' ||
    (isObject(schema.items) && Array.isArray((schema.items as RJSFSchema).enum) && schema.uniqueItems);

  // Define class names for styling - conditionally apply border/indentation
  const outerContainerClass = !isCheckboxes
    ? "rjsf-uswds-array-field-container border border-base-lighter padding-2 margin-left-1"
    : "rjsf-uswds-array-field-container";
  const itemContainerClass = "rjsf-uswds-array-item-list";

  return (
    <div className={`${className} ${outerContainerClass}`}>
      <Fieldset>
        {!hideTitle && (
          <ArrayFieldTitleTemplate
            key={`array-field-title-${idSchema.$id}`}
            id={idSchema.$id}
            title={fieldTitle}
            required={required}
            schema={schema}
            uiSchema={uiSchema}
            registry={registry}
          />
        )}
        {(uiOptions.description || schema.description) && (
          <ArrayFieldDescriptionTemplate
            key={`array-field-description-${idSchema.$id}`}
            id={`${idSchema.$id}__description`}
            description={fieldDescription!}
            schema={schema}
            uiSchema={uiSchema}
            registry={registry}
          />
        )}
        <div key={`array-item-list-${idSchema.$id}`} className={itemContainerClass}>
          {items &&
            items.map(({ key, ...itemProps }: ArrayFieldTemplateItemType<T, S, F>) => (
              <ArrayFieldItemTemplate key={key} {...itemProps} />
            ))}

          {canAdd && (
            <GridContainer containerSize="fluid" className="margin-top-1">
              <Grid row>
                <Grid col={12} className="array-item-add text-right">
                  <AddButton
                    className="usa-button usa-button--outline"
                    onClick={onAddClick}
                    disabled={disabled || readonly}
                    uiSchema={uiSchema}
                    registry={registry}
                  />
                </Grid>
              </Grid>
            </GridContainer>
          )}
        </div>
      </Fieldset>
    </div>
  );
}
