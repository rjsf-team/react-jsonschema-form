import {
  ariaDescribedByIds,
  dateRangeOptions,
  titleId,
  DateObject,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  useAltDateWidgetProps,
  WidgetProps,
} from '@rjsf/utils';
import { Flex, Box, Group, Button, Select, Input } from '@mantine/core';

/** The `AltDateWidget` is an alternative widget for rendering date properties.
 * @param props - The `WidgetProps` for this component
 */
export default function AltDateWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const { id, required, disabled, readonly, label, hideLabel, rawErrors, options, registry } = props;
  const { translateString } = registry;
  const { elements, handleChange, handleClear, handleSetNow } = useAltDateWidgetProps(props);
  return (
    <>
      {!hideLabel && !!label && (
        <Input.Label id={titleId(id)} required={required}>
          {label}
        </Input.Label>
      )}
      <Flex gap='xs' align='center' wrap='nowrap'>
        {elements.map((elemProps, i) => {
          const elemId = `${id}_${elemProps.type}`;
          return (
            <Box key={i}>
              <Select
                id={elemId}
                name={elemId}
                placeholder={elemProps.type}
                disabled={disabled || readonly}
                data={dateRangeOptions<S>(elemProps.range[0], elemProps.range[1]).map((item) => item.value.toString())}
                value={!elemProps.value || elemProps.value < 0 ? null : elemProps.value.toString()}
                onChange={(v) => handleChange(elemProps.type as keyof DateObject, v || undefined)}
                searchable={false}
                allowDeselect={false}
                comboboxProps={{ withinPortal: false }}
                aria-describedby={ariaDescribedByIds(elemId)}
              />
            </Box>
          );
        })}
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
      {rawErrors &&
        rawErrors?.length > 0 &&
        rawErrors.map((error: string, index: number) => (
          <Input.Error key={`alt-date-widget-input-errors-${index}`}>{error}</Input.Error>
        ))}
    </>
  );
}
