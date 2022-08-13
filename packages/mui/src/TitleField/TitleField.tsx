import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
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
