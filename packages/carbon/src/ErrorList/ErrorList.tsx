import { ErrorListProps, FormContextType, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';
import { InlineNotification, UnorderedList, ListItem } from '@carbon/react';

/** Implement `ErrorListTemplate`
 */
export default function ErrorList<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  errors,
  registry,
}: ErrorListProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <>
      <style>
        {`
          .error-list {
            max-inline-size: initial;
          }
          .error-list .cds--inline-notification__title {
            margin-block-end: 0.5rem;
          }
        `}
      </style>
      <InlineNotification
        className='error-list'
        kind='error'
        role='alert'
        lowContrast
        hideCloseButton
        onCloseButtonClick={() => {}}
      >
        <div>
          <div className='cds--inline-notification__title'>{translateString(TranslatableString.ErrorsLabel)}</div>
          <UnorderedList>
            {errors.map((err, i) => (
              <ListItem key={i} className='cds--inline-notification__subtitle'>
                {err.stack}
              </ListItem>
            ))}
          </UnorderedList>
        </div>
      </InlineNotification>
    </>
  );
}
