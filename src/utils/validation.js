// src/utils/validation.js
export const isValidEmail = (email) => {
    // Basic email validation (you might want a more robust solution)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const isNotEmpty = (value) => {
    // Handle null and undefined values
    if (value === null || value === undefined) {
        return false;
    }
    return value.trim() !== '';
};