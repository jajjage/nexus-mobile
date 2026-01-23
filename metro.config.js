const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.transformer.minifierConfig = {
  compress: {
    drop_console: true, // Remove console.logs
  },
};

module.exports = withNativeWind(config, { input: './global.css' });
