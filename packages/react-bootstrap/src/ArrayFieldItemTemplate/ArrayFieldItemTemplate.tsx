import { CSSProperties } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { ArrayFieldTemplateItemType, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

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
  const btnStyle: CSSProperties = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: 'bold',
  };
  return (
    <div>
      <Row className='mb-2  d-flex align-items-center'>
        <Col xs='9' lg='9'>
          {children}
        </Col>
        <Col xs='3' lg='3' className='py-4'>
          {hasToolbar && (
            <div className='d-flex flex-row'>
              {(hasMoveUp || hasMoveDown) && (
                <div className='m-0 p-0'>
                  <MoveUpButton
                    className='array-item-move-up'
                    style={btnStyle}
                    disabled={disabled || readonly || !hasMoveUp}
                    onClick={onReorderClick(index, index - 1)}
                    uiSchema={uiSchema}
                    registry={registry}
                  />
                </div>
              )}
              {(hasMoveUp || hasMoveDown) && (
                <div className='m-0 p-0'>
                  <MoveDownButton
                    style={btnStyle}
                    disabled={disabled || readonly || !hasMoveDown}
                    onClick={onReorderClick(index, index + 1)}
                    uiSchema={uiSchema}
                    registry={registry}
                  />
                </div>
              )}
              {hasCopy && (
                <div className='m-0 p-0'>
                  <CopyButton
                    style={btnStyle}
                    disabled={disabled || readonly}
                    onClick={onCopyIndexClick(index)}
                    uiSchema={uiSchema}
                    registry={registry}
                  />
                </div>
              )}
              {hasRemove && (
                <div className='m-0 p-0'>
                  <RemoveButton
                    style={btnStyle}
                    disabled={disabled || readonly}
                    onClick={onDropIndexClick(index)}
                    uiSchema={uiSchema}
                    registry={registry}
                  />
                </div>
              )}
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
}
