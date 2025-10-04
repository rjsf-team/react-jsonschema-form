import classNames from 'classnames';
import { FormContextType, TitleFieldProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { Col, Divider, Row, ConfigProvider } from 'antd';
import { useContext } from 'react';

/** The `TitleField` is the template to use to render the title of a field
 *
 * @param props - The `TitleFieldProps` for this component
 */
export default function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  required,
  registry,
  title,
  optionalDataControl,
}: TitleFieldProps<T, S, F>) {
  const { formContext } = registry;
  const { colon = true } = formContext;

  let labelChildren = title;
  if (colon && typeof title === 'string' && title.trim() !== '') {
    labelChildren = title.replace(/[：:]\s*$/, '');
  }

  const handleLabelClick = () => {
    if (!id) {
      return;
    }

    const control: HTMLLabelElement | null = document.querySelector(`[id="${id}"]`);
    if (control && control.focus) {
      control.focus();
    }
  };

  const { getPrefixCls } = useContext(ConfigProvider.ConfigContext);
  const prefixCls = getPrefixCls('form');
  const labelClassName = classNames({
    [`${prefixCls}-item-required`]: required,
    [`${prefixCls}-item-no-colon`]: !colon,
  });
  let heading = title ? (
    <label
      className={labelClassName}
      htmlFor={id}
      onClick={handleLabelClick}
      title={typeof title === 'string' ? title : ''}
    >
      {labelChildren}
    </label>
  ) : null;
  if (optionalDataControl) {
    heading = (
      <Row>
        <Col flex='auto'>{heading}</Col>
        <Col flex='none'>{optionalDataControl}</Col>
      </Row>
    );
  }

  return (
    <>
      {heading}
      <Divider size='small' style={{ marginBlock: '1px' /* pull the margin right up against the label */ }} />
    </>
  );
}
