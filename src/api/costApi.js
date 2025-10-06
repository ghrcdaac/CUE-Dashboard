// src/api/costApi.js

import apiClient from './apiClient';

/**
 * Helper to build a query string from a filters object.
 * MODIFICATION: This function no longer adds the leading '?'.
 * @param {object} params - The object of query parameters.
 * @returns {string} A URL query string (e.g., "key=value&key2=value2").
 */
function buildQueryString(params) {
    const queryParams = new URLSearchParams();
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value != null && value !== '') {
                queryParams.append(key, value);
            }
        });
    }
    return queryParams.toString();
}

/**
 * Retrieves the summary of all cost metrics. (V2)
 * Corresponds to: GET /file-metrics/cost-summary
 * @param {object} filters - Optional filters { startDate, endDate, userId, etc. }
 */
export const getCostSummary = (filters) => {
    const queryString = buildQueryString(filters);
    const url = `/file-metrics/cost-summary${queryString ? `?${queryString}` : ''}`;
    return apiClient.get(url);
};

/**
 * Retrieves a paginated list of costs aggregated by collection. (V2)
 * Corresponds to: GET /file-metrics/cost-by-collection
 * @param {object} params - { filters, page, pageSize }
 */
export const getCostByCollection = (params) => {
    const { filters, ...pagination } = params;
    const allParams = { ...filters, ...pagination };
    const queryString = buildQueryString(allParams);
    const url = `/file-metrics/cost-by-collection${queryString ? `?${queryString}` : ''}`;
    return apiClient.get(url);
};

/**
 * Retrieves a paginated list of costs for individual files. (V2)
 * Corresponds to: GET /file-metrics/cost-by-file
 * @param {object} params - { filters, page, pageSize }
 */
export const getCostByFile = (params) => {
    const { filters, ...pagination } = params;
    const allParams = { ...filters, ...pagination };
    const queryString = buildQueryString(allParams);
    const url = `/file-metrics/cost-by-file${queryString ? `?${queryString}` : ''}`;
    return apiClient.get(url);
};