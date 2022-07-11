import Mui5ContextProps from './Mui5ContextProps';

/** Use require for loading these libraries in case they are not available in order to perform a useful fallback */
// core
let Box;
let Button;
let Checkbox;
let Divider;
let FormControl;
let FormControlLabel;
let FormGroup;
let FormHelperText;
let FormLabel;
let Grid;
let IconButton;
let Input;
let InputLabel;
let List;
let ListItem;
let ListItemIcon;
let ListItemText;
let MenuItem;
let Paper;
let Radio;
let RadioGroup;
let Slider;
let TextField;
let Typography;
// icons
let AddIcon;
let ArrowDownwardIcon;
let ArrowUpwardIcon;
let ErrorIcon;
let RemoveIcon;

try {
  // core
  Box = require('@mui/material/Box').default;
  Button = require('@mui/material/Button').default;
  Checkbox = require('@mui/material/Checkbox').default;
  Divider = require('@mui/material/Divider').default;
  FormControl = require('@mui/material/FormControl').default;
  FormControlLabel = require('@mui/material/FormControlLabel').default;
  FormGroup = require('@mui/material/FormGroup').default;
  FormHelperText = require('@mui/material/FormHelperText').default;
  FormLabel = require('@mui/material/FormLabel').default;
  Grid = require('@mui/material/Grid').default;
  IconButton = require('@mui/material/IconButton').default;
  Input = require('@mui/material/OutlinedInput').default;
  InputLabel = require('@mui/material/InputLabel').default;
  List = require('@mui/material/List').default;
  ListItem = require('@mui/material/ListItem').default;
  ListItemIcon = require('@mui/material/ListItemIcon').default;
  ListItemText = require('@mui/material/ListItemText').default;
  MenuItem = require('@mui/material/MenuItem').default;
  Paper = require('@mui/material/Paper').default;
  Radio = require('@mui/material/Radio').default;
  RadioGroup = require('@mui/material/RadioGroup').default;
  Slider = require('@mui/material/Slider').default;
  TextField = require('@mui/material/TextField').default;
  Typography = require('@mui/material/Typography').default;
  // icons
  AddIcon = require('@mui/icons-material/Add').default;
  ArrowDownwardIcon = require('@mui/icons-material/ArrowDownward').default;
  ArrowUpwardIcon = require('@mui/icons-material/ArrowUpward').default;
  ErrorIcon = require('@mui/icons-material/Error').default;
  RemoveIcon = require('@mui/icons-material/Remove').default;
} catch {
  // no-op
}

export let Mui5Context: Mui5ContextProps;

if (Box && AddIcon) {
  Mui5Context = {
    // core
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
    TextField,
    Typography,
    // icons
    AddIcon,
    ArrowDownwardIcon,
    ArrowUpwardIcon,
    ErrorIcon,
    RemoveIcon,
  };
}
