/*
 * Extract props meant for semantic UI components from props that are
 * passed to Widgets, Templates and Fields
 */
export function getSemanticProps({
  formContext = {},
  uiSchema = {},
  options = {},
}) {
  return Object.assign(
    {},
    formContext.semanticProps,
    uiSchema["ui:options"] ? uiSchema["ui:options"].semanticProps : {},
    options.semanticProps || {}
  );
}
