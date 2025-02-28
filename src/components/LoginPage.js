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
import { useDispatch } from 'react-redux';
import { setChallengeName, setUser } from '../app/reducers/authSlice';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom'; // Import useNavigate and rename Link
import useAuth from '../hooks/useAuth';
// Import Cognito SDK
import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import { config } from '../config'; // Import config
import { toast } from 'react-toastify';
import { Grid2 } from '@mui/material';
//import 'react-toastify/dist/ReactToastify.css'; -- No need to add in individual component

const theme = createTheme({
    palette: {
        primary: {
            main: "#19577F",
        },
    },
});

// Cognito User Pool Configuration
const poolData = {
    UserPoolId: config.cognitoUserPoolId, // Use from config.js
    ClientId: config.cognitoClientId, // Use from config.js
};
const userPool = new CognitoUserPool(poolData);

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
     const [loginError, setLoginError] = useState(''); // State for login error
    const passwordRef = useRef(null);
    //const dispatch = useDispatch(); // Get the dispatch function - NO LONGER NEEDED HERE
    //const navigate = useNavigate(); // Get the navigate function - NO LONGER NEEDED HERE
    const { login } = useAuth(); // Use the useAuth hook!  Get login function.
    const navigate = useNavigate();
    const location = useLocation(); // Get current location
    const from = location.state?.from?.pathname || '/';

    const handleLogin = async (event) => {
        event.preventDefault();
        setLoginError(''); // Clear previous errors

        try {
            // Call the 'login' function from useAuth, passing username/password
            await login(username, password, navigate); // Pass navigate!
            // Success handling is now done within the `login` function (Redux, redirect)
            navigate(from, { replace: true });
        } catch (error) {
            console.error("Login error:", error); // Log the error
            setLoginError(error.message || 'An unexpected error occurred.'); // Set error state
        }
    };

     useEffect(() => {
      const handleAutoFill = () => {
        if (passwordRef.current && passwordRef.current.matches(':-webkit-autofill')) {
          // Add a class to the input field when autofilled
          passwordRef.current.classList.add('auto-filled');
        } else if (passwordRef.current) {
          // Remove the class when not autofilled
          passwordRef.current.classList.remove('auto-filled');
        }
      };

        // Check on mount and on input changes
        handleAutoFill();
        const observer = new MutationObserver(handleAutoFill);
        if(passwordRef.current){
          observer.observe(passwordRef.current, { attributes: true, attributeFilter: ['class'] });
        }

        // Clean up the observer on unmount. VERY IMPORTANT!
        return () => observer.disconnect();
    }, [password]);


    return (
        <ThemeProvider theme={theme}>
            {/* Outer Box for background color and centering */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    // justifyContent: 'center',
                    minHeight: '100vh',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    // padding: '20px',
                }}
            >
                {/* Logo and Title */}
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

                {/* White Form Container */}
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
                            type={showPassword ? 'text'
                                : 'password'}
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
                           control={<Checkbox checked={showPassword} onChange={() => setShowPassword(!showPassword)}  sx={{
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
                        >
                            Sign In
                        </Button>
                         {/* Display error message */}
                        {loginError && (
                            <Typography color="error" align="center" sx={{ mb: 2 }}>
                                {loginError}
                            </Typography>
                        )}
                        <Grid2 container justifyContent="space-between">
                            <Grid2 item>
                                 <Link component={RouterLink} to="/forgot-password" variant="body2" sx={{color: theme.palette.primary.main}}>
                                    Forgot password?
                                </Link>
                            </Grid2>
                            <Grid2 item>
                                <Link component={RouterLink} to="/signup" variant="body2" sx={{color: theme.palette.primary.main}}>
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