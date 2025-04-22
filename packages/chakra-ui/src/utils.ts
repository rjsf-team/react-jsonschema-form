import { Field as ChakraField, defaultSystem } from '@chakra-ui/react';
import { UiSchema } from '@rjsf/utils';
import shouldForwardProp from '@emotion/is-prop-valid';

const { isValidProperty } = defaultSystem;

export interface ChakraUiSchema extends Omit<UiSchema, 'ui:options'> {
  'ui:options'?: ChakraUiOptions;
}

type ChakraUiOptions = UiSchema['ui:options'] & { chakra?: ChakraField.RootProps };

export function getChakra(uiSchema: ChakraUiSchema = {}): ChakraField.RootProps {
  const chakraProps = (uiSchema['ui:options'] && uiSchema['ui:options'].chakra) || {};

  Object.keys(chakraProps).forEach((key) => {
    /**
     * Leveraging `shouldForwardProp` to remove props
     * https://chakra-ui.com/docs/styling/chakra-factory#forwarding-props
     */
    if (!isValidProperty(key) || shouldForwardProp(key)) {
      delete (chakraProps as any)[key];
    }
  });

  return chakraProps;
}
