import Typography from "@material-ui/core/Typography";
import { DescriptionFieldProps } from "@rjsf/utils";

const DescriptionField = ({ id, description }: DescriptionFieldProps) => {
  if (description) {
    return (
      <Typography id={id} variant="subtitle2" style={{ marginTop: "5px" }}>
        {description}
      </Typography>
    );
  }

  return null;
};

export default DescriptionField;
