import type { ErrorSchema, WidgetProps } from '@rjsf/utils';

import TextWidget from '../src/components/widgets/TextWidget.tsx';

export function TextWidgetTest(props: WidgetProps) {
  const onChangeTest = (newFormData: any, errorSchema?: ErrorSchema, id?: string) => {
    const value = newFormData;
    let raiseError = errorSchema;
    if (value !== 'test') {
      raiseError = {
        __errors: ['Value must be "test"'],
      } as ErrorSchema;
    }
    props.onChange(newFormData, raiseError, id);
  };
  return <TextWidget {...props} onChange={onChangeTest} />;
}
