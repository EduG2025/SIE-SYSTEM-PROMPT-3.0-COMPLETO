import { useState, useEffect, useCallback } from 'react';

type ValidationStatus = 'idle' | 'checking' | 'valid' | 'invalid';

interface UrlValidationResult {
    status: ValidationStatus;
    message: string;
}

export const useUrlValidation = (initialUrl: string = '') => {
    const [url, setUrl] = useState(initialUrl);
    const [validation, setValidation] = useState<UrlValidationResult>({ status: 'idle', message: '' });

    const validate = useCallback(async (urlToValidate: string) => {
        const urlRegex = /^https?:\/\/.+/;
        if (!urlToValidate.trim()) {
            setValidation({ status: 'idle', message: '' });
            return;
        }

        if (!urlRegex.test(urlToValidate)) {
            setValidation({ status: 'invalid', message: 'Formato de URL inválido. Use http:// ou https://' });
            return;
        }

        setValidation({ status: 'checking', message: 'Verificando...' });

        try {
            // A simple fetch with no-cors is a lightweight way to check if an endpoint is reachable
            // without running into CORS issues. It doesn't guarantee a 200 OK, but confirms reachability.
            await fetch(urlToValidate, { mode: 'no-cors' });
            setValidation({ status: 'valid', message: 'URL válida e acessível.' });
        } catch (error) {
            // This catches network errors, DNS issues, etc.
            setValidation({ status: 'invalid', message: 'URL parece inacessível.' });
        }
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            validate(url);
        }, 700); // Debounce validation to avoid spamming checks while user types

        return () => clearTimeout(handler);
    }, [url, validate]);

    return {
        url,
        setUrl,
        validation,
        isChecking: validation.status === 'checking',
        isValid: validation.status === 'valid',
        isInvalid: validation.status === 'invalid',
    };
};
