import { FormContextType, TitleFieldProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { Header } from 'semantic-ui-react';

import { getSemanticProps } from '../util';

const DEFAULT_OPTIONS = {
  inverted: false,
  dividing: true,
};

/** The `TitleField` is the template to use to render the title of a field
 *
 * @param props - The `TitleFieldProps` for this component
 */
export default function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  title,
  uiSchema,
}: TitleFieldProps<T, S, F>) {
  const semanticProps = getSemanticProps<T, S, F>({
    uiSchema,
    defaultSchemaProps: DEFAULT_OPTIONS,
  });
  if (!title) {
    return null;
  }
  return (
    <Header id={id} {...semanticProps} as='h5'>
      {title}
    </Header>
  );
}
