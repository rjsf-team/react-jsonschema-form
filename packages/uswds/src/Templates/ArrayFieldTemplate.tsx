import {
  ArrayFieldTemplateItemType,
  ArrayFieldTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import ArrayFieldItemTemplate from './ArrayFieldItemTemplate';

export default function ArrayFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldTemplateProps<T, S, F>) {
  const { canAdd, disabled, items, onAddClick, readonly, required, schema, title } = props;

  return (
    <fieldset className="usa-fieldset">
      {(title || schema.title) && (
        <legend className="usa-legend">
          {title || schema.title}
          {required && <span className="usa-label--required">*</span>}
        </legend>
      )}
      {items.map((itemProps: ArrayFieldTemplateItemType<T, S, F>) => (
        <div key={itemProps.key} className="usa-form-group">
          <ArrayFieldItemTemplate {...itemProps} />
        </div>
      ))}
      {canAdd && !readonly && !disabled && (
        <button type="button" className="usa-button usa-button--outline" onClick={onAddClick}>
          Add Item
        </button>
      )}
    </fieldset>
  );
}
