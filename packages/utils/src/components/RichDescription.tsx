import getUiOptions from '../getUiOptions';
import { FormContextType, Registry, RJSFSchema, StrictRJSFSchema, UiSchema } from '../types';
import Markdown from 'markdown-to-jsx';

interface RichDescriptionProps<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any> {
  description: string;
  uiSchema?: UiSchema<T, S, F>;
  registry: Registry<T, S, F>;
}

export default function RichDescription<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({ description, registry, uiSchema = {} }: RichDescriptionProps<T, S, F>) {
  const { globalUiOptions } = registry;
  const uiOptions = getUiOptions<T, S, F>(uiSchema, globalUiOptions);

  return (
    <>
      {uiOptions.enableMarkdownInDescription ? (
        <Markdown options={{ disableParsingRawHTML: true }}>{description}</Markdown>
      ) : (
        description
      )}
    </>
  );
}
