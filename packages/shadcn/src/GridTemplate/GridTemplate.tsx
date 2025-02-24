import { GridTemplateProps } from '@rjsf/utils';

/** Renders a `GridTemplate` for react-bootstrap, which is expecting the column sizing information coming in via the
 * extra props provided by the caller, which are spread directly on the `Row`/`Col`.
 *
 * @param props - The GridTemplateProps, including the extra props containing the react-bootstrap grid positioning details
 */
export default function GridTemplate(props: GridTemplateProps) {
  const { children, column, ...rest } = props;
  return column ? (
    <div className={'flex flex-col'} {...rest}>
      {children}
    </div>
  ) : (
    <div className={'flex'} {...rest}>
      {children}
    </div>
  );
}
