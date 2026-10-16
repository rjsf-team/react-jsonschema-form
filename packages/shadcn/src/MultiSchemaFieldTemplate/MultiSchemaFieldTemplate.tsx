import type { FormContextType, MultiSchemaFieldTemplateProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import { cn } from '../lib/utils.ts';

export default function MultiSchemaFieldTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ selector, optionSchemaField }: MultiSchemaFieldTemplateProps<T, S, F>) {
  return (
    <div className={cn('p-4 border rounded-md bg-background shadow-sm')}>
      {/* No row is laid out for a selector the field doesn't render, as while an optional field has no data (#5401) */}
      {selector ? <div className={cn('mb-4')}>{selector}</div> : null}
      {optionSchemaField}
    </div>
  );
}
