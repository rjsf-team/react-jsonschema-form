import React, { PropsWithChildren, Ref } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormGroup,
  FormLabel,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Paper,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material'
import {
  Add as AddIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Error as ErrorIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { ThemeProps } from '@rjsf/core';

import MuiComponentContext from '../MuiComponentContext';
import ThemeCommon from '../ThemeCommon';

const DefaultChildren5 = () => (
  <Box marginTop={3}>
    <Button type="submit" variant="contained" color="primary">
      Submit
    </Button>
  </Box>
);

export const Mui5Context = {
  Button,
  Box,
  Checkbox,
  Divider,
  Grid,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  IconButton,
  Input: OutlinedInput,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  AddIcon,
  ArrowDownwardIcon,
  ArrowUpwardIcon,
  ErrorIcon,
  RemoveIcon,
};

const Mui5TagName = React.forwardRef(
  function Mui5TagName(props: Omit<PropsWithChildren<HTMLFormElement>, 'contentEditable'>,
                       ref: Ref<HTMLFormElement>) {
    const { children, ...rest } = props;
    return (
      <MuiComponentContext.Provider value={Mui5Context}>
        <form ref={ref} {...rest}>
          {children}
        </form>
      </MuiComponentContext.Provider>
    );
  }
);

const Theme5: ThemeProps = {
  tagName: Mui5TagName,
  children: <DefaultChildren5 />,
  ...ThemeCommon,
};

export default Theme5;
