import { ArrayFieldTemplateItemType, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { Col, Row } from '@appfolio/react-gears';
import { ButtonGroup } from 'react-bootstrap';

export default function ArrayFieldItemTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: ArrayFieldTemplateItemType<T, S, F>) {
  const {
    children,
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
    uiSchema,
  } = props;
  const { CopyButton, MoveDownButton, MoveUpButton, RemoveButton } = registry.templates.ButtonTemplates;
  return (
    <Row className='d-flex flex-row flex-nowrap align-items-end me-2'>
      <Col className='flex-fill'>{children}</Col>
      {hasToolbar && (
        <Col className='px-0 me-1 mb-3'>
          <ButtonGroup>
            {(hasMoveUp || hasMoveDown) && (
              <MoveUpButton
                className='array-item-move-up'
                disabled={disabled || readonly || !hasMoveUp}
                onClick={onReorderClick(index, index - 1)}
                uiSchema={uiSchema}
                registry={registry}
              />
            )}
            {(hasMoveUp || hasMoveDown) && (
              <MoveDownButton
                disabled={disabled || readonly || !hasMoveDown}
                onClick={onReorderClick(index, index + 1)}
                uiSchema={uiSchema}
                registry={registry}
              />
            )}
            {hasCopy && (
              <CopyButton
                disabled={disabled || readonly}
                onClick={onCopyIndexClick(index)}
                uiSchema={uiSchema}
                registry={registry}
              />
            )}
            {hasRemove && (
              <RemoveButton
                disabled={disabled || readonly}
                onClick={onDropIndexClick(index)}
                uiSchema={uiSchema}
                registry={registry}
              />
            )}
          </ButtonGroup>
        </Col>
      )}
    </Row>
  );
}
