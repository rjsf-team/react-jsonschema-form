import type { CSSProperties } from 'react';
import type { ColProps, FormProps, RowProps } from 'antd';

/** The `rowGutter` a row takes when the formContext sets none */
export const DEFAULT_ROW_GUTTER = 24;

/** The `labelCol` a field's label takes when the formContext sets none, which puts the label above its control */
export const DEFAULT_LABEL_COL = { span: 24 };

/** The `formContext` options the antd theme reads. A form's `formContext` can hold anything, so the templates read it
 * through this type, which names the options they look for
 */
export interface AntdFormContext {
  /** Whether antd draws its colon after a label, replacing one the label ends in, unless this is `false`. antd hides
   * its colon on a label above its control, where the default `labelCol` puts it
   */
  colon?: boolean;
  /** The columns an object's property spans, for every property or by its widget name, field name or schema type */
  colSpan?: number | Record<string, number>;
  /** Where a field's description is shown */
  descriptionLocation?: 'below' | 'tooltip';
  /** The alignment of a field's label and of the headings of objects and arrays. Unset, antd aligns a field's label and
   * a heading follows it, starting its column under the default `labelCol` or one 24 columns wide and ending it under
   * any other
   */
  labelAlign?: FormProps['labelAlign'];
  /** The `Col` props of a field's label */
  labelCol?: ColProps;
  /** Whether a read-only field is drawn disabled, which it is unless this is `false` */
  readonlyAsDisabled?: boolean;
  /** The gutter between the columns of a row, `DEFAULT_ROW_GUTTER` when undefined */
  rowGutter?: RowProps['gutter'];
  /** The vertical alignment of an array item's toolbar, or of an additional property's row */
  toolbarAlign?: RowProps['align'];
  /** The `Col` props of a field's control */
  wrapperCol?: ColProps;
  /** The style of a field's antd `Form.Item`, which holds its label and control */
  wrapperStyle?: CSSProperties;
}
