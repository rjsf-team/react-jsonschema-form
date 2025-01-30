
const SubmitButton = ({ submitText = "Submit" }: { submitText?: string }) => (
  <button type="submit" className="btn btn-primary">
    {submitText}
  </button>
);

export default SubmitButton;
