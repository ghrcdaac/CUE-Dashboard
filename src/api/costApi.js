// src/api/costApi.js

import apiClient from './apiClient';

/**
 * Helper to build a query string from a filters object.
 * @param {object} params - The object of query parameters.
 * @returns {string} A URL query string.
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
    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
}

/**
 * Retrieves the summary of all cost metrics. (V2)
 * Corresponds to: GET /file-metrics/cost-summary
 * @param {object} filters - Optional filters { startDate, endDate, userId, etc. }
 */
export const getCostSummary = (filters) => {
    const queryString = buildQueryString(filters);
    return apiClient.get(`/file-metrics/cost-summary${queryString}`);
};

/**
 * Retrieves a paginated list of costs aggregated by collection. (V2)
 * Corresponds to: GET /file-metrics/cost-by-collection
 * @param {object} params - { filters, page, pageSize }
 */
export const getCostByCollection = (params) => {
    const { filters, ...pagination } = params;
    const filtersQuery = buildQueryString(filters);
    const paginationQuery = buildQueryString(pagination);
    const separator = filtersQuery && paginationQuery ? '&' : '';
    return apiClient.get(`/file-metrics/cost-by-collection${filtersQuery}${separator}${paginationQuery}`);
};

/**
 * Retrieves a paginated list of costs for individual files. (V2)
 * Corresponds to: GET /file-metrics/cost-by-file
 * @param {object} params - { filters, page, pageSize }
 */
export const getCostByFile = (params) => {
    const { filters, ...pagination } = params;
    const filtersQuery = buildQueryString(filters);
    const paginationQuery = buildQueryString(pagination);
    const separator = filtersQuery && paginationQuery ? '&' : '';
    return apiClient.get(`/file-metrics/cost-by-file${filtersQuery}${separator}${paginationQuery}`);
};