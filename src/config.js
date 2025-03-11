// src/config.js
export const config = {
    apiBaseUrl: process.env.REACT_APP_API_BASE_URL || "http://localhost:8000", // Default to localhost:8000 if not set in .env
    version: "0.0.12",
    cognitoUserPoolId: "us-west-2_P9iA4SzlA", 
    cognitoClientId: "79gtmmmfqupli6li25aar2p4u9"

};