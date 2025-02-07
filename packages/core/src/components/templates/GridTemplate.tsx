import { GridTemplateProps } from '@rjsf/utils';

/** Renders a `GridTemplate` for bootstrap 3, which is expecting the column
 * information coming in via the `className` prop.
 *
 * @param props - The GridTemplateProps, including the expected className for
 *        the bootstrap 3 grid behavior
 */
export default function GridTemplate(props: GridTemplateProps) {
  const { children, overrides, column, className, ...rest } = props;
  const classNames = column ? className : `row ${className}`;
  return (
    <div className={classNames} {...rest}>
      {children}
    </div>
  );
}
