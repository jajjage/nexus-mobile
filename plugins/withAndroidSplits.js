const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Config plugin to ensure 32-bit and 64-bit ARM support.
 * Essential for compatibility with budget/older Android devices.
 */
const withAndroidSplits = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = updateGradleConfig(config.modResults.contents);
    }
    return config;
  });
};

function updateGradleConfig(buildGradle) {
  // Check if we specifically want to restrict the build (e.g. for small dev APKs)
  const arm64Only = process.env.BUILD_ARM64_ONLY === 'true';
  
  // SUPPORTED ARCHITECTURES:
  // - "armeabi-v7a": 32-bit ARM (Older/Budget phones)
  // - "arm64-v8a": 64-bit ARM (Modern phones)
  const compatibleFilters = '"armeabi-v7a", "arm64-v8a"';
  const restrictedFilters = '"arm64-v8a"';

  const selectedFilters = arm64Only ? restrictedFilters : compatibleFilters;

  // 1. If abiFilters already exists, update it
  if (buildGradle.includes('abiFilters')) {
    return buildGradle.replace(/abiFilters\s+.*$/, `abiFilters ${selectedFilters}`);
  }

  // 2. If ndk block exists but no filters, add them
  if (buildGradle.includes('ndk {')) {
    return buildGradle.replace('ndk {', `ndk {\n            abiFilters ${selectedFilters}`);
  }

  // 3. Most common case for Expo: add ndk block to defaultConfig
  if (buildGradle.includes('defaultConfig {')) {
    return buildGradle.replace(
      'defaultConfig {',
      `defaultConfig {
        ndk {
            abiFilters ${selectedFilters}
        }`
    );
  }

  return buildGradle;
}

module.exports = withAndroidSplits;