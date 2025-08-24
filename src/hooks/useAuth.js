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
        
        // 1. First, check the user's status
        const statusResponse = await fetch(`${config.apiBaseUrl}/auth/status`, {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });
        if (!statusResponse.ok) throw new Error('Could not verify user status.');
        const { status } = await statusResponse.json();

        // 2. Then, build and save the session based on the status
        let session = {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            idToken: tokenData.id_token,
            expiresAt: Date.now() + (tokenData.expires_in * 1000),
            status: status, // Always save the status
        };

        if (status === 'registered') {
            // If registered, THEN fetch the full user profile and add it to the session
            localStorage.setItem('CUE_TEMP_TOKEN', tokenData.access_token);
            const userProfile = await getMyProfile();
            localStorage.removeItem('CUE_TEMP_TOKEN');

            let activeNgroupId = null;
            if (userProfile.ngroups && userProfile.ngroups.length > 0 && userProfile.ngroups[0].id) {
                activeNgroupId = userProfile.ngroups[0].id;
            }
            
            session.user = userProfile;
            session.active_ngroup_id = activeNgroupId;
        } else {
            // For new or pending users, the session is minimal
            session.user = null;
            session.active_ngroup_id = null;
        }

        sessionService.setSession(session);
        dispatch(sessionRestored(session));

        return { status, id_token: tokenData.id_token };

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
        dispatch(setLoading(true));
        const session = sessionService.getSession();

        // --- FIX: Restore any valid, non-expired session ---
        // This allows new/pending users to stay on their respective pages on refresh.
        if (session && session.accessToken && session.expiresAt && (Date.now() < session.expiresAt)) {
            dispatch(sessionRestored(session));
        } else {
            sessionService.clearSession();
            dispatch(logoutSuccess());
        }
        dispatch(setLoading(false));
    }, [dispatch]);

    const setActiveNgroup = useCallback((ngroupId) => {
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
