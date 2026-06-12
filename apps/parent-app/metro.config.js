const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// Force singleton packages to always resolve from the app's own node_modules,
// preventing duplicate React instances across monorepo symlinks.
config.resolver.extraNodeModules = {
  'react':              path.resolve(projectRoot, 'node_modules/react'),
  'react-native':       path.resolve(projectRoot, 'node_modules/react-native'),
  'react/jsx-runtime':  path.resolve(projectRoot, 'node_modules/react/jsx-runtime'),
}

module.exports = config
