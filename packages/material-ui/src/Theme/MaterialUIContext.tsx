import MaterialUIContextProps from './MaterialUIContextProps';

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
  Box = require('@material-ui/core/Box').default;
  Button = require('@material-ui/core/Button').default;
  Checkbox = require('@material-ui/core/Checkbox').default;
  Divider = require('@material-ui/core/Divider').default;
  FormControl = require('@material-ui/core/FormControl').default;
  FormControlLabel = require('@material-ui/core/FormControlLabel').default;
  FormGroup = require('@material-ui/core/FormGroup').default;
  FormHelperText = require('@material-ui/core/FormHelperText').default;
  FormLabel = require('@material-ui/core/FormLabel').default;
  Grid = require('@material-ui/core/Grid').default;
  IconButton = require('@material-ui/core/IconButton').default;
  Input = require('@material-ui/core/Input').default;
  InputLabel = require('@material-ui/core/InputLabel').default;
  List = require('@material-ui/core/List').default;
  ListItem = require('@material-ui/core/ListItem').default;
  ListItemIcon = require('@material-ui/core/ListItemIcon').default;
  ListItemText = require('@material-ui/core/ListItemText').default;
  MenuItem = require('@material-ui/core/MenuItem').default;
  Paper = require('@material-ui/core/Paper').default;
  Radio = require('@material-ui/core/Radio').default;
  RadioGroup = require('@material-ui/core/RadioGroup').default;
  Slider = require('@material-ui/core/Slider').default;
  TextField = require('@material-ui/core/TextField').default;
  Typography = require('@material-ui/core/Typography').default;
  // icons
  AddIcon = require('@material-ui/icons/Add').default;
  ArrowDownwardIcon = require('@material-ui/icons/ArrowDownward').default;
  ArrowUpwardIcon = require('@material-ui/icons/ArrowUpward').default;
  ErrorIcon = require('@material-ui/icons/Error').default;
  RemoveIcon = require('@material-ui/icons/Remove').default;
} catch {
  // no-op
}

export let MaterialUIContext: MaterialUIContextProps;

if (Box && AddIcon) {
  MaterialUIContext = {
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
