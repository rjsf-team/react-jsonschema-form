import { ArrayFieldTemplateItemType, FormContextType, RJSFSchema, StrictRJSFSchema, getTemplate, getUiOptions } from '@rjsf/utils';
import { JSONSchema7 } from 'json-schema';
import { Grid, GridContainer, ButtonGroup } from '@trussworks/react-uswds';

export default function ArrayFieldItemTemplate<
  T = RJSFSchema,
  S extends StrictRJSFSchema = RJSFSchema,
  F = FormContextType,
>(props: ArrayFieldTemplateItemType<T, S, F>) {
  const {
    children,
    className,
    disabled,
    hasToolbar,
    index,
    onCopyIndexClick,
    onDropIndexClick,
    onReorderClick,
    readonly,
    registry,
    schema,
    uiSchema,
    hasMoveUp,
    hasMoveDown,
    hasRemove,
  } = props;

  const { MoveDownButton, MoveUpButton, RemoveButton } = getTemplate<'ButtonTemplates', T, S, F>(
    'ButtonTemplates',
    registry,
    getUiOptions(uiSchema)
  );

  const containerClassName = 'array-item border border-base-lighter padding-y-1 padding-x-2 margin-bottom-1';

  return (
    <GridContainer className={containerClassName} containerSize="fluid">
      <Grid row gap={2} className={className}>
        <Grid col={hasToolbar ? 9 : 12}>{children}</Grid>
        {hasToolbar && (
          <Grid col={3} className="array-item-toolbox">
            <ButtonGroup segmented={true} style={{ height: '100%', alignItems: 'center' }}>
              {(hasMoveUp || hasMoveDown) && MoveUpButton && (
                <MoveUpButton
                  disabled={disabled || readonly || !hasMoveUp}
                  onClick={() => onReorderClick(index, index - 1)}
                  registry={registry}
                  uiSchema={uiSchema}
                  className=""
                />
              )}
              {(hasMoveUp || hasMoveDown) && MoveDownButton && (
                <MoveDownButton
                  disabled={disabled || readonly || !hasMoveDown}
                  onClick={() => onReorderClick(index, index + 1)}
                  registry={registry}
                  uiSchema={uiSchema}
                  className=""
                />
              )}
              {hasRemove && RemoveButton && (
                <RemoveButton
                  disabled={disabled || readonly}
                  onClick={() => onDropIndexClick(index)}
                  registry={registry}
                  uiSchema={uiSchema}
                  className=""
                />
              )}
            </ButtonGroup>
          </Grid>
        )}
      </Grid>
    </GridContainer>
  );
}
