import type { Field as ChakraField } from '@chakra-ui/react';
import { defaultSystem } from '@chakra-ui/react';
import shouldForwardProp from '@emotion/is-prop-valid';
import type { UiSchema } from '@rjsf/utils';

const { isValidProperty } = defaultSystem;

/** A `UiSchema` whose `ui:options` are known to carry the theme's `chakra` prop bag.
 *
 * NOTE: intersects rather than using `Omit`, whose `keyof UiSchema` includes `UiSchema`'s string index signature and so
 * erases every named member.
 */
export type ChakraUiSchema = UiSchema & {
  'ui:options'?: ChakraUiOptions;
};

type ChakraUiOptions = UiSchema['ui:options'] & { chakra?: ChakraField.RootProps };

export function getChakra(uiSchema: ChakraUiSchema = {}): ChakraField.RootProps {
  const chakraProps = uiSchema['ui:options']?.chakra || {};

  /**
   * Leveraging `shouldForwardProp` to remove props
   * https://chakra-ui.com/docs/styling/chakra-factory#forwarding-props
   *
   * Filtered into a copy, since `chakraProps` belongs to the caller's uiSchema.
   */
  return Object.fromEntries(
    Object.entries(chakraProps).filter(([key]) => isValidProperty(key) && !shouldForwardProp(key)),
  ) as ChakraField.RootProps;
}
