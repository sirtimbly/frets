var browserEnv = require('browser-env');
browserEnv({url: 'http://localhost:3000/'});
window.requestAnimationFrame = (callback) => setTimeout(callback, 16);
global.requestAnimationFrame = window.requestAnimationFrame;
