目标:

1. 先满足业务, 使用成熟的 antd
2. 逐步替换成 tailwind (shadcn)

所有的渐进式重构在 storybook 层面进行测试.

---

- [x] 手动安装 storybook https://github.com/storybookjs/storybook/discussions/25475
  - [x] 配置 RSbuild https://rsbuild.dev/zh/guide/framework/react#%E4%BD%BF%E7%94%A8-emotion
    - [ ] 配置 emotion
- [ ] 配置 shadcn https://ui.shadcn.com/docs/installation/manual
  - [x] 配置 tailwindcss

配置 storybook 和 tailwind

- webpack 5 https://storybook.js.org/recipes/tailwindcss
- Rsbuild https://rsbuild.dev/guide/basic/tailwindcss#importing-css Rsbuild 目前不需要在 rsbuild.config.ts 里有修改

附:
tailwind 的一些代码片段参考

- https://flowbite.com/docs/components/buttons/
- https://tw-elements.com/docs/standard/components/buttons/
- https://v1.tailwindcss.com/components/buttons
