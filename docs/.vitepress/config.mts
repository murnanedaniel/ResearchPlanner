import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "ResearchGraph",
  description: "A visual research planning tool",
  base: '/ResearchPlanner/',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'Components', link: '/components/' },
      { text: 'API', link: '/api/' }
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is ResearchGraph?', link: '/guide/' },
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Core Concepts', link: '/guide/core-concepts' }
        ]
      },
      {
        text: 'Components',
        items: [
          { text: 'Node System', link: '/components/node-system' },
          { text: 'Edge System', link: '/components/edge-system' },
          { text: 'Timeline', link: '/components/timeline' },
          { text: 'Subgraphs', link: '/components/subgraphs' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/yourusername/research-planner' }
    ]
  }
}) 