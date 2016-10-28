import Registry from "./Registry";

import defaultWidgetMapping from "../mapping/DefaultWidgetMapping";

Registry.initRegistry({
  defaultWidgetMap: defaultWidgetMapping.defaultWidgetMap,
  altWidgetMap: defaultWidgetMapping.altWidgetMap,
  stringFormatWidgets: defaultWidgetMapping.stringFormatWidgets,
});

function addToDefaultWidgetMap(key, value) {
  const defaultWidgetMapKey = "defaultWidgetMap";
  let defaultWidgetMap = Registry.getFromRegistry(defaultWidgetMapKey);
  defaultWidgetMap[key] = value;
  Registry.addToRegistry(defaultWidgetMapKey, defaultWidgetMap);
}

function addToAltWidgetMap(key, value) {
}

function addToFormatWidgets(key, value) {
}

function getDefaultWidgetMap() {
  const registryKey = "defaultWidgetMap";
  return Registry.getFromRegistry(registryKey);
}

function getAltWidgetMap(){
  const registryKey = "altWidgetMap";
  return Registry.getFromRegistry(registryKey);
}

function getStringFormatWidgets(){
  const registryKey = "stringFormatWidgets";
  return Registry.getFromRegistry(registryKey);
}

export default {
  addToDefaultWidgetMap,
  addToAltWidgetMap,
  addToFormatWidgets,
  getDefaultWidgetMap,
  getAltWidgetMap,
  getStringFormatWidgets,
};