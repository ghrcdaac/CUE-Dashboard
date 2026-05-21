// src/api/reportsApi.js

import apiClient from './apiClient';

/**
 * Requests an async file status report from the backend.
 * The API emails or otherwise notifies the user when a downloadable link is ready.
 */
export const triggerFileStatusReport = ({ status, filters = {}, format = 'pdf' }) => {
    return apiClient.post('/reports/file-status', {
        report_type: 'file_status',
        format,
        status,
        filters,
    });
};
