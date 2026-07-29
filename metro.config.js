const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Enable async requires for React.lazy() and dynamic imports
config.transformer.asyncRequireModulePath = require.resolve(
  "@expo/metro-config/build/async-require"
);

module.exports = config;
