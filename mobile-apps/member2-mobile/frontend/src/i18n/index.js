import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import si from './locales/si.json';

const LANGUAGE_KEY = '@app_language';

const languageDetector = {
    type: 'languageDetector',
    async: true,
    detect: async (callback) => {
        try {
            const storedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
            if (storedLanguage) {
                return callback(storedLanguage);
            }
            return callback('en'); // Default language
        } catch (error) {
            console.log('Error reading language from AsyncStorage:', error);
            return callback('en');
        }
    },
    init: () => { },
    cacheUserLanguage: async (language) => {
        try {
            await AsyncStorage.setItem(LANGUAGE_KEY, language);
        } catch (error) {
            console.log('Error saving language to AsyncStorage:', error);
        }
    },
};

const resources = {
    en: { translation: en },
    si: { translation: si },
};

i18n
    .use(languageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        react: {
            useSuspense: false, // Required for React Native to prevent Suspense errors
        },
        interpolation: {
            escapeValue: false, // React already safes from XSS
        },
    });

export default i18n;
