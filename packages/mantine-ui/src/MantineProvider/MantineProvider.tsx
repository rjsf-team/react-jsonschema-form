import { MantineProvider } from '@mantine/core';

export const __createMantineFrameProvider = (props: any) => () => {
  return <MantineProvider>{props.children}</MantineProvider>;
};
