module.exports = {
  title: 'FRETS',
  base: '/frets/',
  description: 'Docs for the Library',
  themeConfig: {
    nav: [{
        text: 'Home',
        link: '/'
      },
      {
        text: 'Guide',
        link: '/guide/'
      },
      {
        text: 'Github',
        link: 'https://github.com/sirtimbly/frets/'
      },
      {
        text: 'API Docs',
        link: 'https://sirtimbly.github.io/frets/api/'
      },
    ],
    sidebar: [
      '/',
      '/guide/'
    ]
  }
}
