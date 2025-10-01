import apiClient from './apiClient';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Get notification preferences for a user
export async function getUserNotification() {
    const url = `/notification/user`;
    return apiClient.get(url);
}

// Update an existing notification preference
export const updateUserNotification = async (notificationId, payload, accessToken) => {
  if (!accessToken) {
        throw new Error("No access token provided");
    }

    const url = new URL(`${API_BASE_URL}/v2/notification/${notificationId}`);

    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json', // Include content type, even for GET
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to user notification: ${response.status}`);
    }
    return await response.json();
};

export const createUserNotification = async (payload) => {

    const url = `/notification`;

    // const response = await fetch(url, {
    //     method: 'POST',
    //     headers: {
    //         'Authorization': `Bearer ${accessToken}`,
    //         'Content-Type': 'application/json', // Include content type, even for GET
    //     },
    //     body: JSON.stringify(payload),
    // });

    // if (!response.ok) {
    //     const errorData = await response.json();
    //     throw new Error(errorData.detail || `Failed to user notification: ${response.status}`);
    // }
    return apiClient.post(url, payload);
};