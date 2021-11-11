import { withTheme, FormProps } from '@rjsf/core';

import Theme from '../Theme';
import { FunctionComponent } from 'react';

const MuiForm: React.ComponentClass<FormProps<any>> | FunctionComponent<FormProps<any>>  = withTheme(Theme);

export default MuiForm;
