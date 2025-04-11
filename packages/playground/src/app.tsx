import { Theme as MuiTheme } from '@rjsf/mui';
import { Theme as FluentUIRCTheme } from '@rjsf/fluentui-rc';
import { Theme as SuiTheme } from '@rjsf/semantic-ui';
import { Theme as AntdTheme } from '@rjsf/antd';
import { Theme as BootstrapTheme } from '@rjsf/react-bootstrap';
import { Theme as ChakraUITheme } from '@rjsf/chakra-ui';
import { Theme as MantineTheme } from '@rjsf/mantine';
import { Theme as shadcnTheme } from '@rjsf/shadcn';
import v8Validator, { customizeValidator } from '@rjsf/validator-ajv8';
import localize_es from 'ajv-i18n/localize/es';
import Ajv2019 from 'ajv/dist/2019.js';
import Ajv2020 from 'ajv/dist/2020.js';

import Layout from './layout';
import Playground, { PlaygroundProps } from './components';

// @ts-expect-error todo: error TS2345: Argument of type 'Localize' is not assignable to parameter of type 'Localizer'.
const esV8Validator = customizeValidator({}, localize_es);
const AJV8_2019 = customizeValidator({ AjvClass: Ajv2019 });
const AJV8_2020 = customizeValidator({ AjvClass: Ajv2020 });
const AJV8_DISC = customizeValidator({ ajvOptionsOverrides: { discriminator: true } });
const AJV8_DATA_REF = customizeValidator({ ajvOptionsOverrides: { $data: true } });

const validators: PlaygroundProps['validators'] = {
  AJV8: v8Validator,
  'AJV8 $data reference': AJV8_DATA_REF,
  'AJV8 (discriminator)': AJV8_DISC,
  AJV8_es: esV8Validator,
  AJV8_2019,
  AJV8_2020,
};

const themes: PlaygroundProps['themes'] = {
  default: {
    stylesheet: '//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css',
    theme: {},
    subthemes: {
      cerulean: {
        stylesheet: '//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/cerulean/bootstrap.min.css',
      },
      cosmo: {
        stylesheet: '//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/cosmo/bootstrap.min.css',
      },
      cyborg: {
        stylesheet: '//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/cyborg/bootstrap.min.css',
      },
      darkly: {
        stylesheet: '//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/darkly/bootstrap.min.css',
      },
      flatly: {
        stylesheet: '//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/flatly/bootstrap.min.css',
      },
      journal: {
        stylesheet: '//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/journal/bootstrap.min.css',
      },
      lumen: {
        stylesheet: '//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/lumen/bootstrap.min.css',
      },
      paper: {
        stylesheet: '//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/paper/bootstrap.min.css',
      },
      readable: {
        stylesheet: '//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/readable/bootstrap.min.css',
      },
      sandstone: {
        stylesheet: '//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/sandstone/bootstrap.min.css',
      },
      simplex: {
        stylesheet: '//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/simplex/bootstrap.min.css',
      },
      slate: {
        stylesheet: '//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/slate/bootstrap.min.css',
      },
      spacelab: {
        stylesheet: '//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/spacelab/bootstrap.min.css',
      },
      'solarized-dark': {
        stylesheet: '//cdn.rawgit.com/aalpern/bootstrap-solarized/master/bootstrap-solarized-dark.css',
      },
      'solarized-light': {
        stylesheet: '//cdn.rawgit.com/aalpern/bootstrap-solarized/master/bootstrap-solarized-light.css',
      },
      superhero: {
        stylesheet: '//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/superhero/bootstrap.min.css',
      },
      united: {
        stylesheet: '//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/united/bootstrap.min.css',
      },
      yeti: {
        stylesheet: '//cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/yeti/bootstrap.min.css',
      },
    },
  },
  antd: {
    stylesheet: '//cdnjs.cloudflare.com/ajax/libs/antd/5.23.3/reset.min.css',
    theme: AntdTheme,
  },
  'chakra-ui': {
    stylesheet: '',
    theme: ChakraUITheme,
  },
  'fluentui-rc': {
    stylesheet: '',
    theme: FluentUIRCTheme,
  },
  mantine: {
    stylesheet: '//mantine-rjsf.pages.dev/styles.css',
    theme: MantineTheme,
  },
  mui: {
    stylesheet: '',
    theme: MuiTheme,
  },
  'react-bootstrap': {
    stylesheet: '//cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
    theme: BootstrapTheme,
  },
  'semantic-ui': {
    stylesheet: '//cdn.jsdelivr.net/npm/semantic-ui@2.4.2/dist/semantic.min.css',
    theme: SuiTheme,
  },
  shadcn: {
    stylesheet: 'https://cdn.jsdelivr.net/gh/tuanphung2308/rjsf-shadcn-css@main/public/default.css',
    theme: shadcnTheme,
    subthemes: {
      default: {
        stylesheet: 'https://cdn.jsdelivr.net/gh/tuanphung2308/rjsf-shadcn-css@main/public/default.css',
      },
      blue: {
        stylesheet: 'https://cdn.jsdelivr.net/gh/tuanphung2308/rjsf-shadcn-css@main/public/blue.css',
      },
      green: {
        stylesheet: 'https://cdn.jsdelivr.net/gh/tuanphung2308/rjsf-shadcn-css@main/public/green.css',
      },
      orange: {
        stylesheet: 'https://cdn.jsdelivr.net/gh/tuanphung2308/rjsf-shadcn-css@main/public/orange.css',
      },
      red: {
        stylesheet: 'https://cdn.jsdelivr.net/gh/tuanphung2308/rjsf-shadcn-css@main/public/red.css',
      },
      rose: {
        stylesheet: 'https://cdn.jsdelivr.net/gh/tuanphung2308/rjsf-shadcn-css@main/public/rose.css',
      },
      violet: {
        stylesheet: 'https://cdn.jsdelivr.net/gh/tuanphung2308/rjsf-shadcn-css@main/public/violet.css',
      },
      yellow: {
        stylesheet: 'https://cdn.jsdelivr.net/gh/tuanphung2308/rjsf-shadcn-css@main/public/yellow.css',
      },
      zinc: {
        stylesheet: 'https://cdn.jsdelivr.net/gh/tuanphung2308/rjsf-shadcn-css@main/public/zinc.css',
      },
    },
  },
};

export default function App() {
  return (
    <Layout>
      <Playground themes={themes} validators={validators} />
    </Layout>
  );
}
