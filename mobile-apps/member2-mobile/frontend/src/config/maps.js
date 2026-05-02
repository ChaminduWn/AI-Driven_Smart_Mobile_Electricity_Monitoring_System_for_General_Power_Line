import Constants from 'expo-constants';

const configuredFromExpo =
    Constants.expoConfig?.extra?.googleMapsApiKeyConfigured ??
    Constants.manifest?.extra?.googleMapsApiKeyConfigured;

export const liveGoogleMapEnabled = Boolean(
    configuredFromExpo ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
);
