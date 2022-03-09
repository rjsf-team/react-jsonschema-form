import React from 'react';
import MaterialUIContextProps from './MaterialUIContextProps';

/** Use require for loading these libraries in case they are not available in order to perform a useful fallback
 * We are explicitly loading each component with the `#__PURE__` webpack magic comment so that tree-shaking works.
 */
let mui;
let icons;
try {
  mui = {
    Box: /*#__PURE__*/require('@material-ui/core/Box').default,
    Button: /*#__PURE__*/require('@material-ui/core/Button').default,
    Checkbox: /*#__PURE__*/require('@material-ui/core/Checkbox').default,
    Divider: /*#__PURE__*/require('@material-ui/core/Divider').default,
    FormControl: /*#__PURE__*/require('@material-ui/core/FormControl').default,
    FormControlLabel: /*#__PURE__*/require('@material-ui/core/FormControlLabel').default,
    FormHelperText: /*#__PURE__*/require('@material-ui/core/FormHelperText').default,
    FormGroup: /*#__PURE__*/require('@material-ui/core/FormGroup').default,
    FormLabel: /*#__PURE__*/require('@material-ui/core/FormLabel').default,
    Grid: /*#__PURE__*/require('@material-ui/core/Grid').default,
    IconButton: /*#__PURE__*/require('@material-ui/core/IconButton').default,
    Input: /*#__PURE__*/require('@material-ui/core/Input').default,
    InputLabel: /*#__PURE__*/require('@material-ui/core/InputLabel').default,
    List: /*#__PURE__*/require('@material-ui/core/List').default,
    ListItem: /*#__PURE__*/require('@material-ui/core/ListItem').default,
    ListItemIcon: /*#__PURE__*/require('@material-ui/core/ListItemIcon').default,
    ListItemText: /*#__PURE__*/require('@material-ui/core/ListItemText').default,
    MenuItem: /*#__PURE__*/require('@material-ui/core/MenuItem').default,
    Paper: /*#__PURE__*/require('@material-ui/core/Paper').default,
    Radio: /*#__PURE__*/require('@material-ui/core/Radio').default,
    RadioGroup: /*#__PURE__*/require('@material-ui/core/RadioGroup').default,
    Slider: /*#__PURE__*/require('@material-ui/core/Slider').default,
    TextField: /*#__PURE__*/require('@material-ui/core/TextField').default,
    Typography: /*#__PURE__*/require('@material-ui/core/Typography').default,
  };
  icons = {
    Add: /*#__PURE__*/require('@material-ui/icons/Add').default,
    ArrowUpward: /*#__PURE__*/require('@material-ui/icons/ArrowUpward').default,
    ArrowDownward: /*#__PURE__*/require('@material-ui/icons/ArrowDownward').default,
    Error: /*#__PURE__*/require('@material-ui/icons/Error').default,
    Remove: /*#__PURE__*/require('@material-ui/icons/Remove').default
  };
} catch (err) {
  // purposely a no-op
}

export let MaterialUIContext: MaterialUIContextProps;
export let DefaultChildren = () => <div>@material-ui not available</div>;

if (mui && Object.keys(mui).length && icons && Object.keys(icons).length) {
  const {
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
    Input,
    InputLabel,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Paper,
    Radio,
    RadioGroup,
    Slider,
    TextField,
    Typography,
  } = mui;
  const {
    Add: AddIcon,
    ArrowUpward: ArrowUpwardIcon,
    ArrowDownward: ArrowDownwardIcon,
    Error: ErrorIcon,
    Remove: RemoveIcon,
  } = icons;

  DefaultChildren = () => (
    <Box marginTop={3}>
      <Button type="submit" variant="contained" color="primary">
        Submit
      </Button>
    </Box>
  );

  MaterialUIContext = {
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
    Input,
    InputLabel,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Paper,
    Radio,
    RadioGroup,
    Slider,
    TextField,
    Typography,
    AddIcon,
    ArrowDownwardIcon,
    ArrowUpwardIcon,
    ErrorIcon,
    RemoveIcon,
  };
}
