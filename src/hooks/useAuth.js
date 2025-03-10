// src/hooks/useAuth.js
import { useSelector, useDispatch } from 'react-redux';
import { loginSuccess, logoutSuccess, setChallengeName, setUser, setAccessToken, setLoading, setNgroupId, setRoleId } from '../app/reducers/authSlice';
import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoRefreshToken } from 'amazon-cognito-identity-js';
import { config } from '../config';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useCallback } from 'react';
import { getCueuserByUsername } from '../api/cueUser';


const poolData = {
    UserPoolId: config.cognitoUserPoolId,
    ClientId: config.cognitoClientId,
};

const userPool = new CognitoUserPool(poolData);

function useAuth() {
    const dispatch = useDispatch();
    const auth = useSelector(state => state.auth);
    const { isAuthenticated, accessToken, refreshToken, username, challengeName, user } = auth;
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

        // Return the promise from authenticateUser
        return new Promise((resolve, reject) => { // Added return here
            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess: async (result) => {
                    const accessToken = result.getAccessToken().getJwtToken();
                    const idToken = result.getIdToken().getJwtToken();
                    const refreshToken = result.getRefreshToken().getToken();
                    const decodedAccessToken = jwtDecode(accessToken);
                    const expirationTime = decodedAccessToken.exp;

                    try {
                        const cueUserData = await getCueuserByUsername(username, accessToken);

                        if (cueUserData && cueUserData.ngroup_id && cueUserData.role_id) {
                            localStorage.setItem('CUE_ngroup_id', cueUserData.ngroup_id);
                            localStorage.setItem('CUE_role_id', cueUserData.role_id);
                            dispatch(setNgroupId(cueUserData.ngroup_id));
                            dispatch(setRoleId(cueUserData.role_id));
                        } else {
                            console.warn("ngroup_id or role_id missing from CueUser data.");
                            dispatch(logoutSuccess());
                            navigate('/login');
                            reject(new Error("Missing user data")); // Reject on missing data
                            return;
                        }


                    } catch (apiError) {
                        console.error("Failed to fetch CueUser data:", apiError);
                        dispatch(logoutSuccess());
                        navigate('/login');
                        reject(apiError); // Re-throw the API error
                        return;
                    }

                    localStorage.setItem('CUE_username', username);
                    localStorage.setItem('CUE_refreshToken', refreshToken);
                    localStorage.setItem('CUE_accessToken', accessToken);
                    localStorage.setItem('CUE_accessTokenExpiration', expirationTime);

                    dispatch(loginSuccess({ accessToken, refreshToken, username, ngroupId: localStorage.getItem('CUE_ngroup_id'), roleId: localStorage.getItem('CUE_role_id') }));
                    navigate('/');
                    resolve();
                },
                onFailure: (err) => {
                    console.error("Login error:", err);
                    reject(err); // Reject the promise with the error
                },
                newPasswordRequired: (userAttributes, requiredAttributes) => { 
                    localStorage.setItem('CUE_username', username);
                    dispatch(setChallengeName('NEW_PASSWORD_REQUIRED'));
                    dispatch(setUser(cognitoUser))
                    navigate('/change-password', { state: { username: username } });
                }
            });
        }); // Added closing parenthesis for new Promise
    }, [dispatch]); // navigate removed.

    const logout = useCallback((navigate) => {
      const cognitoUser = userPool.getCurrentUser();
      if (cognitoUser) {
        cognitoUser.signOut();
      }
      dispatch(logoutSuccess());
      navigate('/login');
      localStorage.removeItem('CUE_username');
      localStorage.removeItem('CUE_accessToken');
      localStorage.removeItem('CUE_refreshToken');
      localStorage.removeItem('CUE_accessTokenExpiration');
      localStorage.removeItem('CUE_ngroup_id');
      localStorage.removeItem('CUE_role_id');
    }, [dispatch]);

    const forgotPassword = useCallback(async (username) => {
      // ... (forgotPassword code - no changes needed here) ...
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

    const changePassword = useCallback(async (oldPassword, newPassword) => {
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
    }, [user]);

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
              navigate('/login');
              reject(err);  // Reject the promise
              return;
            }
            console.log("Got new Refresh Token");
            const newAccessToken = session.getAccessToken().getJwtToken();
            localStorage.setItem('CUE_accessToken', newAccessToken);
            localStorage.setItem('CUE_refreshToken', session.getRefreshToken().getToken());
            const decodedToken = jwtDecode(newAccessToken);
            const expirationTime = decodedToken.exp * 1000;
            localStorage.setItem('CUE_accessTokenExpiration', expirationTime);
            dispatch(setAccessToken(newAccessToken));
            resolve(session); // Resolve with session
          });
        });

      } catch (error) {
          console.error("refreshAccessToken: Error:", error);
            dispatch(logoutSuccess());
            navigate('/login');

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
                refreshAccessToken().catch(error => {
                    console.error("Failed to refresh token:", error);
                     dispatch(logoutSuccess());
                });
            }, timeoutTime);

            return () => { if (timeoutId) clearTimeout(timeoutId) };
        }
    }, [isAuthenticated, accessToken, dispatch, refreshAccessToken]);


  const initializeAuth = useCallback(async (navigate) => {
    const storedUsername = localStorage.getItem('CUE_username');
    const storedRefreshToken = localStorage.getItem('CUE_refreshToken');
    const storedExpiration = localStorage.getItem('CUE_accessTokenExpiration');
    const storedNgroupId = localStorage.getItem('CUE_ngroup_id');
    const storedRoleId = localStorage.getItem('CUE_role_id');

    console.log("initializeAuth: refreshToken from localstorage:", storedRefreshToken);
    console.log("initializeAuth: username from localStorage:", storedUsername);
    dispatch(setLoading(true));
    if (storedUsername && storedRefreshToken && storedExpiration) {
      const now = Math.floor(Date.now() / 1000);
      if (parseInt(storedExpiration, 10) > now) {
        console.log("initializeAuth: Access token still valid. Setting from localStorage.");
        const accessToken = localStorage.getItem('CUE_accessToken');
        dispatch(loginSuccess({ accessToken, refreshToken: storedRefreshToken, username: storedUsername, ngroupId: storedNgroupId, roleId: storedRoleId }));
        return;
      }
      console.log("initializeAuth: Found username and refresh token.  Attempting refresh.");
      try {
        const cognitoUser = new CognitoUser({
          Username: storedUsername,
          Pool: userPool
        });

          cognitoUser.getSession((err, session) => {
            if (err) {
                console.error("Error getting user session:", err);
                    dispatch(logoutSuccess());
                 navigate('/login');
                return; // Stop execution
            }

            const cognitoRefreshToken = new CognitoRefreshToken({ RefreshToken: storedRefreshToken });
            cognitoUser.refreshSession(cognitoRefreshToken, (err, session) => {
              if (err) {
                console.error("initializeAuth: Refresh token error:", err);
                dispatch(logoutSuccess());
                navigate('/login');
                return; // Stop execution
              }

              const newAccessToken = session.getAccessToken().getJwtToken();
              const newRefreshToken = session.getRefreshToken().getToken();
              const decodedToken = jwtDecode(newAccessToken);
              const expirationTime = decodedToken.exp * 1000;
              localStorage.setItem('CUE_accessToken', newAccessToken);
              localStorage.setItem('CUE_refreshToken', newRefreshToken);
              localStorage.setItem('CUE_accessTokenExpiration', expirationTime);
              dispatch(loginSuccess({ accessToken: newAccessToken, refreshToken: newRefreshToken, username: storedUsername, ngroupId: storedNgroupId, roleId: storedRoleId }));
            });
          });

      } catch (error) {
        console.error("Error initializing auth:", error);
         dispatch(logoutSuccess());
         navigate('/login');

      }
    }
    else {
      console.log("initializeAuth: No username/refresh token found. User is not logged in.");
       dispatch(logoutSuccess());
       dispatch(setLoading(false));
    }
  }, [dispatch]);

    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);


    return { isAuthenticated, accessToken, login, logout, username, challengeName, forgotPassword, confirmForgotPassword, changePassword, initializeAuth, refreshAccessToken };
}

export default useAuth;