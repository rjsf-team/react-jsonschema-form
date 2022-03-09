/** Use require for loading these libraries in case they are not available in order to perform a useful fallback
 */
let mui = {};
try {
  mui = {
    Box: /*#__PURE__*/require('@mui/material/Box').default,
    Button: /*#__PURE__*/require('@mui/material/Button').default,
    Checkbox: /*#__PURE__*/require('@mui/material/Checkbox').default,
    Divider: /*#__PURE__*/require('@mui/material/Divider').default,
    FormControl: /*#__PURE__*/require('@mui/material/FormControl').default,
    FormControlLabel: /*#__PURE__*/require('@mui/material/FormControlLabel').default,
    FormHelperText: /*#__PURE__*/require('@mui/material/FormHelperText').default,
    FormGroup: /*#__PURE__*/require('@mui/material/FormGroup').default,
    FormLabel: /*#__PURE__*/require('@mui/material/FormLabel').default,
    Grid: /*#__PURE__*/require('@mui/material/Grid').default,
    IconButton: /*#__PURE__*/require('@mui/material/IconButton').default,
    InputLabel: /*#__PURE__*/require('@mui/material/InputLabel').default,
    List: /*#__PURE__*/require('@mui/material/List').default,
    ListItem: /*#__PURE__*/require('@mui/material/ListItem').default,
    ListItemIcon: /*#__PURE__*/require('@mui/material/ListItemIcon').default,
    ListItemText: /*#__PURE__*/require('@mui/material/ListItemText').default,
    MenuItem: /*#__PURE__*/require('@mui/material/MenuItem').default,
    OutlinedInput: /*#__PURE__*/require('@mui/material/OutlinedInput').default,
    Paper: /*#__PURE__*/require('@mui/material/Paper').default,
    Radio: /*#__PURE__*/require('@mui/material/Radio').default,
    RadioGroup: /*#__PURE__*/require('@mui/material/RadioGroup').default,
    Slider: /*#__PURE__*/require('@mui/material/Slider').default,
    SvgIcon: /*#__PURE__*/require('@mui/material/SvgIcon').default,
    TextField: /*#__PURE__*/require('@mui/material/TextField').default,
    Typography: /*#__PURE__*/require('@mui/material/Typography').default,
  };
} catch (err) {
  // purposely a no-op
}

// @ts-ignore What we are doing here isn't really good Typescript, but it works
const {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
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
  Slider,
  SvgIcon,
  TextField,
  Typography,
} = mui;

export default interface Mui5ContextProps {
  Box?: Box;
  Button?: Button;
  Checkbox?: Checkbox;
  Divider?: Divider;
  Grid?: Grid;
  FormControl?: FormControl;
  FormControlLabel?: FormControlLabel;
  FormGroup?: FormGroup;
  FormHelperText?: FormHelperText;
  FormLabel?: FormLabel;
  IconButton?: IconButton;
  Input?: OutlinedInput;
  InputLabel?: InputLabel;
  List?: List;
  ListItem?: ListItem;
  ListItemIcon?: ListItemIcon;
  ListItemText?: ListItemText;
  MenuItem?: MenuItem;
  Paper?: Paper;
  Radio?: Radio;
  RadioGroup?: RadioGroup;
  Slider?: Slider;
  TextField?: TextField;
  Typography?: Typography;
  AddIcon?: SvgIcon;
  ArrowDownwardIcon?: SvgIcon;
  ArrowUpwardIcon?: SvgIcon;
  ErrorIcon?: SvgIcon;
  RemoveIcon?: SvgIcon;
}
