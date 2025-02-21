import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import useAuth from '../hooks/useAuth'; // Import useAuth
import { toast, ToastContainer } from 'react-toastify'; // Import ToastContainer
import 'react-toastify/dist/ReactToastify.css';
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

function ForgotPassword() {
    const [username, setUsername] = useState('');
    const [confirmationCode, setConfirmationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [resetRequested, setResetRequested] = useState(false); // Track request status
    const [message, setMessage] = useState('');
    const { forgotPassword, confirmForgotPassword } = useAuth(); // Get functions from useAuth
    const navigate = useNavigate(); // Use useNavigate hook
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);

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
    const handleForgotPassword = async (event) => {
        event.preventDefault();
        setError('');
        setMessage('');

        try {
            const result = await forgotPassword(username);
            console.log("Forgot password request successful:", result);
            setResetRequested(true); // Show the confirmation form
           // toast.success("Password reset code sent. Check your email."); //removed toast
           setMessage("Password reset code sent. Check your email."); // Set success message

        } catch (err) {
            setError(err.message || 'An error occurred.');
            toast.error(error); // Use toast for errors
        }
    };



    const handleConfirmForgotPassword = async (event) => {
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

        try {
            await confirmForgotPassword(username, confirmationCode, newPassword);
            setSuccessDialogOpen(true);
            //toast.success("Password reset successfully! Please log in."); //removed toast
            // navigate('/login'); // Redirect to login page

        } catch (err) {
             setError(err.message || 'An error occurred while confirming the password.');
            toast.error(error);
        }
    };

    const handleCloseSuccessDialog = () => {
        setSuccessDialogOpen(false);
        navigate('/login'); // Navigate to login after closing dialog
    };
    

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
                    Forgot Password
                </Typography>
                {error && <Typography color="error" align="center" sx={{ mb: 2 }}>{error}</Typography>}
                {message && <Typography  align="center" sx={{ mb: 2, color: 'primary.main' }}>{message}</Typography>}

                {!resetRequested ? (
                    <Box component="form" noValidate onSubmit={handleForgotPassword} sx={{ width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Username"
                            name="username"
                            autoComplete="username"
                            autoFocus
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
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
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            Reset Password
                        </Button>
                    </Box>
                ) : (
                    <Box component="form" noValidate onSubmit={handleConfirmForgotPassword} sx={{ width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="confirmationCode"
                            label="Confirmation Code"
                            type="text"
                            id="confirmation-code"
                            value={confirmationCode}
                            onChange={(e) => setConfirmationCode(e.target.value)}
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

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            Confirm Password
                        </Button>
                    </Box>
                )}
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
              <ToastContainer position="top-center" />
        </Box>
      </ThemeProvider>
    );
}

export default ForgotPassword;