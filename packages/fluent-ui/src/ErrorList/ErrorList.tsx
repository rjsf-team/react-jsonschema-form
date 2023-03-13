import { MessageBar, MessageBarType } from '@fluentui/react';
import { ErrorListProps, FormContextType, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';

export default function ErrorList<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  errors,
  registry,
}: ErrorListProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <>
      {errors.map((error, i) => {
        return (
          <MessageBar
            key={i}
            messageBarType={MessageBarType.error}
            isMultiline={false}
            dismissButtonAriaLabel={translateString(TranslatableString.CloseLabel)}
          >
            {error.stack}
          </MessageBar>
        );
      })}
    </>
  );
}
