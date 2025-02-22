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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

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
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    // Retrieve the username from the location state.  VERY important!
    const username = location.state?.username;
     const cognitoUser = useSelector(state => state.auth.user);
         // Validation states
    const [hasUpperCase, setHasUpperCase] = useState(false);
    const [hasLowerCase, setHasLowerCase] = useState(false);
    const [hasNumber, setHasNumber] = useState(false);
    const [hasMinLength, setHasMinLength] = useState(false);
    const [passwordsMatch, setPasswordsMatch] = useState(null); // null, true, or false

    const validatePassword = (password) => {
    setHasUpperCase(/[A-Z]/.test(password));
    setHasLowerCase(/[a-z]/.test(password));
    setHasNumber(/[0-9]/.test(password));
    setHasMinLength(password.length >= 8);
    };


    // Redirect to login if no username.  This is a safety check.
    React.useEffect(() => {
      if (!username) {
        navigate("/login");
      }
    }, [username, navigate]);

    const handleNewPasswordChange = (e) => {
        const password = e.target.value;
        setNewPassword(password);
        validatePassword(password); // Validate on every change
        // Also check if passwords match whenever newPassword changes:
        setPasswordsMatch(password === confirmPassword);
    };

        // Add an onChange handler for confirmPassword:
        const handleConfirmPasswordChange = (e) => {
            const confirmVal = e.target.value;
            setConfirmPassword(confirmVal);
            setPasswordsMatch(newPassword === confirmVal); // Check for match
    
        };

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
                        // navigate('/login'); // Go to home
                        setSuccessDialogOpen(true);
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

    const handleCloseSuccessDialog = () => {
        setSuccessDialogOpen(false);
        navigate('/login'); // Navigate to login after closing dialog
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
                            onChange={handleNewPasswordChange}
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
                            onChange={handleConfirmPasswordChange}
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
                            {/* Validation Messages */}
                            <Box sx={{ mt: 1, mb: 2 }}>
                            <Typography variant="body2" color={hasMinLength ? "success.main" : "error.main"}>
                                {hasMinLength ? '✓' : '✕'} At least 8 characters
                            </Typography>
                            <Typography variant="body2" color={hasUpperCase ? "success.main" : "error.main"}>
                                {hasUpperCase ? '✓' : '✕'} At least one uppercase letter
                            </Typography>
                            <Typography variant="body2" color={hasLowerCase ? "success.main" : "error.main"}>
                               {hasLowerCase ? '✓' : '✕'} At least one lowercase letter
                            </Typography>
                            <Typography variant="body2" color={hasNumber ? "success.main" : "error.main"}>
                                {hasNumber ? '✓' : '✕'} At least one number
                            </Typography>
                            {/* Passwords Match Indicator */}
                            <Typography variant="body2" color={passwordsMatch === true ? 'success.main' : (passwordsMatch === false ? 'error.main' : 'error.main')}>
                             {passwordsMatch === true ? '✓ Passwords match' : (passwordsMatch === false ? '✕ Passwords do not match' : '✕ Passwords do not match')}
                         </Typography>
                        </Box>
                        <Button type="submit" fullWidth variant="contained" color="primary" sx={{ mt: 3, mb: 2 }}>
                            Change Password
                        </Button>
                    </Box>
                </Paper>
                <Dialog
                    open={successDialogOpen}
                    onClose={handleCloseSuccessDialog}
                    >
                    <DialogTitle>Success</DialogTitle>
                    <DialogContent>
                        <Typography>Your password has been successfully reset. You can now log in.</Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseSuccessDialog} color="primary">
                            OK
                        </Button>
                    </DialogActions>
                    </Dialog>
            </Box>
            <ToastContainer position="top-center" />
        </ThemeProvider>
    );
}

export default ChangePassword;