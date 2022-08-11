/* eslint-disable react/prop-types */
function DescriptionField({ className, description, id }) {
  if (description) {
    return (
      <p id={id} className={className || "sui-description"}>
        {description}
      </p>
    );
  }
}

export default DescriptionField;
