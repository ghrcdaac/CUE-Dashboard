// src/utils/errorUtils.js

/**
 * Parses a raw API error object and returns a user-friendly string.
 * @param {Error} error - The error object from a failed API call.
 * @returns {string} A user-friendly error message.
 */
export const parseApiError = (error) => {
  const detail = error.response?.detail;

  // --- NEW: Handle FastAPI/Pydantic validation errors ---
  // These errors come as an array of objects. We'll take the first message.
  if (Array.isArray(detail) && detail.length > 0 && detail[0].msg) {
    return detail[0].msg;
  }

  // Handle cases where 'detail' is a simple string.
  if (typeof detail === 'string') {
    // For Foreign Key errors (e.g., trying to delete a linked user)
    if (detail.includes('violates foreign key constraint')) {
      return 'This item cannot be deleted because it is still linked to other resources (e.g., as a point of contact).';
    }
    // For Check Constraint errors (e.g., the api_key owner issue)
    if (detail.includes('violates check constraint')) {
      return 'The data provided is invalid or incomplete. Please check the form and try again.';
    }
    // For Unique Constraint errors (e.g., creating something that already exists)
    if (detail.includes('violates unique constraint') || detail.includes('already exists')) {
      return 'An item with this name or ID already exists.';
    }
    // If no specific keyword match, return the original string detail.
    return detail;
  }
  
  // Fallback for all other error types
  return error.message || 'An unexpected error occurred.';
};