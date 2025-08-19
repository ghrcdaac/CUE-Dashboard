import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { CircularProgress, Box, Typography, Paper, Button, createTheme, ThemeProvider } from '@mui/material';

const theme = createTheme({
    palette: {
        primary: {
            main: "#19577F",
        },
    },
});

function AuthCallback() {
    const { handleAuthCallback, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState(null);

    useEffect(() => {
        const processAuth = async () => {
            const params = new URLSearchParams(location.search);
            const code = params.get('code');
            const state = params.get('state');

            if (!code || !state) {
                setError("Authentication failed: Missing authorization code or state from the provider.");
                return;
            }

            try {
                // The hook now handles session creation and Redux dispatch.
                // We no longer need to check the status here.
                await handleAuthCallback(code, state);
                
                // After the session is created, always redirect to the homepage.
                // ProtectedRoute will then handle routing to /login if not authenticated,
                // or the user will see the dashboard if they are.
                navigate('/', { replace: true });

            } catch (err) {
                console.error("Authentication callback error:", err);
                setError(err.message || 'An unexpected error occurred during login. Please try again.');
            }
        };

        processAuth();
    }, [handleAuthCallback, location.search, navigate]);

    return (
        <ThemeProvider theme={theme}>
            <Box 
                sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100vh', 
                    backgroundColor: 'primary.main' 
                }}
            >
                <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: '400px' }}>
                    {error ? (
                        <>
                            <Typography variant="h6" color="error">Authentication Failed</Typography>
                            <Typography color="text.secondary" align="center">{error}</Typography>
                            <Button
                                variant="contained"
                                onClick={() => logout()}
                                sx={{ mt: 2, width: '100%' }}
                            >
                                Back to Login
                            </Button>
                        </>
                    ) : (
                        <>
                            <CircularProgress />
                            <Typography sx={{ mt: 2 }} color="text.secondary">
                                Finalizing authentication, please wait...
                            </Typography>
                        </>
                    )}
                </Paper>
            </Box>
        </ThemeProvider>
    );
}

export default AuthCallback;
