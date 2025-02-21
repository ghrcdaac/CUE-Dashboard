import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess } from '../app/reducers/authSlice';
import { toast, ToastContainer } from 'react-toastify';
//import { Auth } from 'aws-amplify'; // REMOVE THIS - use CognitoUser object
import { CognitoUser } from 'amazon-cognito-identity-js';

const theme = createTheme({
    palette: {
        primary: {
            main: "#19577F",
        },
    },
});

function ChangePassword() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    // Retrieve the username from the location state.  VERY important!
    const username = location.state?.username;
     const cognitoUser = useSelector(state => state.auth.user);


    // Redirect to login if no username.  This is a safety check.
    React.useEffect(() => {
      if (!username) {
        navigate("/login");
      }
    }, [username, navigate]);


    const handleChangePassword = async (event) => {
        event.preventDefault();

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (!cognitoUser) {
          setError('User data not found. Please log in again.');
          navigate('/login'); // Redirect to login if user data is missing
          return;
        }


        try {
          // Use the CognitoUser object (from Redux)
            // and the newPassword

             return new Promise((resolve, reject) => {
                cognitoUser.completeNewPasswordChallenge(newPassword, {}, {
                    onSuccess: (result) => {

                        const accessToken = result.getAccessToken().getJwtToken();
                        const refreshToken = result.getRefreshToken().getToken();

                        dispatch(loginSuccess({ accessToken, refreshToken, username }));
                        toast.success("Password changed successfully!"); // Use toast
                        navigate('/'); // Go to home
                        resolve();
                    },
                    onFailure: (err) => {
                        console.error("Password change error:", err);
                        setError(err.message || 'An error occurred while changing the password.');
                        reject(err);
                    }
                });
            });

        } catch (err) {
            setError(err.message || 'An error occurred while changing the password.');
            toast.error(`Error: ${error}`); // Use toast for errors
        }
    };

    // Prevent rendering if username is not available
    if (!username) {
        return <div>Loading...</div>; // Or some other placeholder
    }

    return (
        <ThemeProvider theme={theme}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    padding: '20px',
                }}
            >
                {/* Logo and Title */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        mb: 4,
                    }}
                >
                    <img src="/nasa_logo.png" alt="NASA Logo" className="nasa-logo" />
                    <Typography variant="h5" component="h2" sx={{ mt: 1 }}>
                        Cloud Upload Environment
                    </Typography>
                </Box>

                <Paper elevation={3} sx={{ padding: 3, width: '100%', maxWidth: '400px' }}>
                    <Typography variant="h5" component="h1" gutterBottom sx={{ textAlign: 'center', color: 'primary.main' }}>
                        Change Password
                    </Typography>
                    {error && <Typography color="error" align="center" sx={{ mb: 2 }}>{error}</Typography>}
                    <Box component="form" noValidate onSubmit={handleChangePassword} sx={{ width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="newPassword"
                            label="New Password"
                            type="password"
                            id="new-password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            InputLabelProps={{
                                style: { color: theme.palette.primary.main },
                            }}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    "& fieldset": { borderColor: theme.palette.primary.main },
                                    "&:hover fieldset": { borderColor: theme.palette.primary.main },
                                    "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
                                }
                            }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="confirmPassword"
                            label="Confirm New Password"
                            type="password"
                            id="confirm-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            InputLabelProps={{
                                style: { color: theme.palette.primary.main },
                            }}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    "& fieldset": { borderColor: theme.palette.primary.main },
                                    "&:hover fieldset": { borderColor: theme.palette.primary.main },
                                    "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
                                }
                            }}
                        />
                        <Button type="submit" fullWidth variant="contained" color="primary" sx={{ mt: 3, mb: 2 }}>
                            Change Password
                        </Button>
                    </Box>
                </Paper>
            </Box>
            <ToastContainer position="top-center" />
        </ThemeProvider>
    );
}

export default ChangePassword;