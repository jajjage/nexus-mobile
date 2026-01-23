const { withAppBuildGradle } = require('expo/config-plugins');

const withAndroidSplits = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = addSplitsToGradle(config.modResults.contents);
    } else {
      throw new Error('Cannot add splits to build.gradle because it is not groovy');
    }
    return config;
  });
};

function addSplitsToGradle(buildGradle) {
  if (buildGradle.includes('splits {')) {
    return buildGradle;
  }

  // Density split (always enabled as per original request)
  let splitsBlock = `
    splits {
        density {
            enable true
            exclude "ldpi", "mdpi"
            compatibleScreens 'small', 'normal', 'large', 'xlarge'
        }
`;

  // ABI split (conditional)
  if (process.env.BUILD_ARM64_ONLY === 'true') {
    splitsBlock += `
        abi {
            enable true
            reset()
            include "arm64-v8a"
            universalApk false
        }
`;
  }

  splitsBlock += `    }`;

  // Insert inside android { ... } block
  // matches android { ...
  return buildGradle.replace(/android\s?{/, `android {${splitsBlock}`);
}

module.exports = withAndroidSplits;
