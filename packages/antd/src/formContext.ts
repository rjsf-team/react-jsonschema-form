import type { CSSProperties } from 'react';
import type { ColProps, FormProps, RowProps } from 'antd';

/** The `formContext` options the antd theme reads. A form's `formContext` can hold anything, so the templates read it
 * through this type, which names the options they look for
 */
export interface AntdFormContext {
  /** Whether a label ends in a colon, which it does unless this is `false` */
  colon?: boolean;
  /** The columns an object's property spans, for every property or by its widget or field name */
  colSpan?: number | Record<string, number>;
  /** Where a field's description is shown */
  descriptionLocation?: 'below' | 'tooltip';
  /** The alignment of the labels of objects and arrays */
  labelAlign?: FormProps['labelAlign'];
  /** The `Col` props of a field's label */
  labelCol?: ColProps;
  /** Whether a read-only field is drawn disabled, which it is unless this is `false` */
  readonlyAsDisabled?: boolean;
  /** The gutter between the columns of a row */
  rowGutter?: RowProps['gutter'];
  /** The vertical alignment of an array item's toolbar */
  toolbarAlign?: RowProps['align'];
  /** The `Col` props of a field's control */
  wrapperCol?: ColProps;
  /** The style of a field's control */
  wrapperStyle?: CSSProperties;
}
