import Form from './Form';
import { setState } from '../utils';

export default class FormWithServerValidation extends Form {
  onSubmit = (event) => {
    event.preventDefault();

    if (!this.props.noValidate) {
      const { errors, errorSchema } = this.validate(this.state.formData);
      if (Object.keys(errors).length > 0) {
        setState(this, { errors, errorSchema }, () => {
          if (this.props.onError) {
            this.props.onError(errors);
          } else {
            console.error('Form validation failed', errors);
          }
        });
        return;
      }
    }

    setState(this, { errors: [], errorSchema: {} }, async () => {
      if (this.props.onSubmit) {
        const { serverErrorSchema } = await this.props.onSubmit({ ...this.state, status: 'submitted' });
        if (serverErrorSchema) {
          setState(this, { errors: [], errorSchema: serverErrorSchema });
        }
      }
    });
  };
}
