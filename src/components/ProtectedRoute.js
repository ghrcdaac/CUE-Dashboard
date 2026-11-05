import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

/**
 * Guards every signed-in page (used once around each layout in App.js).
 *  - Not signed in                     -> /login (as before).
 *  - Signed in but not yet registered  -> /signup, or /pending-approval while the
 *    application is under review. These users have a token but no CUE profile
 *    (`user` is null), so the app pages can't work for them.
 * Checks `user`, not `status`, so older saved sessions of registered users still pass.
 * Never runs while auth is loading: App shows a spinner until initializeAuth finishes.
 */
function ProtectedRoute({ children }) {
    const { isAuthenticated, user, status } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to when they were redirected.
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (!user) {
        return <Navigate to={status === 'pending_approval' ? '/pending-approval' : '/signup'} replace />;
    }

    return children;
}
export default ProtectedRoute;
