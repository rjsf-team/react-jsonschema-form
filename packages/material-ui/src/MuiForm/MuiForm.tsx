import { StatelessComponent } from 'react';
import { withTheme, FormProps } from '@rjsf/core';

import Theme from '../Theme';

const MuiForm: React.ComponentClass<FormProps<any>> | StatelessComponent<FormProps<any>> = withTheme(Theme);

export default MuiForm;
