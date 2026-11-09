import type { ConfigErrorTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';
import { Markdown } from 'markdown-to-jsx/react';

/** The `ConfigErrorTemplate` component is used to render a field whose configuration is invalid, such as an object
 * whose `ui:order` does not list all of its properties, in place of the field itself.
 *
 * @param props - The `ConfigErrorTemplateProps` for this template
 */
export default function ConfigErrorTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ConfigErrorTemplateProps<T, S, F>) {
  const { schema, name, error, registry } = props;
  const { translateString } = registry;
  return (
    <div>
      <p className='rjsf-config-error' style={{ color: 'red' }}>
        <Markdown options={{ disableParsingRawHTML: true }}>
          {translateString(TranslatableString.InvalidObjectField, [name || 'root', error.message])}
        </Markdown>
      </p>
      <pre>{JSON.stringify(schema)}</pre>
    </div>
  );
}
