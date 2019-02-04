// rollup.config.js
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import alias from 'rollup-plugin-alias';
import { terser } from 'rollup-plugin-terser';

const substituteModulePaths = {
    'maquette': 'node_modules/maquette/dist/index.js',
    '../node_modules/lodash.throttle': 'node_modules/lodash.throttle/index.js',
    '../node_modules/lodash.memoize': 'node_modules/lodash.memoize/index.js'
}

export default {
    input: 'build/module/index.js',
    output: {
        name: 'frets'
    },
    plugins: [
        alias(substituteModulePaths),
        nodeResolve({
            browser: true
        }),
        commonjs({
            namedExports: {
              // left-hand side can be an absolute path, a path
              // relative to the current directory, or the name
              // of a module in node_modules
              'maquette': [ 'Projector', 'createProjector' ]
            }
        }),
        terser()
    ]
}
