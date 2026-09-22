'use client';

import { useCallback, useMemo } from 'react';

import getWidget from './getWidget.tsx';
import noop from './noop.ts';
import optionsList from './optionsList.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';

/** The props for the `AdditionalPropertyKeySelect` component */
export type AdditionalPropertyKeySelectProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> = Pick<
  WidgetProps<T, S, F>,
  'autofocus' | 'disabled' | 'hideLabel' | 'id' | 'label' | 'placeholder' | 'readonly' | 'registry' | 'required'
> & {
  /** The current key of the `additionalProperties` property, which is the selected option */
  value: string;
  /** The key names the property is allowed to take, from the parent schema's `propertyNames.enum`. A current `value`
   * that is not among them is still shown, as a disabled option, so the dropdown reads back the key it is on
   */
  propertyNamesEnum: string[];
  /** Callback used to rename the property to the newly selected key name */
  onKeyRename: (newKey: string) => void;
};

/** Renders the key of an `additionalProperties` property as the theme's `SelectWidget`, limited to the key names the
 * parent schema's `propertyNames.enum` allows. Each theme's `WrapIfAdditionalTemplate` renders this in place of its
 * own free-text key input when `propertyNamesEnum` is provided, so the dropdown itself only has to be built once.
 *
 * @param props - The `AdditionalPropertyKeySelectProps` for this component
 */
export default function AdditionalPropertyKeySelect<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: AdditionalPropertyKeySelectProps<T, S, F>) {
  const { id, propertyNamesEnum, onKeyRename, registry, ...selectProps } = props;
  const { value } = selectProps;
  /** A key the schema no longer allows — one `propertyNames` has since stopped enumerating, or the `newKey` the add
   * button falls back to once every allowed name is taken — has no option of its own, which would leave the dropdown
   * blank and the key unreadable. It gets one, disabled, so the key stays visible without becoming a name to pick.
   */
  const allowsCurrentKey = propertyNamesEnum.includes(value);
  const schema = useMemo(
    () =>
      ({ type: 'string', enum: allowsCurrentKey ? propertyNamesEnum : [value, ...propertyNamesEnum] }) as unknown as S,
    [allowsCurrentKey, propertyNamesEnum, value],
  );
  const enumOptions = useMemo(() => optionsList<T, S, F>(schema), [schema]);
  /** A select commits its value as soon as an option is picked, so the rename happens on change rather than on blur
   * the way the free-text key input's does; waiting for a blur would leave the shown selection and the key apart.
   * A widget renders a placeholder option whenever nothing is selected, which happens here when the current key is
   * not one of the allowed names; picking it reports an empty value, which is not a name `propertyNames` accepts, so
   * only a value the enum actually holds renames the key.
   */
  const handleChange = useCallback(
    (newKey: unknown) => {
      if (typeof newKey === 'string' && propertyNamesEnum.includes(newKey)) {
        onKeyRename(newKey);
      }
    },
    [onKeyRename, propertyNamesEnum],
  );
  const SelectWidget = getWidget<T, S, F>(schema, 'SelectWidget', registry.widgets);

  return (
    <SelectWidget
      {...selectProps}
      id={id}
      name={id}
      schema={schema}
      options={{ enumOptions, enumDisabled: allowsCurrentKey ? undefined : [value] }}
      onChange={handleChange}
      onBlur={noop}
      onFocus={noop}
      registry={registry}
    />
  );
}
