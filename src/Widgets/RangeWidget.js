import { jsx as _jsx } from "react/jsx-runtime";
export default function RangeInput(props) {
    const { id, value, readonly, disabled, onBlur, onFocus, onChange, options, schema, uiSchema, rawErrors } = props;
    const _onChange = ({ target: { value } }) => onChange(value === "" ? options.emptyValue : value);
    const _onBlur = ({ target: { value } }) => onBlur(id, value);
    const _onFocus = ({ target: { value } }) => onFocus(id, value);
    return (_jsx("input", { type: "range", id: id, value: value || "", readOnly: readonly, disabled: disabled, onChange: _onChange, onBlur: _onBlur, onFocus: _onFocus }));
}
