// src/utils/validation.js
export const isValidEmail = (email) => {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const isNotEmpty = (value) => {
    // null and undefined values handling
    if (value === null || value === undefined) {
        return false;
    }
    return value.trim() !== '';
};