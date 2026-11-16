const { AndroidConfig, withGradleProperties } = require('expo/config-plugins');

module.exports = function withAndroidPreviewBuild(config) {
  if (process.env.STUDYSTREAK_ANDROID_PREVIEW !== '1') return config;

  return withGradleProperties(config, (config) => {
    const properties = config.modResults;
    const { updateAndroidBuildProperty } = AndroidConfig.BuildProperties;

    // The M150 prefixed WebRTC AAR references an absent JNI class in R8.
    // Keep the signed preview APK independent of Metro without running R8.
    updateAndroidBuildProperty(properties, 'android.enableMinifyInReleaseBuilds', 'false');
    updateAndroidBuildProperty(properties, 'android.enableShrinkResourcesInReleaseBuilds', 'false');
    return config;
  });
};
