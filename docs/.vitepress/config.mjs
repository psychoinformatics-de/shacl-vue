import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/shacl-vue/docs/",
  title: "shacl-vue (alpha)",
  description: "Automatic generation of user interfaces from SHACL",
  head: [['link', { rel: 'icon', href: '/shacl-vue/docs/favicon.ico' }]],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/shacl_vue.svg',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Get started', link: '/get-started' }
    ],

    sidebar: [
      {
        items: [
          { text: 'Get started', link: '/get-started' },
        ]
      },
      {
        text: 'App design',
        items: [
          { text: 'The big picture', link: '/app-design' },
          { text: 'Core concepts', link: '/core-concepts' },
          { text: 'Code layout', link: '/code-layout' },
          { text: 'Component hierarchy', link: '/component-hierarchy' },
          { text: 'The editor component', link: '/editor-component' },
          { text: 'State management (TODO)', link: '/state-management' },
        ]
      },
      {
        text: 'Setup and deployment',
        items: [
          { text: 'Application inputs', link: '/app-inputs' },
          { text: 'Application configuration', link: '/app-configuration' },
        ]
      },
      {
        text: 'API Docs (TODO)',
        items: [
        ]
      },
      {
        text: 'Contributing',
        link: '/contributing'
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/psychoinformatics-de/shacl-vue' }
    ]
  }
})
