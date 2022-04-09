import Form from "./components/Form";
import withTheme from "./withTheme";
import * as _utils from "./utils";
import { getDefaultRegistry } from "./defaultRegistry";

const utils = {
  ..._utils,
  getDefaultRegistry,
};

export { withTheme, utils };
export default Form;
