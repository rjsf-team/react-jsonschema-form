import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { withTheme, ThemeProps } from '@rjsf/core';

import Theme from './Theme/index';
import Templates from './Templates/index';
import Widgets from './Widgets/index';

export { Theme, Templates, Widgets };

export default withTheme(Theme);