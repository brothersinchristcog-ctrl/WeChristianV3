const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude Gradle Kotlin compiler build and caching directories from the Metro file watcher
config.resolver.blockList = [
  /node_modules\/.*\/build\/kotlin\/.*/,
  /node_modules\/.*\/compileKotlin\/.*/,
  /node_modules\/expo-updates\/.*\/caches-jvm.*/,
  /.*\/build\/kotlin\/compileKotlin\/.*/
];

const path = require('path');
const workspaceRoot = path.resolve(__dirname, '../');

config.watchFolders = [...(config.watchFolders || []), workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
