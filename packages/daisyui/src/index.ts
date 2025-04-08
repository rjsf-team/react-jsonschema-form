import { withTheme } from '@rjsf/core';
import Theme, { ThemeProvider, useTheme } from './theme';

export { default as Form } from './DaisyUIForm';
export { default as Theme } from './theme';
export { ThemeProvider, useTheme };

export { default as Templates } from './templates/Templates';
export { default as Widgets } from './widgets/Widgets';

export { default as GridTemplate } from './templates/GridTemplate/GridTemplate';

export { __createDaisyUIFrameProvider } from './DaisyUIFrameProvider';

export default withTheme(Theme);
