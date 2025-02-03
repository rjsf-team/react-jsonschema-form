import { Theme as MuiV4Theme } from '@rjsf/material-ui';
import { Theme as MuiV5Theme } from '@rjsf/mui';
import { Theme as FluentUITheme } from '@rjsf/fluent-ui';
import { Theme as FluentUIRCTheme } from '@rjsf/fluentui-rc';
import { Theme as SuiTheme } from '@rjsf/semantic-ui';
import { Theme as AntdTheme } from '@rjsf/antd';
import { Theme as Bootstrap4Theme } from '@rjsf/bootstrap-4';
import { Theme as ChakraUITheme } from '@rjsf/chakra-ui';
import { Theme as PrimeReactTheme } from '@rjsf/primereact';
import v8Validator, { customizeValidator } from '@rjsf/validator-ajv8';
import v6Validator from '@rjsf/validator-ajv6';
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
  'AJV6 (deprecated)': v6Validator,
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
    stylesheet: '//cdnjs.cloudflare.com/ajax/libs/antd/4.1.4/antd.min.css',
    theme: AntdTheme,
  },
  'bootstrap-4': {
    stylesheet: 'https://maxcdn.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css',
    theme: Bootstrap4Theme,
  },
  'chakra-ui': {
    stylesheet: '',
    theme: ChakraUITheme,
  },
  'fluent-ui': {
    stylesheet: '//static2.sharepointonline.com/files/fabric/office-ui-fabric-core/11.0.0/css/fabric.min.css',
    theme: FluentUITheme,
  },
  'fluentui-rc': {
    stylesheet: '',
    theme: FluentUIRCTheme,
  },
  'material-ui-4': {
    stylesheet: '',
    theme: MuiV4Theme,
  },
  mui: {
    stylesheet: '',
    theme: MuiV5Theme,
  },
  primereact: {
    stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/lara-light-cyan/theme.css',
    theme: PrimeReactTheme,
    subthemes: {
      'arya-blue': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/arya-blue/theme.css',
      },
      'arya-green': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/arya-green/theme.css',
      },
      'arya-orange': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/arya-orange/theme.css',
      },
      'arya-purple': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/arya-purple/theme.css',
      },
      'bootstrap4-dark-blue': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/bootstrap4-dark-blue/theme.css',
      },
      'bootstrap4-dark-purple': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/bootstrap4-dark-purple/theme.css',
      },
      'bootstrap4-light-blue': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/bootstrap4-light-blue/theme.css',
      },
      'bootstrap4-light-purple': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/bootstrap4-light-purple/theme.css',
      },
      'fluent-light': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/fluent-light/theme.css',
      },
      'lara-dark-amber': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/lara-dark-amber/theme.css',
      },
      'lara-dark-blue': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/lara-dark-blue/theme.css',
      },
      'lara-dark-cyan': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/lara-dark-cyan/theme.css',
      },
      'lara-dark-green': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/lara-dark-green/theme.css',
      },
      'lara-dark-indigo': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/lara-dark-indigo/theme.css',
      },
      'lara-dark-pink': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/lara-dark-pink/theme.css',
      },
      'lara-dark-purple': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/lara-dark-purple/theme.css',
      },
      'lara-dark-teal': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/lara-dark-teal/theme.css',
      },
      'lara-light-amber': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/lara-light-amber/theme.css',
      },
      'lara-light-blue': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/lara-light-blue/theme.css',
      },
      'lara-light-cyan': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/lara-light-cyan/theme.css',
      },
      'lara-light-green': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/lara-light-green/theme.css',
      },
      'lara-light-indigo': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/lara-light-indigo/theme.css',
      },
      'lara-light-pink': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/lara-light-pink/theme.css',
      },
      'lara-light-purple': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/lara-light-purple/theme.css',
      },
      'lara-light-teal': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/lara-light-teal/theme.css',
      },
      'luna-amber': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/luna-amber/theme.css',
      },
      'luna-blue': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/luna-blue/theme.css',
      },
      'luna-green': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/luna-green/theme.css',
      },
      'luna-pink': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/luna-pink/theme.css',
      },
      'md-dark-deeppurple': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/md-dark-deeppurple/theme.css',
      },
      'md-dark-indigo': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/md-dark-indigo/theme.css',
      },
      'md-light-deeppurple': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/md-light-deeppurple/theme.css',
      },
      'md-light-indigo': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/md-light-indigo/theme.css',
      },
      'mdc-dark-deeppurple': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/mdc-dark-deeppurple/theme.css',
      },
      'mdc-dark-indigo': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/mdc-dark-indigo/theme.css',
      },
      'mdc-light-deeppurple': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/mdc-light-deeppurple/theme.css',
      },
      'mdc-light-indigo': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/mdc-light-indigo/theme.css',
      },
      mira: {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/mira/theme.css',
      },
      nano: {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/nano/theme.css',
      },
      nova: {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/nova/theme.css',
      },
      'nova-accent': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/nova-accent/theme.css',
      },
      'nova-alt': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/nova-alt/theme.css',
      },
      rhea: {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/rhea/theme.css',
      },
      'saga-blue': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/saga-blue/theme.css',
      },
      'saga-green': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/saga-green/theme.css',
      },
      'saga-orange': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/saga-orange/theme.css',
      },
      'saga-purple': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/saga-purple/theme.css',
      },
      'soho-dark': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/soho-dark/theme.css',
      },
      'soho-light': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/soho-light/theme.css',
      },
      'tailwind-light': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/tailwind-light/theme.css',
      },
      'viva-dark': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/viva-dark/theme.css',
      },
      'viva-light': {
        stylesheet: '//cdn.jsdelivr.net/npm/primereact@10.9.2/resources/themes/viva-light/theme.css',
      },
    },
  },
  'semantic-ui': {
    stylesheet: '//cdn.jsdelivr.net/npm/semantic-ui@2.4.2/dist/semantic.min.css',
    theme: SuiTheme,
  },
};

export default function App() {
  return (
    <Layout>
      <Playground themes={themes} validators={validators} />
    </Layout>
  );
}
