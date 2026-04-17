import { Alert, Space, theme, version } from 'antd';

const antdMajor = parseInt(version.split('.')[0], 10);
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { ErrorListProps, FormContextType, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';

/** The `ErrorList` component is the template that renders the all the errors associated with the fields in the `Form`
 *
 * @param props - The `ErrorListProps` for this component
 */
export default function ErrorList<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  errors,
  registry,
}: ErrorListProps<T, S, F>) {
  const { translateString } = registry;
  // Antd's List component has been deprecated and waiting to be replaced: https://ant.design/components/list#faq-listy-replacement
  // In the meantime we can mimic the Look & Feel of the List component by adding some inline CSS
  const { token } = theme.useToken();
  const itemBorder = `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`;
  const renderErrors = () => (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {errors.map((error, index) => (
        <li
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: `${token.paddingXS}px ${token.padding}px`,
            color: token.colorText,
            borderBlockEnd: index < errors.length - 1 ? itemBorder : 'none',
          }}
        >
          <Space>
            <ExclamationCircleOutlined />
            {error.stack}
          </Space>
        </li>
      ))}
    </ul>
  );

  // Deal with the two versions of antd that we support (v5, v6). In RJSF v7, we will drop support for antd 5, so clean this up
  const headerProp =
    antdMajor >= 6
      ? { title: translateString(TranslatableString.ErrorsLabel) }
      : { message: translateString(TranslatableString.ErrorsLabel) };

  return <Alert className='panel panel-danger errors' description={renderErrors()} type='error' {...headerProp} />;
}
