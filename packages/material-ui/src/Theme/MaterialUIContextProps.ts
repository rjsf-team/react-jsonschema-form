/** Use require for loading these libraries in case they are not available in order to perform a useful fallback
 */
let mui = {};
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
    SvgIcon: /*#__PURE__*/require('@material-ui/core/SvgIcon').default,
    TextField: /*#__PURE__*/require('@material-ui/core/TextField').default,
    Typography: /*#__PURE__*/require('@material-ui/core/Typography').default,
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
  SvgIcon,
  TextField,
  Typography,
} = mui;

export default interface MaterialUIContextProps {
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
  Input?: Input;
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
