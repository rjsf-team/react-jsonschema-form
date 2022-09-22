import React from "react";
import { Button, Grid, Segment } from "semantic-ui-react";

import { MaybeWrap } from "../util";

const gridStyle = (vertical) => ({
  display: "grid",
  gridTemplateColumns: `1fr ${vertical ? 65 : 110}px`,
});

// checks if it's the first array item
function isInitialArrayItem(props) {
  // no underscore because im not sure if we want to import a library here
  const { idSchema } = props.children.props;
  return idSchema.target && idSchema.conditions;
}

const ArrayFieldItemTemplate = (props) => {
  const {
    children,
    disabled,
    hasToolbar,
    hasMoveDown,
    hasMoveUp,
    hasRemove,
    horizontalButtons,
    index,
    onDropIndexClick,
    onReorderClick,
    readonly,
    wrapItem,
    uiSchema,
    registry,
  } = props;
  const { MoveDownButton, MoveUpButton, RemoveButton } =
    registry.templates.ButtonTemplates;
  return (
    <div className="array-item">
      <MaybeWrap wrap={wrapItem} component={Segment}>
        <Grid
          style={
            !isInitialArrayItem(props)
              ? { ...gridStyle(!horizontalButtons), alignItems: "center" }
              : gridStyle(!horizontalButtons)
          }
        >
          <Grid.Column width={16} verticalAlign="middle">
            {children}
          </Grid.Column>
          {hasToolbar && (
            <Grid.Column>
              {(hasMoveUp || hasMoveDown || hasRemove) && (
                <Button.Group size="mini" vertical={!horizontalButtons}>
                  {(hasMoveUp || hasMoveDown) && (
                    <MoveUpButton
                      className="array-item-move-up"
                      disabled={disabled || readonly || !hasMoveUp}
                      onClick={onReorderClick(index, index - 1)}
                      uiSchema={uiSchema}
                    />
                  )}
                  {(hasMoveUp || hasMoveDown) && (
                    <MoveDownButton
                      className="array-item-move-down"
                      disabled={disabled || readonly || !hasMoveDown}
                      onClick={onReorderClick(index, index + 1)}
                      uiSchema={uiSchema}
                    />
                  )}
                  {hasRemove && (
                    <RemoveButton
                      className="array-item-remove"
                      disabled={disabled || readonly}
                      onClick={onDropIndexClick(index)}
                      uiSchema={uiSchema}
                    />
                  )}
                </Button.Group>
              )}
            </Grid.Column>
          )}
        </Grid>
      </MaybeWrap>
    </div>
  );
};

export default ArrayFieldItemTemplate;
