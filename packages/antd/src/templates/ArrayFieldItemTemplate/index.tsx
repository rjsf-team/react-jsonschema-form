import { Button, Col, Row } from 'antd';
import {
  ArrayFieldTemplateItemType,
  FormContextType,
  getUiOptions,
  getTemplate,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';

const BTN_GRP_STYLE = {
  width: '100%',
};

const BTN_STYLE = {
  width: 'calc(100% / 4)',
};

/** The `ArrayFieldItemTemplate` component is the template used to render an items of an array.
 *
 * @param props - The `ArrayFieldItemTemplateType` props for the component
 */
export default function ArrayFieldItemTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: ArrayFieldTemplateItemType<T, S, F>) {
  const { children, buttonsProps, hasToolbar, index, registry, uiSchema } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldItemButtonsTemplate = getTemplate<'ArrayFieldItemButtonsTemplate', T, S, F>(
    'ArrayFieldItemButtonsTemplate',
    registry,
    uiOptions
  );
  const { rowGutter = 24, toolbarAlign = 'top' } = registry.formContext;

  return (
    <Row align={toolbarAlign} key={`array-item-${index}`} gutter={rowGutter}>
      <Col flex='1'>{children}</Col>

      {hasToolbar && (
        <Col flex='192px'>
          <Button.Group style={BTN_GRP_STYLE}>
            <ArrayFieldItemButtonsTemplate {...buttonsProps} style={BTN_STYLE} />
          </Button.Group>
        </Col>
      )}
    </Row>
  );
}
