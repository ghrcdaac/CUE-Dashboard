// LoginPage.js
import React, { useState, useRef, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import './LoginPage.css';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom'; // Import useNavigate and useLocation
import useAuth from '../hooks/useAuth';
import { config } from '../config';
import { Grid as Grid2 } from '@mui/material'; // Corrected import
import { CircularProgress } from '@mui/material'; // Import CircularProgress
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@mui/material';

const theme = createTheme({
    palette: {
        primary: {
            main: "#19577F",
        },
    },
});

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const passwordRef = useRef(null);
    const { login } = useAuth();  // Get login function
    const navigate = useNavigate(); // Get navigate function
    const location = useLocation(); // Get location object
    const from = location.state?.from?.pathname || '/'; // Get intended destination

    const handleLogin = async (event) => {
        event.preventDefault();
        setLoginError('');
        setIsLoading(true);
        setOpenDialog(false);

        try {
            const result = await login(username, password); // Await the login promise
             if (result === 'NEW_PASSWORD_REQUIRED') {
                // Redirect to ChangePassword page
                navigate('/change-password', { state: { username: username } }); //Pass username
                return; // Stop further execution
            }
            navigate(from, { replace: true }); // <---  Navigate AFTER login succeeds
        } catch (error) {
            console.error("Login error:", error);
            let errorMessage = 'An unexpected error occurred.';

            if (error.code === 'UserNotFoundException') {
                errorMessage = 'User not found.';
            } else if (error.code === 'NotAuthorizedException') {
                errorMessage = 'Incorrect username or password.';
            } else if (error.code === 'PasswordResetRequiredException') {
                errorMessage = 'Password reset required.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            setLoginError(errorMessage);
            setOpenDialog(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setLoginError('');
    };
//the rest of you login component code

    useEffect(() => {
        const handleAutoFill = () => {
            if (passwordRef.current && passwordRef.current.matches(':-webkit-autofill')) {
                passwordRef.current.classList.add('auto-filled');
            } else if (passwordRef.current) {
                passwordRef.current.classList.remove('auto-filled');
            }
        };

        handleAutoFill();
        const observer = new MutationObserver(handleAutoFill);
        if (passwordRef.current) {
            observer.observe(passwordRef.current, { attributes: true, attributeFilter: ['class'] });
        }

        return () => observer.disconnect();
    }, [password]);


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
                    // padding: '20px',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        mb: 4,
                        paddingTop: 10,
                    }}
                >
                    <img src="/nasa_logo.png" alt="NASA Logo" className="nasa-logo" />
                    <Typography variant="h5" component="h2" sx={{ mt: 1 }}>
                        Cloud Upload Environment
                    </Typography>
                </Box>

                <Paper elevation={3} sx={{ padding: 3, width: '100%', maxWidth: '400px' }}>
                    <Box component="form" noValidate onSubmit={handleLogin} sx={{ width: '100%' }}>
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
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            inputRef={passwordRef}
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
                        <FormControlLabel
                            control={<Checkbox checked={showPassword} onChange={() => setShowPassword(!showPassword)} sx={{
                                color: 'black',
                                '&.Mui-checked': {
                                    color: theme.palette.primary.main,
                                },
                            }} />}
                            label={<Typography sx={{ color: theme.palette.primary.main }}>Show Password</Typography>}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 1, mb: 2, p: 1.2, fontSize: '1rem' }}
                            disabled={isLoading} // Disable the button while loading
                        >
                            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                        </Button>

                        {/* Error Dialog */}
                        <Dialog open={openDialog} onClose={handleCloseDialog}>
                            <DialogTitle>Login Error</DialogTitle>
                            <DialogContent>
                                <DialogContentText>{loginError}</DialogContentText>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={handleCloseDialog} color="primary">
                                    Close
                                </Button>
                            </DialogActions>
                        </Dialog>

                        <Grid2 container justifyContent="space-between">
                            <Grid2 item>
                                <Link component={RouterLink} to="/forgot-password" variant="body2" sx={{ color: theme.palette.primary.main }}>
                                    Forgot password?
                                </Link>
                            </Grid2>
                            <Grid2 item>
                                <Link component={RouterLink} to="/signup" variant="body2" sx={{ color: theme.palette.primary.main }}>
                                    New User? Create Account
                                </Link>
                            </Grid2>
                        </Grid2>
                    </Box>
                </Paper>
            </Box>
        </ThemeProvider>
    );
}

export default LoginPage;