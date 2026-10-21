import { createContext } from 'react';

/** The theme the `DaisyUIFrameProvider` around a component shows, handed down so that `useTheme()` names it from the
 * frame's first render on, before the frame has stored a chosen `dataTheme`, and whatever another caller or tab stores
 * while that theme is chosen. Outside a frame it is `undefined`
 */
export const FrameThemeContext = createContext<string | undefined>(undefined);
