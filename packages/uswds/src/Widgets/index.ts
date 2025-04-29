import TextareaWidget from './TextareaWidget';

export default function generateWidgets<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>() {
  const widgets = {
    TextareaWidget,
  };

  // alias lowercase key for ui:widget
  ;(widgets as any).textarea = TextareaWidget;

  return widgets as RegistryWidgetsType<T, S, F>;
}
