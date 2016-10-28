import Form from "./components/Form";

import WidgetRegistry from "./registry/WidgetRegistry";
import defaultWidgetMapping from "./registry/DefaultWidgetMapping";

WidgetRegistry.addToRegistry("defaultWidgetMap", defaultWidgetMapping.defaultWidgetMap);
WidgetRegistry.addToRegistry("altWidgetMap", defaultWidgetMapping.altWidgetMap);
WidgetRegistry.addToRegistry("stringFormatWidgets", defaultWidgetMapping.stringFormatWidgets);

export default Form;
