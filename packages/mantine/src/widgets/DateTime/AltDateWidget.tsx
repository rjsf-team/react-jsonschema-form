import { useMemo } from 'react';
import { Flex, Box, Group, Button, Select, Input } from '@mantine/core';
import type {
  DateElementProp,
  DateObject,
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { dateRangeOptions, isObject, titleId, TranslatableString, useAltDateWidgetProps } from '@rjsf/utils';

import { useAriaDescribedByProps, useFieldWrapperProps, useShownSuccessId } from '../../utils.tsx';

interface AltDatePartProps {
  id: string;
  part: DateElementProp;
  inputContainer: unknown;
  wrapperOverrides: GenericObjectType;
  disabled?: boolean;
  autofocus?: boolean;
  invalid: boolean;
  labelled: boolean;
  fieldSuccessId: string;
  onChange: (value: string | null) => void;
  onBlur: (id: string, value: unknown) => void;
  onFocus: (id: string, value: unknown) => void;
}

/** One part of the date, such as the year, as a `Select` with its own id, rendered inside the field's `Input.Wrapper`,
 * whose success message it is described by. The part is named by the field's title followed by its own `aria-label`,
 * which a self-reference in `aria-labelledby` resolves to, and which Mantine also gives the part's listbox.
 */
function AltDatePart({
  id,
  part,
  inputContainer,
  wrapperOverrides,
  disabled,
  autofocus,
  invalid,
  labelled,
  fieldSuccessId,
  onChange,
  onBlur,
  onFocus,
}: AltDatePartProps) {
  const partId = `${id}_${part.type}`;
  const shownSuccessId = useShownSuccessId(fieldSuccessId);
  const ariaDescribedByProps = useAriaDescribedByProps(
    'Select',
    id,
    { inputContainer },
    { alsoDescribedBy: shownSuccessId, wrapperOverrides },
  );
  return (
    <Box>
      <Select
        id={partId}
        name={partId}
        placeholder={part.type}
        aria-label={part.type}
        aria-labelledby={labelled ? `${titleId(id)} ${partId}` : undefined}
        disabled={disabled}
        autoFocus={autofocus}
        // Booleans mark and style the part invalid or successful, without Mantine rendering the field's messages again
        error={invalid}
        success={!!shownSuccessId}
        data={dateRangeOptions(part.range[0], part.range[1]).map((item) => item.value.toString())}
        value={part.value === undefined || part.value < 0 ? null : part.value.toString()}
        onChange={onChange}
        onBlur={() => onBlur(partId, part.value)}
        onFocus={() => onFocus(partId, part.value)}
        searchable={false}
        allowDeselect={false}
        comboboxProps={{ withinPortal: false }}
        {...ariaDescribedByProps}
      />
    </Box>
  );
}

/** The `AltDateWidget` is an alternative widget for rendering date properties.
 * @param props - The `WidgetProps` for this component
 */
export default function AltDateWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { id, disabled, readonly, autofocus, label, options, registry, onBlur, onFocus } = props;
  const { translateString } = registry;
  const { elements, handleChange, handleClear, handleSetNow } = useAltDateWidgetProps(props);
  const { wrapperProps, hiddenTitle, invalid, successId } = useFieldWrapperProps(props, true);
  const { inputContainer, wrapperProps: fieldWrapperProps } = options;
  // Each part renders the field's `inputContainer` in its own wrapper, rather than the field's wrapper around them all,
  // resolved as for any input. The field's own wrapper applies the rest of its `wrapperProps`, so only their
  // `inputContainer` reaches the parts, over the theme's `Select` `wrapperProps` without replacing them. The field's
  // wrapper also renders the one success message, which each part is described by.
  const wrapperOverrides = useMemo(
    () => ({
      success: null,
      ...(isObject(fieldWrapperProps) &&
        'inputContainer' in fieldWrapperProps && { inputContainer: fieldWrapperProps.inputContainer }),
    }),
    [fieldWrapperProps],
  );
  return (
    <>
      {hiddenTitle}
      <Input.Wrapper {...wrapperProps}>
        <Flex gap='xs' align='center' wrap='nowrap'>
          {elements.map((part, i) => (
            <AltDatePart
              // oxlint-disable-next-line react/no-array-index-key
              key={i}
              id={id}
              part={part}
              inputContainer={inputContainer}
              wrapperOverrides={wrapperOverrides}
              disabled={disabled || readonly}
              autofocus={autofocus && i === 0}
              invalid={invalid}
              labelled={!!label}
              fieldSuccessId={successId}
              onChange={(v) => handleChange(part.type as keyof DateObject, v || undefined)}
              onBlur={onBlur}
              onFocus={onFocus}
            />
          ))}
          <Group wrap='nowrap' gap={3}>
            {!options.hideNowButton && (
              <Button variant='subtle' size='xs' disabled={disabled || readonly} onClick={handleSetNow}>
                {translateString(TranslatableString.NowLabel)}
              </Button>
            )}
            {!options.hideClearButton && (
              <Button variant='subtle' size='xs' disabled={disabled || readonly} onClick={handleClear}>
                {translateString(TranslatableString.ClearLabel)}
              </Button>
            )}
          </Group>
        </Flex>
      </Input.Wrapper>
    </>
  );
}
