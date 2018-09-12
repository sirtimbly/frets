var browserEnv = require('browser-env');
browserEnv();
window.requestAnimationFrame = (callback) => setTimeout(callback, 16);
global.requestAnimationFrame = window.requestAnimationFrame;
