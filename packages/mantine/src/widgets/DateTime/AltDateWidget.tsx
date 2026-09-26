import { Flex, Box, Group, Button, Select, Input } from '@mantine/core';
import type {
  DateElementProp,
  DateObject,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { dateRangeOptions, getVisibleErrors, titleId, TranslatableString, useAltDateWidgetProps } from '@rjsf/utils';

import { FieldTitle, getDescriptionProps, useAriaDescribedByProps } from '../../utils.tsx';

interface AltDatePartProps {
  id: string;
  part: DateElementProp;
  disabled?: boolean;
  labelled: boolean;
  onChange: (value: string | null) => void;
}

/** One part of the date, such as the year, as a `Select` with its own id and success message. The part is named by the
 * field's title followed by its own `aria-label`, which a self-reference in `aria-labelledby` resolves to, and which
 * Mantine also gives the part's listbox.
 */
function AltDatePart({ id, part, disabled, labelled, onChange }: AltDatePartProps) {
  const partId = `${id}_${part.type}`;
  const ariaDescribedByProps = useAriaDescribedByProps('Select', id, {}, false, `${partId}-success`);
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
  const { id, required, disabled, readonly, label, hideLabel, options, registry } = props;
  const { translateString } = registry;
  const { elements, handleChange, handleClear, handleSetNow } = useAltDateWidgetProps(props);
  const { descriptionProps, description } = getDescriptionProps(props);
  return (
    <>
      <FieldTitle id={id} label={label} hideLabel={hideLabel} required={required} options={options} />
      {description && <Input.Description {...descriptionProps}>{description}</Input.Description>}
      <Flex gap='xs' align='center' wrap='nowrap'>
        {elements.map((part, i) => (
          <AltDatePart
            // oxlint-disable-next-line react/no-array-index-key
            key={i}
            id={id}
            part={part}
            disabled={disabled || readonly}
            labelled={!!label}
            onChange={(v) => handleChange(part.type as keyof DateObject, v || undefined)}
          />
        ))}
        <Group wrap='nowrap' gap={3}>
          {(options.hideNowButton !== 'undefined' ? !options.hideNowButton : true) && (
            <Button variant='subtle' size='xs' onClick={handleSetNow}>
              {translateString(TranslatableString.NowLabel)}
            </Button>
          )}
          {(options.hideClearButton !== 'undefined' ? !options.hideClearButton : true) && (
            <Button variant='subtle' size='xs' onClick={handleClear}>
              {translateString(TranslatableString.ClearLabel)}
            </Button>
          )}
        </Group>
      </Flex>
      {getVisibleErrors(props).map((error: string, index: number) => (
        // oxlint-disable-next-line react/no-array-index-key
        <Input.Error key={`alt-date-widget-input-errors-${index}`}>{error}</Input.Error>
      ))}
    </>
  );
}
