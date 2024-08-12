// import type { StorybookConfig } from "@storybook/react-webpack5";
import { StorybookConfig } from 'storybook-react-rsbuild'

const config: StorybookConfig = {
    stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
    addons: [
      "@storybook/addon-webpack5-compiler-swc",
      "@storybook/addon-onboarding",
      "@storybook/addon-links",
      "@storybook/addon-essentials",
      "@chromatic-com/storybook",
      "@storybook/addon-interactions",
    ],
    framework: {
      // name: "@storybook/react-webpack5",
      name: "storybook-react-rsbuild",
      options: {},
    },
    rsbuildFinal: (config) => {
      return config;
    }
  };
  export default config;