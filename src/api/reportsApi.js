// src/api/reportsApi.js

import apiClient from './apiClient';
import dayjs from 'dayjs';

const formatDateString = (dateVal) => {
    if (!dateVal) return null;
    if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        return dateVal;
    }
    const d = dayjs(dateVal);
    return d.isValid() ? d.format('YYYY-MM-DD') : null;
};

/**
 * Requests an async file status report from the backend.
 * Expects backend schema FileStatusPdfReportRequest:
 * {
 *   status: string,
 *   start_date?: string (YYYY-MM-DD),
 *   end_date?: string (YYYY-MM-DD)
 * }
 */
export const triggerFileStatusReport = ({ status, start_date, end_date, filters = {} }) => {
    const userStartDate = formatDateString(start_date || filters.start_date);
    const userEndDate = formatDateString(end_date || filters.end_date);

    const finalEndDate = userEndDate || dayjs().format('YYYY-MM-DD');
    const finalStartDate = userStartDate || dayjs(finalEndDate).subtract(7, 'day').format('YYYY-MM-DD');

    return apiClient.post('/reports/status-pdf', {
        status,
        start_date: finalStartDate,
        end_date: finalEndDate,
    });
};
