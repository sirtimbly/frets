// rollup.config.js
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import alias from 'rollup-plugin-alias';


const substituteModulePaths = {
    // 'lodash-es': 'node_modules/lodash-es',
    'maquette': 'node_modules/maquette/dist/index.js',
    '../node_modules/lodash.throttle': 'node_modules/lodash.throttle/index.js',
    '../node_modules/lodash.memoize': 'node_modules/lodash.memoize/index.js'
}

export default {
    entry: 'build/module/index.js',
    sourceMap: true,
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
        })
    ]
}
