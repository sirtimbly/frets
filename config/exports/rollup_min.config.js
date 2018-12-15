// rollup.config.js
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import alias from 'rollup-plugin-alias';
import { terser } from 'rollup-plugin-terser';

const substituteModulePaths = {
    'crypto': 'build/module/adapters/crypto.browser.js',
    'maquette': 'node_modules/maquette/dist/index.js',
    'hash.js': 'build/temp/hash.js'
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
