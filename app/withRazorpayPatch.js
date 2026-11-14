const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withRazorpayPatch(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = config.modResults.contents.replace(
        /allprojects\s*\{\s*repositories\s*\{/,
        "allprojects {\n    repositories {\n        mavenCentral()\n"
      );
    }
    return config;
  });
};
