import type { CSSProperties } from 'react';
import type { ArrayFieldItemTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { getTemplates, getUiOptions } from '@rjsf/utils';
import { Col, Row } from 'react-bootstrap';

export default function ArrayFieldItemTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: ArrayFieldItemTemplateProps<T, S, F>) {
  const { children, buttonsProps, displayLabel, hasDescription, hasDisclosure, hasToolbar, uiSchema, registry } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const { ArrayFieldItemButtonsTemplate } = getTemplates<T, S, F>(registry, uiOptions);
  const btnStyle: CSSProperties = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: 'bold',
  };
  const labelPadding = hasDescription ? 'pb-1' : 'pt-4 mt-2';
  const toolbarPadding = displayLabel ? labelPadding : 'py-4';
  const rowClass = hasDisclosure ? 'mb-2 d-flex align-items-start' : 'mb-2  d-flex align-items-center';
  return (
    <div>
      <Row className={rowClass}>
        <Col xs='8' md='9' lg='10'>
          {children}
        </Col>
        <Col xs='4' md='3' lg='2' className={hasDisclosure ? undefined : toolbarPadding}>
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
