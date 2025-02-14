import { FormContextType, TitleFieldProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { Title } from '@mantine/core';

export default function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: TitleFieldProps<T, S, F>
) {
  const { id, title } = props;
  return title ? (
    <Title id={id} order={3} fw='normal'>
      {title}
    </Title>
  ) : null;
}
