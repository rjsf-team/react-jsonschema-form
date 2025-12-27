import { Box, Button, FieldsetRoot } from '@chakra-ui/react';
import {
  DateElement,
  DateElementProp,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  useAltDateWidgetProps,
  WidgetProps,
} from '@rjsf/utils';
import { getChakra } from '../utils';

function AltDateWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  autofocus = false,
  disabled = false,
  readonly = false,
  time = false,
  options = {
    yearsRange: [1900, new Date().getFullYear() + 2],
  },
  ...props
}: WidgetProps<T, S, F>) {
  const { id, onBlur, onFocus, registry } = props;
  const { translateString } = registry;
  const { elements, handleChange, handleClear, handleSetNow } = useAltDateWidgetProps({ ...props, options });

  const chakraProps = getChakra({ uiSchema: props.uiSchema });

  return (
    <FieldsetRoot {...(chakraProps as any)}>
      <Box display='flex' flexWrap='wrap' alignItems='center'>
        {elements.map((elemProps: DateElementProp, i) => {
          const elemId = `${id}_${elemProps.type}`;
          return (
            <Box key={elemId} mr='2' mb='2' width='20'>
              <DateElement<T, S, F>
                {...props}
                {...elemProps}
                autofocus={autofocus && i === 0}
                disabled={disabled}
                rootId={id}
                name={id}
                onBlur={onBlur}
                onFocus={onFocus}
                readonly={readonly}
                registry={registry}
                select={handleChange}
                value={elemProps.value && elemProps.value < 0 ? '' : elemProps.value}
              />
            </Box>
          );
        })}
      </Box>
      <Box display='flex'>
        {!options.hideNowButton && (
          <Button onClick={handleSetNow} mr='2'>
            {translateString(TranslatableString.NowLabel)}
          </Button>
        )}
        {!options.hideClearButton && (
          <Button onClick={handleClear}>{translateString(TranslatableString.ClearLabel)}</Button>
        )}
      </Box>
    </FieldsetRoot>
  );
}

// AltDateWidget.defaultProps = {
//   autofocus: false,
//   disabled: false,
//   readonly: false,
//   time: false,
//   options: {
//     yearsRange: [1900, new Date().getFullYear() + 2],
//   },
// };

export default AltDateWidget;
