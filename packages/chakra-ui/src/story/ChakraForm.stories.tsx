import { Box, Grid } from '@chakra-ui/core'
import React from 'react'
import { Basic } from '~/components/jsonschema/chakraTheme/story/Basic'
import { Number } from '~/components/jsonschema/chakraTheme/story/Numbers'
import { Widgets } from '~/components/jsonschema/chakraTheme/story/Widgets'
import VndlyJsonSchemaFormBase from '~/components/jsonschema/VndlyJsonSchemaFormBase/VndlyJsonSchemaFormBase'

export default {
  title: 'RJSF/ChakraForm',
  component: VndlyJsonSchemaFormBase,
  decorators: [
    storyFn => (
      <Grid minH="100vh" justifyContent="center" alignItems="center">
        <Box minW="xl">{storyFn()}</Box>
      </Grid>
    )
  ]
}

export { Basic, Number, Widgets }
