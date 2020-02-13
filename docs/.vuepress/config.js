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
        text: 'Start using Frets',
        link: '/guide/'
      },
      {
        text: 'Github',
        link: 'https://github.com/sirtimbly/frets/'
      },
      {
        text: 'API Docss',
        link: 'https://sirtimbly.github.io/frets/api/'
      },
    ],
    sidebar: [
      '/',
      '/guide/',
      '/guide/layers',
      '/guide/components',
      '/guide/philosophy'      
    ]
  }
}
