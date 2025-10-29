import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import { useDispatch, useSelector } from 'react-redux'; 
import { setChallengeName, setUser } from '../app/reducers/authSlice'; 
import { toast, ToastContainer } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { verifyUserEmail } from '../api/authApi'; 


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
    const location = useLocation();  // Get location
    const username = location.state?.username;  // Get username from state
    const cognitoUser = useSelector(state => state.auth.user) // Get the user object from Redux



    // Validation states
    const [hasUpperCase, setHasUpperCase] = useState(false);
    const [hasLowerCase, setHasLowerCase] = useState(false);
    const [hasNumber, setHasNumber] = useState(false);
    const [hasMinLength, setHasMinLength] = useState(false);
    const [passwordsMatch, setPasswordsMatch] = useState(null); // null, true, or false

    // Validation function (same as before)
    const validatePassword = (password) => {
        setHasUpperCase(/[A-Z]/.test(password));
        setHasLowerCase(/[a-z]/.test(password));
        setHasNumber(/[0-9]/.test(password));
        setHasMinLength(password.length >= 8);
    };

    const handleNewPasswordChange = (e) => {
        const password = e.target.value;
        setNewPassword(password);
        validatePassword(password);
        setPasswordsMatch(password === confirmPassword);
    };

    const handleConfirmPasswordChange = (e) => {
        const confirmVal = e.target.value;
        setConfirmPassword(confirmVal);
        setPasswordsMatch(newPassword === confirmVal);
    };


    const handleChangePassword = async (event) => {
        event.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasMinLength) {
            setError('Password does not meet all requirements.');
            return;
        }
        // Check if cognitoUser exists before proceeding
        if (!cognitoUser) {
          setError('User data not found. Please try logging in again.');
          navigate('/login'); // Redirect to login if user data is missing
          return;
        }
        try {
            // Call completeNewPasswordChallenge on the CognitoUser object
            const result = await new Promise((reject) => {
                cognitoUser.completeNewPasswordChallenge(newPassword, {}, {
                    onSuccess: (session) => {
                        verifyUserEmail(username) //Await this
                        .then(() => {
                            toast.success("Password changed and email verified successfully!");
                            setSuccessDialogOpen(true);
                        }).catch((verifyError) => {
                            console.error("Error verifying email:", verifyError);
                            // Display BOTH errors.  Password change *did* happen.
                            toast.error("Password changed, but email verification failed: " + verifyError.message + ". Please log in again.");
                            navigate('/login');
                            reject(verifyError);
                        });

                    },
                    onFailure: (err) => {
                        console.error("Password change error:", err);
                        reject(err); // Pass the error to the catch block
                    }
                });
            });
            console.log("Password change successful, result:", result);
            // Clear challenge name after updating password.
            dispatch(setChallengeName(null));
            //clear user data
            dispatch(setUser(null));
            toast.success("Password changed successfully! Please log in.");
             navigate('/login'); // Redirect to login

        } catch (err) {
             setError(err.message || 'An error occurred while changing the password.');
             toast.error(error)

        }
    };


    const handleCloseSuccessDialog = () => {
        setSuccessDialogOpen(false);
        navigate('/login'); // Navigate to login after closing dialog
    };

     useEffect(() => {
    if (!username) {
      navigate("/login");
    }
  }, [username, navigate]);

    if (!username) {
        return null; // Or a loading spinner
    }

    return (
      <ThemeProvider theme={theme}>
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: 'primary.main',
                color: 'white',
                padding: '20px',
            }}
        >
           <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        mb: 4,
                        paddingTop: 10
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
                    <Typography>Your password has been reset and email verified successfully. You can now log in.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseSuccessDialog} color="primary">
                        OK
                    </Button>
                </DialogActions>
            </Dialog>
            <ToastContainer position="top-center" />
        </Box>
        </ThemeProvider>
    );
}

export default ChangePassword;