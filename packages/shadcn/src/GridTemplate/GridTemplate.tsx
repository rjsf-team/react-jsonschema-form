import { GridTemplateProps } from '@rjsf/utils';
import { cn } from '../lib/utils';

// Implementation using https://tailwindcss.com/docs/grid-auto-columns and https://tailwindcss.com/docs/grid-auto-rows
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
