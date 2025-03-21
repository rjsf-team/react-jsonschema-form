import { GridTemplateProps } from '@rjsf/utils';
import { cn } from '../lib/utils';

/** Renders a `GridTemplate` for mui, which is expecting the column sizing information coming in via the
 * extra props provided by the caller, which are spread directly on the `Grid2`.
 *
 * @param props - The GridTemplateProps, including the extra props containing the mui grid positioning details
 */
export default function GridTemplate(props: GridTemplateProps) {
  const { children, column, ...rest } = props;
  return (
    <div
      className={cn('grid gap-2', !column && 'grid-cols-12 col-span-12', column && 'grid-flow-col grid-rows-12')}
      {...rest}
    >
      {children}
    </div>
  );
}
