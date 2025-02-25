import { useSelector, useDispatch } from 'react-redux';
import { loginSuccess, logoutSuccess, setChallengeName, setUser, setAccessToken } from '../app/reducers/authSlice';
import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoRefreshToken } from 'amazon-cognito-identity-js';
import { config } from '../config';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useCallback } from 'react'; // Import useCallback

const poolData = {
    UserPoolId: config.cognitoUserPoolId,
    ClientId: config.cognitoClientId,
};

const userPool = new CognitoUserPool(poolData);

function useAuth() {
    const dispatch = useDispatch();
    const auth = useSelector(state => state.auth);
    const { isAuthenticated, accessToken, refreshToken, username, challengeName, user } = auth;
    let refreshTimeout = null; //keep the timeout outside

    // Use useCallback for ALL your functions that are used as dependencies
    const login = useCallback(async (username, password, navigate) => {
        const authenticationData = {
            Username: username,
            Password: password,
        };
        const authenticationDetails = new AuthenticationDetails(authenticationData);

        const userData = {
            Username: username,
            Pool: userPool
        }
        const cognitoUser = new CognitoUser(userData);
        try{
            return new Promise((resolve, reject) => {
            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess: (result) => {
                    const accessToken = result.getAccessToken().getJwtToken();
                    const idToken = result.getIdToken().getJwtToken();
                    const refreshToken = result.getRefreshToken().getToken();
                    const decodedAccessToken = jwtDecode(accessToken); // Decode access token
                    const expirationTime = decodedAccessToken.exp; // Get expiration time (in seconds)

                    // Store username and tokens in localStorage with "CUE_" prefix
                    localStorage.setItem('CUE_username', username);
                    localStorage.setItem('CUE_refreshToken', refreshToken);
                    localStorage.setItem('CUE_accessToken', accessToken);
                    localStorage.setItem('CUE_accessTokenExpiration', expirationTime);


                    dispatch(loginSuccess({ accessToken, refreshToken, username }));
                    navigate('/');
                    resolve();
                },
                onFailure: (err) => {
                    console.error("Login error:", err);
                    reject(err);

                },
                newPasswordRequired: (userAttributes, requiredAttributes) => {
                    delete userAttributes.email_verified;
                    localStorage.setItem('CUE_username', username); // Store username
                    dispatch(setChallengeName('NEW_PASSWORD_REQUIRED'));
                    dispatch(setUser(cognitoUser))
                    navigate('/change-password', { state: { username: username } });
                    resolve();
                }
            });
        })
        } catch (error) {
        console.error("Login error:", error);
        throw error;
        }
    },[dispatch]); // Correct dependency


    const logout = useCallback((navigate) => {
        const cognitoUser = userPool.getCurrentUser();
        if (cognitoUser) {
            cognitoUser.signOut();
        }
        dispatch(logoutSuccess());
        navigate('/login');
        localStorage.removeItem('CUE_username'); // Clear username
        localStorage.removeItem('CUE_refreshToken'); // Clear refresh token
        localStorage.removeItem('CUE_accessToken'); // Clear access token
        localStorage.removeItem('CUE_accessTokenExpiration'); // Clear expiration

    },[dispatch]);


    const forgotPassword = useCallback(async (username) => {

      const userData = {
          Username: username,
          Pool: userPool
      }
      const cognitoUser = new CognitoUser(userData);
        try{
           return new Promise((resolve, reject) => {
             cognitoUser.forgotPassword({
                onSuccess: function (result) {
                   resolve(result);
                },
                onFailure: function (err) {
                  reject(err)
                }
            });
           })
        } catch (error) {
        console.error("Forgot Password error:", error); // Log the error
        throw error; // Re-throw the error to be caught by the caller
        }
    }, []);


    const confirmForgotPassword = useCallback(async (username, confirmationCode, newPassword) => {
        const userData = {
          Username: username,
          Pool: userPool
        }
        const cognitoUser = new CognitoUser(userData);
        try{
            return new Promise((resolve, reject) => {
                cognitoUser.confirmPassword(confirmationCode, newPassword, {
                    onSuccess() {
                        resolve();
                    },
                    onFailure(err) {
                        reject(err);
                    }
                });
            })
        } catch (error) {
        console.error("Confirm Forgot Password error:", error); // Log the error
        throw error; // Re-throw the error to be caught by the caller
        }
    }, []);

    const changePassword = useCallback(async(oldPassword, newPassword) => {
        try{
            return new Promise((resolve, reject) => {
              user.changePassword(oldPassword, newPassword, (err, result) => {
                if (err) {
                  reject(err)
                }
                resolve(result);
              });
            })

        } catch(error){
            console.error("Change Password error:", error); // Log the error
            throw error; // Re-throw the error to be caught by the caller
        }
    },[user])

   const refreshAccessToken = useCallback(async () => {
        // Get refresh token from LOCAL STORAGE - CORRECT
        const storedRefreshToken = localStorage.getItem('CUE_refreshToken');

        console.log("refreshAccessToken called. refreshToken:", storedRefreshToken);

        if (!storedRefreshToken) {
            console.log("No refresh token found in local storage.");
            return;
        }

        const cognitoUser = userPool.getCurrentUser();
        if (!cognitoUser) {
            console.log("No cognito user found.");
            return;
        }

        const cognitoRefreshToken = new CognitoRefreshToken({ RefreshToken: storedRefreshToken });

        try {
            const session = await new Promise((resolve, reject) => {
                cognitoUser.refreshSession(cognitoRefreshToken, (err, session) => {
                    if (err) {
                        console.error("Error refreshing token:", err);
                        dispatch(logoutSuccess()); // Log out on refresh failure
                        // No navigation here. Let calling component handle it
                        reject(err); // REJECT the promise
                        return;
                    }

                    console.log("Token refresh successful:", session);
                    const newAccessToken = session.getAccessToken().getJwtToken();
                    const newRefreshToken = session.getRefreshToken().getToken(); // Get new refresh token.
                    const expirationTime = session.getAccessToken().getExp();
                    console.log("New access token:", newAccessToken);
                     // Store the new refresh token and expiration time
                    localStorage.setItem('CUE_accessToken', newAccessToken);
                    localStorage.setItem('CUE_refreshToken', newRefreshToken);
                    localStorage.setItem('CUE_accessTokenExpiration', expirationTime);
                    dispatch(setAccessToken(newAccessToken)); // Update Redux
                    resolve(session); // RESOLVE the promise
                });
            });
        }
        catch (error){
             console.error("refreshAccessToken: Error:", error);
            dispatch(logoutSuccess()); // Logout on error
        }

    }, [dispatch]); // Correct dependencies


    useEffect(() => {
        let timeoutId;
        if (isAuthenticated && accessToken) {
            console.log("Setting up refresh timeout. accessToken:", accessToken);
            const decodedToken = jwtDecode(accessToken);
            console.log("Decoded token:", decodedToken);
            const expirationTime = decodedToken.exp * 1000; // Convert to milliseconds.
            const currentTime = Date.now();
            let timeoutTime = expirationTime - currentTime - 300000; // 5 minutes (300000ms) before expiry

            if (timeoutTime < 0) {
                timeoutTime = 0;  // Refresh immediately if already expired.
            }
            console.log(`Refresh timeout set for ${timeoutTime}ms`);

            timeoutId = setTimeout(() => {

                refreshAccessToken().catch(error => { // Now correctly using a promise
                    console.error("Failed to refresh token:", error);
                    dispatch(logoutSuccess());
                    // No navigate here - let calling component handle it
                });
            }, timeoutTime);
             return () => {if (timeoutId) clearTimeout(timeoutId)}; // Cleanup on unmount/logout
        }
         else {
            console.log("Not authenticated or no access token.  Not setting refresh timeout.");
        }
        // removed navigate
    }, [isAuthenticated, accessToken, dispatch, refreshAccessToken]); // Correct dependencies!

    const initializeAuth = useCallback(async () => {
    const storedUsername = localStorage.getItem('CUE_username');
    const storedRefreshToken = localStorage.getItem('CUE_refreshToken'); // CORRECT KEY
    const storedExpiration = localStorage.getItem('CUE_accessTokenExpiration');

    console.log("initializeAuth: refreshToken from localStorage:", storedRefreshToken);
    console.log("initializeAuth: username from localStorage:", storedUsername);

    if (storedUsername && storedRefreshToken && storedExpiration) {
        const now = Math.floor(Date.now() / 1000); // Current time in seconds

        if (parseInt(storedExpiration, 10) > now) {
            // Token is still valid, set access token in Redux
            console.log("initializeAuth: Access token still valid. Setting from localStorage.");
            const accessToken = localStorage.getItem('CUE_accessToken');
            dispatch(loginSuccess({ accessToken, refreshToken: storedRefreshToken, username: storedUsername }));
            return; // Exit early, we're already logged in
        }

        console.log("initializeAuth: Found username and refresh token. Attempting refresh.");
        try {
            const cognitoUser = new CognitoUser({
                Username: storedUsername,
                Pool: userPool
            });

            // No need to call getSession explicitly; refreshSession handles it.
            const cognitoRefreshToken = new CognitoRefreshToken({ RefreshToken: storedRefreshToken });
            cognitoUser.refreshSession(cognitoRefreshToken, (err, session) => {
                if (err) {
                    console.error("initializeAuth: Refresh token error:", err);
                    dispatch(logoutSuccess());
                    // navigate('/login'); -- NO, handled by caller
                    return;
                }

                const newAccessToken = session.getAccessToken().getJwtToken();
                const newRefreshToken = session.getRefreshToken().getToken(); // Get new refresh token
                const expirationTime = session.getAccessToken().getExp();

                console.log("initializeAuth: New access token:", newAccessToken);

                // Store the new tokens and expiration time
                localStorage.setItem('CUE_accessToken', newAccessToken);
                localStorage.setItem('refreshToken', newRefreshToken); //update to local storage
                localStorage.setItem('CUE_accessTokenExpiration', expirationTime);


                // Dispatch loginSuccess with stored username and new tokens
                dispatch(loginSuccess({ accessToken: newAccessToken, refreshToken: newRefreshToken, username: storedUsername }));
            });
        } catch (error) {
            console.error("initializeAuth: Error during refresh attempt:", error);
            dispatch(logoutSuccess()); // Logout on error
        }
    } else {
        console.log("initializeAuth: No username/refresh token found. User is not logged in.");
        dispatch(logoutSuccess()); // Ensure consistent state
    }
}, [dispatch]); // Correct dependencies

useEffect(() => {
    initializeAuth();
}, [initializeAuth]); // Depend ONLY on initializeAuth


    return { isAuthenticated, accessToken, login, logout, username, challengeName, forgotPassword, confirmForgotPassword, changePassword, initializeAuth, refreshAccessToken }; // no navigate here
}

export default useAuth;