import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/shacl-vue/docs/",
  title: "shacl-vue",
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
          { text: 'Overview', link: '/get-started' },
        ]
      },
      {
        text: 'App design',
        items: [
          { text: 'The big picture', link: '/app-design' },
        ]
      },
      {
        text: 'Setup and deployment',
        items: [
        ]
      },
      {
        text: 'API Docs',
        items: [
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/psychoinformatics-de/shacl-vue' }
    ]
  }
})
