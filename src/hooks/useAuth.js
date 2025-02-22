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

                    // Store username in localStorage *and* dispatch to Redux
                    localStorage.setItem('CUE_username', username);
                    localStorage.setItem('refreshToken', refreshToken); //Store in localstorage
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
         localStorage.removeItem('refreshToken');

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
        // Get refresh token from Redux state - CORRECT
        const refreshTokenValue = localStorage.getItem('refreshToken');; // Use a different variable name!

        if (!refreshTokenValue) {
            console.log("No refresh token found in local storage.");
            return;
        }

        const cognitoUser = userPool.getCurrentUser();
        if (!cognitoUser) {
            console.log("No cognito user found.");
            return;
        }

        const cognitoRefreshToken = new CognitoRefreshToken({ RefreshToken: refreshTokenValue });

        return new Promise((resolve, reject) => {
            cognitoUser.refreshSession(cognitoRefreshToken, (err, session) => {
                if (err) {
                    console.error("Error refreshing token:", err);
                    dispatch(logoutSuccess());
                    if(navigate){
                        navigate('/login');
                    }
                    reject(err);
                    return;
                }

                const newAccessToken = session.getAccessToken().getJwtToken();
                // Dispatch an action to update the access token in Redux
                localStorage.setItem('refreshToken', session.getRefreshToken().getToken()); // Update local storage
                dispatch(setAccessToken(newAccessToken));
                resolve();
            });
        });
    }, [auth.refreshToken, dispatch]);


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


     const initializeAuth = useCallback(async () => { // Remove navigate here
        const storedUsername = localStorage.getItem('CUE_username');
        const storedRefreshToken = localStorage.getItem('refreshToken');//get refresh token from local storage
        console.log("initializeAuth: refreshToken from localstorage:", storedRefreshToken); // LOG THIS
        console.log("initializeAuth: username from localStorage:", storedUsername);

        if (storedUsername && storedRefreshToken) { // Check for BOTH
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
                        // if(navigate){ //check if navigate is a function -- removed navigate
                        //     navigate('/login');
                        // }
                        return; // Stop execution if there's an error
                    }

                   // const currentUsername = cognitoUser.username;  // NO LONGER NEEDED - use storedUsername
                    const cognitoRefreshToken = new CognitoRefreshToken({ RefreshToken: storedRefreshToken });
                      cognitoUser.refreshSession(cognitoRefreshToken, (err, session) => {
                        if (err) {
                            console.error("initializeAuth: Refresh token error:", err);
                             dispatch(logoutSuccess());
                            // if(navigate){
                            //     navigate('/login'); // And here
                            // }
                            return; // Stop execution
                        }

                        const newAccessToken = session.getAccessToken().getJwtToken();
                        const newRefreshToken = session.getRefreshToken().getToken(); // Get new refresh token
                        localStorage.setItem('refreshToken', newRefreshToken); // update refresh token
                        //console.log("initializeAuth: New access token:", newAccessToken);

                        // Dispatch loginSuccess with the *retrieved* username, new tokens
                        dispatch(loginSuccess({ accessToken: newAccessToken, refreshToken: newRefreshToken , username: storedUsername }));
                    });
                });

            } catch (error) {
                console.error("Error initializing auth:", error);
                dispatch(logoutSuccess()); // Logout on error.  This is important.
                // if(navigate){
                //     navigate('/login');
                // }

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
    }, [initializeAuth]); // Depend on initializeAuth function ONLY


    return { isAuthenticated, accessToken, login, logout, username, challengeName, forgotPassword, confirmForgotPassword, changePassword, initializeAuth, refreshAccessToken }; // no navigate here
}

export default useAuth;