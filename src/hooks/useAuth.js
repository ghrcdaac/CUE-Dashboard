// src/hooks/useAuth.js
import { useSelector, useDispatch } from 'react-redux';
import { loginSuccess, logoutSuccess, setChallengeName, setUser } from '../app/reducers/authSlice'; // Import actions
import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import { config } from '../config';  // Assuming you have API base URL here
import { useNavigate } from 'react-router-dom';

const poolData = {
    UserPoolId: config.cognitoUserPoolId, // Use values from config.js
    ClientId: config.cognitoClientId,
};

const userPool = new CognitoUserPool(poolData);

function useAuth() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const auth = useSelector(state => state.auth); // Get entire auth state
    const { isAuthenticated, accessToken, username, challengeName, user } = auth;

    const login = async (username, password) => {

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

                    dispatch(loginSuccess({ accessToken, refreshToken, username }));
                    navigate('/'); // Redirect to home page on success
                    resolve();
                },
                onFailure: (err) => {
                    console.error("Login error:", err);
                    reject(err);  // Reject the promise with the error

                },
                newPasswordRequired: (userAttributes, requiredAttributes) => {
                    delete userAttributes.email_verified;
                    dispatch(setChallengeName('NEW_PASSWORD_REQUIRED'));
                    dispatch(setUser(cognitoUser))
                    navigate('/change-password', { state: { username: username } }); //Pass the username
                    resolve();
                }
            });
        })
        } catch (error) {
        console.error("Login error:", error); // Log the error
        throw error; // Re-throw the error to be caught by the caller
        }
    };


    const logout = () => {
        //Signout the user from cognito
        const cognitoUser = userPool.getCurrentUser();
        if(cognitoUser != null) {
            cognitoUser.signOut();
        }
        dispatch(logoutSuccess());
        navigate('/login'); // Redirect to login page
    };


    const forgotPassword = async (username) => {

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
    };


    const confirmForgotPassword = async (username, confirmationCode, newPassword) => {
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
    };

    const changePassword = async(oldPassword, newPassword) => {
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
    }


    return { isAuthenticated, accessToken, login, logout, username, challengeName, forgotPassword, confirmForgotPassword, changePassword };
}

export default useAuth;