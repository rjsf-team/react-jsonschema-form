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

import { useAriaDescribedByProps, useFieldWrapperProps } from '../../utils.tsx';

interface AltDatePartProps {
  id: string;
  part: DateElementProp;
  inputContainer: unknown;
  wrapperOverrides?: GenericObjectType;
  disabled?: boolean;
  labelled: boolean;
  onChange: (value: string | null) => void;
}

/** One part of the date, such as the year, as a `Select` with its own id and success message. The part is named by the
 * field's title followed by its own `aria-label`, which a self-reference in `aria-labelledby` resolves to, and which
 * Mantine also gives the part's listbox.
 */
function AltDatePart({ id, part, inputContainer, wrapperOverrides, disabled, labelled, onChange }: AltDatePartProps) {
  const partId = `${id}_${part.type}`;
  const ariaDescribedByProps = useAriaDescribedByProps(
    'Select',
    id,
    { inputContainer },
    { successId: `${partId}-success`, wrapperOverrides },
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
        data={dateRangeOptions(part.range[0], part.range[1]).map((item) => item.value.toString())}
        value={!part.value || part.value < 0 ? null : part.value.toString()}
        onChange={onChange}
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
  const { id, disabled, readonly, label, options, registry } = props;
  const { translateString } = registry;
  const { elements, handleChange, handleClear, handleSetNow } = useAltDateWidgetProps(props);
  const { wrapperProps, hiddenTitle } = useFieldWrapperProps(props, true);
  const { inputContainer, wrapperProps: fieldWrapperProps } = options;
  // Each part renders the field's `inputContainer` in its own wrapper, rather than the field's wrapper around them all,
  // resolved as for any input. The field's own wrapper applies the rest of its `wrapperProps`, so only their
  // `inputContainer` reaches the parts, over the theme's `Select` `wrapperProps` without replacing them.
  const wrapperOverrides = useMemo(
    () =>
      isObject(fieldWrapperProps) && 'inputContainer' in fieldWrapperProps
        ? { inputContainer: fieldWrapperProps.inputContainer }
        : undefined,
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
              labelled={!!label}
              onChange={(v) => handleChange(part.type as keyof DateObject, v || undefined)}
            />
          ))}
          <Group wrap='nowrap' gap={3}>
            {!options.hideNowButton && (
              <Button variant='subtle' size='xs' onClick={handleSetNow}>
                {translateString(TranslatableString.NowLabel)}
              </Button>
            )}
            {!options.hideClearButton && (
              <Button variant='subtle' size='xs' onClick={handleClear}>
                {translateString(TranslatableString.ClearLabel)}
              </Button>
            )}
          </Group>
        </Flex>
      </Input.Wrapper>
    </>
  );
}
