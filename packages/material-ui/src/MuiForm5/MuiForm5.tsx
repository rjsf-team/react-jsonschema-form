import { StatelessComponent } from 'react';

import { withTheme, FormProps } from '@rjsf/core';
import Theme5 from '../Theme5';

const MuiForm5: React.ComponentClass<FormProps<any>> | StatelessComponent<FormProps<any>> = withTheme(Theme5);

export default MuiForm5;
