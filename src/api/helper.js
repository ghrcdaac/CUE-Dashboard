async function handleResponse(response, errorMessagePrefix) {
    // ... (same handleResponse implementation as in fileApi.js) ...
     if (!response.ok) {
        let errorData;
        try {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                errorData = await response.json();
            } else {
                errorData = { message: await response.text() };
            }
        } catch (e) {
            errorData = { message: response.statusText };
        }
        const message = `${errorMessagePrefix}: ${errorData?.detail || errorData?.message || response.statusText} (Status: ${response.status})`;
        console.error(message, errorData);
        const error = new Error(message);
        error.status = response.status;
        error.data = errorData;
        throw error;
    }
    if (response.status === 204) { return null; }
     try {
        return await response.json();
     } catch(e) {
         if (response.ok && response.status !== 204) {
             console.warn(`Response was OK but not JSON for ${response.url}`);
             return { success: true };
         }
         throw e;
     }
}

function buildQueryString(params) {
    // ... (same buildQueryString implementation as in fileApi.js) ...
    const queryParams = new URLSearchParams();
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value != null) { // Check for null or undefined
                queryParams.append(key, value);
            }
        });
    }
    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
}