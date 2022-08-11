import Box from "@material-ui/core/Box";
import Divider from "@material-ui/core/Divider";
import Typography from "@material-ui/core/Typography";
import { TitleFieldProps } from "@rjsf/utils";

const TitleField = ({ id, title }: TitleFieldProps) => {
  return (
    <Box id={id} mb={1} mt={1}>
      <Typography variant="h5">{title}</Typography>
      <Divider />
    </Box>
  );
};

export default TitleField;
