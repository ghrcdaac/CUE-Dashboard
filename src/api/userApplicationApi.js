import apiClient from './apiClient';

// Note: All functions now use the apiClient, which handles auth automatically.
// Endpoint paths have been updated from /v1/ to / to match the backend.

export const createUserApplication = (applicationData) => {
    // This is a public endpoint, so we can use a standard fetch or the apiClient.
    // Using apiClient is fine, it will just not add an auth header if no token exists.
    return apiClient.post('/user_application/', applicationData);
};

export const getNgroups = () => {
    // This is a public endpoint.
    return apiClient.get('/user_application/ngroups');
};

export const getProvidersForNgroup = (ngroupId) => {
    // This is a public endpoint.
    return apiClient.get(`/user_application/ngroups/${ngroupId}/providers`);
};

export const listUserApplications = (status) => {
    let url = `/user_application/`;
    if (status) {
        url += `?status=${status}`;
    }
    return apiClient.get(url);
};

export const approveUserApplication = (applicationId, roleId) => {
    return apiClient.post(`/user_application/${applicationId}/approve?role_id=${roleId}`);
};

export const rejectUserApplication = (applicationId) => {
    return apiClient.post(`/user_application/${applicationId}/reject`);
};


export const updateUserApplication = (userApplicationId, updatedData) => {
    return apiClient.patch(`/user_application/${userApplicationId}`, updatedData);
};

export const deleteUserApplication = (userApplicationId, ngroupId) => {
    let url = `/user_application/${userApplicationId}`;
    if (ngroupId) {
        url += `?ngroup_id=${ngroupId}`;
    }
    return apiClient.delete(url);
};
