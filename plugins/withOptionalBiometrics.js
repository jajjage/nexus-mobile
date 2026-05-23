const { withAndroidManifest } = require('@expo/config-plugins');

const withOptionalBiometrics = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;

    if (!androidManifest.manifest['uses-feature']) {
      androidManifest.manifest['uses-feature'] = [];
    }

    // Explicitly mark common hardware features as optional
    const features = [
      { name: 'android.hardware.fingerprint', required: 'false' },
      { name: 'android.hardware.biometrics', required: 'false' },
      { name: 'android.hardware.camera', required: 'false' },
      { name: 'android.hardware.camera.autofocus', required: 'false' },
      { name: 'android.hardware.location', required: 'false' },
      { name: 'android.hardware.location.gps', required: 'false' },
      { name: 'android.hardware.location.network', required: 'false' }
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

    // Add tools namespace to manifest element if missing
    if (!androidManifest.manifest.$['xmlns:tools']) {
      androidManifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    // Add activity override to application element
    const mainApplication = androidManifest.manifest.application[0];
    if (!mainApplication.activity) {
      mainApplication.activity = [];
    }

    const activityName = 'com.google.mlkit.vision.codescanner.internal.GmsBarcodeScanningDelegateActivity';
    const existingActivity = mainApplication.activity.find(
      (a) => a.$['android:name'] === activityName
    );

    if (existingActivity) {
      existingActivity.$['android:screenOrientation'] = 'fullSensor';
      existingActivity.$['tools:replace'] = 'android:screenOrientation';
    } else {
      mainApplication.activity.push({
        $: {
          'android:name': activityName,
          'android:screenOrientation': 'fullSensor',
          'tools:replace': 'android:screenOrientation',
          'android:exported': 'false'
        }
      });
    }

    return config;
  });
};

module.exports = withOptionalBiometrics;

