import { FormContextType, RJSFSchema, StrictRJSFSchema, TitleFieldProps } from '@rjsf/utils';
import { Label } from '@fluentui/react';

const styles = {
  root: [
    {
      fontSize: 24,
      marginBottom: 20,
      paddingBottom: 0,
    },
  ],
};

export default function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  title,
}: TitleFieldProps<T, S, F>) {
  return (
    <Label id={id} styles={styles}>
      {title}
    </Label>
  );
}
