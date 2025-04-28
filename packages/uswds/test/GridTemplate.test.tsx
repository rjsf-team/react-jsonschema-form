import { gridTests } from "@rjsf/snapshot-tests";

import Theme from "../src";

// Run the snapshot tests for the GridTemplate using the theme and directory context
gridTests(Theme, __dirname);
