import Registry from "./Registry";

import defaultWidgetMapping from "../mapping/DefaultWidgetMapping";

const DEFAULT_WIDGET_MAP_KEY = "defaultWidgetMap";
const ALT_WIDGET_MAP_KEY = "altWidgetMap";
const STRING_FORMAT_WIDGETS_KEY = "stringFormatWidgets";

Registry.initRegistry({
  defaultWidgetMap: defaultWidgetMapping.defaultWidgetMap,
  altWidgetMap: defaultWidgetMapping.altWidgetMap,
  stringFormatWidgets: defaultWidgetMapping.stringFormatWidgets,
});

function _createOrUpdateRegistry(registryKey, key, value, type) {
  const registryMap = Registry.getFromRegistry(registryKey);
  if (type) {
    const registryMapByType = registryMap[type];
    registryMapByType[key] = value;
  } else {
    registryMap[key] = value;
  }
  Registry.addToRegistry(registryKey, registryMap);
}

function addToDefaultWidgetMap(key, value) {
  _createOrUpdateRegistry(DEFAULT_WIDGET_MAP_KEY, key, value);
}

function addToAltWidgetMapByType(type, key, value) {
  _createOrUpdateRegistry(ALT_WIDGET_MAP_KEY, key, value, type);
}

function addToStringFormatWidgets(key, value) {
  _createOrUpdateRegistry(STRING_FORMAT_WIDGETS_KEY, key, value);
}

function getDefaultWidgetMap() {
  return Registry.getFromRegistry(DEFAULT_WIDGET_MAP_KEY);
}

function getAltWidgetMap() {
  return Registry.getFromRegistry(ALT_WIDGET_MAP_KEY);
}

function getStringFormatWidgets() {
  return Registry.getFromRegistry(STRING_FORMAT_WIDGETS_KEY);
}

function register(mapping) {
  mapping && Object.keys(mapping).forEach(entryKey => {
    const mappingEntry = mapping[entryKey];
    addToDefaultWidgetMap(entryKey, mappingEntry.default);
    mappingEntry.alternatives && Object.keys(mappingEntry.alternatives).forEach(altKey => {
      const mappingAltEntry = mappingEntry.alternatives[altKey];
      addToAltWidgetMapByType(entryKey, altKey, mappingAltEntry);
    });
  });
}

export default {
  addToDefaultWidgetMap,
  addToAltWidgetMapByType,
  addToStringFormatWidgets,
  getDefaultWidgetMap,
  getAltWidgetMap,
  getStringFormatWidgets,
  register,
};