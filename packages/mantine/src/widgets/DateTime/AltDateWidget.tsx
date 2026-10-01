import { useCallback, useMemo } from 'react';
import { Flex, Box, Group, Button, Select, Input } from '@mantine/core';
import type {
  DateElementProp,
  DateObject,
  FormContextType,
  GenericObjectType,
  Registry,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import {
  dateElementLabel,
  dateRangeOptions,
  isObject,
  titleId,
  TranslatableString,
  useAltDateWidgetProps,
} from '@rjsf/utils';

import { useAriaDescribedByProps, useFieldWrapperProps, useShownSuccessId } from '../../utils.tsx';

interface AltDatePartProps {
  id: string;
  part: DateElementProp;
  ariaDescribedByProps: GenericObjectType;
  disabled?: boolean;
  autofocus?: boolean;
  required?: boolean;
  invalid: boolean;
  success: boolean;
  labelled: boolean;
  translateString: Registry['translateString'];
  onChange: (property: keyof DateObject, value?: string) => void;
  onBlur: (id: string, value: unknown) => void;
  onFocus: (id: string, value: unknown) => void;
}

/** One part of the date, such as the year, as a `Select` with its own id. The part is named by the field's title
 * followed by its own `aria-label`, which a self-reference in `aria-labelledby` resolves to, and which Mantine also
 * gives the part's listbox.
 */
function AltDatePart({
  id,
  part,
  ariaDescribedByProps,
  disabled,
  autofocus,
  required,
  invalid,
  success,
  labelled,
  translateString,
  onChange,
  onBlur,
  onFocus,
}: AltDatePartProps) {
  const partId = `${id}_${part.type}`;
  const partLabel = dateElementLabel(part.type, translateString);
  // The widget's state holds -1 for an unset part, and a string once one is picked
  const partValue = part.value === undefined || Number(part.value) < 0 ? undefined : Number(part.value);
  const [start, end] = part.range;
  const data = useMemo(() => dateRangeOptions(start, end).map((item) => item.value.toString()), [start, end]);
  const handleChange = useCallback(
    (value: string | null) => onChange(part.type as keyof DateObject, value || undefined),
    [onChange, part.type],
  );
  const handleBlur = useCallback(() => onBlur(partId, partValue), [onBlur, partId, partValue]);
  const handleFocus = useCallback(() => onFocus(partId, partValue), [onFocus, partId, partValue]);
  return (
    <Box>
      <Select
        id={partId}
        name={partId}
        placeholder={partLabel}
        aria-label={partLabel}
        aria-labelledby={labelled ? `${titleId(id)} ${partId}` : undefined}
        disabled={disabled}
        autoFocus={autofocus}
        // The parts are read-only while `searchable` is false, so this adds no constraint validation
        required={required}
        // Booleans mark and style the part invalid or successful, without Mantine rendering the field's messages again
        error={invalid}
        success={success}
        data={data}
        value={partValue === undefined ? null : partValue.toString()}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        searchable={false}
        allowDeselect={false}
        comboboxProps={{ withinPortal: false }}
        {...ariaDescribedByProps}
      />
    </Box>
  );
}

interface AltDatePartsProps extends Omit<AltDatePartProps, 'part' | 'ariaDescribedByProps' | 'success'> {
  elements: DateElementProp[];
  inputContainer: unknown;
  wrapperOverrides: GenericObjectType;
  fieldSuccessId: string;
}

/** The parts of the date, rendered inside the field's `Input.Wrapper`, whose success message they are described by
 * while it is shown. Their aria props are the same for every part, so they are resolved once here.
 */
function AltDateParts({
  elements,
  autofocus,
  inputContainer,
  wrapperOverrides,
  fieldSuccessId,
  ...partProps
}: AltDatePartsProps) {
  const shownSuccessId = useShownSuccessId(fieldSuccessId);
  const ariaDescribedByProps = useAriaDescribedByProps(
    'Select',
    partProps.id,
    { inputContainer },
    { alsoDescribedBy: shownSuccessId, wrapperOverrides },
  );
  return elements.map((part, i) => (
    <AltDatePart
      // oxlint-disable-next-line react/no-array-index-key
      key={i}
      part={part}
      ariaDescribedByProps={ariaDescribedByProps}
      autofocus={autofocus && i === 0}
      success={!!shownSuccessId}
      {...partProps}
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
  const { id, disabled, readonly, autofocus, required, label, options, registry, onBlur, onFocus } = props;
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
          <AltDateParts
            id={id}
            elements={elements}
            inputContainer={inputContainer}
            wrapperOverrides={wrapperOverrides}
            disabled={disabled || readonly}
            autofocus={autofocus}
            required={required}
            invalid={invalid}
            labelled={!!label}
            translateString={translateString}
            fieldSuccessId={successId}
            onChange={handleChange}
            onBlur={onBlur}
            onFocus={onFocus}
          />
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
