/** The `*` beside the label or heading of a required field. Its own module rather than an export of a template's, so
 * the widgets that draw it don't depend on `templates/`
 */
export default function RequiredMarker() {
  return <span className='text-error ml-1'>*</span>;
}
