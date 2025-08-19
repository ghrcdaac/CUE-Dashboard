import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
    sessionRestored, 
    logoutSuccess, 
    setLoading,
    setActiveNgroup as setActiveNgroupAction
} from '../app/reducers/authSlice';
import { config } from '../config';
import sessionService from '../services/sessionService';
import { getMyProfile } from '../api/cueUser';

// Helper function for the apiClient to get the temp token during login
export const getTempToken = () => localStorage.getItem('CUE_TEMP_TOKEN');

function useAuth() {
    const dispatch = useDispatch();
    const authState = useSelector(state => state.auth);

    const login = useCallback(async () => {
        dispatch(setLoading(true));
        try {
            const response = await fetch(`${config.apiBaseUrl}/auth/login-url`);
            if (!response.ok) throw new Error('Failed to get login configuration.');
            
            const { login_url, state } = await response.json();
            sessionStorage.setItem('oauth_state', state);
            window.location.href = login_url;
        } catch (error) {
            console.error("Login initiation failed:", error);
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const handleAuthCallback = useCallback(async (code, state) => {
        const storedState = sessionStorage.getItem('oauth_state');
        if (state !== storedState) throw new Error('Invalid state parameter.');
        sessionStorage.removeItem('oauth_state');

        const response = await fetch(`${config.apiBaseUrl}/auth/exchange-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, state, redirect_uri: `${window.location.origin}/callback` }),
        });
        
        if (!response.ok) throw new Error('Failed to exchange authorization code for tokens.');

        const tokenData = await response.json();
        
        localStorage.setItem('CUE_TEMP_TOKEN', tokenData.access_token);
        const userProfile = await getMyProfile();
        localStorage.removeItem('CUE_TEMP_TOKEN');

        let activeNgroupId = null;
        // --- FIX: Correctly handle the expected list of objects ---
        if (userProfile.ngroups && userProfile.ngroups.length > 0 && userProfile.ngroups[0].id) {
            activeNgroupId = userProfile.ngroups[0].id; // Default to the first group's ID
        } else {
            console.warn("User profile does not contain a valid list of ngroup objects with IDs. Active group not set.");
        }

        const session = {
            user: userProfile,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt: Date.now() + (tokenData.expires_in * 1000),
            active_ngroup_id: activeNgroupId,
        };

        sessionService.setSession(session);
        dispatch(sessionRestored(session));

        return { status: 'registered' };

    }, [dispatch]);

    const logout = useCallback(async () => {
        const session = sessionService.getSession();
        const idToken = session ? session.idToken : null;
        
        sessionService.clearSession();
        dispatch(logoutSuccess());

        try {
            if (!idToken) throw new Error("No ID token found for logout.");
            
            const response = await fetch(`${config.apiBaseUrl}/auth/logout-url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_token_hint: idToken }),
            });
            if (!response.ok) throw new Error("Could not get logout URL from backend.");
            
            const { logout_url } = await response.json();
            window.location.href = logout_url;
        } catch (error) {
            console.error("Full logout failed, redirecting to login as a fallback.", error);
            window.location.href = '/login';
        }
    }, [dispatch]);

    const initializeAuth = useCallback(() => {
        console.log("Auth: Initializing session...");
        dispatch(setLoading(true));
        const session = sessionService.getSession();
        console.log("Auth: Found session data in localStorage:", session);

        if (session && session.accessToken && session.expiresAt && (Date.now() < session.expiresAt)) {
            console.log("Auth: Session is valid and not expired. Restoring session to Redux.");
            dispatch(sessionRestored(session));
        } else {
            console.log("Auth: No valid session found. Clearing any remnants.");
            sessionService.clearSession();
            dispatch(logoutSuccess());
        }
        dispatch(setLoading(false));
    }, [dispatch]);

    const setActiveNgroup = useCallback((ngroupId) => {
        console.log(`Auth: Setting active ngroup to ${ngroupId}`);
        sessionService.setActiveNgroup(ngroupId);
        dispatch(setActiveNgroupAction(ngroupId));
    }, [dispatch]);

    return { 
        ...authState, 
        login, 
        logout, 
        handleAuthCallback, 
        initializeAuth,
        setActiveNgroup,
    };
}

export default useAuth;
