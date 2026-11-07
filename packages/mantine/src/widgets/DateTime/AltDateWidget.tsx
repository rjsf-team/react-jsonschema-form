import { useMemo } from 'react';
import { Flex, Group, Button, Input } from '@mantine/core';
import type {
  DateElementProp,
  DateElementProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { DateElement, getControlDescribedBy, TranslatableString, useAltDateWidgetProps } from '@rjsf/utils';

import {
  getOwnLabel,
  useFieldWrapperProps,
  useShownSuccessId,
  useThemeWrapperProps,
  wrapperPropsOption,
} from '../../utils.tsx';

interface AltDatePartsProps<T, S extends StrictRJSFSchema, F extends FormContextType> extends Omit<
  DateElementProps<T, S, F>,
  'value' | 'type' | 'range' | 'attributes'
> {
  elements: DateElementProp[];
  invalid: boolean;
  fieldSuccessId: string;
}

/** Rendered inside the field's `Input.Wrapper`, whose context `useShownSuccessId()` reads */
function AltDateParts<T, S extends StrictRJSFSchema, F extends FormContextType>({
  elements,
  invalid,
  autofocus,
  elementOptions,
  fieldSuccessId,
  ...partProps
}: AltDatePartsProps<T, S, F>) {
  const { rootId, presentation } = partProps;
  const shownSuccessId = useShownSuccessId(fieldSuccessId);
  const attributes = useMemo(
    () => ({
      'aria-describedby': getControlDescribedBy<T, S, F>(
        { id: rootId, presentation },
        shownSuccessId ? [shownSuccessId] : [],
      ),
      'aria-invalid': invalid || undefined,
    }),
    [rootId, presentation, shownSuccessId, invalid],
  );
  // `success` styles each part, while its `wrapperProps.success` of null keeps the part's wrapper from repeating the
  // field's message
  const partOptions = useMemo(
    () => ({ ...elementOptions, success: !!shownSuccessId }),
    [elementOptions, shownSuccessId],
  );
  return elements.map((part, i) => (
    <DateElement<T, S, F>
      key={part.type}
      {...partProps}
      {...part}
      autofocus={autofocus && i === 0}
      attributes={attributes}
      elementOptions={partOptions}
    />
  ));
}

/** The `AltDateWidget` is an alternative widget for rendering date properties.
 * @param props - The `WidgetProps` for this component
 */
export default function AltDateWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { id, disabled, readonly, autofocus, required, label, options, registry, onBlur, onFocus, presentation } =
    props;
  const { translateString } = registry;
  const { elements, handleChange, handleClear, handleSetNow, buttonsDisabled } = useAltDateWidgetProps(props);
  const { wrapperProps, size, invalid, successId, slotlessErrors } = useFieldWrapperProps(props, 'Select', true);
  const { inputContainer, wrapperProps: fieldWrapperProps } = options;
  // The field's own wrapper applies its `wrapperProps` but for `inputContainer`, which each part renders around itself.
  // The theme's `Select` `wrapperProps` are merged in here, since the parts' own would replace them
  const themeWrapperProps = useThemeWrapperProps('Select');
  const partOptions = useMemo(() => {
    const ownWrapperProps = wrapperPropsOption(fieldWrapperProps);
    return {
      searchable: false,
      allowDeselect: false,
      size,
      inputContainer,
      wrapperProps: {
        ...themeWrapperProps,
        success: null,
        ...(ownWrapperProps &&
          'inputContainer' in ownWrapperProps && { inputContainer: ownWrapperProps.inputContainer }),
      },
    };
  }, [size, inputContainer, themeWrapperProps, fieldWrapperProps]);
  return (
    <>
      <Input.Wrapper {...wrapperProps}>
        <Flex gap='xs' align='center' wrap='nowrap'>
          <AltDateParts<T, S, F>
            rootId={id}
            elements={elements}
            select={handleChange}
            presentation={presentation}
            invalid={invalid}
            elementOptions={partOptions}
            disabled={disabled}
            readonly={readonly}
            autofocus={autofocus}
            elementRequired={required}
            // The text `ui:label: false` hides names the parts, as it names the field's other controls; where the
            // template draws the label, the parts still name themselves after it
            label={getOwnLabel<T, S, F>(props) ?? label}
            registry={registry}
            fieldSuccessId={successId}
            onBlur={onBlur}
            onFocus={onFocus}
          />
          <Group wrap='nowrap' gap={3}>
            {!options.hideNowButton && (
              <Button variant='subtle' size='xs' disabled={buttonsDisabled} onClick={handleSetNow}>
                {translateString(TranslatableString.NowLabel)}
              </Button>
            )}
            {!options.hideClearButton && (
              <Button variant='subtle' size='xs' disabled={buttonsDisabled} onClick={handleClear}>
                {translateString(TranslatableString.ClearLabel)}
              </Button>
            )}
          </Group>
        </Flex>
      </Input.Wrapper>
      {slotlessErrors}
    </>
  );
}
