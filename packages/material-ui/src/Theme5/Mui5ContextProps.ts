/** Use require for loading these libraries in case they are not available in order to perform a useful fallback
 */
let mui = {};
try {
  mui = require('@mui/material');
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
