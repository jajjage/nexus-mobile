const { withAppBuildGradle } = require('expo/config-plugins');

const withAndroidSplits = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = updateGradleConfig(config.modResults.contents);
    } else {
      throw new Error('Cannot add splits to build.gradle because it is not groovy');
    }
    return config;
  });
};

function updateGradleConfig(buildGradle) {
  // Check if we are building for ARM64 only (super lean)
  const arm64Only = process.env.BUILD_ARM64_ONLY === 'true';
  
  // Default to ARM only (exclude x86/x64 emulators) - this saves ~40-50%
  // If arm64Only is true, we save even more.
  const abiFilters = arm64Only 
    ? 'abiFilters "arm64-v8a"' 
    : 'abiFilters "armeabi-v7a", "arm64-v8a"';

  if (buildGradle.includes('ndk {')) {
    // If ndk block exists, we might need to be careful, but standard expo template usually doesn't have it in defaultConfig
    return buildGradle.replace(/ndk\s?{/, `ndk { ${abiFilters}`);
  }

  // Insert inside defaultConfig { ... }
  // Use a more robust regex to find defaultConfig
  if (buildGradle.includes('defaultConfig {')) {
    return buildGradle.replace(
      /defaultConfig\s?{/,
      `defaultConfig {
        ndk {
            ${abiFilters}
        }`
    );
  }

  return buildGradle;
}

module.exports = withAndroidSplits;