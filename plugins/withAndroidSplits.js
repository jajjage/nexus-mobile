const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Config plugin to ensure 32-bit and 64-bit ARM support.
 * Essential for compatibility with budget/older Android devices.
 * Also adds x86 support for broader compatibility with older tablets.
 */
const withAndroidSplits = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = updateGroovyConfig(config.modResults.contents);
    } else if (config.modResults.language === 'kotlin') {
      config.modResults.contents = updateKotlinConfig(config.modResults.contents);
    }
    return config;
  });
};

function updateGroovyConfig(buildGradle) {
  const arm64Only = process.env.BUILD_ARM64_ONLY === 'true';
  const selectedFilters = arm64Only 
    ? '"arm64-v8a"' 
    : '"armeabi-v7a", "arm64-v8a", "x86", "x86_64"';

  console.log(`[withAndroidSplits] Applying Groovy ABI filters: ${selectedFilters}`);

  // 1. If abiFilters already exists, update it
  if (buildGradle.includes('abiFilters')) {
    return buildGradle.replace(/abiFilters\s+.*$/, `abiFilters ${selectedFilters}`);
  }

  // 2. If ndk block exists but no filters, add them
  if (buildGradle.includes('ndk {')) {
    return buildGradle.replace('ndk {', `ndk {\n            abiFilters ${selectedFilters}`);
  }

  // 3. Add ndk block to defaultConfig if missing
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

function updateKotlinConfig(buildGradle) {
  const arm64Only = process.env.BUILD_ARM64_ONLY === 'true';
  const selectedFilters = arm64Only 
    ? '"arm64-v8a"' 
    : '"armeabi-v7a", "arm64-v8a", "x86", "x86_64"';

  console.log(`[withAndroidSplits] Applying Kotlin ABI filters: ${selectedFilters}`);

  if (buildGradle.includes('abiFilters')) {
    return buildGradle.replace(/abiFilters.addAll\(.*\)/, `abiFilters.addAll(listOf(${selectedFilters}))`);
  }

  if (buildGradle.includes('ndk {')) {
    return buildGradle.replace('ndk {', `ndk {\n            abiFilters.addAll(listOf(${selectedFilters}))`);
  }

  if (buildGradle.includes('defaultConfig {')) {
    return buildGradle.replace(
      'defaultConfig {',
      `defaultConfig {\n        ndk {\n            abiFilters.addAll(listOf(${selectedFilters}))\n        }`
    );
  }

  return buildGradle;
}

module.exports = withAndroidSplits;