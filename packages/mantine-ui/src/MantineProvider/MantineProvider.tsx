import { createEmotionCache, MantineProvider } from '@mantine/core';

export const __createMantineFrameProvider =
  (props: any) =>
  ({ document }: any) => {
    const mantineCache = createEmotionCache({ key: 'mantine', container: document.head });
    return <MantineProvider emotionCache={mantineCache}>{props.children}</MantineProvider>;
  };
