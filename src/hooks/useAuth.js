import { useSelector, useDispatch } from 'react-redux';
import { loginSuccess, logoutSuccess, setChallengeName, setUser, setAccessToken } from '../app/reducers/authSlice';
import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoRefreshToken } from 'amazon-cognito-identity-js';
import { config } from '../config';
//import { useNavigate } from 'react-router-dom'; // REMOVE useNavigate from here
import { jwtDecode } from 'jwt-decode';
import { useEffect, useCallback } from 'react';

const poolData = {
    UserPoolId: config.cognitoUserPoolId,
    ClientId: config.cognitoClientId,
};

const userPool = new CognitoUserPool(poolData);

function useAuth() {
    const dispatch = useDispatch();
    const auth = useSelector(state => state.auth);
    const { isAuthenticated, accessToken, refreshToken, username, challengeName, user } = auth;  // Include refreshToken
    let refreshTimeout = null;

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
                    const idToken = result.getIdToken().getJwtToken(); // Often useful
                    const refreshToken = result.getRefreshToken().getToken();
                     const decodedAccessToken = jwtDecode(accessToken);
                    const expirationTime = decodedAccessToken.exp; // Seconds

                    // Store username in localStorage *and* dispatch to Redux
                    localStorage.setItem('CUE_username', username);
                    localStorage.setItem('CUE_refreshToken', refreshToken); //Store in localstorage
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
                    //storing in local storage
                    localStorage.setItem('CUE_username', username);
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
    },[dispatch]);


    const logout = useCallback((navigate) => {
        const cognitoUser = userPool.getCurrentUser();
        if (cognitoUser) {
            cognitoUser.signOut();
        }
        dispatch(logoutSuccess());
        navigate('/login');
         // Clear refresh token cookie.  IMPORTANT!
        //Cookies.remove('refreshToken', { path: '/', secure: true, sameSite: 'strict' }); -- Removed cookie
         localStorage.removeItem('CUE_username'); // Clear username
         localStorage.removeItem('CUE_refreshToken');
          localStorage.removeItem('CUE_accessTokenExpiration'); //clear on logout

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
  
  
    const refreshAccessToken = useCallback(async (navigate) => {
        const storedRefreshToken = localStorage.getItem('CUE_refreshToken');

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
                        dispatch(logoutSuccess());
                        if (navigate) {
                            navigate('/login');
                        }
                        reject(err); // Add this
                        return;
                    }
                    console.log("Got new Refresh Token");
                    const newAccessToken = session.getAccessToken().getJwtToken();
                    // Dispatch an action to update the access token and expiration time in Redux
                    localStorage.setItem('CUE_accessToken', newAccessToken);
                    localStorage.setItem('CUE_refreshToken', session.getRefreshToken().getToken()); // Update local storage
                    const decodedToken = jwtDecode(newAccessToken);
                    const expirationTime = decodedToken.exp * 1000;
                    localStorage.setItem('CUE_accessTokenExpiration', expirationTime);
                    dispatch(setAccessToken(newAccessToken));
                    resolve(session); // Resolve the promise
                });
            });

        } catch (error) {
            console.error("refreshAccessToken: Error:", error);
            dispatch(logoutSuccess()); // Logout on error
            if(navigate){
                 navigate('/login');
            }

        }
    }, [dispatch]);


   useEffect(() => {
        let timeoutId;
        if (isAuthenticated && accessToken) {
            const decodedToken = jwtDecode(accessToken);
            const expirationTime = decodedToken.exp * 1000;
            const currentTime = Date.now();
            let timeoutTime = expirationTime - currentTime - 300000;

            if (timeoutTime < 0) {
                timeoutTime = 0;
            }

            timeoutId = setTimeout(() => {
              refreshAccessToken().catch(error => { // refreshToken now returns a promise
                    console.error("Failed to refresh token:", error);
                    dispatch(logoutSuccess());
                });
            }, timeoutTime);

            return () => {if (timeoutId) clearTimeout(timeoutId)}; // Cleanup on unmount/logout
        }
    }, [isAuthenticated, accessToken, dispatch, refreshAccessToken]);


     const initializeAuth = useCallback(async (navigate) => { // Add navigate here
        const storedUsername = localStorage.getItem('CUE_username');
        const storedRefreshToken = localStorage.getItem('CUE_refreshToken');//get refresh token from local storage
        const storedExpiration = localStorage.getItem('CUE_accessTokenExpiration');

        console.log("initializeAuth: refreshToken from localstorage:", storedRefreshToken); // LOG THIS
        console.log("initializeAuth: username from localStorage:", storedUsername);

       if (storedUsername && storedRefreshToken && storedExpiration) {
        const now = Math.floor(Date.now() / 1000); // Current time in seconds

        if (parseInt(storedExpiration, 10) > now) {
            // Token is still valid, set access token in Redux
            console.log("initializeAuth: Access token still valid. Setting from localStorage.");
            const accessToken = localStorage.getItem('CUE_accessToken');
            dispatch(loginSuccess({ accessToken, refreshToken:storedRefreshToken, username: storedUsername })); //Restore session
            return; // Exit early, we're already logged in
        }
            console.log("initializeAuth: Found username and refresh token. Attempting refresh.");
            try {
                const cognitoUser = new CognitoUser({
                    Username: storedUsername, // Use stored username
                    Pool: userPool
                });

                 // Get the current user's session data
                cognitoUser.getSession((err, session) => {
                    if (err) {
                        console.error("Error getting user session:", err);
                         dispatch(logoutSuccess());
                        if(navigate){ //check if navigate is a function
                            navigate('/login');
                        }
                        return; // Stop execution if there's an error
                    }

                   // const currentUsername = cognitoUser.username;  // NO LONGER NEEDED - use storedUsername
                    const cognitoRefreshToken = new CognitoRefreshToken({ RefreshToken: storedRefreshToken });
                      cognitoUser.refreshSession(cognitoRefreshToken, (err, session) => {
                        if (err) {
                            console.error("initializeAuth: Refresh token error:", err);
                             dispatch(logoutSuccess());
                            if(navigate){
                                navigate('/login'); // And here
                            }
                            return; // Stop execution
                        }

                        const newAccessToken = session.getAccessToken().getJwtToken();
                        const newRefreshToken = session.getRefreshToken().getToken(); // Get new refresh token
                        const decodedToken = jwtDecode(newAccessToken);
                        const expirationTime = decodedToken.exp * 1000;
                        localStorage.setItem('CUE_accessToken', newAccessToken);
                        localStorage.setItem('CUE_refreshToken', newRefreshToken); // update refresh token
                         localStorage.setItem('CUE_accessTokenExpiration', expirationTime);
                        //console.log("initializeAuth: New access token:", newAccessToken);

                        // Dispatch loginSuccess with the *retrieved* username, new tokens
                        dispatch(loginSuccess({ accessToken: newAccessToken, refreshToken: newRefreshToken , username: storedUsername }));
                    });
                });

            } catch (error) {
                console.error("Error initializing auth:", error);
                dispatch(logoutSuccess()); // Logout on error.  This is important.
                if(navigate){
                    navigate('/login');
                }

            }
        }
         else {
            // No refresh token, user is not logged in.
            console.log("initializeAuth: No username/refresh token found. User is not logged in.");
            dispatch(logoutSuccess());  // Ensure consistent state - important!
        }
    }, [dispatch]); // removed auth.refreshToken
     useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);



  return { isAuthenticated, accessToken, login, logout, username, challengeName, forgotPassword, confirmForgotPassword, changePassword, initializeAuth, refreshAccessToken }; // no navigate here
}

export default useAuth;