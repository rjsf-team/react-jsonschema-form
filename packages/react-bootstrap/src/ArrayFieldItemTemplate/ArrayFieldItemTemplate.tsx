import { CSSProperties } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import {
  ArrayFieldItemTemplateProps,
  FormContextType,
  getTemplate,
  getUiOptions,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';

export default function ArrayFieldItemTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldItemTemplateProps<T, S, F>) {
  const { children, buttonsProps, displayLabel, hasDescription, hasToolbar, uiSchema, registry } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldItemButtonsTemplate = getTemplate<'ArrayFieldItemButtonsTemplate', T, S, F>(
    'ArrayFieldItemButtonsTemplate',
    registry,
    uiOptions,
  );
  const btnStyle: CSSProperties = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: 'bold',
  };
  const padding = hasDescription ? 'pb-1' : 'pt-4 mt-2';
  return (
    <div>
      <Row className='mb-2  d-flex align-items-center'>
        <Col xs='8' md='9' lg='10'>
          {children}
        </Col>
        <Col xs='4' md='3' lg='2' className={displayLabel ? padding : 'py-4'}>
          {hasToolbar && (
            <div className='d-flex flex-row'>
              <ArrayFieldItemButtonsTemplate {...buttonsProps} style={btnStyle} />
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
}
