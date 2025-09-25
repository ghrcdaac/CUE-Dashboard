// src/config.js
/**
 * Returns a configuration object based on the current environment.
 * The environment is determined by the REACT_APP_APP_ENV variable.
 * Defaults to 'uat' for safety in local development.
 */
const getEnvConfig = () => {
    const env = process.env.REACT_APP_APP_ENV || 'uat';

    switch (env) {
        case 'sit':
            return {
                apiBaseUrl: 'https://upload.sit.earthdata.nasa.gov/api/v2',
                keycloakHost: 'https://idfs.uat.earthdata.nasa.gov',
                keycloakClientId: 'cue-uat' // SIT-specific Client ID
            };
        case 'prod':
            return {
                apiBaseUrl: 'https://upload.earthdata.nasa.gov/api/v2',
                keycloakHost: 'https://idfs.earthdata.nasa.gov',
                keycloakClientId: 'cue-uat' // Production Client ID
            };
        case 'uat':
        default:
            return {
                apiBaseUrl: 'https://upload.uat.earthdata.nasa.gov/api/v2',
                // http://localhost:8000/v2
                // https://upload.uat.earthdata.nasa.gov/api/v2
                keycloakHost: 'https://idfs.uat.earthdata.nasa.gov',
                keycloakClientId: 'cue-uat' // UAT-specific Client ID
            };
    }
};

const envConfig = getEnvConfig();

export const config = {

    // Spread the environment-specific settings
    ...envConfig,

    // Static settings that are the same across all environments
    version: "0.0.30",
    keycloakRealm: "cue",
};


// SIT
// cognitoUserPoolId: "us-west-2_P9iA4SzlA", 
// cognitoClientId: "79gtmmmfqupli6li25aar2p4u9"
// 


// UAT
// cognitoUserPoolId: "us-west-2_x9nYiAMKS", 
// cognitoClientId: "44cr4134perjrvkgm437363fko"