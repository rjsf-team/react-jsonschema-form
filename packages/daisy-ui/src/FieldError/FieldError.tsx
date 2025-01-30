
const FieldError = ({ errors }: { errors: string[] }) => (
  <div className="field-error text-red-600">
    {errors.map((error, index) => (
      <p key={index} className="text-sm">
        {error}
      </p>
    ))}
  </div>
);

export default FieldError;
