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
        console.log('Auth: Starting login process...');
        dispatch(setLoading(true));
        try {
            const response = await fetch(`${config.apiBaseUrl}/auth/login-url`);
            if (!response.ok) throw new Error('Failed to get login configuration.');
            
            const { login_url, state } = await response.json();
            console.log('Auth: Got login URL. Storing state and redirecting.', { state });
            sessionStorage.setItem('oauth_state', state);
            window.location.href = login_url;
        } catch (error) {
            console.error("Auth: Login initiation failed:", error);
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const handleAuthCallback = useCallback(async (code, state) => {
        console.log('Auth: Handling OIDC callback...');
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
        console.log('Auth: Tokens exchanged successfully. Token data:', tokenData);
        
        const statusResponse = await fetch(`${config.apiBaseUrl}/auth/status`, {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });
        if (!statusResponse.ok) throw new Error('Could not verify user status.');
        const { status } = await statusResponse.json();
        console.log('Auth: User CUE status is:', status);

        let session = {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            idToken: tokenData.id_token,
            expiresAt: Date.now() + (tokenData.expires_in * 1000),
            status: status,
        };

        if (status === 'registered') {
            console.log('Auth: User is registered, fetching full profile...');
            localStorage.setItem('CUE_TEMP_TOKEN', tokenData.access_token);
            const userProfile = await getMyProfile();
            localStorage.removeItem('CUE_TEMP_TOKEN');
            console.log('Auth: Fetched user profile:', userProfile);

            let activeNgroupId = null;
            if (userProfile.ngroups && userProfile.ngroups.length > 0 && userProfile.ngroups[0].id) {
                activeNgroupId = userProfile.ngroups[0].id;
            }
            
            session.user = userProfile;
            session.active_ngroup_id = activeNgroupId;
        } else {
            console.log(`Auth: User is '${status}'. Creating minimal session.`);
            session.user = null;
            session.active_ngroup_id = null;
        }

        console.log("Auth: Setting post-login flag and saving session:", session);
        sessionStorage.setItem('CUE_POST_LOGIN_FLOW_ACTIVE', 'true');
        sessionService.setSession(session);
        dispatch(sessionRestored(session));

        console.log("Auth: Returning data to callback page:", { status, id_token: tokenData.id_token });
        return { status, id_token: tokenData.id_token };

    }, [dispatch]);

    const logout = useCallback(async () => {
        console.log('Auth: Starting logout process...');
        const session = sessionService.getSession();
        const idToken = session ? session.idToken : null;
        
        console.log('Auth: Clearing all local session data...');
        sessionStorage.removeItem('CUE_POST_LOGIN_FLOW_ACTIVE');
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
            console.log('Auth: Redirecting to Keycloak logout URL...');
            window.location.href = logout_url;
        } catch (error) {
            console.error("Auth: Full logout failed, redirecting to login as a fallback.", error);
            window.location.href = '/login';
        }
    }, [dispatch]);

    const initializeAuth = useCallback(() => {
        const isPostLoginFlow = sessionStorage.getItem('CUE_POST_LOGIN_FLOW_ACTIVE');
        if (isPostLoginFlow) {
            console.log("Auth: Post-login flow active, skipping initialization.");
            sessionStorage.removeItem('CUE_POST_LOGIN_FLOW_ACTIVE');
            return;
        }
        
        console.log("Auth: Initializing session...");
        dispatch(setLoading(true));
        const session = sessionService.getSession();
        console.log("Auth: Found session data in localStorage:", session);

        if (session && session.accessToken && session.expiresAt && (Date.now() < session.expiresAt)) {
            console.log("Auth: Session is valid and not expired. Restoring session to Redux.");
            dispatch(sessionRestored(session));
        } else {
            if (session) console.log("Auth: Session found but is invalid or expired.");
            else console.log("Auth: No session found.");
            
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
