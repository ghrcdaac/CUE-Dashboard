// src/api/fileMetricsApi.js

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
    return queryParams.toString();
}

/**
 * Retrieves the main summary of all volume, count, and status metrics.
 * Ideal for a main dashboard view.
 * @param {object} filters - Optional filters { startDate, endDate, userId, collectionId, providerId }
 */
export const getMetricsSummary = (filters) => {
    const queryString = buildQueryString(filters);
    return apiClient.get(`/file-metrics/summary?${queryString}`);
};

/**
 * Retrieves just the daily volume metrics.
 * @param {object} filters - Optional filters.
 */
export const getDailyVolume = (filters) => {
    const queryString = buildQueryString(filters);
    return apiClient.get(`/file-metrics/daily-volume?${queryString}`);
};

/**
 * Retrieves just the daily file count metrics.
 * @param {object} filters - Optional filters.
 */
export const getDailyCount = (filters) => {
    const queryString = buildQueryString(filters);
    return apiClient.get(`/file-metrics/daily-count?${queryString}`);
};

/**
 * Retrieves just the overall volume metric.
 * @param {object} filters - Optional filters.
 */
export const getOverallVolume = (filters) => {
    const queryString = buildQueryString(filters);
    return apiClient.get(`/file-metrics/overall-volume?${queryString}`);
};

/**
 * Retrieves just the overall file count metric.
 * @param {object} filters - Optional filters.
 */
export const getOverallCount = (filters) => {
    const queryString = buildQueryString(filters);
    return apiClient.get(`/file-metrics/overall-count?${queryString}`);
};

/**
 * Retrieves the breakdown of file counts by status.
 * @param {object} filters - Optional filters.
 */
export const getStatusCounts = (filters) => {
    const queryString = buildQueryString(filters);
    return apiClient.get(`/file-metrics/status-counts?${queryString}`);
};

/**
 * Retrieves a summary of all cost metrics.
 * @param {object} filters - Optional filters.
 */
export const getCostSummary = (filters) => {
    const queryString = buildQueryString(filters);
    return apiClient.get(`/file-metrics/cost-summary?${queryString}`);
};

/**
 * Retrieves a paginated list of costs aggregated by collection.
 * @param {object} params - { filters, page, pageSize }
 */
export const getCostByCollection = (params) => {
    const { filters, ...pagination } = params;
    const filtersQuery = buildQueryString(filters);
    const paginationQuery = buildQueryString(pagination);
    return apiClient.get(`/file-metrics/cost-by-collection?${filtersQuery}&${paginationQuery}`);
};

/**
 * Retrieves a paginated list of costs for individual files.
 * @param {object} params - { filters, page, pageSize }
 */
export const getCostByFile = (params) => {
    const { filters, ...pagination } = params;
    const filtersQuery = buildQueryString(filters);
    const paginationQuery = buildQueryString(pagination);
    return apiClient.get(`/file-metrics/cost-by-file?${filtersQuery}&${paginationQuery}`);
};