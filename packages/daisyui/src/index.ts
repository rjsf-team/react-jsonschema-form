import { withTheme } from '@rjsf/core';

import Theme, { ThemeProvider, useTheme } from './theme';

export { default as Form } from './DaisyUIForm';
export { __createDaisyUIFrameProvider } from './DaisyUIFrameProvider';
export { default as GridTemplate } from './templates/GridTemplate/GridTemplate';
export { default as Templates } from './templates/Templates';
export { default as Theme } from './theme';
export { default as Widgets } from './widgets/Widgets';
export { ThemeProvider, useTheme };

export default withTheme(Theme);
