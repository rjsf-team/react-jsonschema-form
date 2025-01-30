import { Sample } from './Sample';
import { FieldProps } from '@rjsf/utils';

function UiField(props: FieldProps) {
  const {
    idSchema: { $id },
    formData,
    onChange,
  } = props;
  const changeHandlerFactory = (fieldName: string) => (event: any) => {
    onChange(formData ? { ...formData, [fieldName]: event.target.value } : { [fieldName]: event.target.value });
  };
  return (
    <>
      <h4 className="text-lg font-bold mb-4">Location</h4>
      <div className="flex flex-wrap">
        <div className="w-full md:w-1/2 p-2">
          <div className="form-control">
            <label className="label" htmlFor={`${$id}-city`}>
              <span className="label-text">City</span>
            </label>
            <input
              className="input input-bordered"
              id={`${$id}-city`}
              required={false}
              placeholder=""
              type="text"
              value={formData?.city || ''}
              onChange={changeHandlerFactory('city')}
            />
          </div>
        </div>
        <div className="w-full md:w-1/2 p-2">
          <div className="form-control">
            <label className="label" htmlFor={`${$id}-lat`}>
              <span className="label-text">Latitude</span>
            </label>
            <input
              className="input input-bordered"
              id={`${$id}-lat`}
              type="number"
              value={formData?.lat || 0}
              onChange={changeHandlerFactory('lat')}
            />
          </div>
          <div className="form-control mt-4">
            <label className="label" htmlFor={`${$id}-lon`}>
              <span className="label-text">Longitude</span>
            </label>
            <input
              className="input input-bordered"
              id={`${$id}-lon`}
              type="number"
              value={formData?.lon || 0}
              onChange={changeHandlerFactory('lon')}
            />
          </div>
        </div>
      </div>
    </>
  );
}

const customFieldAnyOf: Sample = {
  schema: {
    title: 'Location',
    type: 'object',
    anyOf: [
      {
        title: 'City',
        properties: {
          city: {
            type: 'string',
          },
        },
        required: ['city'],
      },
      {
        title: 'Coordinates',
        properties: {
          lat: {
            type: 'number',
          },
          lon: {
            type: 'number',
          },
        },
        required: ['lat', 'lon'],
      },
    ],
  },
  uiSchema: {
    'ui:field': UiField,
  },
  formData: {},
};

export default customFieldAnyOf;
