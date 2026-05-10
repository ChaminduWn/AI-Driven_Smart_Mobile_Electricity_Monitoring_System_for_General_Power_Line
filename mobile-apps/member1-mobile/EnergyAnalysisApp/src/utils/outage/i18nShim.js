import en from '../../i18n/outage/en.json';

const translations = { en };

export const useTranslation = () => {
    const t = (key, options = {}) => {
        const parts = key.split('.');
        let value = translations.en;
        
        for (const part of parts) {
            value = value?.[part];
        }

        if (options.returnObjects) {
            return value || [];
        }

        if (typeof value === 'string' && options.count !== undefined) {
            return value.replace('{{count}}', options.count);
        }

        return value || key;
    };

    return {
        t,
        i18n: {
            language: 'en',
            changeLanguage: () => {},
        },
    };
};
