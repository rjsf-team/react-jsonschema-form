import { CSSProperties } from 'react';
import {
  ArrayFieldItemTemplateType,
  FormContextType,
  getTemplate,
  getUiOptions,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';

/** The `ArrayFieldItemTemplate` component is the template used to render an items of an array.
 *
 * @param props - The `ArrayFieldItemTemplateType` props for the component
 */
export default function ArrayFieldItemTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldItemTemplateType<T, S, F>) {
  const { children, className, buttonsProps, hasToolbar, registry, uiSchema } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const ArrayFieldItemButtonsTemplate = getTemplate<'ArrayFieldItemButtonsTemplate', T, S, F>(
    'ArrayFieldItemButtonsTemplate',
    registry,
    uiOptions,
  );
  const btnStyle: CSSProperties = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: 'bold',
  };
  return (
    <div className={className}>
      <div className={hasToolbar ? 'col-xs-9' : 'col-xs-12'}>{children}</div>
      {hasToolbar && (
        <div className='col-xs-3 array-item-toolbox'>
          <div
            className='btn-group'
            style={{
              display: 'flex',
              justifyContent: 'space-around',
            }}
          >
            <ArrayFieldItemButtonsTemplate {...buttonsProps} style={btnStyle} />
          </div>
        </div>
      )}
    </div>
  );
}
