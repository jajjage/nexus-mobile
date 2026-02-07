const { withAndroidManifest } = require('@expo/config-plugins');

const withOptionalBiometrics = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;

    if (!androidManifest.manifest['uses-feature']) {
      androidManifest.manifest['uses-feature'] = [];
    }

    // Explicitly mark biometric hardware as optional
    const features = [
      { name: 'android.hardware.fingerprint', required: 'false' },
      { name: 'android.hardware.biometrics', required: 'false' }
    ];

    features.forEach(feature => {
      // Check if feature already exists
      const existingFeature = androidManifest.manifest['uses-feature'].find(
        (f) => f.$['android:name'] === feature.name
      );

      if (existingFeature) {
        existingFeature.$['android:required'] = feature.required;
      } else {
        androidManifest.manifest['uses-feature'].push({
          $: {
            'android:name': feature.name,
            'android:required': feature.required,
          }
        });
      }
    });

    return config;
  });
};

module.exports = withOptionalBiometrics;
