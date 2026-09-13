import type { Field as ChakraField } from '@chakra-ui/react';
import { defaultSystem } from '@chakra-ui/react';
import shouldForwardProp from '@emotion/is-prop-valid';
import type { UiSchema } from '@rjsf/utils';

const { isValidProperty } = defaultSystem;

/** A `UiSchema` whose `ui:options` are known to carry the theme's `chakra` prop bag.
 *
 * NOTE: this intersects rather than using `Omit<UiSchema, 'ui:options'>`. `UiSchema` has a string index signature, so
 * `keyof UiSchema` includes `string` and `Omit` erases every named member, leaving only the index signature — which
 * silently typed the whole uiSchema as `any`.
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
   * This builds a filtered copy. Deleting from `chakraProps` mutated the caller's own `ui:options.chakra` object,
   * permanently stripping those keys from the uiSchema the consumer passed in.
   */
  const forwardable = Object.entries(chakraProps).filter(([key]) => isValidProperty(key) && !shouldForwardProp(key));

  return Object.fromEntries(forwardable) as ChakraField.RootProps;
}
