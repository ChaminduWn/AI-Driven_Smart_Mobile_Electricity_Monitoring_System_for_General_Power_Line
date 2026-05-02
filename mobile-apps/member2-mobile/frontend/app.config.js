const fs = require('fs');
const path = require('path');
const appJson = require('./app.json');

const readGradleProperty = (propertyName) => {
  try {
    const gradlePropertiesPath = path.join(__dirname, 'android', 'gradle.properties');
    const gradleProperties = fs.readFileSync(gradlePropertiesPath, 'utf8');
    const match = gradleProperties.match(
      new RegExp(`^${propertyName}=(.*)$`, 'm')
    );

    return match?.[1]?.trim() || '';
  } catch (_error) {
    return '';
  }
};

module.exports = () => {
  const expoConfig = appJson.expo ?? {};
  const googleMapsApiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    readGradleProperty('GOOGLE_MAPS_API_KEY') ||
    '';

  const androidConfig = googleMapsApiKey
    ? {
        ...(expoConfig.android?.config ?? {}),
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      }
    : expoConfig.android?.config;

  return {
    ...expoConfig,
    android: {
      ...expoConfig.android,
      ...(androidConfig ? { config: androidConfig } : {}),
    },
    extra: {
      ...(expoConfig.extra ?? {}),
      googleMapsApiKeyConfigured: Boolean(googleMapsApiKey),
    },
  };
};
