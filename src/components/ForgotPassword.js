import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import useAuth from '../hooks/useAuth'; // Import useAuth
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Make sure to import the CSS!
import { useNavigate } from 'react-router-dom'; // Import useNavigate


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
    const navigate = useNavigate(); // Add useNavigate hook

    const handleForgotPassword = async (event) => {
        event.preventDefault();
        setError('');
        setMessage('');

        try {
            await forgotPassword(username);
            setResetRequested(true); // Show the confirmation form
            toast.success("Password reset code sent. Check your email.");

        } catch (err) {
            setError(err.message || 'An error occurred.');
            toast.error(error);
        }
    };

    const handleConfirmForgotPassword = async (event) => {
        event.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

       // Basic password validation (customize to match your Cognito policy)
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }
        if (!/[A-Z]/.test(newPassword)) {
          setError("Password must contain at least one uppercase character");
          return;
        }
        if (!/[a-z]/.test(newPassword)) {
          setError("Password must contain at least one lowercase character");
          return;
        }
        if (!/[0-9]/.test(newPassword)) {
          setError("Password must contain at least one number");
          return;
        }

        try {
            await confirmForgotPassword(username, confirmationCode, newPassword);
            toast.success("Password reset successfully!  You can now login.");
            navigate('/login'); // Redirect to login page
        } catch (err) {
            setError(err.message || 'An error occurred while confirming the password.');
            toast.error(error);

        }
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
                {message && <Typography align="center" sx={{ mb: 2, color: 'primary.main' }}>{message}</Typography>}

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
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            Confirm New Password
                        </Button>
                    </Box>
                )}
                 <ToastContainer position="top-center" />
            </Paper>
        </Box>
        </ThemeProvider>
    );
}

export default ForgotPassword;