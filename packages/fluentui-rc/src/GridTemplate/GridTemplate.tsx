import { Flex } from '@fluentui/react-migration-v0-v9';
import { GridTemplateProps } from '@rjsf/utils';

/** Renders a `GridTemplate` for fluentui-rc, which is expecting the column sizing information coming in via the
 * extra props provided by the caller, which are spread directly on the `Flex`.
 *
 * @param props - The GridTemplateProps, including the extra props containing the fluentui-rc grid positioning details
 */
export default function GridTemplate(props: GridTemplateProps) {
  const { children, column, ...rest } = props;
  return <Flex {...rest}>{children}</Flex>;
}
