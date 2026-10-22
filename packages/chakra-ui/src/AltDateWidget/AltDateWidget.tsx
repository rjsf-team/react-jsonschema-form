import { Box, Button, FieldsetRoot } from '@chakra-ui/react';
import type { DateElementProp, FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { DateElement, dateElementId, getGroupAttributes, TranslatableString, useAltDateWidgetProps } from '@rjsf/utils';

import { getChakra, labelledByOrNone } from '../utils.ts';

function AltDateWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const {
    autofocus = false,
    disabled = false,
    id,
    onBlur,
    onFocus,
    options,
    readonly = false,
    registry,
    presentation,
  } = props;
  const { translateString } = registry;
  const { elements, handleChange, handleClear, handleSetNow, buttonsDisabled } = useAltDateWidgetProps(props);

  const chakraProps = getChakra(options);
  const { group } = getGroupAttributes<T, S, F>({ id, presentation }, 'group');

  return (
    <FieldsetRoot
      {...group}
      // Ark points the fieldset at a legend id of its own, which never renders here, so it is pointed at the label the
      // plan names, or at nothing
      aria-labelledby={labelledByOrNone(group['aria-labelledby'], false)}
      {...chakraProps}
    >
      <Box display='flex' flexWrap='wrap' alignItems='center'>
        {elements.map((elemProps: DateElementProp, i) => {
          const elemId = dateElementId(id, elemProps.type);
          return (
            <Box key={elemId} mr='2' mb='2' width='20'>
              <DateElement<T, S, F>
                {...props}
                {...elemProps}
                autofocus={autofocus && i === 0}
                disabled={disabled}
                rootId={id}
                onBlur={onBlur}
                onFocus={onFocus}
                readonly={readonly}
                registry={registry}
                select={handleChange}
              />
            </Box>
          );
        })}
      </Box>
      <Box display='flex'>
        {!options.hideNowButton && (
          <Button onClick={handleSetNow} mr='2' disabled={buttonsDisabled}>
            {translateString(TranslatableString.NowLabel)}
          </Button>
        )}
        {!options.hideClearButton && (
          <Button onClick={handleClear} disabled={buttonsDisabled}>
            {translateString(TranslatableString.ClearLabel)}
          </Button>
        )}
      </Box>
    </FieldsetRoot>
  );
}

export default AltDateWidget;
