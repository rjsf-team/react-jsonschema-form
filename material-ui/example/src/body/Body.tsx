import React from 'react';

import { withStyles } from '@material-ui/core/styles';

import styles from './body-styles';
import Example from './Example';

export default withStyles(styles)(({ classes, selectedDemo }: any) => (
  <div className={classes.body}>
    <Example data={selectedDemo} />
  </div>
));
